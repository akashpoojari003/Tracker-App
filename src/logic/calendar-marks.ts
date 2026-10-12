// src/logic/calendar-marks.ts — turns logs + predictions into per-day marks. Pure.
import dayjs from 'dayjs';

import type { PeriodLog } from '@/db/periods';
import type { PredictedCycle } from '@/logic/cycle';

export type DayKind = 'logged' | 'predicted' | 'fertile';
export type DayMark = { kind?: DayKind; ovulation?: boolean };
export type DayMarks = Record<string, DayMark>;

export const DAY_KIND_LABELS: Record<DayKind, string> = {
  logged: 'Logged period',
  predicted: 'Predicted period',
  fertile: 'Fertile window',
};
export const OVULATION_LABEL = 'Ovulation day';

/** Plain-text description of a day's marks, so meaning never depends on colour alone. */
export function describeDay(mark?: DayMark): string {
  const parts = [mark?.kind ? DAY_KIND_LABELS[mark.kind] : '', mark?.ovulation ? OVULATION_LABEL : ''];
  return parts.filter(Boolean).join(', ');
}

const FMT = 'YYYY-MM-DD';
const MAX_SPAN_DAYS = 62;

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  let d = dayjs(from);
  for (let i = 0; i < MAX_SPAN_DAYS && !d.isAfter(dayjs(to), 'day'); i++) {
    days.push(d.format(FMT));
    d = d.add(1, 'day');
  }
  return days;
}

function paint(marks: DayMarks, from: string, to: string, kind: DayKind): void {
  eachDay(from, to).forEach((day) => {
    marks[day] = { ...marks[day], kind };
  });
}

/** Paint order = priority: fertile < predicted < logged. Ovulation is a dot on top. */
export function buildDayMarks(periods: PeriodLog[], predicted: PredictedCycle[]): DayMarks {
  const marks: DayMarks = {};
  predicted.forEach((p) => paint(marks, p.fertileStart, p.fertileEnd, 'fertile'));
  predicted.forEach((p) => paint(marks, p.start, p.end, 'predicted'));
  predicted.forEach((p) => {
    marks[p.ovulation] = { ...marks[p.ovulation], ovulation: true };
  });
  periods.forEach((p) => paint(marks, p.start_date, p.end_date ?? p.start_date, 'logged'));
  return marks;
}
