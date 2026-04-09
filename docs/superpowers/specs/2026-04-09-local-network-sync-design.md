# Local Network Sync — Design Spec

## Overview

Add bidirectional sync between multiple phones on the home network, using a lightweight server running as a Home Assistant add-on on a Raspberry Pi. Phones auto-discover the server via mDNS and sync on launch and after every change. The app works fully offline when the server isn't reachable.

## Goals

- Multiple devices (2+) stay in sync when on the home network
- No cloud services or global servers
- Append-only transactions merge naturally with no conflicts
- App works identically when offline — sync is invisible and non-blocking
- Server runs as a managed HA add-on (start/stop/logs via HA UI)

## Non-Goals

- Real-time push notifications between devices (pull-based is sufficient)
- Sync over the internet / outside the home network
- Multi-family or multi-household support
- HA entity integration (HA is just a Docker host)

---

## Data Model Changes

### Current entities with additions

**Kid**
```typescript
interface Kid {
  id: string;          // UUID, unchanged
  name: string;
  age: number;
  avatarId: string;
  createdAt: string;   // unchanged
  updatedAt: string;   // NEW — ISO timestamp, set on create and every edit
  deletedAt?: string;  // NEW — ISO timestamp, set on soft-delete
}
```

**Category**
```typescript
interface Category {
  id: string;          // unchanged
  name: string;
  type: CategoryType;
  emoji?: string;
  updatedAt: string;   // NEW
  deletedAt?: string;  // NEW
}
```

**Transaction** — no changes. Already has `createdAt`. Transactions are append-only: never edited, never deleted.

**AppState** — add `deviceId: string`, a UUID generated on first launch. Used for debugging, not for sync logic.

### Soft deletes

When a kid or category is "deleted," set `deletedAt` to the current ISO timestamp instead of removing it from the array. The UI filters out entities where `deletedAt` is set. Soft-deleted entities are retained for 12 months, then the server prunes them during sync.

### Default categories

Default categories (earn-chores, spend-toys, etc.) use deterministic IDs, so they won't duplicate across devices. They need `updatedAt` set to a fixed epoch value on first creation so user edits always win.

### Migration

On first launch after the update, a one-time migration adds `updatedAt: new Date().toISOString()` to all existing kids and categories that lack it. Existing transactions are untouched.

---

## Sync Algorithm

### Single operation: `sync()`

One function handles all sync. Called on app launch (after local state loads) and after every state change (debounced 500ms).

### Steps

1. Read current local state from AsyncStorage
2. POST full state (kids, categories, transactions) to server's `/sync` endpoint
3. Server performs merge (see below) and returns the merged state
4. Client writes merged state to AsyncStorage and dispatches `LOAD_STATE` to update UI

### Server-side merge logic

**Transactions (set-union):**
- Combine client and server transactions by ID
- If a transaction ID exists on one side but not the other, include it
- No conflict possible — transactions are immutable and uniquely identified

**Kids (last-write-wins with soft-delete):**
- For each kid ID present on either side:
  - If only one side has it, include it
  - If both sides have it, take the one with the latest `updatedAt`
  - If one side has `deletedAt` set: the delete wins if `deletedAt` is newer than the other side's `updatedAt`. Otherwise the edit wins (resurrects the entity by clearing `deletedAt`).
  - If both sides have `deletedAt` set, take the latest `deletedAt` (doesn't matter much, both agree it's deleted).
- Prune entities where `deletedAt` is older than 12 months

**Categories (same logic as kids)**

### Response

Server returns the full merged state. Client replaces its local state entirely with the server's response. After sync, both sides are identical.

### Failure handling

- If the server is unreachable, sync silently fails. The app continues working locally.
- Next trigger (app launch or state change) retries automatically.
- No retry queues, no background workers, no exponential backoff. Just try, succeed or don't, move on.

---

## Server Architecture

### Stack

- Node.js 20 + Express
- SQLite (single file, persisted to HA volume)
- `bonjour-service` for mDNS advertisement

### Endpoints

**`POST /sync`**
- Request body: `{ deviceId, kids, categories, transactions }`
- Performs merge against stored state
- Stores merged result in SQLite
- Returns: `{ kids, categories, transactions }`

**`GET /health`**
- Returns `{ status: "ok", version: "1.0.0" }`
- Used by clients to check reachability before syncing

### SQLite Schema

Three tables mirroring the entity types:

```sql
CREATE TABLE kids (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  avatarId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  emoji TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  kidId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  categoryId TEXT NOT NULL,
  note TEXT,
  createdAt TEXT NOT NULL
);
```

### mDNS Advertisement

On startup, the server publishes a service:
- Type: `_piggybank._tcp`
- Port: `3456`
- Name: `Piggy Bank Sync`

Any device on the local network browsing for `_piggybank._tcp` will find it.

---

## App-Side Sync Layer

### Server discovery: `utils/discovery.ts`

Uses `react-native-zeroconf` to browse for `_piggybank._tcp` on the local network.

Flow:
1. On app launch, check AsyncStorage for a cached server address
2. Try to hit `GET /health` at the cached address
3. If it fails (or no cache), start mDNS browse for `_piggybank._tcp`
4. When found, cache the address and proceed with sync
5. If nothing found within 3 seconds, give up silently (app works offline)

### Sync module: `utils/sync.ts`

Exports a `sync()` function used by the AppContext:
1. Resolve server address (from cache or discovery)
2. Read local state
3. POST to `/sync`
4. Dispatch `LOAD_STATE` with the merged response
5. Return success/failure for UI indicator

### Integration with AppContext

- On initial load (after `loadState()`): call `sync()`
- After every reducer dispatch that mutates state: call `sync()` debounced at 500ms
- The `LOAD_STATE` dispatch from sync replaces state entirely, same as the existing initial load path

### Sync status UI

A subtle indicator, likely on the Settings screen or in a header:
- "Synced" with a checkmark — last sync succeeded
- "Syncing..." — sync in progress
- "Offline" — server not reachable

No modals, no blocking UI, no error toasts. Sync is silent and invisible unless the user looks for it.

### Recently Deleted (Settings)

A new section in Settings: "Recently Deleted." Shows kids and categories that have `deletedAt` set. Tapping one offers a "Restore" action that clears `deletedAt` and sets `updatedAt` to now (so the restore propagates via sync). Items older than 12 months are hidden from this list.

---

## Home Assistant Add-on

### File structure

```
piggybank-sync-addon/
  Dockerfile
  config.yaml
  run.sh
  server/
    index.ts
    db.ts
    merge.ts
    mdns.ts
    package.json
    tsconfig.json
```

### config.yaml

```yaml
name: "Piggy Bank Sync"
description: "Local network sync server for the Piggy Bank family app"
version: "1.0.0"
slug: "piggybank-sync"
arch:
  - aarch64
  - armv7
ports:
  3456/tcp: 3456
map:
  - data:rw
startup: application
boot: auto
```

- `arch`: Raspberry Pi 3 (armv7) and Pi 4 (aarch64)
- `ports`: Expose 3456 to the local network
- `map: data:rw`: Persistent volume for SQLite database at `/data`
- `boot: auto`: Start automatically when HA starts

### Dockerfile

Based on `node:20-alpine`. Copies server code, runs `npm install`, exposes port 3456. Entry point is `run.sh` which starts the Node server.

### Installation

Add the add-on repository to HA (either a local path or a GitHub repo URL). HA builds the image and shows it in the add-on store. Click install, click start. Logs visible in HA UI.

---

## Native Build Changes

### New dependency

- `react-native-zeroconf` — mDNS service discovery

### Android permissions

- `ACCESS_WIFI_STATE` — required for mDNS on Android
- Add to `app.json` under `android.permissions` if not already present

### Build impact

- One new preview build (wife's phone) and one new dev client build (your phone)
- After that, all sync logic is JS-only and delivered via OTA updates

---

## Summary of all changes

| Area | What changes |
|------|-------------|
| `types/index.ts` | Add `updatedAt`, `deletedAt` to Kid and Category. Add `deviceId` to AppState. |
| `utils/storage.ts` | Migration to add `updatedAt` to existing entities |
| `utils/sync.ts` | New file — sync function |
| `utils/discovery.ts` | New file — mDNS server discovery |
| `context/AppContext.tsx` | Call sync after load and after every state change (debounced) |
| `context/actions.ts` | Update DELETE actions to soft-delete. Add LOAD_STATE handling for sync. |
| `app/(tabs)/settings.tsx` | Add sync status indicator and "Recently Deleted" section |
| `app/settings-recently-deleted.tsx` | New screen — list and restore soft-deleted entities |
| `app.json` | Add Android WiFi permission |
| `package.json` | Add `react-native-zeroconf` |
| `piggybank-sync-addon/` | New directory — full HA add-on with server code |
