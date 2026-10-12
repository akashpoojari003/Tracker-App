// src/components/category-manager.tsx — list of categories: add, rename, recolour, delete.
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { NewCategoryModal } from '@/components/new-category-modal';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { addCategory, deleteCategory, updateCategory, type Category } from '@/db/categories';
import { useTheme } from '@/hooks/use-theme';

type Props = { categories: Category[]; onChanged: () => void };

/** "Other" receives deleted categories' expenses, so it can't be renamed or deleted. */
const isOther = (c: Category): boolean => c.is_default && c.name === 'Other';

export function CategoryManager({ categories, onChanged }: Props) {
  const theme = useTheme();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const target = editing !== null && editing !== 'new' ? editing : null;

  const save = async (name: string, color: string) => {
    if (target) await updateCategory(target.id, { name, icon: target.icon, color });
    else await addCategory({ name, icon: 'label', color });
    setEditing(null);
    onChanged();
  };

  const remove = async (c: Category) => {
    try {
      await deleteCategory(c.id);
      onChanged();
    } catch {
      Alert.alert('Could not delete', 'Please try again.');
    }
  };

  const confirmDelete = (c: Category) =>
    Alert.alert(`Delete "${c.name}"?`, 'Its expenses will move to "Other".', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(c) },
    ]);

  return (
    <View style={styles.list}>
      {categories.map((c) => (
        <View key={c.id} style={styles.row}>
          <Pressable
            onPress={() => setEditing(c)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${c.name}`}
            style={styles.main}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <ThemedText numberOfLines={1} style={styles.name}>
              {c.name}
            </ThemedText>
          </Pressable>
          {c.is_default ? null : (
            <Pressable
              onPress={() => confirmDelete(c)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${c.name}`}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Delete
              </ThemedText>
            </Pressable>
          )}
        </View>
      ))}
      <Pressable onPress={() => setEditing('new')} accessibilityRole="button" accessibilityLabel="Add category">
        <ThemedText type="smallBold" style={[styles.add, { color: theme.primary }]}>
          + Add category
        </ThemedText>
      </Pressable>

      {editing !== null ? (
        <NewCategoryModal
          key={target?.id ?? 'new'}
          existingNames={categories.filter((c) => c.id !== target?.id).map((c) => c.name)}
          initial={target ? { name: target.name, color: target.color } : undefined}
          lockName={target !== null && isOther(target)}
          onCreate={save}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.mid },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.mid, paddingVertical: Spacing.one },
  dot: { width: 16, height: 16, borderRadius: 8 },
  name: { flex: 1 },
  add: { paddingTop: Spacing.one },
});
