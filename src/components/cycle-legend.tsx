// src/components/cycle-legend.tsx — every calendar mark with a text label (colour is never the only cue).
import { StyleSheet, View } from 'react-native';

import { dayPalette } from '@/components/cycle-day';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DAY_KIND_LABELS, OVULATION_LABEL, type DayKind } from '@/logic/calendar-marks';

type Item = { label: string; kind?: DayKind; marker?: 'ovulation' | 'today' };

const ITEMS: Item[] = [
  { label: DAY_KIND_LABELS.logged, kind: 'logged' },
  { label: DAY_KIND_LABELS.predicted, kind: 'predicted' },
  { label: DAY_KIND_LABELS.fertile, kind: 'fertile' },
  { label: OVULATION_LABEL, marker: 'ovulation' },
  { label: 'Today', marker: 'today' },
];

export function CycleLegend() {
  const theme = useTheme();

  const swatchStyle = ({ kind, marker }: Item) => {
    if (marker === 'ovulation') return [styles.dot, { backgroundColor: theme.ovulation }];
    if (marker === 'today') return [styles.ring, { borderColor: theme.primary }];
    return [styles.swatch, dayPalette(kind, theme).style];
  };

  return (
    <View style={styles.row} accessibilityLabel="Calendar legend">
      {ITEMS.map((i) => (
        <View key={i.label} style={styles.item} accessible accessibilityLabel={i.label}>
          <View style={styles.slot}>
            <View style={swatchStyle(i)} />
          </View>
          <ThemedText type="small">{i.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, paddingHorizontal: Spacing.three },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  slot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 20, height: 20, borderRadius: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  ring: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
});
