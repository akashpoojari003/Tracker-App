// src/db/settings.ts
import { getDb } from '@/db';
import { DEFAULT_CYCLE_SETTINGS, type CycleSettings } from '@/logic/cycle';
import { clampSetting, parseSetting, type CycleKey } from '@/logic/settings';

export type Setting = { key: string; value: string };

/** Insert or update. */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM settings WHERE key = ?', key);
}

export async function listSettings(): Promise<Setting[]> {
  const db = await getDb();
  return db.getAllAsync<Setting>('SELECT key, value FROM settings ORDER BY key');
}

export const CYCLE_SETTING_KEYS: Record<CycleKey, string> = {
  defaultCycleLength: 'default_cycle_length',
  defaultPeriodLength: 'default_period_length',
  lutealLength: 'luteal_length',
};

/** Cycle defaults from the settings table; missing or invalid values fall back to 28 / 5 / 14. */
export async function getCycleSettings(): Promise<CycleSettings> {
  const stored = new Map((await listSettings()).map((s) => [s.key, s.value]));
  const read = (k: CycleKey): number => parseSetting(k, stored.get(CYCLE_SETTING_KEYS[k]));
  return {
    ...DEFAULT_CYCLE_SETTINGS,
    defaultCycleLength: read('defaultCycleLength'),
    defaultPeriodLength: read('defaultPeriodLength'),
    lutealLength: read('lutealLength'),
  };
}

/** Saves one cycle setting, clamped to its limits. Returns the stored value. */
export async function setCycleSetting(key: CycleKey, value: number): Promise<number> {
  const clamped = clampSetting(key, value);
  await setSetting(CYCLE_SETTING_KEYS[key], String(clamped));
  return clamped;
}
