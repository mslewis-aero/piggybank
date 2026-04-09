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
