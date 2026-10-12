// src/components/month-selector.tsx — "‹ October 2026 ›" with the next arrow disabled at the limit.
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  label: string;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthSelector({ label, nextDisabled, onPrev, onNext }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} hitSlop={12} accessibilityRole="button" accessibilityLabel="Previous month">
        <ThemedText type="subtitle">‹</ThemedText>
      </Pressable>
      <ThemedText type="smallBold" accessibilityRole="header" accessibilityLiveRegion="polite">
        {label}
      </ThemedText>
      <Pressable
        onPress={onNext}
        disabled={nextDisabled}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityState={{ disabled: nextDisabled }}
        style={nextDisabled && styles.disabled}>
        <ThemedText type="subtitle">›</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two },
  disabled: { opacity: 0.25 },
});
