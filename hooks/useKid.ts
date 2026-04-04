import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";

export function useKid(kidId: string) {
  const { state } = useAppContext();

  const kid = useMemo(
    () => state.kids.find((k) => k.id === kidId),
    [state.kids, kidId]
  );

  const balance = useMemo(() => {
    return state.transactions
      .filter((t) => t.kidId === kidId)
      .reduce((sum, t) => {
        return t.type === "deposit" ? sum + t.amount : sum - t.amount;
      }, 0);
  }, [state.transactions, kidId]);

  return { kid, balance };
}

export function useKidBalance(kidId: string): number {
  const { state } = useAppContext();
  return useMemo(() => {
    return state.transactions
      .filter((t) => t.kidId === kidId)
      .reduce((sum, t) => {
        return t.type === "deposit" ? sum + t.amount : sum - t.amount;
      }, 0);
  }, [state.transactions, kidId]);
}
