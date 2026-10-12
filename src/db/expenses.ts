// src/db/expenses.ts
import { getDb } from '@/db';

export type Expense = {
  id: number;
  amount_minor: number; // integer paise/cents
  category_id: number;
  date: string; // 'YYYY-MM-DD'
  note: string | null;
  created_at: string; // ISO timestamp
};

export type ExpenseInput = Omit<Expense, 'id' | 'created_at'>;

export type CategoryTotal = {
  category_id: number;
  name: string;
  icon: string;
  color: string;
  total_minor: number;
  count: number;
};

function assertMinor(amount: number): void {
  if (!Number.isInteger(amount)) throw new Error('amount_minor must be an integer');
}

/** 'YYYY-MM' -> inclusive [first, last] date strings; string order matches date order. */
const monthRange = (month: string): [string, string] => [`${month}-01`, `${month}-31`];

export async function addExpense({ amount_minor, category_id, date, note }: ExpenseInput): Promise<number> {
  assertMinor(amount_minor);
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO expenses (amount_minor, category_id, date, note, created_at) VALUES (?, ?, ?, ?, ?)',
    amount_minor,
    category_id,
    date,
    note,
    new Date().toISOString(),
  );
  return res.lastInsertRowId;
}

export async function updateExpense(
  id: number,
  { amount_minor, category_id, date, note }: ExpenseInput,
): Promise<void> {
  assertMinor(amount_minor);
  const db = await getDb();
  await db.runAsync(
    'UPDATE expenses SET amount_minor = ?, category_id = ?, date = ?, note = ? WHERE id = ?',
    amount_minor,
    category_id,
    date,
    note,
    id,
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

/** Newest first. */
export async function listExpenses(): Promise<Expense[]> {
  const db = await getDb();
  return db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC, id DESC');
}

export async function listExpensesByMonth(month: string): Promise<Expense[]> {
  const db = await getDb();
  const [from, to] = monthRange(month);
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC, id DESC',
    from,
    to,
  );
}

/** Per-category totals for a month, largest first. */
export async function monthlyTotalsByCategory(month: string): Promise<CategoryTotal[]> {
  const db = await getDb();
  const [from, to] = monthRange(month);
  return db.getAllAsync<CategoryTotal>(
    `SELECT c.id AS category_id, c.name, c.icon, c.color,
            SUM(e.amount_minor) AS total_minor, COUNT(*) AS count
       FROM expenses e
       JOIN categories c ON c.id = e.category_id
      WHERE e.date BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY total_minor DESC`,
    from,
    to,
  );
}
