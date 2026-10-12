import { describe, expect, it } from '@jest/globals';

import { clampSetting, parseSetting, sameCycleSettings } from './settings';

describe('clampSetting', () => {
  it('keeps values inside the limits and rounds', () => {
    expect(clampSetting('defaultCycleLength', 10)).toBe(21);
    expect(clampSetting('defaultCycleLength', 99)).toBe(45);
    expect(clampSetting('defaultPeriodLength', 4.6)).toBe(5);
  });
});

describe('parseSetting', () => {
  it('falls back to the default for missing or invalid text', () => {
    expect(parseSetting('defaultCycleLength', null)).toBe(28);
    expect(parseSetting('defaultPeriodLength', '')).toBe(5);
    expect(parseSetting('lutealLength', 'abc')).toBe(14);
  });

  it('clamps stored numbers', () => {
    expect(parseSetting('lutealLength', '30')).toBe(16);
    expect(parseSetting('defaultCycleLength', '30')).toBe(30);
  });
});

describe('sameCycleSettings', () => {
  it('compares by value', () => {
    const a = { defaultCycleLength: 28, defaultPeriodLength: 5, lutealLength: 14 };
    expect(sameCycleSettings(a, { ...a })).toBe(true);
    expect(sameCycleSettings(a, { ...a, lutealLength: 13 })).toBe(false);
  });
});
