// src/components/category-chips.tsx — horizontal category chips plus a '+ New' chip.
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Category } from '@/db/categories';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
};

export function CategoryChips({ categories, selectedId, onSelect, onNew }: Props) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}>
      {categories.map((c) => {
        const selected = c.id === selectedId;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              { backgroundColor: theme.backgroundElement, borderColor: selected ? c.color : 'transparent' },
            ]}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <ThemedText type={selected ? 'smallBold' : 'small'}>{selected ? `✓ ${c.name}` : c.name}</ThemedText>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onNew}
        accessibilityRole="button"
        accessibilityLabel="New category"
        style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          + New
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.mid,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
