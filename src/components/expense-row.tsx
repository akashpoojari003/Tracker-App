// src/components/expense-row.tsx — one expense in the Expenses list.
import dayjs from 'dayjs';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Category } from '@/db/categories';
import type { Expense } from '@/db/expenses';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/logic/money';

type Props = {
  expense: Expense;
  category: Category | undefined;
  symbol: string;
  showDate?: boolean;
  onPress: () => void;
};

export function ExpenseRow({ expense, category, symbol, showDate = true, onPress }: Props) {
  const theme = useTheme();
  const date = showDate ? dayjs(expense.date).format('D MMM YYYY') : null;
  const subtitle = [date, expense.note].filter(Boolean).join(' · ');
  const name = category?.name ?? 'Uncategorised';
  const amount = formatMoney(expense.amount_minor, symbol);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[name, amount, subtitle].filter(Boolean).join(', ')}
      accessibilityHint="Opens the expense to edit"
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.dot, { backgroundColor: category?.color ?? theme.textSecondary }]} />
      <View style={styles.body}>
        <ThemedText type="smallBold">{name}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="smallBold">{amount}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.mid,
    padding: Spacing.mid,
    borderRadius: 14,
    marginBottom: Spacing.two,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  body: { flex: 1 },
});
