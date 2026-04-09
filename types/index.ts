export type CategoryType = "earning" | "spending";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  emoji?: string;
  updatedAt: string;
  deletedAt?: string;
}

export type TransactionType = "deposit" | "withdrawal";

export interface Transaction {
  id: string;
  kidId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  createdAt: string;
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

export interface AppState {
  kids: Kid[];
  categories: Category[];
  transactions: Transaction[];
  deviceId: string;
}
