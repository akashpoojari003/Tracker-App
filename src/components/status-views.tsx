// src/components/status-views.tsx — shared loading and empty/error states.
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadingProps = { label?: string; fill?: boolean };

export function LoadingView({ label = 'Loading…', fill = false }: LoadingProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[styles.box, fill && styles.fill]}>
      <ActivityIndicator color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

type EmptyProps = { title: string; message?: string };

export function EmptyState({ title, message }: EmptyProps) {
  return (
    <View accessible style={styles.box}>
      <ThemedText type="smallBold" style={styles.center}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  fill: { flex: 1 },
  center: { textAlign: 'center' },
});
