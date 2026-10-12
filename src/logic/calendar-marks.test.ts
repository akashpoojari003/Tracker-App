import { describe, expect, it } from '@jest/globals';

import { buildDayMarks } from './calendar-marks';

describe('buildDayMarks', () => {
  const predicted = [
    { start: '2026-04-01', end: '2026-04-04', ovulation: '2026-03-18', fertileStart: '2026-03-13', fertileEnd: '2026-03-18' },
  ];

  it('marks predicted, fertile and ovulation days', () => {
    const m = buildDayMarks([], predicted);
    expect(m['2026-04-02']).toEqual({ kind: 'predicted' });
    expect(m['2026-03-13']).toEqual({ kind: 'fertile' });
    expect(m['2026-03-18']).toEqual({ kind: 'fertile', ovulation: true });
  });

  it('logged days win over predictions', () => {
    const m = buildDayMarks([{ id: 1, start_date: '2026-04-02', end_date: '2026-04-03' }], predicted);
    expect(m['2026-04-01'].kind).toBe('predicted');
    expect(m['2026-04-02'].kind).toBe('logged');
    expect(m['2026-04-03'].kind).toBe('logged');
  });

  it('shows an open period as its start day only', () => {
    const m = buildDayMarks([{ id: 1, start_date: '2026-03-02', end_date: null }], []);
    expect(Object.keys(m)).toEqual(['2026-03-02']);
  });
});
