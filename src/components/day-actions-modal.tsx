// src/components/day-actions-modal.tsx — small modal listing only the valid actions for a day.
import dayjs from 'dayjs';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DayAction } from '@/logic/period-rules';

type Props = {
  date: string | null;
  /** Text description of what is marked on this day (shown so colour is never the only cue). */
  status: string;
  actions: DayAction[];
  emptyText: string;
  onSelect: (action: DayAction) => void;
  onClose: () => void;
};

export function DayActionsModal({ date, status, actions, emptyText, onSelect, onClose }: Props) {
  const theme = useTheme();

  return (
    <Modal visible={date !== null} transparent animationType="fade" onRequestClose={onClose}>
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
            {date ? dayjs(date).format('ddd, D MMM YYYY') : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {status}
          </ThemedText>
          {actions.length === 0 ? <ThemedText themeColor="textSecondary">{emptyText}</ThemedText> : null}
          {actions.map((a) => (
            <Pressable
              key={a.kind}
              onPress={() => onSelect(a)}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={a.kind === 'remove' && { color: theme.danger }}>{a.label}</ThemedText>
            </Pressable>
          ))}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel" style={styles.button}>
            <ThemedText themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '82%', maxWidth: 360, borderRadius: 20, padding: Spacing.three, gap: Spacing.two },
  button: { paddingVertical: Spacing.mid, borderRadius: 12, alignItems: 'center' },
});
