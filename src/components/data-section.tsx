// src/components/data-section.tsx — export all data as CSV (share sheet) and delete all data.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRef } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { deleteAllData, loadExportData } from '@/db/data';
import { useTheme } from '@/hooks/use-theme';
import { buildExportCsv } from '@/logic/csv';
import { rescheduleReminders } from '@/logic/reminders';

type Props = { onDeleted: () => void };

// One fixed name: each export overwrites the last, so only one copy ever sits in the cache.
const EXPORT_NAME = 'tracker-export.csv';

async function shareCsv(csv: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available');
  const file = new File(Paths.cache, EXPORT_NAME);
  file.create({ overwrite: true });
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export data',
  });
}

export function DataSection({ onDeleted }: Props) {
  const theme = useTheme();
  const busy = useRef(false);

  const guarded = async (fn: () => Promise<void>, failure: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn();
    } catch {
      Alert.alert(failure, 'Please try again.');
    } finally {
      busy.current = false;
    }
  };

  const exportCsv = () => guarded(async () => shareCsv(buildExportCsv(await loadExportData())), 'Could not export');

  const wipe = () =>
    guarded(async () => {
      await deleteAllData();
      await rescheduleReminders().catch(() => undefined);
      onDeleted();
    }, 'Could not delete');

  const confirmWipe = () =>
    Alert.alert('Delete all data?', 'Every period, expense, category change and setting will be erased.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Are you absolutely sure?', 'This cannot be undone. Export first if you want a copy.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete everything', style: 'destructive', onPress: wipe },
          ]),
      },
    ]);

  return (
    <>
      <Pressable
        onPress={exportCsv}
        accessibilityRole="button"
        accessibilityLabel="Export all data as CSV"
        style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Export all data (CSV)</ThemedText>
      </Pressable>
      <Pressable
        onPress={confirmWipe}
        accessibilityRole="button"
        accessibilityLabel="Delete all data"
        style={[styles.button, { backgroundColor: theme.danger }]}>
        <ThemedText type="smallBold" style={{ color: theme.onDanger }}>
          Delete all data
        </ThemedText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, paddingVertical: Spacing.mid, alignItems: 'center' },
});
