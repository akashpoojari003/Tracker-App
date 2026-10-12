// src/app/(tabs)/expenses.tsx — monthly dashboard: total, category bars, day-grouped list.
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { CategoryBars } from '@/components/category-bars';
import { ExpenseRow } from '@/components/expense-row';
import { MonthSelector } from '@/components/month-selector';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingView } from '@/components/status-views';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listCategories, type Category } from '@/db/categories';
import { listExpensesByMonth, monthlyTotalsByCategory, type CategoryTotal, type Expense } from '@/db/expenses';
import { useCurrencySymbol } from '@/hooks/use-currency-symbol';
import { useTheme } from '@/hooks/use-theme';
import {
  canGoNext,
  changePercent,
  currentMonth,
  dayLabel,
  formatChange,
  groupByDay,
  monthLabel,
  shiftMonth,
  sumMinor,
} from '@/logic/expense-summary';
import { formatMoney } from '@/logic/money';

type LoadStatus = 'loading' | 'ready' | 'error';
type MonthData = { expenses: Expense[]; totals: CategoryTotal[]; prevTotal: number };

const EMPTY: MonthData = { expenses: [], totals: [], prevTotal: 0 };

async function loadMonth(month: string): Promise<MonthData> {
  const [expenses, totals, prevTotals] = await Promise.all([
    listExpensesByMonth(month),
    monthlyTotalsByCategory(month),
    monthlyTotalsByCategory(shiftMonth(month, -1)),
  ]);
  return { expenses, totals, prevTotal: sumMinor(prevTotals) };
}

export default function ExpensesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const symbol = useCurrencySymbol();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<MonthData>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  // Reloads on focus (after the modal closes) and whenever the month changes.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadMonth(month), listCategories()])
        .then(([d, c]) => {
          if (!active) return;
          setData(d);
          setCategories(c);
          setStatus('ready');
        })
        .catch(() => {
          if (active) setStatus('error');
          Alert.alert('Could not load expenses');
        });
      return () => {
        active = false;
      };
    }, [month]),
  );

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const sections = useMemo(() => groupByDay(data.expenses), [data.expenses]);
  const total = sumMinor(data.totals);
  const change = changePercent(total, data.prevTotal);

  const header = (
    <View style={styles.header}>
      <MonthSelector
        label={monthLabel(month)}
        nextDisabled={!canGoNext(month)}
        onPrev={() => setMonth(shiftMonth(month, -1))}
        onNext={() => setMonth(shiftMonth(month, 1))}
      />
      <View style={styles.totalBlock}>
        <ThemedText type="title">{formatMoney(total, symbol)}</ThemedText>
        {change !== null ? (
          <ThemedText type="small" themeColor="textSecondary">
            vs last month: {formatChange(change)}
          </ThemedText>
        ) : null}
      </View>
      {total > 0 ? <CategoryBars totals={data.totals} total={total} symbol={symbol} /> : null}
    </View>
  );

  const empty =
    status === 'loading' ? (
      <LoadingView label="Loading expenses…" />
    ) : status === 'error' ? (
      <EmptyState title="Could not load expenses" message="Switch tabs and come back to try again." />
    ) : (
      <EmptyState title={`No expenses in ${monthLabel(month)}`} message="Tap + to add one." />
    );

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <ThemedText type="smallBold" accessibilityRole="header">
              {dayLabel(section.date)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatMoney(section.total_minor, symbol)}
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            category={byId.get(item.category_id)}
            symbol={symbol}
            showDate={false}
            onPress={() => router.push({ pathname: '/expense-form', params: { id: String(item.id) } })}
          />
        )}
      />
      <Pressable
        onPress={() => router.push('/expense-form')}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        style={[styles.fab, { backgroundColor: theme.primary }]}>
        <Text style={[styles.fabText, { color: theme.onPrimary }]}>+</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, paddingBottom: BottomTabInset + 96 },
  header: { gap: Spacing.three, marginBottom: Spacing.two },
  totalBlock: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.four,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { fontSize: 32, lineHeight: 36 },
});
