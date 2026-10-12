// src/logic/period-rules.ts — pure rules for editing period logs. No React, no DB.
import dayjs from 'dayjs';

import type { PeriodLog } from '@/db/periods';

export const MAX_PERIOD_DAYS = 14;

export type PeriodOp =
  | { type: 'add'; start_date: string; end_date: string | null }
  | { type: 'update'; id: number; start_date: string; end_date: string | null }
  | { type: 'remove'; id: number };

export type DayAction = {
  kind: 'start' | 'end' | 'remove';
  label: string;
  op: PeriodOp;
};

const diffDays = (a: string, b: string): number => dayjs(a).diff(dayjs(b), 'day');
const lastDay = (p: PeriodLog): string => p.end_date ?? p.start_date;

const sortByStart = (periods: PeriodLog[]): PeriodLog[] =>
  [...periods].sort((a, b) => (a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0));

const findInside = (date: string, periods: PeriodLog[]): PeriodLog | undefined =>
  periods.find((p) => p.start_date <= date && date <= lastDay(p));

const findPrevious = (date: string, sorted: PeriodLog[]): PeriodLog | undefined =>
  sorted.filter((p) => p.start_date <= date).pop();

const nextAfter = (p: PeriodLog, sorted: PeriodLog[]): PeriodLog | undefined =>
  sorted.find((q) => q.start_date > p.start_date);

/** Can `target` end on `date` without breaking the rules? */
function canEndOn(date: string, target: PeriodLog, sorted: PeriodLog[]): boolean {
  if (date < target.start_date || date === target.end_date) return false;
  const next = nextAfter(target, sorted);
  if (next && date >= next.start_date) return false;
  return diffDays(date, target.start_date) + 1 <= MAX_PERIOD_DAYS;
}

function startAction(date: string, inside: PeriodLog | undefined): DayAction | null {
  const label = 'Period started this day';
  if (!inside) return { kind: 'start', label, op: { type: 'add', start_date: date, end_date: null } };
  if (date === inside.start_date) return null;
  return { kind: 'start', label, op: { type: 'update', id: inside.id, start_date: date, end_date: inside.end_date } };
}

function endAction(date: string, target: PeriodLog | undefined, sorted: PeriodLog[]): DayAction | null {
  if (!target || !canEndOn(date, target, sorted)) return null;
  const op: PeriodOp = { type: 'update', id: target.id, start_date: target.start_date, end_date: date };
  return { kind: 'end', label: 'Period ended this day', op };
}

/**
 * Only valid actions for a tapped day. No future dates, end >= start,
 * no overlapping periods. Inside a period, start/end edit that period.
 */
export function getDayActions(date: string, periods: PeriodLog[], today: string): DayAction[] {
  if (date > today) return [];
  const sorted = sortByStart(periods);
  const inside = findInside(date, sorted);
  const target = inside ?? findPrevious(date, sorted);
  const remove: DayAction | null = inside
    ? { kind: 'remove', label: 'Remove this period entry', op: { type: 'remove', id: inside.id } }
    : null;
  return [startAction(date, inside), endAction(date, target, sorted), remove].filter(
    (a): a is DayAction => a !== null,
  );
}
