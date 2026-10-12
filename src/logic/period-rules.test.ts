import { describe, expect, it } from '@jest/globals';

import type { PeriodLog } from '@/db/periods';
import { getDayActions } from './period-rules';

const TODAY = '2026-03-20';
const P = (id: number, start_date: string, end_date: string | null): PeriodLog => ({ id, start_date, end_date });
const kinds = (date: string, periods: PeriodLog[]) => getDayActions(date, periods, TODAY).map((a) => a.kind);

describe('getDayActions', () => {
  it('offers nothing on future dates', () => {
    expect(kinds('2026-03-21', [])).toEqual([]);
  });

  it('empty day: can start a period, nothing to end or remove', () => {
    expect(kinds('2026-03-10', [])).toEqual(['start']);
  });

  it('open period: can end it on a later day', () => {
    const periods = [P(1, '2026-03-10', null)];
    const end = getDayActions('2026-03-13', periods, TODAY).find((a) => a.kind === 'end');
    expect(end?.op).toEqual({ type: 'update', id: 1, start_date: '2026-03-10', end_date: '2026-03-13' });
  });

  it('never ends before the start date', () => {
    expect(kinds('2026-03-05', [P(1, '2026-03-10', null)])).toEqual(['start']);
  });

  it('inside a closed period: move start, move end, or remove', () => {
    const periods = [P(1, '2026-03-02', '2026-03-06')];
    expect(kinds('2026-03-04', periods)).toEqual(['start', 'end', 'remove']);
    expect(getDayActions('2026-03-04', periods, TODAY)[0].op).toEqual({
      type: 'update', id: 1, start_date: '2026-03-04', end_date: '2026-03-06',
    });
  });

  it('on the start day, no no-op start action; on the end day, no no-op end action', () => {
    const periods = [P(1, '2026-03-02', '2026-03-06')];
    expect(kinds('2026-03-02', periods)).toEqual(['end', 'remove']);
    expect(kinds('2026-03-06', periods)).toEqual(['start', 'remove']);
  });

  it('cannot extend a period onto or past the next period start', () => {
    const periods = [P(1, '2026-02-01', '2026-02-04'), P(2, '2026-02-10', null)];
    const endsFor = (date: string) =>
      getDayActions(date, periods, TODAY).filter((a) => a.kind === 'end').map((a) => (a.op as { id: number }).id);
    expect(endsFor('2026-02-08')).toEqual([1]); // extends period 1, still before period 2
    expect(endsFor('2026-02-10')).toEqual([2]); // never period 1
    expect(endsFor('2026-02-12')).toEqual([2]);
  });

  it('extending a closed period is blocked past the max length', () => {
    const periods = [P(1, '2026-02-01', '2026-02-04')];
    expect(kinds('2026-02-10', periods)).toEqual(['start', 'end']);
    expect(kinds('2026-02-20', periods)).toEqual(['start']);
  });
});
