// src/db/periods.ts
import { getDb } from '@/db';

export type PeriodLog = {
  id: number;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string | null; // null while the period is ongoing
};

export type PeriodInput = Omit<PeriodLog, 'id'>;

export async function addPeriod({ start_date, end_date }: PeriodInput): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO period_logs (start_date, end_date) VALUES (?, ?)',
    start_date,
    end_date,
  );
  return res.lastInsertRowId;
}

export async function updatePeriod(id: number, { start_date, end_date }: PeriodInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE period_logs SET start_date = ?, end_date = ? WHERE id = ?',
    start_date,
    end_date,
    id,
  );
}

export async function deletePeriod(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM period_logs WHERE id = ?', id);
}

/** Newest first. */
export async function listPeriods(): Promise<PeriodLog[]> {
  const db = await getDb();
  return db.getAllAsync<PeriodLog>('SELECT * FROM period_logs ORDER BY start_date DESC, id DESC');
}
