import { AppState } from "../types";
import { discoverServer, getServerUrl } from "./discovery";
import { saveState } from "./storage";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline";

export async function performSync(localState: AppState): Promise<{
  mergedState: AppState | null;
  status: SyncStatus;
}> {
  const server = await discoverServer();
  if (!server) {
    return { mergedState: null, status: "offline" };
  }

  try {
    const url = getServerUrl(server);
    const res = await fetch(`${url}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: localState.deviceId,
        kids: localState.kids,
        categories: localState.categories,
        transactions: localState.transactions,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { mergedState: null, status: "offline" };
    }

    const merged = await res.json();
    const mergedState: AppState = {
      deviceId: localState.deviceId,
      kids: merged.kids,
      categories: merged.categories,
      transactions: merged.transactions,
    };

    await saveState(mergedState);
    return { mergedState, status: "synced" };
  } catch {
    return { mergedState: null, status: "offline" };
  }
}
