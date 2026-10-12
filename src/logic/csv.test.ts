import { describe, expect, it } from '@jest/globals';

import { buildExportCsv, csvCell } from './csv';

describe('csvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('x\ny')).toBe('"x\ny"');
  });

  it('writes null as empty and numbers as-is', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(-5)).toBe('-5');
  });

  it('neutralises formula-looking text', () => {
    expect(csvCell('=1+1')).toBe("'=1+1");
  });
});

describe('buildExportCsv', () => {
  const csv = buildExportCsv({
    periods: [{ id: 1, start_date: '2026-03-01', end_date: null }],
    categories: [{ id: 7, name: 'Food', icon: 'restaurant', color: '#F59E0B', is_default: true }],
    expenses: [
      { id: 2, amount_minor: 1250, category_id: 7, date: '2026-03-02', note: 'lunch, tea', created_at: 'T2' },
      { id: 1, amount_minor: 500, category_id: 7, date: '2026-03-01', note: null, created_at: 'T1' },
    ],
    settings: [{ key: 'currency_symbol', value: '₹' }],
  });

  it('writes every table, oldest expense first, with category names and decimal amounts', () => {
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[0]).toBe('period_logs');
    expect(lines[2]).toBe('1,2026-03-01,');
    expect(lines).toContain('1,2026-03-01,5,Food,,T1');
    expect(lines).toContain('2,2026-03-02,12.50,Food,"lunch, tea",T2');
    expect(lines).toContain('7,Food,restaurant,#F59E0B,1');
    expect(lines).toContain('currency_symbol,₹');
  });

  it('starts with a BOM', () => {
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
});
