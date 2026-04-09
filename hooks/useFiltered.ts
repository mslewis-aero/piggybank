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
