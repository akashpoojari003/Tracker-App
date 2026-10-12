// src/hooks/use-cycle-settings.ts — cycle defaults from settings (28 / 5 / 14 until loaded).
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getCycleSettings } from '@/db/settings';
import { DEFAULT_CYCLE_SETTINGS, type CycleSettings } from '@/logic/cycle';
import { sameCycleSettings } from '@/logic/settings';

export function useCycleSettings(): CycleSettings {
  const [settings, setSettings] = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      getCycleSettings()
        .then((next) => setSettings((prev) => (sameCycleSettings(prev, next) ? prev : next)))
        .catch(() => setSettings(DEFAULT_CYCLE_SETTINGS));
    }, []),
  );

  return settings;
}
