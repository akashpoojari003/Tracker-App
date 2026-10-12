import { describe, expect, it } from '@jest/globals';

import { formatMoney, fromMinor, sanitizeAmountInput, toMinor } from './money';

describe('toMinor', () => {
  it('converts decimals to integer minor units without float drift', () => {
    expect(toMinor('12')).toBe(1200);
    expect(toMinor('12.5')).toBe(1250);
    expect(toMinor('12.50')).toBe(1250);
    expect(toMinor('0.07')).toBe(7);
    expect(toMinor('19.99')).toBe(1999);
    expect(toMinor('.5')).toBe(50);
    expect(toMinor('5.')).toBe(500);
    expect(toMinor('12,5')).toBe(1250);
  });

  it('rejects empty, invalid, and unsafe input', () => {
    ['', ' ', '.', 'abc', '1.234', '-5', '1.2.3', '99999999999999999999'].forEach((s) =>
      expect(toMinor(s)).toBeNull(),
    );
  });
});

describe('fromMinor', () => {
  it('round-trips with toMinor', () => {
    [0, 7, 50, 1200, 1250, 1999, 123456].forEach((n) => expect(toMinor(fromMinor(n))).toBe(n));
    expect(fromMinor(1250)).toBe('12.50');
    expect(fromMinor(1200)).toBe('12');
  });
});

describe('formatMoney', () => {
  it('defaults to the rupee sign with lakh grouping', () => {
    expect(formatMoney(5)).toBe('₹0.05');
    expect(formatMoney(123450)).toBe('₹1,234.50');
    expect(formatMoney(123456700)).toBe('₹12,34,567.00');
  });

  it('uses the given symbol with thousands grouping', () => {
    expect(formatMoney(123456700, '$')).toBe('$1,234,567.00');
    expect(formatMoney(-250, '$')).toBe('-$2.50');
  });
});

describe('sanitizeAmountInput', () => {
  it('keeps digits, one dot, two decimals', () => {
    expect(sanitizeAmountInput('1a2')).toBe('12');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
    expect(sanitizeAmountInput('1.239')).toBe('1.23');
    expect(sanitizeAmountInput('1,5')).toBe('1.5');
  });
});
