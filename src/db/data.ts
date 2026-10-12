// src/db/data.ts — whole-database helpers for export and "delete all data".
import { getDb, seedCategories } from '@/db';
import { listCategories } from '@/db/categories';
import { listExpenses } from '@/db/expenses';
import { listPeriods } from '@/db/periods';
import { listSettings } from '@/db/settings';
import type { ExportData } from '@/logic/csv';

export async function loadExportData(): Promise<ExportData> {
  const [periods, expenses, categories, settings] = await Promise.all([
    listPeriods(),
    listExpenses(),
    listCategories(),
    listSettings(),
  ]);
  return { periods, expenses, categories, settings };
}

/** Wipes every table, then restores the default categories. All-or-nothing. */
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      'DELETE FROM expenses; DELETE FROM period_logs; DELETE FROM categories; DELETE FROM settings;',
    );
    await seedCategories(db);
  });
}
