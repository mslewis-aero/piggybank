import { Kid, Transaction, Category, AppState } from "../types";

export type AppAction =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "ADD_KID"; payload: Omit<Kid, "createdAt"> }
  | { type: "EDIT_KID"; payload: { id: string; name: string; age: number; avatarId: string } }
  | { type: "DELETE_KID"; payload: { id: string } }
  | { type: "ADD_TRANSACTION"; payload: Omit<Transaction, "id" | "createdAt"> }
  | { type: "ADD_CATEGORY"; payload: Omit<Category, "id"> }
  | { type: "EDIT_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: { id: string } };
