import { describe, expect, it } from '@jest/globals';

import { upcomingFertileWindow } from './dashboard';

const cycle = (fertileStart: string, fertileEnd: string) => ({
  start: '', end: '', ovulation: fertileEnd, fertileStart, fertileEnd,
});
const predicted = [cycle('2026-03-13', '2026-03-18'), cycle('2026-04-12', '2026-04-17')];

describe('upcomingFertileWindow', () => {
  it('returns the window that is current or next', () => {
    expect(upcomingFertileWindow(predicted, '2026-03-15')).toEqual({ start: '2026-03-13', end: '2026-03-18' });
    expect(upcomingFertileWindow(predicted, '2026-03-18')?.end).toBe('2026-03-18');
  });

  it('skips windows that already passed (e.g. late period)', () => {
    expect(upcomingFertileWindow(predicted, '2026-03-25')).toEqual({ start: '2026-04-12', end: '2026-04-17' });
  });

  it('returns null with no predictions', () => {
    expect(upcomingFertileWindow([], '2026-03-15')).toBeNull();
  });
});
