// src/components/category-bars.tsx — horizontal bars per category: colour, amount and share of total.
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CategoryTotal } from '@/db/expenses';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/logic/money';
import { percentOf } from '@/logic/expense-summary';

type Props = { totals: CategoryTotal[]; total: number; symbol: string };

export function CategoryBars({ totals, total, symbol }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {totals.map((t) => {
        const pct = percentOf(t.total_minor, total);
        return (
          <View key={t.category_id} style={styles.item}>
            <View style={styles.labels}>
              <ThemedText type="small">{t.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatMoney(t.total_minor, symbol)} · {pct}%
              </ThemedText>
            </View>
            <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.fill, { width: `${Math.max(pct, 2)}%`, backgroundColor: t.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.mid },
  item: { gap: Spacing.one },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
