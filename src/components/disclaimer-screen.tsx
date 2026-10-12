// src/components/disclaimer-screen.tsx — shown once on first launch; acceptance is stored in settings.
import { useRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { setSetting } from '@/db/settings';
import { useTheme } from '@/hooks/use-theme';

export const DISCLAIMER_SETTING_KEY = 'disclaimer_accepted';

type Props = { onAccept: () => void };

export function DisclaimerScreen({ onAccept }: Props) {
  const theme = useTheme();
  const busy = useRef(false);

  const accept = () => {
    if (busy.current) return;
    busy.current = true;
    setSetting(DISCLAIMER_SETTING_KEY, '1')
      .then(onAccept)
      .catch(() => Alert.alert('Could not save', 'Please try again.'))
      .finally(() => {
        busy.current = false;
      });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Before you start
        </ThemedText>
        <ThemedText>This app is not a medical device or a contraceptive. Predictions are estimates.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Everything you enter stays on this device.
        </ThemedText>
      </View>
      <Pressable
        onPress={accept}
        accessibilityRole="button"
        accessibilityLabel="I understand"
        style={[styles.button, { backgroundColor: theme.primary }]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          I understand
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  button: {
    margin: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
});
