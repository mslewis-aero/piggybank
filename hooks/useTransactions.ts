import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { Transaction } from "../types";

export function useKidTransactions(kidId: string, limit?: number): Transaction[] {
  const { state } = useAppContext();
  return useMemo(() => {
    const sorted = state.transactions
      .filter((t) => t.kidId === kidId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [state.transactions, kidId, limit]);
}

export function useAllTransactions(kidFilter?: string): Transaction[] {
  const { state } = useAppContext();
  return useMemo(() => {
    const filtered = kidFilter
      ? state.transactions.filter((t) => t.kidId === kidFilter)
      : state.transactions;
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [state.transactions, kidFilter]);
}
