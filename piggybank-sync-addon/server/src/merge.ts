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
      const clientTime = new Date(clientItem.updatedAt).getTime();
      const serverTime = new Date(serverItem.updatedAt).getTime();
      if (clientTime > serverTime) {
        merged.set(clientItem.id, clientItem);
      }
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

  for (const kid of mergedKids) {
    upsertKid(kid);
  }
  for (const cat of mergedCategories) {
    upsertCategory(cat);
  }
  for (const tx of mergedTransactions) {
    upsertTransaction(tx);
  }

  pruneOldDeletes();

  return {
    kids: mergedKids,
    categories: mergedCategories,
    transactions: mergedTransactions,
  };
}
