// src/logic/reminders.ts — optional local reminders. Text is deliberately discreet for lock screens.
import dayjs from 'dayjs';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { listPeriods } from '@/db/periods';
import { getCycleSettings, getSetting, setSetting } from '@/db/settings';
import { predictCycles, type CycleLog, type PredictedCycle } from '@/logic/cycle';

export type ReminderKey = 'period' | 'fertile';
export type ReminderPrefs = Record<ReminderKey, boolean>;
export type PlannedReminder = { kind: ReminderKey; at: Date };

export const REMINDER_KEYS: Record<ReminderKey, string> = {
  period: 'remind_period',
  fertile: 'remind_fertile',
};

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/** expo-notifications throws on import in Expo Go (Android); load it lazily so the app still runs. */
function loadNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || (Platform.OS === 'android' && isRunningInExpoGo())) return (cached = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

const CHANNEL_ID = 'reminders';
const REMINDER_HOUR = 9;
const PERIOD_LEAD_DAYS = 2;
const HORIZON_MONTHS = 3;
const DISCREET = { title: 'Tracker', body: 'Reminder from Tracker' };

const at9am = (date: string, offsetDays = 0): Date =>
  dayjs(date).add(offsetDays, 'day').hour(REMINDER_HOUR).startOf('hour').toDate();

const firstFuture = (times: Date[], now: Date): Date | undefined =>
  times.find((t) => t.getTime() > now.getTime());

/** Pure: next future reminder time for each enabled kind. `predicted` is ascending. */
export function planReminders(predicted: PredictedCycle[], prefs: ReminderPrefs, now = new Date()): PlannedReminder[] {
  const candidates: [ReminderKey, Date[]][] = [
    ['period', predicted.map((p) => at9am(p.start, -PERIOD_LEAD_DAYS))],
    ['fertile', predicted.map((p) => at9am(p.fertileStart))],
  ];
  return candidates.flatMap(([kind, times]) => {
    const at = prefs[kind] ? firstFuture(times, now) : undefined;
    return at ? [{ kind, at }] : [];
  });
}

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const [period, fertile] = await Promise.all([
    getSetting(REMINDER_KEYS.period),
    getSetting(REMINDER_KEYS.fertile),
  ]);
  return { period: period === '1', fertile: fertile === '1' };
}

export const setReminderPref = (key: ReminderKey, on: boolean): Promise<void> =>
  setSetting(REMINDER_KEYS[key], on ? '1' : '0');

/** Ask only when a toggle is switched on. Returns whether notifications are allowed. */
export async function ensureReminderPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

const schedule = (Notifications: NotificationsModule, { at }: PlannedReminder): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: DISCREET,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
  });

async function run(): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const prefs = await getReminderPrefs();
  if (!prefs.period && !prefs.fertile) return;
  const [periods, settings] = await Promise.all([listPeriods(), getCycleSettings()]);
  const logs: CycleLog[] = periods.map((p) => ({ startDate: p.start_date, endDate: p.end_date }));
  const predicted = predictCycles(logs, settings, HORIZON_MONTHS);
  await Promise.all(planReminders(predicted, prefs).map((r) => schedule(Notifications, r)));
}

let queue: Promise<void> = Promise.resolve();

/** Cancels everything, then schedules the next period and fertile-window reminders. Calls run one at a time. */
export function rescheduleReminders(): Promise<void> {
  queue = queue.catch(() => undefined).then(run);
  return queue;
}
