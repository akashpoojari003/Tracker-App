// src/logic/settings.ts — limits, parsing and option lists for the Settings screen. Pure.
import { DEFAULT_CYCLE_SETTINGS, type CycleSettings } from '@/logic/cycle';

export type CycleKey = keyof CycleSettings;
export type Limits = { min: number; max: number };

export const CYCLE_LIMITS: Record<CycleKey, Limits> = {
  defaultCycleLength: { min: 21, max: 45 },
  defaultPeriodLength: { min: 1, max: 10 },
  lutealLength: { min: 8, max: 16 },
};

export const CURRENCY_SYMBOLS: readonly string[] = ['₹', '$', '€', '£', '¥', '₩', '₽', '₺', '₦', 'R$'];

export function clampSetting(key: CycleKey, n: number): number {
  const { min, max } = CYCLE_LIMITS[key];
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Stored text -> a valid number; missing or garbage falls back to the default. */
export function parseSetting(key: CycleKey, raw: string | null | undefined): number {
  const n = raw?.trim() ? Number(raw) : NaN;
  return Number.isFinite(n) ? clampSetting(key, n) : DEFAULT_CYCLE_SETTINGS[key];
}

export const sameCycleSettings = (a: CycleSettings, b: CycleSettings): boolean =>
  a.defaultCycleLength === b.defaultCycleLength &&
  a.defaultPeriodLength === b.defaultPeriodLength &&
  a.lutealLength === b.lutealLength;
