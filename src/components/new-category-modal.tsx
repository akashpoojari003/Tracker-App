// src/components/new-category-modal.tsx — create or edit a category (name + colour).
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const COLORS = [
  { value: '#F59E0B', name: 'Amber' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#EF4444', name: 'Red' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#10B981', name: 'Green' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#6B7280', name: 'Grey' },
];

type Props = {
  existingNames: string[];
  /** Saves the category; throw to show an error. Also used for edits. */
  onCreate: (name: string, color: string) => Promise<void>;
  onClose: () => void;
  /** Pass to edit an existing category instead of creating one. */
  initial?: { name: string; color: string };
  lockName?: boolean;
};

export function NewCategoryModal({ existingNames, onCreate, onClose, initial, lockName = false }: Props) {
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? COLORS[0].value);
  const [error, setError] = useState<string | null>(null);

  const validate = (trimmed: string): string | null => {
    if (!trimmed) return 'Enter a name';
    const taken = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
    return taken ? 'That category already exists' : null;
  };

  const submit = async () => {
    const trimmed = name.trim();
    const problem = validate(trimmed);
    setError(problem);
    if (problem) return;
    try {
      await onCreate(trimmed, color);
    } catch {
      setError('Could not save category');
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close">
        <Pressable
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.backgroundElement }]}
          onPress={() => {}}>
          <ThemedText type="smallBold" accessibilityRole="header">
            {initial ? 'Edit category' : 'New category'}
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Category name"
            maxLength={24}
            autoFocus={!lockName}
            editable={!lockName}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundSelected },
              lockName && styles.locked,
            ]}
          />
          <View style={styles.colors}>
            {COLORS.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setColor(c.value)}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${c.name}`}
                accessibilityState={{ selected: c.value === color }}
                style={[styles.swatch, { backgroundColor: c.value }, c.value === color && { borderColor: theme.text }]}>
                {c.value === color ? (
                  <ThemedText type="smallBold" style={styles.check}>
                    ✓
                  </ThemedText>
                ) : null}
              </Pressable>
            ))}
          </View>
          {error ? (
            <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel={initial ? 'Save category' : 'Create category'}
            style={[styles.create, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={[styles.createText, { color: theme.onPrimary }]}>
              {initial ? 'Save' : 'Create'}
            </ThemedText>
          </Pressable>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel" style={styles.cancel}>
            <ThemedText themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '86%', maxWidth: 380, borderRadius: 20, padding: Spacing.three, gap: Spacing.three },
  input: { borderRadius: 12, padding: Spacing.mid, fontSize: 16 },
  locked: { opacity: 0.5 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#FFFFFF', textShadowColor: '#000000', textShadowRadius: 2 },
  create: { borderRadius: 12, paddingVertical: Spacing.mid, alignItems: 'center' },
  createText: { fontSize: 16 },
  cancel: { alignItems: 'center', paddingVertical: Spacing.one },
});
