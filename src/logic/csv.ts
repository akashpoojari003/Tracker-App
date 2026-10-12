// src/logic/csv.ts — builds the "export all data" CSV. Pure; one file, one block per table.
import type { Category } from '@/db/categories';
import type { Expense } from '@/db/expenses';
import type { PeriodLog } from '@/db/periods';
import type { Setting } from '@/db/settings';
import { fromMinor } from '@/logic/money';

export type ExportData = {
  periods: PeriodLog[];
  expenses: Expense[];
  categories: Category[];
  settings: Setting[];
};

type Cell = string | number | null;

const EOL = '\r\n';
const BOM = '\uFEFF'; // lets Excel read UTF-8 (currency symbols)

/** Stops spreadsheets from running user text such as "=SUM(...)" as a formula. */
const guardFormula = (s: string): string => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

export function csvCell(value: Cell): string {
  if (value === null) return '';
  const s = typeof value === 'string' ? guardFormula(value) : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const csvRow = (cells: Cell[]): string => cells.map(csvCell).join(',');

const block = (title: string, header: string[], rows: Cell[][]): string =>
  [[title], header, ...rows].map(csvRow).join(EOL);

/** Oldest first, so the file reads chronologically. */
export function buildExportCsv({ periods, expenses, categories, settings }: ExportData): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const blocks = [
    block(
      'period_logs',
      ['id', 'start_date', 'end_date'],
      [...periods].reverse().map((p) => [p.id, p.start_date, p.end_date]),
    ),
    block(
      'expenses',
      ['id', 'date', 'amount', 'category', 'note', 'created_at'],
      [...expenses]
        .reverse()
        .map((e) => [e.id, e.date, fromMinor(e.amount_minor), names.get(e.category_id) ?? '', e.note, e.created_at]),
    ),
    block(
      'categories',
      ['id', 'name', 'icon', 'color', 'is_default'],
      categories.map((c) => [c.id, c.name, c.icon, c.color, c.is_default ? 1 : 0]),
    ),
    block('settings', ['key', 'value'], settings.map((s) => [s.key, s.value])),
  ];
  return BOM + blocks.join(EOL + EOL) + EOL;
}
