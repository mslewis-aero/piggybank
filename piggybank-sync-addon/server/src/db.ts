import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join("/data", "piggybank.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS kids (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        avatarId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        emoji TEXT,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        kidId TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL
      );
    `);
  }
  return db;
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

export interface Category {
  id: string;
  name: string;
  type: string;
  emoji?: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Transaction {
  id: string;
  kidId: string;
  type: string;
  amount: number;
  categoryId: string;
  note?: string;
  createdAt: string;
}

export function getAllKids(): Kid[] {
  return getDb().prepare("SELECT * FROM kids").all() as Kid[];
}

export function getAllCategories(): Category[] {
  return getDb().prepare("SELECT * FROM categories").all() as Category[];
}

export function getAllTransactions(): Transaction[] {
  return getDb().prepare("SELECT * FROM transactions").all() as Transaction[];
}

export function upsertKid(kid: Kid): void {
  getDb().prepare(`
    INSERT INTO kids (id, name, age, avatarId, createdAt, updatedAt, deletedAt)
    VALUES (@id, @name, @age, @avatarId, @createdAt, @updatedAt, @deletedAt)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, age=@age, avatarId=@avatarId, createdAt=@createdAt,
      updatedAt=@updatedAt, deletedAt=@deletedAt
  `).run({ ...kid, deletedAt: kid.deletedAt ?? null });
}

export function upsertCategory(cat: Category): void {
  getDb().prepare(`
    INSERT INTO categories (id, name, type, emoji, updatedAt, deletedAt)
    VALUES (@id, @name, @type, @emoji, @updatedAt, @deletedAt)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, type=@type, emoji=@emoji, updatedAt=@updatedAt, deletedAt=@deletedAt
  `).run({ ...cat, emoji: cat.emoji ?? null, deletedAt: cat.deletedAt ?? null });
}

export function upsertTransaction(tx: Transaction): void {
  getDb().prepare(`
    INSERT OR IGNORE INTO transactions (id, kidId, type, amount, categoryId, note, createdAt)
    VALUES (@id, @kidId, @type, @amount, @categoryId, @note, @createdAt)
  `).run({ ...tx, note: tx.note ?? null });
}

export function pruneOldDeletes(): void {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  getDb().prepare("DELETE FROM kids WHERE deletedAt IS NOT NULL AND deletedAt < ?").run(cutoff);
  getDb().prepare("DELETE FROM categories WHERE deletedAt IS NOT NULL AND deletedAt < ?").run(cutoff);
}
