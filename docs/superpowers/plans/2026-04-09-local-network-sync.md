# Local Network Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bidirectional sync between multiple phones on the home network via a Home Assistant add-on sync server.

**Architecture:** A Node.js + Express + SQLite server runs as a Home Assistant add-on, advertising via mDNS. The app auto-discovers the server, and performs a full bidirectional sync (push local + pull remote) on launch and after every state change. Transactions merge by set-union; kids and categories merge by last-write-wins with soft deletes.

**Tech Stack:** Node.js 20, Express, better-sqlite3, bonjour-service (server); react-native-zeroconf (app); existing Expo + React Native + AsyncStorage stack.

**Spec:** `docs/superpowers/specs/2026-04-09-local-network-sync-design.md`

---

## Task 1: Update data model types

**Files:**
- Modify: `types/index.ts`

This task adds `updatedAt`, `deletedAt` to Kid and Category, and `deviceId` to AppState. All downstream tasks depend on these types.

- [ ] **Step 1: Update Kid interface**

In `types/index.ts`, replace the Kid interface:

```typescript
export interface Kid {
  id: string;
  name: string;
  age: number;
  avatarId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

- [ ] **Step 2: Update Category interface**

In `types/index.ts`, replace the Category interface:

```typescript
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  emoji?: string;
  updatedAt: string;
  deletedAt?: string;
}
```

- [ ] **Step 3: Update AppState interface**

In `types/index.ts`, replace the AppState interface:

```typescript
export interface AppState {
  kids: Kid[];
  categories: Category[];
  transactions: Transaction[];
  deviceId: string;
}
```

- [ ] **Step 4: Run TypeScript to see all breakages**

Run: `npx tsc --noEmit 2>&1 | head -60`

Expected: Multiple type errors in defaults.ts, AppContext.tsx, actions.ts, and anywhere that creates Kid/Category objects without the new fields. This confirms the types are wired through. We'll fix these in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add types/index.ts
git commit -m "feat(sync): add updatedAt, deletedAt, and deviceId to data model types"
```

---

## Task 2: Update defaults and storage migration

**Files:**
- Modify: `utils/defaults.ts`
- Modify: `utils/storage.ts`

Add `updatedAt` to all default categories, generate `deviceId` on first launch, and migrate existing data that lacks the new fields.

- [ ] **Step 1: Update default categories with updatedAt**

In `utils/defaults.ts`, replace the entire file:

```typescript
import * as Crypto from "expo-crypto";
import { Category, AppState } from "../types";

const EPOCH = "2000-01-01T00:00:00.000Z";

export const DEFAULT_EARNING_CATEGORIES: Category[] = [
  { id: "earn-chores", name: "Chores", type: "earning", emoji: "🧹", updatedAt: EPOCH },
  { id: "earn-homework", name: "Homework", type: "earning", emoji: "📚", updatedAt: EPOCH },
  { id: "earn-behavior", name: "Good Behavior", type: "earning", emoji: "⭐", updatedAt: EPOCH },
  { id: "earn-helping", name: "Helping Out", type: "earning", emoji: "🤝", updatedAt: EPOCH },
  { id: "earn-other", name: "Other", type: "earning", emoji: "💰", updatedAt: EPOCH },
];

export const DEFAULT_SPENDING_CATEGORIES: Category[] = [
  { id: "spend-toys", name: "Toys", type: "spending", emoji: "🧸", updatedAt: EPOCH },
  { id: "spend-candy", name: "Candy/Snacks", type: "spending", emoji: "🍬", updatedAt: EPOCH },
  { id: "spend-savings", name: "Savings Withdrawal", type: "spending", emoji: "🏦", updatedAt: EPOCH },
  { id: "spend-other", name: "Other", type: "spending", emoji: "🛒", updatedAt: EPOCH },
];

export const UNDELETABLE_CATEGORY_IDS = ["earn-other", "spend-other"];

export const DEFAULT_STATE: AppState = {
  kids: [],
  categories: [...DEFAULT_EARNING_CATEGORIES, ...DEFAULT_SPENDING_CATEGORIES],
  transactions: [],
  deviceId: Crypto.randomUUID(),
};
```

- [ ] **Step 2: Add migration to storage.ts**

Replace `utils/storage.ts` with:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { AppState } from "../types";
import { DEFAULT_STATE } from "./defaults";

const STORAGE_KEY = "@piggybank_data";

function migrateState(state: AppState): AppState {
  const now = new Date().toISOString();
  return {
    ...state,
    deviceId: state.deviceId || Crypto.randomUUID(),
    kids: state.kids.map((k) => ({
      ...k,
      updatedAt: k.updatedAt || now,
    })),
    categories: state.categories.map((c) => ({
      ...c,
      updatedAt: c.updatedAt || now,
    })),
  };
}

export const loadState = async (): Promise<AppState> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json) as AppState;
      return migrateState(parsed);
    }
  } catch (error) {
    console.error("Failed to load state:", error);
  }
  return DEFAULT_STATE;
};

export const saveState = async (state: AppState): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
};
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: Errors should be reduced to action/reducer areas (AppContext.tsx, actions.ts) which we fix next. No errors in defaults.ts or storage.ts.

- [ ] **Step 4: Commit**

```bash
git add utils/defaults.ts utils/storage.ts
git commit -m "feat(sync): add updatedAt to default categories, add storage migration"
```

---

## Task 3: Update reducer and actions for soft deletes and updatedAt

**Files:**
- Modify: `context/actions.ts`
- Modify: `context/AppContext.tsx`

Update the reducer to set `updatedAt` on create/edit, change deletes to soft deletes, and add a `SYNC_STATE` action distinct from `LOAD_STATE`.

- [ ] **Step 1: Update actions.ts**

Replace `context/actions.ts`:

```typescript
import { Kid, Transaction, Category, AppState } from "../types";

export type AppAction =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "SYNC_STATE"; payload: AppState }
  | { type: "ADD_KID"; payload: Omit<Kid, "createdAt" | "updatedAt"> }
  | { type: "EDIT_KID"; payload: { id: string; name: string; age: number; avatarId: string } }
  | { type: "DELETE_KID"; payload: { id: string } }
  | { type: "ADD_TRANSACTION"; payload: Omit<Transaction, "id" | "createdAt"> }
  | { type: "ADD_CATEGORY"; payload: Omit<Category, "id" | "updatedAt"> }
  | { type: "EDIT_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: { id: string } }
  | { type: "RESTORE_KID"; payload: { id: string } }
  | { type: "RESTORE_CATEGORY"; payload: { id: string } };
```

- [ ] **Step 2: Update the reducer in AppContext.tsx**

Replace the `appReducer` function in `context/AppContext.tsx`:

```typescript
function appReducer(state: AppState, action: AppAction): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    case "LOAD_STATE":
    case "SYNC_STATE":
      return action.payload;

    case "ADD_KID":
      return {
        ...state,
        kids: [
          ...state.kids,
          {
            ...action.payload,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

    case "EDIT_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, name: action.payload.name, age: action.payload.age, avatarId: action.payload.avatarId, updatedAt: now }
            : k
        ),
      };

    case "DELETE_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, deletedAt: now, updatedAt: now }
            : k
        ),
      };

    case "RESTORE_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, deletedAt: undefined, updatedAt: now }
            : k
        ),
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [
          ...state.transactions,
          {
            ...action.payload,
            id: Crypto.randomUUID(),
            createdAt: now,
          },
        ],
      };

    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [
          ...state.categories,
          {
            ...action.payload,
            id: Crypto.randomUUID(),
            updatedAt: now,
          },
        ],
      };

    case "EDIT_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? { ...action.payload, updatedAt: now } : c
        ),
      };

    case "DELETE_CATEGORY": {
      if (UNDELETABLE_CATEGORY_IDS.includes(action.payload.id)) {
        return state;
      }
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id
            ? { ...c, deletedAt: now, updatedAt: now }
            : c
        ),
      };
    }

    case "RESTORE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id
            ? { ...c, deletedAt: undefined, updatedAt: now }
            : c
        ),
      };

    default:
      return state;
  }
}
```

Make sure the file still imports `* as Crypto from "expo-crypto"` and `UNDELETABLE_CATEGORY_IDS` from `../utils/defaults` at the top. Keep all other code in the file (the context, provider, etc.) unchanged.

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: Should be clean or very close. Any remaining errors are in UI files that reference `state.kids` without filtering soft deletes — we handle those next.

- [ ] **Step 4: Commit**

```bash
git add context/actions.ts context/AppContext.tsx
git commit -m "feat(sync): soft deletes, updatedAt in reducer, add SYNC_STATE and RESTORE actions"
```

---

## Task 4: Filter soft-deleted entities from UI

**Files:**
- Modify: `hooks/useKid.ts`
- Modify: `app/(tabs)/index.tsx` (home screen kid list)
- Modify: `app/(tabs)/activity.tsx` (filter bar kid list)
- Modify: `app/(tabs)/settings.tsx` (will also be updated in Task 9 for sync status)
- Modify: `app/settings-categories.tsx` (category lists)
- Modify: `hooks/useInsights.ts` (category lookups)

Anywhere that reads `state.kids` or `state.categories` for display needs to filter out items where `deletedAt` is set. The simplest approach: add helper hooks.

- [ ] **Step 1: Create useActiveKids and useActiveCategories helpers**

Create a new file `hooks/useFiltered.ts`:

```typescript
import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { Kid, Category, CategoryType } from "../types";

export function useActiveKids(): Kid[] {
  const { state } = useAppContext();
  return useMemo(
    () => state.kids.filter((k) => !k.deletedAt),
    [state.kids]
  );
}

export function useActiveCategories(type?: CategoryType): Category[] {
  const { state } = useAppContext();
  return useMemo(
    () => state.categories.filter((c) => !c.deletedAt && (type === undefined || c.type === type)),
    [state.categories, type]
  );
}
```

- [ ] **Step 2: Update home screen**

In `app/(tabs)/index.tsx`, add import:

```typescript
import { useActiveKids } from "../../hooks/useFiltered";
```

Inside the component, replace `const { state, isLoaded } = useAppContext();` with:

```typescript
const { isLoaded } = useAppContext();
const kids = useActiveKids();
```

Then replace all references to `state.kids` with `kids`:
- `if (kids.length === 0)` (line ~15)
- `data={kids}` in the FlatList (line ~36)

- [ ] **Step 3: Update activity screen filter bar**

In `app/(tabs)/activity.tsx`, add import:

```typescript
import { useActiveKids } from "../../hooks/useFiltered";
```

Inside the component, add `const kids = useActiveKids();` and replace `state.kids.map((kid) => (` in the filter bar with `kids.map((kid) => (`. Keep the `state` destructure for `state.categories` used in the transaction rendering below.

- [ ] **Step 4: Update settings-categories screen**

In `app/settings-categories.tsx`, add import:

```typescript
import { useActiveCategories } from "../hooks/useFiltered";
```

Replace the inline filter `const categories = state.categories.filter((c) => c.type === type);` with:

```typescript
const categories = useActiveCategories(type);
```

- [ ] **Step 5: Update kid detail and category lookups**

In `hooks/useKid.ts`, update the kid lookup to only find non-deleted kids:

```typescript
const kid = useMemo(
  () => state.kids.find((k) => k.id === kidId && !k.deletedAt),
  [state.kids, kidId]
);
```

In `hooks/useInsights.ts`, the category lookup (`state.categories.find`) can find soft-deleted categories — this is fine because it's just resolving a name for a transaction's categoryId. No change needed here.

- [ ] **Step 6: Run TypeScript check and verify**

Run: `npx tsc --noEmit`

Expected: Clean.

- [ ] **Step 7: Commit**

```bash
git add hooks/useFiltered.ts hooks/useKid.ts app/\(tabs\)/index.tsx app/\(tabs\)/activity.tsx app/settings-categories.tsx
git commit -m "feat(sync): filter soft-deleted entities from all UI screens"
```

---

## Task 5: Build the sync server

**Files:**
- Create: `piggybank-sync-addon/server/package.json`
- Create: `piggybank-sync-addon/server/tsconfig.json`
- Create: `piggybank-sync-addon/server/src/db.ts`
- Create: `piggybank-sync-addon/server/src/merge.ts`
- Create: `piggybank-sync-addon/server/src/mdns.ts`
- Create: `piggybank-sync-addon/server/src/index.ts`

This task builds the entire server. It's a standalone Node.js project inside `piggybank-sync-addon/server/`.

- [ ] **Step 1: Create server package.json**

Create `piggybank-sync-addon/server/package.json`:

```json
{
  "name": "piggybank-sync-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "bonjour-service": "^1.3.0",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "typescript": "~5.7.0"
  }
}
```

- [ ] **Step 2: Create server tsconfig.json**

Create `piggybank-sync-addon/server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonPaths": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create db.ts — SQLite setup and CRUD**

Create `piggybank-sync-addon/server/src/db.ts`:

```typescript
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join("/data", "piggybank.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS kids (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        avatarId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        emoji TEXT,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        kidId TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL
      );
    `);
  }
  return db;
}

export interface Kid {
  id: string;
  name: string;
  age: number;
  avatarId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  emoji?: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Transaction {
  id: string;
  kidId: string;
  type: string;
  amount: number;
  categoryId: string;
  note?: string;
  createdAt: string;
}

export function getAllKids(): Kid[] {
  return getDb().prepare("SELECT * FROM kids").all() as Kid[];
}

export function getAllCategories(): Category[] {
  return getDb().prepare("SELECT * FROM categories").all() as Category[];
}

export function getAllTransactions(): Transaction[] {
  return getDb().prepare("SELECT * FROM transactions").all() as Transaction[];
}

export function upsertKid(kid: Kid): void {
  getDb().prepare(`
    INSERT INTO kids (id, name, age, avatarId, createdAt, updatedAt, deletedAt)
    VALUES (@id, @name, @age, @avatarId, @createdAt, @updatedAt, @deletedAt)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, age=@age, avatarId=@avatarId, createdAt=@createdAt,
      updatedAt=@updatedAt, deletedAt=@deletedAt
  `).run({ ...kid, deletedAt: kid.deletedAt ?? null });
}

export function upsertCategory(cat: Category): void {
  getDb().prepare(`
    INSERT INTO categories (id, name, type, emoji, updatedAt, deletedAt)
    VALUES (@id, @name, @type, @emoji, @updatedAt, @deletedAt)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, type=@type, emoji=@emoji, updatedAt=@updatedAt, deletedAt=@deletedAt
  `).run({ ...cat, emoji: cat.emoji ?? null, deletedAt: cat.deletedAt ?? null });
}

export function upsertTransaction(tx: Transaction): void {
  getDb().prepare(`
    INSERT OR IGNORE INTO transactions (id, kidId, type, amount, categoryId, note, createdAt)
    VALUES (@id, @kidId, @type, @amount, @categoryId, @note, @createdAt)
  `).run({ ...tx, note: tx.note ?? null });
}

export function pruneOldDeletes(): void {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  getDb().prepare("DELETE FROM kids WHERE deletedAt IS NOT NULL AND deletedAt < ?").run(cutoff);
  getDb().prepare("DELETE FROM categories WHERE deletedAt IS NOT NULL AND deletedAt < ?").run(cutoff);
}
```

- [ ] **Step 4: Create merge.ts — merge logic**

Create `piggybank-sync-addon/server/src/merge.ts`:

```typescript
import {
  Kid, Category, Transaction,
  getAllKids, getAllCategories, getAllTransactions,
  upsertKid, upsertCategory, upsertTransaction, pruneOldDeletes,
} from "./db";

interface SyncRequest {
  deviceId: string;
  kids: Kid[];
  categories: Category[];
  transactions: Transaction[];
}

interface SyncResponse {
  kids: Kid[];
  categories: Category[];
  transactions: Transaction[];
}

function mergeEntity<T extends { id: string; updatedAt: string; deletedAt?: string }>(
  clientItems: T[],
  serverItems: T[]
): T[] {
  const merged = new Map<string, T>();

  for (const item of serverItems) {
    merged.set(item.id, item);
  }

  for (const clientItem of clientItems) {
    const serverItem = merged.get(clientItem.id);
    if (!serverItem) {
      merged.set(clientItem.id, clientItem);
    } else {
      // Both exist — compare timestamps
      const clientTime = new Date(clientItem.updatedAt).getTime();
      const serverTime = new Date(serverItem.updatedAt).getTime();

      if (clientTime > serverTime) {
        merged.set(clientItem.id, clientItem);
      }
      // else keep server version (already in map)
    }
  }

  return Array.from(merged.values());
}

function mergeTransactions(clientTxs: Transaction[], serverTxs: Transaction[]): Transaction[] {
  const merged = new Map<string, Transaction>();

  for (const tx of serverTxs) {
    merged.set(tx.id, tx);
  }
  for (const tx of clientTxs) {
    if (!merged.has(tx.id)) {
      merged.set(tx.id, tx);
    }
  }

  return Array.from(merged.values());
}

export function performSync(request: SyncRequest): SyncResponse {
  const serverKids = getAllKids();
  const serverCategories = getAllCategories();
  const serverTransactions = getAllTransactions();

  const mergedKids = mergeEntity(request.kids, serverKids);
  const mergedCategories = mergeEntity(request.categories, serverCategories);
  const mergedTransactions = mergeTransactions(request.transactions, serverTransactions);

  // Persist merged state
  for (const kid of mergedKids) {
    upsertKid(kid);
  }
  for (const cat of mergedCategories) {
    upsertCategory(cat);
  }
  for (const tx of mergedTransactions) {
    upsertTransaction(tx);
  }

  // Prune soft deletes older than 12 months
  pruneOldDeletes();

  return {
    kids: mergedKids,
    categories: mergedCategories,
    transactions: mergedTransactions,
  };
}
```

- [ ] **Step 5: Create mdns.ts — Bonjour advertisement**

Create `piggybank-sync-addon/server/src/mdns.ts`:

```typescript
import Bonjour from "bonjour-service";

let instance: ReturnType<typeof Bonjour.prototype.publish> | null = null;

export function advertise(port: number): void {
  const bonjour = new Bonjour();
  instance = bonjour.publish({
    name: "Piggy Bank Sync",
    type: "piggybank",
    protocol: "tcp",
    port,
  });
  console.log(`mDNS: advertising _piggybank._tcp on port ${port}`);
}
```

- [ ] **Step 6: Create index.ts — Express app**

Create `piggybank-sync-addon/server/src/index.ts`:

```typescript
import express from "express";
import { getDb } from "./db";
import { performSync } from "./merge";
import { advertise } from "./mdns";

const PORT = parseInt(process.env.PORT || "3456", 10);

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.post("/sync", (req, res) => {
  try {
    const result = performSync(req.body);
    res.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Sync failed" });
  }
});

// Initialize DB on startup
getDb();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Piggy Bank Sync server listening on port ${PORT}`);
  advertise(PORT);
});
```

- [ ] **Step 7: Install server dependencies and build**

```bash
cd piggybank-sync-addon/server && npm install && npm run build
```

Expected: Clean TypeScript compilation, `dist/` folder created.

- [ ] **Step 8: Commit**

```bash
cd /workspaces/piggybank
git add piggybank-sync-addon/server/
git commit -m "feat(sync): add sync server with Express, SQLite, merge logic, and mDNS"
```

---

## Task 6: Package server as Home Assistant add-on

**Files:**
- Create: `piggybank-sync-addon/config.yaml`
- Create: `piggybank-sync-addon/Dockerfile`
- Create: `piggybank-sync-addon/run.sh`

- [ ] **Step 1: Create config.yaml**

Create `piggybank-sync-addon/config.yaml`:

```yaml
name: "Piggy Bank Sync"
description: "Local network sync server for the Piggy Bank family app"
version: "1.0.0"
slug: "piggybank-sync"
arch:
  - aarch64
  - armv7
  - amd64
ports:
  3456/tcp: 3456
ports_description:
  3456/tcp: "Sync server"
map:
  - data:rw
startup: application
boot: auto
host_network: true
```

Note: `host_network: true` is needed so mDNS advertisements are visible on the LAN (Docker bridge networking isolates multicast).

- [ ] **Step 2: Create Dockerfile**

Create `piggybank-sync-addon/Dockerfile`:

```dockerfile
ARG BUILD_FROM=node:20-alpine
FROM ${BUILD_FROM}

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/dist/ ./dist/

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 3456

CMD ["/run.sh"]
```

- [ ] **Step 3: Create run.sh**

Create `piggybank-sync-addon/run.sh`:

```bash
#!/bin/sh
echo "Starting Piggy Bank Sync server..."
export DB_PATH="/data/piggybank.db"
exec node /app/dist/index.js
```

- [ ] **Step 4: Commit**

```bash
git add piggybank-sync-addon/config.yaml piggybank-sync-addon/Dockerfile piggybank-sync-addon/run.sh
git commit -m "feat(sync): package sync server as Home Assistant add-on"
```

---

## Task 7: Add react-native-zeroconf and server discovery to the app

**Files:**
- Modify: `package.json` (install dependency)
- Modify: `app.json` (Android permissions)
- Create: `utils/discovery.ts`

- [ ] **Step 1: Install react-native-zeroconf**

```bash
npx expo install react-native-zeroconf
```

- [ ] **Step 2: Add Android permissions to app.json**

In `app.json`, add a `permissions` array inside the `android` object:

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#F8F9FA"
  },
  "edgeToEdgeEnabled": true,
  "package": "com.piggybank.app",
  "permissions": ["android.permission.ACCESS_WIFI_STATE"]
}
```

- [ ] **Step 3: Create discovery.ts**

Create `utils/discovery.ts`:

```typescript
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
  // Try cached address first
  if (!cachedAddress) {
    cachedAddress = await loadCachedAddress();
  }

  if (cachedAddress && (await checkHealth(cachedAddress))) {
    return cachedAddress;
  }

  // Discover via mDNS
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
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: Clean. (react-native-zeroconf types may need `@types/react-native-zeroconf` — if tsc errors on the import, add a declaration file `types/react-native-zeroconf.d.ts` with `declare module "react-native-zeroconf";`)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json utils/discovery.ts
git commit -m "feat(sync): add react-native-zeroconf and mDNS server discovery"
```

---

## Task 8: Implement the sync function and integrate with AppContext

**Files:**
- Create: `utils/sync.ts`
- Modify: `context/AppContext.tsx`

- [ ] **Step 1: Create sync.ts**

Create `utils/sync.ts`:

```typescript
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
```

- [ ] **Step 2: Add sync integration and SyncContext to AppContext.tsx**

Replace `context/AppContext.tsx` entirely:

```typescript
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import * as Crypto from "expo-crypto";
import { AppState } from "../types";
import { AppAction } from "./actions";
import { DEFAULT_STATE, UNDELETABLE_CATEGORY_IDS } from "../utils/defaults";
import { loadState, saveState } from "../utils/storage";
import { performSync, SyncStatus } from "../utils/sync";

function appReducer(state: AppState, action: AppAction): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    case "LOAD_STATE":
    case "SYNC_STATE":
      return action.payload;

    case "ADD_KID":
      return {
        ...state,
        kids: [
          ...state.kids,
          {
            ...action.payload,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

    case "EDIT_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, name: action.payload.name, age: action.payload.age, avatarId: action.payload.avatarId, updatedAt: now }
            : k
        ),
      };

    case "DELETE_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, deletedAt: now, updatedAt: now }
            : k
        ),
      };

    case "RESTORE_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, deletedAt: undefined, updatedAt: now }
            : k
        ),
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [
          ...state.transactions,
          {
            ...action.payload,
            id: Crypto.randomUUID(),
            createdAt: now,
          },
        ],
      };

    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [
          ...state.categories,
          {
            ...action.payload,
            id: Crypto.randomUUID(),
            updatedAt: now,
          },
        ],
      };

    case "EDIT_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? { ...action.payload, updatedAt: now } : c
        ),
      };

    case "DELETE_CATEGORY": {
      if (UNDELETABLE_CATEGORY_IDS.includes(action.payload.id)) {
        return state;
      }
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id
            ? { ...c, deletedAt: now, updatedAt: now }
            : c
        ),
      };
    }

    case "RESTORE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id
            ? { ...c, deletedAt: undefined, updatedAt: now }
            : c
        ),
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isLoaded: boolean;
  syncStatus: SyncStatus;
}

const AppContext = createContext<AppContextValue>({
  state: DEFAULT_STATE,
  dispatch: () => {},
  isLoaded: false,
  syncStatus: "idle",
});

const SYNC_DEBOUNCE_MS = 500;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const doSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus("syncing");

    try {
      const { mergedState, status } = await performSync(stateRef.current);
      setSyncStatus(status);
      if (mergedState) {
        dispatch({ type: "SYNC_STATE", payload: mergedState });
      }
    } catch {
      setSyncStatus("offline");
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(doSync, SYNC_DEBOUNCE_MS);
  }, [doSync]);

  // Load state and initial sync
  useEffect(() => {
    loadState().then((saved) => {
      dispatch({ type: "LOAD_STATE", payload: saved });
      setIsLoaded(true);
    });
  }, []);

  // Sync on first load
  useEffect(() => {
    if (isLoaded) {
      doSync();
    }
  }, [isLoaded, doSync]);

  // Save and sync on state changes (skip LOAD_STATE and SYNC_STATE triggers)
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (!isLoaded) return;
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    saveState(state);
    debouncedSync();
  }, [state, isLoaded, debouncedSync]);

  return (
    <AppContext.Provider value={{ state, dispatch, isLoaded, syncStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add utils/sync.ts context/AppContext.tsx
git commit -m "feat(sync): implement sync function and integrate with AppContext (debounced)"
```

---

## Task 9: Add sync status indicator and Recently Deleted screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Create: `app/settings-recently-deleted.tsx`
- Modify: `app/_layout.tsx` (add route)

- [ ] **Step 1: Add sync status and Recently Deleted link to settings**

Replace `app/(tabs)/settings.tsx`:

```typescript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext } from "../../context/AppContext";
import { ThemeColors, ThemeMode, FontSize, Spacing } from "../../constants/theme";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "light", label: "Light", icon: "sunny" },
  { mode: "dark", label: "Dark", icon: "moon" },
  { mode: "system", label: "System", icon: "phone-portrait-outline" },
];

const SYNC_DISPLAY: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: (c: ThemeColors) => string }> = {
  idle: { label: "Not synced", icon: "cloud-outline", color: (c) => c.textLight },
  syncing: { label: "Syncing...", icon: "sync-outline", color: (c) => c.primary },
  synced: { label: "Synced", icon: "checkmark-circle", color: (c) => c.deposit },
  offline: { label: "Offline", icon: "cloud-offline-outline", color: (c) => c.textSecondary },
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { syncStatus } = useAppContext();
  const styles = makeStyles(colors);
  const sync = SYNC_DISPLAY[syncStatus] || SYNC_DISPLAY.idle;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sync</Text>

      <View style={styles.row}>
        <Ionicons name={sync.icon} size={22} color={sync.color(colors)} />
        <Text style={styles.rowText}>{sync.label}</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Appearance
      </Text>

      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.mode}
            style={[
              styles.themeOption,
              themeMode === opt.mode && styles.themeOptionActive,
            ]}
            onPress={() => setThemeMode(opt.mode)}
          >
            <Ionicons
              name={opt.icon}
              size={22}
              color={themeMode === opt.mode ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeLabel,
                themeMode === opt.mode && styles.themeLabelActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Categories
      </Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-categories?type=earning")}
      >
        <Ionicons name="trending-up" size={22} color={colors.deposit} />
        <Text style={styles.rowText}>Manage Earning Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-categories?type=spending")}
      >
        <Ionicons name="trending-down" size={22} color={colors.withdrawal} />
        <Text style={styles.rowText}>Manage Spending Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Data
      </Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings-recently-deleted")}
      >
        <Ionicons name="trash-outline" size={22} color={colors.withdrawal} />
        <Text style={styles.rowText}>Recently Deleted</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        About
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowText}>Version</Text>
        <Text style={styles.rowValue}>1.0.0</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for families</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.md,
    },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    themeRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    themeOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeLabel: {
      fontSize: FontSize.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    themeLabelActive: {
      color: "#FFFFFF",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    rowText: {
      fontSize: FontSize.md,
      color: colors.text,
      flex: 1,
    },
    rowValue: {
      fontSize: FontSize.md,
      color: colors.textSecondary,
    },
    footer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: Spacing.xl,
    },
    footerText: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
  });
```

- [ ] **Step 2: Create the Recently Deleted screen**

Create `app/settings-recently-deleted.tsx`:

```typescript
import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { ThemeColors, FontSize, Spacing, getAvatarEmoji } from "../constants/theme";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export default function RecentlyDeletedScreen() {
  const { state, dispatch } = useAppContext();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS).toISOString();

  const deletedKids = state.kids.filter(
    (k) => k.deletedAt && k.deletedAt > cutoff
  );
  const deletedCategories = state.categories.filter(
    (c) => c.deletedAt && c.deletedAt > cutoff
  );

  const hasItems = deletedKids.length > 0 || deletedCategories.length > 0;

  const handleRestoreKid = (id: string, name: string) => {
    Alert.alert("Restore", `Restore ${name}'s piggy bank?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => dispatch({ type: "RESTORE_KID", payload: { id } }),
      },
    ]);
  };

  const handleRestoreCategory = (id: string, name: string) => {
    Alert.alert("Restore", `Restore the "${name}" category?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => dispatch({ type: "RESTORE_CATEGORY", payload: { id } }),
      },
    ]);
  };

  if (!hasItems) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🗑️"
          title="Nothing here"
          subtitle="Deleted items will appear here for 12 months"
        />
      </View>
    );
  }

  const data = [
    ...deletedKids.map((k) => ({ type: "kid" as const, item: k })),
    ...deletedCategories.map((c) => ({ type: "category" as const, item: c })),
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(d) => d.item.id}
        renderItem={({ item: d }) => {
          if (d.type === "kid") {
            const kid = d.item;
            return (
              <View style={styles.row}>
                <Text style={styles.emoji}>{getAvatarEmoji(kid.avatarId)}</Text>
                <View style={styles.details}>
                  <Text style={styles.name}>{kid.name}</Text>
                  <Text style={styles.meta}>
                    Deleted {new Date(kid.deletedAt!).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRestoreKid(kid.id, kid.name)}>
                  <Ionicons name="refresh" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            );
          } else {
            const cat = d.item;
            return (
              <View style={styles.row}>
                <Text style={styles.emoji}>{cat.emoji || "?"}</Text>
                <View style={styles.details}>
                  <Text style={styles.name}>{cat.name}</Text>
                  <Text style={styles.meta}>
                    Deleted {new Date(cat.deletedAt!).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRestoreCategory(cat.id, cat.name)}>
                  <Ionicons name="refresh" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            );
          }
        }}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: 12,
      marginBottom: Spacing.sm,
    },
    emoji: {
      fontSize: 28,
      marginRight: Spacing.sm,
    },
    details: {
      flex: 1,
    },
    name: {
      fontSize: FontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    meta: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
```

- [ ] **Step 3: Add route to _layout.tsx**

In `app/_layout.tsx`, add a new `Stack.Screen` inside the `ThemedStack` component, after the `settings-categories` screen:

```tsx
<Stack.Screen
  name="settings-recently-deleted"
  options={{
    title: "Recently Deleted",
  }}
/>
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: Clean.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/settings.tsx app/settings-recently-deleted.tsx app/_layout.tsx
git commit -m "feat(sync): add sync status indicator and Recently Deleted screen"
```

---

## Task 10: Native rebuild and OTA update

**Files:** No code changes — build and deploy.

- [ ] **Step 1: Build new development client (your phone)**

```bash
eas build --profile development --platform android --non-interactive --no-wait
```

- [ ] **Step 2: Build new preview APK (wife's phone)**

```bash
eas build --profile preview --platform android --non-interactive --no-wait
```

- [ ] **Step 3: Push OTA update to preview channel**

```bash
eas update --channel preview --message "add local network sync with auto-discovery" --non-interactive
```

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git status
# Only commit if there are meaningful changes
git commit -m "chore(sync): update lockfiles after native dependency addition"
```

---

## Task 11: Install and test the HA add-on

This is a manual task with the user. The steps are:

- [ ] **Step 1: Push the add-on code to a GitHub repo or copy to HA**

The user needs to make the `piggybank-sync-addon/` directory accessible to Home Assistant. Options:
- Push to a GitHub repo and add it as an add-on repository in HA
- Copy the directory to the HA `/addons/` folder via Samba or SSH

- [ ] **Step 2: Install the add-on in HA**

In Home Assistant:
1. Go to Settings > Add-ons > Add-on Store
2. Click the three dots menu > Repositories
3. Add the repository URL (if using GitHub)
4. Find "Piggy Bank Sync" and click Install
5. Click Start
6. Check the Logs tab to confirm "Piggy Bank Sync server listening on port 3456"

- [ ] **Step 3: Test from a phone**

1. Install the new build on a phone
2. Open the app on the home WiFi
3. Check Settings — sync status should show "Synced"
4. Add a transaction on one phone
5. Close and reopen the app on the other phone
6. Verify the transaction appears

---

## Summary

| Task | What | Depends on |
|------|------|-----------|
| 1 | Update type definitions | — |
| 2 | Defaults + storage migration | 1 |
| 3 | Reducer: soft deletes, updatedAt, SYNC_STATE | 1, 2 |
| 4 | Filter soft-deleted entities from UI | 3 |
| 5 | Build sync server | 1 (types only for reference) |
| 6 | Package as HA add-on | 5 |
| 7 | react-native-zeroconf + discovery | — |
| 8 | Sync function + AppContext integration | 3, 7 |
| 9 | Sync status UI + Recently Deleted screen | 4, 8 |
| 10 | Native rebuild + OTA update | 7, 9 |
| 11 | Install + test HA add-on | 6, 10 |

Tasks 5-6 (server) and Tasks 1-4 (app model changes) can be done in parallel since the server is a standalone project. Task 7 (zeroconf) is also independent.
