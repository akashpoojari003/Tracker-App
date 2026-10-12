// src/components/settings-section.tsx — titled card used to group settings.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = { title: string; footer?: string; children: ReactNode };

export function SettingsSection({ title, footer, children }: Props) {
  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        {children}
      </ThemedView>
      {footer ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          {footer}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  title: { paddingHorizontal: Spacing.one, textTransform: 'uppercase' },
  card: { borderRadius: 20, padding: Spacing.three, gap: Spacing.three },
  footer: { paddingHorizontal: Spacing.one },
});
