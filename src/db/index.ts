// src/db/index.ts
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'tracker.db';

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'restaurant', color: '#F59E0B' },
  { name: 'Transport', icon: 'directions_car', color: '#3B82F6' },
  { name: 'Bills', icon: 'receipt_long', color: '#EF4444' },
  { name: 'Shopping', icon: 'shopping_bag', color: '#EC4899' },
  { name: 'Health', icon: 'favorite', color: '#10B981' },
  { name: 'Entertainment', icon: 'movie', color: '#8B5CF6' },
  { name: 'Other', icon: 'more_horiz', color: '#6B7280' },
] as const;

export async function seedCategories(db: SQLiteDatabase): Promise<void> {
  for (const c of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1)',
      c.name,
      c.icon,
      c.color,
    );
  }
}

async function migrateV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE period_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      end_date TEXT
    );
    CREATE INDEX idx_period_logs_start ON period_logs (start_date);

    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount_minor INTEGER NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories (id),
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX idx_expenses_date ON expenses (date);
    CREATE INDEX idx_expenses_category ON expenses (category_id);

    CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await seedCategories(db);
}

// Append new migrations; never edit shipped ones. Index + 1 = schema version.
const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [migrateV1];

async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await MIGRATIONS[v](db);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

async function open(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

let dbPromise: Promise<SQLiteDatabase> | null = null;

/** Shared database handle. Opens and migrates once; safe to call from anywhere. */
export function getDb(): Promise<SQLiteDatabase> {
  dbPromise ??= open().catch((e) => {
    dbPromise = null; // allow retry after a failed init
    throw e;
  });
  return dbPromise;
}

/** Call once at app start (see app/_layout.tsx). */
export const initDatabase = getDb;
