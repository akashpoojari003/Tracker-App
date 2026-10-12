// src/app/(tabs)/settings.tsx — cycle defaults, currency + categories, data export/delete.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { CategoryManager } from '@/components/category-manager';
import { CurrencyPicker } from '@/components/currency-picker';
import { DataSection } from '@/components/data-section';
import { Screen } from '@/components/screen';
import { SettingsSection } from '@/components/settings-section';
import { LoadingView } from '@/components/status-views';
import { StepperRow } from '@/components/stepper-row';
import { ThemedText } from '@/components/themed-text';
import { ToggleRow } from '@/components/toggle-row';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listCategories, type Category } from '@/db/categories';
import { getCycleSettings, getSetting, setCycleSetting, setSetting } from '@/db/settings';
import { CURRENCY_SETTING_KEY } from '@/hooks/use-currency-symbol';
import { DEFAULT_CYCLE_SETTINGS, type CycleSettings } from '@/logic/cycle';
import { DEFAULT_CURRENCY_SYMBOL } from '@/logic/money';
import {
  ensureReminderPermission,
  getReminderPrefs,
  rescheduleReminders,
  setReminderPref,
  type ReminderKey,
  type ReminderPrefs,
} from '@/logic/reminders';
import { CYCLE_LIMITS, type CycleKey } from '@/logic/settings';

const REMINDER_ROWS: { key: ReminderKey; label: string }[] = [
  { key: 'period', label: 'Remind me 2 days before my period' },
  { key: 'fertile', label: 'Fertile window starts' },
];

const NO_REMINDERS: ReminderPrefs = { period: false, fertile: false };

const CYCLE_ROWS: { key: CycleKey; label: string }[] = [
  { key: 'defaultCycleLength', label: 'Cycle length' },
  { key: 'defaultPeriodLength', label: 'Period length' },
  { key: 'lutealLength', label: 'Luteal phase' },
];

export default function SettingsScreen() {
  const [cycle, setCycle] = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS);
  const [symbol, setSymbol] = useState(DEFAULT_CURRENCY_SYMBOL);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<ReminderPrefs>(NO_REMINDERS);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const [c, s, cats, r] = await Promise.all([
      getCycleSettings(),
      getSetting(CURRENCY_SETTING_KEY),
      listCategories(),
      getReminderPrefs(),
    ]);
    setCycle(c);
    setSymbol(s?.trim() || DEFAULT_CURRENCY_SYMBOL);
    setCategories(cats);
    setReminders(r);
    setLoaded(true);
  }, []);

  const refresh = useCallback(() => {
    reload().catch(() => Alert.alert('Could not load settings'));
  }, [reload]);

  useFocusEffect(refresh);

  const changeCycle = (key: CycleKey, value: number) => {
    setCycle((prev) => ({ ...prev, [key]: value }));
    setCycleSetting(key, value)
      .then(() => rescheduleReminders().catch(() => undefined))
      .catch(() => {
        Alert.alert('Could not save', 'Please try again.');
        refresh();
      });
  };

  const changeReminder = async (key: ReminderKey, on: boolean) => {
    try {
      if (on && !(await ensureReminderPermission())) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for this app in your system settings to use reminders.',
        );
        return;
      }
      setReminders((prev) => ({ ...prev, [key]: on }));
      await setReminderPref(key, on);
      await rescheduleReminders();
    } catch {
      Alert.alert('Could not save', 'Please try again.');
      refresh();
    }
  };

  const changeSymbol = (next: string) => {
    setSymbol(next);
    setSetting(CURRENCY_SETTING_KEY, next).catch(() => {
      Alert.alert('Could not save', 'Please try again.');
      refresh();
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Settings
        </ThemedText>
        {!loaded ? (
          <LoadingView label="Loading settings…" />
        ) : (
          <>
            <SettingsSection
              title="Cycle"
              footer="Cycle and period length are used until you've logged enough periods to average. Luteal length always applies.">
              {CYCLE_ROWS.map(({ key, label }) => (
                <StepperRow
                  key={key}
                  label={label}
                  value={cycle[key]}
                  min={CYCLE_LIMITS[key].min}
                  max={CYCLE_LIMITS[key].max}
                  onChange={(n) => changeCycle(key, n)}
                />
              ))}
            </SettingsSection>

            <SettingsSection
              title="Reminders"
              footer="Notifications only say 'Reminder from Tracker'. Nothing is sent off your phone.">
              {REMINDER_ROWS.map(({ key, label }) => (
                <ToggleRow key={key} label={label} value={reminders[key]} onChange={(on) => changeReminder(key, on)} />
              ))}
            </SettingsSection>

            <SettingsSection title="Expenses">
              <ThemedText type="smallBold">Currency symbol</ThemedText>
              <CurrencyPicker value={symbol} onChange={changeSymbol} />
              <ThemedText type="smallBold">Categories</ThemedText>
              <CategoryManager categories={categories} onChanged={refresh} />
            </SettingsSection>

            <SettingsSection title="Data">
              <DataSection onDeleted={refresh} />
            </SettingsSection>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.four },
});
