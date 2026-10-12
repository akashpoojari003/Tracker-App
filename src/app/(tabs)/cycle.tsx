// src/app/(tabs)/cycle.tsx
import dayjs from 'dayjs';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { CycleDashboardCard } from '@/components/CycleDashboardCard';
import { CycleDay, DayMarksContext } from '@/components/cycle-day';
import { CycleLegend } from '@/components/cycle-legend';
import { DayActionsModal } from '@/components/day-actions-modal';
import { Screen } from '@/components/screen';
import { LoadingView } from '@/components/status-views';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { addPeriod, deletePeriod, listPeriods, updatePeriod, type PeriodLog } from '@/db/periods';
import { useCycleSettings } from '@/hooks/use-cycle-settings';
import { useTheme } from '@/hooks/use-theme';
import { buildDayMarks, describeDay } from '@/logic/calendar-marks';
import { getDayInfo, predictCycles, type CycleLog } from '@/logic/cycle';
import { upcomingFertileWindow } from '@/logic/dashboard';
import { getDayActions, type DayAction, type PeriodOp } from '@/logic/period-rules';
import { rescheduleReminders } from '@/logic/reminders';

const FMT = 'YYYY-MM-DD';
const MAX_MONTHS_AHEAD = 36;

const toCycleLog = (p: PeriodLog): CycleLog => ({ startDate: p.start_date, endDate: p.end_date });

async function runOp(op: PeriodOp): Promise<void> {
  if (op.type === 'add') await addPeriod({ start_date: op.start_date, end_date: op.end_date });
  else if (op.type === 'update') await updatePeriod(op.id, { start_date: op.start_date, end_date: op.end_date });
  else await deletePeriod(op.id);
}

/** Months from today to cover the visible month (plus a little slack). */
const monthsToCover = (visibleMonth: string, today: string): number =>
  Math.min(MAX_MONTHS_AHEAD, Math.max(2, dayjs(visibleMonth).diff(dayjs(today), 'month') + 2));

export default function CycleScreen() {
  const theme = useTheme();
  const settings = useCycleSettings();
  const today = dayjs().format(FMT);
  const [periods, setPeriods] = useState<PeriodLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const [selected, setSelected] = useState<string | null>(null);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    setPeriods(await listPeriods());
    setLoaded(true);
  }, []);
  useFocusEffect(
    useCallback(() => {
      reload().catch(() => Alert.alert('Could not load periods'));
    }, [reload]),
  );

  const logs = useMemo(() => periods.map(toCycleLog), [periods]);
  const predicted = useMemo(
    () => predictCycles(logs, settings, monthsToCover(visibleMonth, today), today),
    [logs, settings, visibleMonth, today],
  );
  const dayInfo = useMemo(() => getDayInfo(today, logs, settings), [logs, settings, today]);
  const fertile = useMemo(() => upcomingFertileWindow(predicted, today), [predicted, today]);
  const marks = useMemo(() => buildDayMarks(periods, predicted), [periods, predicted]);
  const actions = useMemo(() => (selected ? getDayActions(selected, periods, today) : []), [selected, periods, today]);

  const onSelect = async (action: DayAction) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await runOp(action.op);
      await rescheduleReminders().catch(() => undefined);
      setSelected(null);
      await reload();
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      busy.current = false;
    }
  };

  const emptyText =
    selected && selected > today ? "Periods can't be logged on future dates." : 'No actions available for this day.';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }}>
        {loaded ? (
          <CycleDashboardCard info={dayInfo} today={today} fertile={fertile} />
        ) : (
          <LoadingView label="Loading your cycle…" />
        )}
        <DayMarksContext.Provider value={marks}>
          <Calendar
            key={theme.background}
            dayComponent={CycleDay as never}
            hideExtraDays
            enableSwipeMonths
            onDayPress={(d: DateData) => setSelected(d.dateString)}
            onMonthChange={(m: DateData) => setVisibleMonth(m.dateString)}
            theme={{
              calendarBackground: theme.background,
              monthTextColor: theme.text,
              textSectionTitleColor: theme.textSecondary,
              arrowColor: theme.text,
              disabledArrowColor: theme.textSecondary,
              todayTextColor: theme.primary,
            }}
          />
        </DayMarksContext.Provider>
        <CycleLegend />
      </ScrollView>
      <DayActionsModal
        date={selected}
        status={selected ? describeDay(marks[selected]) || 'Nothing marked' : ''}
        actions={actions}
        emptyText={emptyText}
        onSelect={onSelect}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}
