import { Category, AppState } from "../types";

export const DEFAULT_EARNING_CATEGORIES: Category[] = [
  { id: "earn-chores", name: "Chores", type: "earning", emoji: "🧹" },
  { id: "earn-homework", name: "Homework", type: "earning", emoji: "📚" },
  { id: "earn-behavior", name: "Good Behavior", type: "earning", emoji: "⭐" },
  { id: "earn-helping", name: "Helping Out", type: "earning", emoji: "🤝" },
  { id: "earn-other", name: "Other", type: "earning", emoji: "💰" },
];

export const DEFAULT_SPENDING_CATEGORIES: Category[] = [
  { id: "spend-toys", name: "Toys", type: "spending", emoji: "🧸" },
  { id: "spend-candy", name: "Candy/Snacks", type: "spending", emoji: "🍬" },
  { id: "spend-savings", name: "Savings Withdrawal", type: "spending", emoji: "🏦" },
  { id: "spend-other", name: "Other", type: "spending", emoji: "🛒" },
];

export const UNDELETABLE_CATEGORY_IDS = ["earn-other", "spend-other"];

export const DEFAULT_STATE: AppState = {
  kids: [],
  categories: [...DEFAULT_EARNING_CATEGORIES, ...DEFAULT_SPENDING_CATEGORIES],
  transactions: [],
};
