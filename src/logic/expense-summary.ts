// src/logic/expense-summary.ts — pure helpers for the Expenses dashboard (months are 'YYYY-MM').
import dayjs from 'dayjs';

const MONTH_FMT = 'YYYY-MM';

export type DayGroup<T> = { date: string; total_minor: number; data: T[] };

export const currentMonth = (): string => dayjs().format(MONTH_FMT);

export const shiftMonth = (month: string, delta: number): string =>
  dayjs(`${month}-01`).add(delta, 'month').format(MONTH_FMT);

/** Next is allowed only while the shown month is before the current month. */
export const canGoNext = (month: string): boolean => month < currentMonth();

export const monthLabel = (month: string): string => dayjs(`${month}-01`).format('MMMM YYYY');

export const sumMinor = (rows: { total_minor: number }[]): number =>
  rows.reduce((sum, r) => sum + r.total_minor, 0);

export const percentOf = (part: number, total: number): number =>
  total > 0 ? Math.round((part * 100) / total) : 0;

/** Percent change vs previous; null when there is no previous data to compare. */
export function changePercent(current: number, previous: number): number | null {
  return previous > 0 ? Math.round(((current - previous) * 100) / previous) : null;
}

export const formatChange = (p: number): string => `${p > 0 ? '+' : ''}${p}%`;

export function dayLabel(date: string): string {
  const d = dayjs(date);
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('ddd, D MMM');
}

/** Groups rows (already newest first) by date, keeping order and a per-day total. */
export function groupByDay<T extends { date: string; amount_minor: number }>(rows: T[]): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();
  for (const r of rows) {
    const g = groups.get(r.date) ?? { date: r.date, total_minor: 0, data: [] };
    g.total_minor += r.amount_minor;
    g.data.push(r);
    groups.set(r.date, g);
  }
  return [...groups.values()];
}
