import { describe, expect, it } from '@jest/globals';
import dayjs from 'dayjs';
import {
  avgCycleLength,
  avgPeriodLength,
  getDayInfo,
  predictCycles,
  DEFAULT_CYCLE_SETTINGS as S,
  type CycleLog,
} from './cycle';

// Gaps 29 and 31 -> avg cycle 30; lengths 3, 4, 5 -> avg period 4.
const THREE: CycleLog[] = [
  { startDate: '2026-01-01', endDate: '2026-01-03' },
  { startDate: '2026-01-30', endDate: '2026-02-02' },
  { startDate: '2026-03-02', endDate: '2026-03-06' },
];

describe('no logs', () => {
  it('uses defaults, predicts nothing, day is unknown', () => {
    expect(avgCycleLength([], S)).toBe(28);
    expect(avgPeriodLength([], S)).toBe(5);
    expect(predictCycles([], S, 6, '2026-03-01')).toEqual([]);
    expect(getDayInfo('2026-03-01', [], S)).toEqual({
      phase: 'unknown',
      cycleDay: null,
      isPredictedPeriod: false,
      isFertile: false,
      daysUntilNextPeriod: null,
      daysLate: 0,
    });
  });
});

describe('one log', () => {
  const logs: CycleLog[] = [{ startDate: '2026-03-02', endDate: null }];

  it('falls back to defaults and predicts from them', () => {
    expect(avgCycleLength(logs, S)).toBe(28);
    expect(avgPeriodLength(logs, S)).toBe(5);
    expect(predictCycles(logs, S, 1, '2026-03-10')[0]).toEqual({
      start: '2026-03-30',
      end: '2026-04-03',
      ovulation: '2026-03-16',
      fertileStart: '2026-03-11',
      fertileEnd: '2026-03-16',
    });
  });

  it('derives phases across the cycle', () => {
    expect(getDayInfo('2026-03-04', logs, S)).toMatchObject({
      phase: 'menstrual',
      cycleDay: 3,
      isFertile: false,
      daysUntilNextPeriod: 26,
      daysLate: 0,
    });
    expect(getDayInfo('2026-03-11', logs, S)).toMatchObject({ phase: 'follicular', isFertile: true });
    expect(getDayInfo('2026-03-16', logs, S)).toMatchObject({ phase: 'ovulation', cycleDay: 15, isFertile: true });
    expect(getDayInfo('2026-03-20', logs, S)).toMatchObject({ phase: 'luteal', isFertile: false });
    expect(getDayInfo('2026-03-30', logs, S)).toMatchObject({ isPredictedPeriod: true, daysUntilNextPeriod: 0, daysLate: 0 });
  });

  it('is unknown before the first log', () => {
    expect(getDayInfo('2026-02-20', logs, S).phase).toBe('unknown');
  });
});

describe('three logs with different lengths', () => {
  it('averages gaps and period lengths', () => {
    expect(avgCycleLength(THREE, S)).toBe(30);
    expect(avgPeriodLength(THREE, S)).toBe(4);
  });

  it('predicts months ahead from the latest start', () => {
    const out = predictCycles(THREE, S, 6, '2026-03-10');
    expect(out).toHaveLength(6);
    expect(out[0]).toEqual({
      start: '2026-04-01',
      end: '2026-04-04',
      ovulation: '2026-03-18',
      fertileStart: '2026-03-13',
      fertileEnd: '2026-03-18',
    });
    expect(out[1].start).toBe('2026-05-01');
  });

  it('is order-independent', () => {
    expect(predictCycles([...THREE].reverse(), S, 1, '2026-03-10')).toEqual(predictCycles(THREE, S, 1, '2026-03-10'));
  });

  it('uses the actual next start for past cycles', () => {
    expect(getDayInfo('2026-01-10', THREE, S)).toMatchObject({
      phase: 'follicular',
      cycleDay: 10,
      isPredictedPeriod: false,
      daysUntilNextPeriod: 20,
    });
  });
});

describe('gap filtering', () => {
  it('ignores gaps under 15 and over 60 days', () => {
    const logs: CycleLog[] = [
      { startDate: '2026-01-01', endDate: null },
      { startDate: '2026-01-10', endDate: null }, // 9 -> ignored
      { startDate: '2026-02-09', endDate: null }, // 30
    ];
    expect(avgCycleLength(logs, S)).toBe(30);
    const far: CycleLog[] = [
      { startDate: '2026-01-01', endDate: null },
      { startDate: '2026-04-01', endDate: null }, // 90 -> ignored
    ];
    expect(avgCycleLength(far, S)).toBe(28);
  });

  it('only looks at the last 6 cycles', () => {
    let d = dayjs('2025-01-01');
    const logs: CycleLog[] = [{ startDate: d.format('YYYY-MM-DD'), endDate: null }];
    [40, 28, 28, 28, 28, 28, 28].forEach((gap) => {
      d = d.add(gap, 'day');
      logs.push({ startDate: d.format('YYYY-MM-DD'), endDate: null });
    });
    expect(avgCycleLength(logs, S)).toBe(28);
  });
});

describe('edited start date', () => {
  it('shifts averages and predictions', () => {
    const edited = THREE.map((l) =>
      l.startDate === '2026-03-02' ? { startDate: '2026-03-12', endDate: '2026-03-16' } : l,
    );
    expect(avgCycleLength(edited, S)).toBe(35); // gaps 29 and 41
    expect(predictCycles(THREE, S, 1, '2026-03-20')[0].start).toBe('2026-04-01');
    expect(predictCycles(edited, S, 1, '2026-03-20')[0]).toMatchObject({
      start: '2026-04-16',
      end: '2026-04-19',
    });
    expect(getDayInfo('2026-03-13', edited, S)).toMatchObject({ phase: 'menstrual', cycleDay: 2 });
  });
});

describe('late period', () => {
  it('reports days late once past the predicted start', () => {
    expect(getDayInfo('2026-04-01', THREE, S)).toMatchObject({ daysLate: 0, daysUntilNextPeriod: 0 });
    expect(getDayInfo('2026-04-04', THREE, S)).toMatchObject({
      phase: 'luteal',
      cycleDay: 34,
      isPredictedPeriod: true,
      daysUntilNextPeriod: 0,
      daysLate: 3,
    });
    expect(getDayInfo('2026-04-10', THREE, S)).toMatchObject({ isPredictedPeriod: false, daysLate: 9 });
  });

  it('stops being late once the new period is logged', () => {
    const logged = [...THREE, { startDate: '2026-04-05', endDate: null }];
    expect(getDayInfo('2026-04-06', logged, S)).toMatchObject({ phase: 'menstrual', cycleDay: 2, daysLate: 0 });
  });
});
