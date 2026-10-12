// src/logic/cycle.ts — pure cycle maths. No React, no DB. Dates are 'YYYY-MM-DD'.
import dayjs from 'dayjs';

export type CycleLog = { startDate: string; endDate: string | null };

export type CycleSettings = {
  defaultCycleLength: number;
  defaultPeriodLength: number;
  lutealLength: number;
};

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  defaultCycleLength: 28,
  defaultPeriodLength: 5,
  lutealLength: 14,
};

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

export type PredictedCycle = {
  start: string;
  end: string;
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
};

export type DayInfo = {
  phase: Phase;
  cycleDay: number | null;
  isPredictedPeriod: boolean;
  isFertile: boolean;
  daysUntilNextPeriod: number | null;
  daysLate: number;
};

const FMT = 'YYYY-MM-DD';
const RECENT_CYCLES = 6;
const MIN_GAP = 15;
const MAX_GAP = 60;
const FERTILE_DAYS = 5;

const addDays = (date: string, n: number): string => dayjs(date).add(n, 'day').format(FMT);
const diffDays = (a: string, b: string): number => dayjs(a).diff(dayjs(b), 'day');
const inRange = (d: string, from: string, to: string): boolean => d >= from && d <= to;
const meanRounded = (xs: number[]): number => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);

const sortLogs = (logs: CycleLog[]): CycleLog[] =>
  [...logs].sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));

const uniqueStarts = (logs: CycleLog[]): string[] =>
  Array.from(new Set(sortLogs(logs).map((l) => l.startDate)));

export function avgCycleLength(logs: CycleLog[], settings: CycleSettings): number {
  const starts = uniqueStarts(logs);
  if (starts.length < 2) return settings.defaultCycleLength;
  const gaps = starts
    .slice(1)
    .map((s, i) => diffDays(s, starts[i]))
    .slice(-RECENT_CYCLES)
    .filter((g) => g >= MIN_GAP && g <= MAX_GAP);
  return gaps.length ? meanRounded(gaps) : settings.defaultCycleLength;
}

export function avgPeriodLength(logs: CycleLog[], settings: CycleSettings): number {
  const lengths = logs
    .flatMap((l) => (l.endDate ? [diffDays(l.endDate, l.startDate) + 1] : []))
    .filter((n) => n > 0);
  return lengths.length ? meanRounded(lengths) : settings.defaultPeriodLength;
}

/** Ovulation = next start - luteal; fertile window = ovulation - 5 days .. ovulation. */
function fertileFor(nextStart: string, luteal: number) {
  const ovulation = addDays(nextStart, -luteal);
  return { ovulation, fertileStart: addDays(ovulation, -FERTILE_DAYS), fertileEnd: ovulation };
}

function buildCycle(start: string, periodLen: number, luteal: number): PredictedCycle {
  return { start, end: addDays(start, periodLen - 1), ...fertileFor(start, luteal) };
}

/** Future periods after the latest log, up to `monthsAhead` months after `today`. */
export function predictCycles(
  logs: CycleLog[],
  settings: CycleSettings,
  monthsAhead = 6,
  today: string = dayjs().format(FMT),
): PredictedCycle[] {
  const starts = uniqueStarts(logs);
  if (!starts.length) return [];
  const cycleLen = Math.max(1, avgCycleLength(logs, settings));
  const periodLen = Math.max(1, avgPeriodLength(logs, settings));
  const horizon = dayjs(today).add(monthsAhead, 'month').format(FMT);
  const out: PredictedCycle[] = [];
  for (let s = addDays(starts[starts.length - 1], cycleLen); s <= horizon; s = addDays(s, cycleLen)) {
    out.push(buildCycle(s, periodLen, settings.lutealLength));
  }
  return out;
}

function phaseOf(date: string, periodEnd: string, ovulation: string): Phase {
  if (date <= periodEnd) return 'menstrual';
  if (date === ovulation) return 'ovulation';
  return date < ovulation ? 'follicular' : 'luteal';
}

const UNKNOWN_DAY: DayInfo = {
  phase: 'unknown',
  cycleDay: null,
  isPredictedPeriod: false,
  isFertile: false,
  daysUntilNextPeriod: null,
  daysLate: 0,
};

/**
 * Describes `date` using confirmed logs. A date past the predicted next start
 * (with no newer log) counts as late. Predicted flags come from predictCycles.
 */
export function getDayInfo(date: string, logs: CycleLog[], settings: CycleSettings): DayInfo {
  const sorted = sortLogs(logs);
  const current = sorted.filter((l) => l.startDate <= date).pop();
  if (!current) return UNKNOWN_DAY;

  const actualNext = sorted[sorted.lastIndexOf(current) + 1]?.startDate;
  const cycleLen = Math.max(1, avgCycleLength(logs, settings));
  const periodLen = Math.max(1, avgPeriodLength(logs, settings));
  const nextStart = actualNext ?? addDays(current.startDate, cycleLen);
  const periodEnd = current.endDate ?? addDays(current.startDate, periodLen - 1);
  const fertile = fertileFor(nextStart, settings.lutealLength);
  const predicted = actualNext ? [] : predictCycles(logs, settings, 2, date);

  return {
    phase: phaseOf(date, periodEnd, fertile.ovulation),
    cycleDay: diffDays(date, current.startDate) + 1,
    isPredictedPeriod: predicted.some((p) => inRange(date, p.start, p.end)),
    isFertile:
      inRange(date, fertile.fertileStart, fertile.fertileEnd) ||
      predicted.some((p) => inRange(date, p.fertileStart, p.fertileEnd)),
    daysUntilNextPeriod: Math.max(0, diffDays(nextStart, date)),
    daysLate: !actualNext && date > nextStart ? diffDays(date, nextStart) : 0,
  };
}
