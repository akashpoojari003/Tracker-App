// src/components/cycle-day.tsx — custom day cell for react-native-calendars.
// Each mark differs by shape as well as colour: solid = logged, dashed outline = predicted,
// plain tint = fertile, dot = ovulation, ring = today. The accessibility label spells it out.
import dayjs from 'dayjs';
import { createContext, memo, useContext } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { DateData } from 'react-native-calendars';

import { useTheme } from '@/hooks/use-theme';
import { describeDay, type DayKind, type DayMarks } from '@/logic/calendar-marks';

export const DayMarksContext = createContext<DayMarks>({});

type AppTheme = ReturnType<typeof useTheme>;
export type DayPalette = { style: ViewStyle; textColor: string };

/** Shared by the calendar cell and the legend so both always look the same. */
export function dayPalette(kind: DayKind | undefined, theme: AppTheme): DayPalette {
  if (kind === 'logged') return { style: { backgroundColor: theme.logged }, textColor: theme.onLogged };
  if (kind === 'predicted') {
    const border = { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.logged } as const;
    return { style: { backgroundColor: theme.predicted, ...border }, textColor: theme.onPredicted };
  }
  if (kind === 'fertile') return { style: { backgroundColor: theme.fertile }, textColor: theme.onFertile };
  return { style: {}, textColor: theme.text };
}

type Props = {
  date?: DateData;
  state?: string;
  onPress?: (date?: DateData) => void;
};

function CycleDayBase({ date, state, onPress }: Props) {
  const theme = useTheme();
  const marks = useContext(DayMarksContext);
  const mark = date ? marks[date.dateString] : undefined;
  const palette = dayPalette(mark?.kind, theme);
  const isToday = state === 'today';
  const description = [isToday ? 'today' : '', describeDay(mark)].filter(Boolean).join(', ');
  const label = date
    ? [dayjs(date.dateString).format('D MMMM YYYY'), description].filter(Boolean).join(', ')
    : undefined;

  return (
    <Pressable
      onPress={() => onPress?.(date)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.cell}>
      {isToday ? <View style={[styles.ring, { borderColor: theme.primary }]} /> : null}
      <View style={[styles.circle, palette.style]}>
        <Text
          style={[
            styles.text,
            { color: palette.textColor },
            (mark?.kind === 'logged' || isToday) && styles.bold,
            state === 'disabled' && styles.dim,
          ]}>
          {date?.day}
        </Text>
      </View>
      {mark?.ovulation ? <View style={[styles.dot, { backgroundColor: theme.ovulation }]} /> : null}
    </Pressable>
  );
}

export const CycleDay = memo(CycleDayBase);

const styles = StyleSheet.create({
  cell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 2 },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontWeight: '500' },
  bold: { fontWeight: '700' },
  dim: { opacity: 0.4 },
  dot: { position: 'absolute', bottom: 0, width: 7, height: 7, borderRadius: 4 },
});
