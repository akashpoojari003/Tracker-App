// src/components/CycleDashboardCard.tsx
import dayjs from 'dayjs';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DayInfo, Phase } from '@/logic/cycle';
import type { FertileWindow } from '@/logic/dashboard';

type Props = {
  info: DayInfo;
  today: string;
  fertile: FertileWindow | null;
};

const PHASES: Record<Exclude<Phase, 'unknown'>, { label: string; color: string; blurb: string }> = {
  menstrual: { label: 'Menstrual', color: '#DC2626', blurb: 'Your period is in progress.' },
  follicular: { label: 'Follicular', color: '#0F766E', blurb: 'Your body is getting ready to ovulate.' },
  ovulation: { label: 'Ovulation', color: '#7C3AED', blurb: 'Estimated ovulation day, when fertility peaks.' },
  luteal: { label: 'Luteal', color: '#B45309', blurb: 'The phase after ovulation, before your next period.' },
};

const plural = (n: number): string => `${n} ${n === 1 ? 'day' : 'days'}`;
const short = (d: string): string => dayjs(d).format('D MMM');

function formatRange({ start, end }: FertileWindow): string {
  const sameMonth = dayjs(start).isSame(dayjs(end), 'month');
  return sameMonth ? `${dayjs(start).format('D')}–${short(end)}` : `${short(start)} – ${short(end)}`;
}

function nextPeriodText(info: DayInfo, today: string): string {
  if (info.daysLate > 0) return `Period is ${plural(info.daysLate)} late`;
  const days = info.daysUntilNextPeriod ?? 0;
  const date = short(dayjs(today).add(days, 'day').format('YYYY-MM-DD'));
  return days === 0 ? `Next period is due today (${date})` : `Next period in ${plural(days)} (${date})`;
}

export function CycleDashboardCard({ info, today, fertile }: Props) {
  const phase = info.phase === 'unknown' ? null : PHASES[info.phase];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {phase && info.cycleDay !== null ? (
        <>
          <View style={styles.row}>
            <ThemedText type="subtitle">{`Day ${info.cycleDay}`}</ThemedText>
            <View style={[styles.chip, { backgroundColor: phase.color }]}>
              <ThemedText type="smallBold" style={styles.chipText}>
                {phase.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText themeColor="textSecondary">{phase.blurb}</ThemedText>
          <ThemedText type="default">{nextPeriodText(info, today)}</ThemedText>
          {fertile ? <ThemedText type="default">{`Fertile window: ${formatRange(fertile)}`}</ThemedText> : null}
        </>
      ) : (
        <>
          <ThemedText type="smallBold">No periods logged yet</ThemedText>
          <ThemedText themeColor="textSecondary">
            Tap a date on the calendar to log your first period and see predictions.
          </ThemedText>
        </>
      )}
      {/* <ThemedText type="small" themeColor="textSecondary">
        Predictions are estimates, not medical advice.
      </ThemedText> */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.three, padding: Spacing.three, borderRadius: 20, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chip: { paddingHorizontal: Spacing.mid, paddingVertical: Spacing.one, borderRadius: 999 },
  chipText: { color: '#FFFFFF' },
});
