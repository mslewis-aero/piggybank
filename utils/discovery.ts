import AsyncStorage from "@react-native-async-storage/async-storage";
import Zeroconf from "react-native-zeroconf";

const CACHE_KEY = "@piggybank_server";
const DISCOVERY_TIMEOUT = 3000;

interface ServerAddress {
  host: string;
  port: number;
}

let cachedAddress: ServerAddress | null = null;

async function loadCachedAddress(): Promise<ServerAddress | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (json) return JSON.parse(json);
  } catch {}
  return null;
}

async function saveCachedAddress(addr: ServerAddress): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(addr));
  } catch {}
}

async function checkHealth(addr: ServerAddress): Promise<boolean> {
  try {
    const res = await fetch(`http://${addr.host}:${addr.port}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function discoverViaMdns(): Promise<ServerAddress | null> {
  return new Promise((resolve) => {
    const zeroconf = new Zeroconf();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        zeroconf.stop();
        zeroconf.removeAllListeners();
      }
    };

    zeroconf.on("resolved", (service: any) => {
      if (resolved) return;
      const host = service.host || service.addresses?.[0];
      const port = service.port;
      if (host && port) {
        cleanup();
        resolve({ host, port });
      }
    });

    zeroconf.on("error", () => {
      cleanup();
      resolve(null);
    });

    setTimeout(() => {
      cleanup();
      resolve(null);
    }, DISCOVERY_TIMEOUT);

    zeroconf.scan("piggybank", "tcp", "local.");
  });
}

export async function discoverServer(): Promise<ServerAddress | null> {
  if (!cachedAddress) {
    cachedAddress = await loadCachedAddress();
  }

  if (cachedAddress && (await checkHealth(cachedAddress))) {
    return cachedAddress;
  }

  const discovered = await discoverViaMdns();
  if (discovered && (await checkHealth(discovered))) {
    cachedAddress = discovered;
    await saveCachedAddress(discovered);
    return discovered;
  }

  cachedAddress = null;
  return null;
}

export function getServerUrl(addr: ServerAddress): string {
  return `http://${addr.host}:${addr.port}`;
}
