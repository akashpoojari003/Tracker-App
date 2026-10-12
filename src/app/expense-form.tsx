// src/app/expense-form.tsx — add/edit expense modal. Pass ?id=<expense id> to edit.
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/category-chips';
import { DateField } from '@/components/date-field';
import { NewCategoryModal } from '@/components/new-category-modal';
import { LoadingView } from '@/components/status-views';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { addCategory, listCategories, type Category } from '@/db/categories';
import { addExpense, deleteExpense, listExpenses, updateExpense, type ExpenseInput } from '@/db/expenses';
import { useCurrencySymbol } from '@/hooks/use-currency-symbol';
import { useTheme } from '@/hooks/use-theme';
import { fromMinor, sanitizeAmountInput, toMinor } from '@/logic/money';

const FMT = 'YYYY-MM-DD';

export default function ExpenseFormScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const symbol = useCurrencySymbol();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id && Number.isInteger(Number(id)) ? Number(id) : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(() => dayjs().format(FMT));
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    (async () => {
      setCategories(await listCategories());
      if (editId !== null) {
        const e = (await listExpenses()).find((x) => x.id === editId);
        if (!e) return router.back();
        setAmount(fromMinor(e.amount_minor));
        setCategoryId(e.category_id);
        setDate(e.date);
        setNote(e.note ?? '');
      }
      setReady(true);
    })().catch(() => Alert.alert('Could not load', 'Please close this screen and try again.'));
  }, [editId, router]);

  const minor = toMinor(amount);
  const amountError = minor === null || minor <= 0 ? 'Enter an amount greater than 0' : null;
  const categoryError = categoryId === null ? 'Choose a category' : null;

  const guarded = async (fn: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn();
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      busy.current = false;
    }
  };

  const save = () => {
    setSubmitted(true);
    if (amountError || categoryError || minor === null || categoryId === null) return;
    const input: ExpenseInput = { amount_minor: minor, category_id: categoryId, date, note: note.trim() || null };
    guarded(async () => {
      if (editId === null) await addExpense(input);
      else await updateExpense(editId, input);
      router.back();
    });
  };

  const confirmDelete = () => {
    if (editId === null) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          guarded(async () => {
            await deleteExpense(editId);
            router.back();
          }),
      },
    ]);
  };

  const createCategory = async (name: string, color: string) => {
    const newId = await addCategory({ name, icon: 'label', color });
    setCategories(await listCategories());
    setCategoryId(newId);
    setNewOpen(false);
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: editId === null ? 'Add expense' : 'Edit expense',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
              <ThemedText>Cancel</ThemedText>
            </Pressable>
          ),
        }}
      />
      {!ready ? (
        <LoadingView label="Loading…" fill />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.content, { paddingBottom: Spacing.four + insets.bottom }]}>
          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary">
              Amount
            </ThemedText>
            <View style={styles.amountRow}>
              <ThemedText type="subtitle">{symbol}</ThemedText>
              <TextInput
                value={amount}
                onChangeText={(t) => setAmount(sanitizeAmountInput(t))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={`Amount in ${symbol}`}
                autoFocus={editId === null}
                style={[...inputStyle, styles.amountInput]}
              />
            </View>
            {submitted && amountError ? (
              <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.danger }}>
                {amountError}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary">
              Category
            </ThemedText>
            <CategoryChips
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
              onNew={() => setNewOpen(true)}
            />
            {submitted && categoryError ? (
              <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.danger }}>
                {categoryError}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary">
              Date
            </ThemedText>
            <DateField value={date} onChange={setDate} />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary">
              Note (optional)
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Note, optional"
              maxLength={200}
              style={inputStyle}
            />
          </View>

          <Pressable
            onPress={save}
            accessibilityRole="button"
            accessibilityLabel="Save expense"
            style={[styles.save, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={[styles.saveText, { color: theme.onPrimary }]}>
              Save
            </ThemedText>
          </Pressable>
          {editId !== null ? (
            <Pressable
              onPress={confirmDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete expense"
              style={styles.delete}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Delete expense
              </ThemedText>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
      {newOpen ? (
        <NewCategoryModal
          existingNames={categories.map((c) => c.name)}
          onCreate={createCategory}
          onClose={() => setNewOpen(false)}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.four },
  field: { gap: Spacing.two },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: { borderRadius: 12, padding: Spacing.mid, fontSize: 16 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '600' },
  save: { borderRadius: 14, paddingVertical: Spacing.three, alignItems: 'center' },
  saveText: { fontSize: 16 },
  delete: { alignItems: 'center', paddingVertical: Spacing.two },
});
