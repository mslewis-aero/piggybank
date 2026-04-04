import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { CategoryType } from "../types";

export interface InsightItem {
  categoryId: string;
  categoryName: string;
  emoji: string;
  total: number;
  percentage: number;
}

export function useInsights(
  kidId: string,
  type: CategoryType
): InsightItem[] {
  const { state } = useAppContext();

  return useMemo(() => {
    const transactionType = type === "earning" ? "deposit" : "withdrawal";
    const relevantTransactions = state.transactions.filter(
      (t) => t.kidId === kidId && t.type === transactionType
    );

    const totalAmount = relevantTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    if (totalAmount === 0) return [];

    const byCategory = new Map<string, number>();
    for (const t of relevantTransactions) {
      byCategory.set(
        t.categoryId,
        (byCategory.get(t.categoryId) ?? 0) + t.amount
      );
    }

    const items: InsightItem[] = [];
    for (const [categoryId, total] of byCategory) {
      const cat = state.categories.find((c) => c.id === categoryId);
      items.push({
        categoryId,
        categoryName: cat?.name ?? "Unknown",
        emoji: cat?.emoji ?? "?",
        total,
        percentage: Math.round((total / totalAmount) * 100),
      });
    }

    return items.sort((a, b) => b.total - a.total);
  }, [state.transactions, state.categories, kidId, type]);
}
