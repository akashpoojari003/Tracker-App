// src/components/stepper-row.tsx — label plus a  − value +  numeric stepper with hard limits.
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
};

export function StepperRow({ label, value, min, max, unit = 'days', onChange }: Props) {
  const theme = useTheme();

  const button = (glyph: string, delta: -1 | 1, disabled: boolean) => (
    <Pressable
      onPress={() => onChange(value + delta)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${delta < 0 ? 'Decrease' : 'Increase'} ${label}`}
      style={[styles.button, { backgroundColor: theme.backgroundSelected }, disabled && styles.disabled]}>
      <ThemedText style={styles.glyph}>{glyph}</ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <ThemedText>{label}</ThemedText>
      <View style={styles.controls}>
        {button('−', -1, value <= min)}
        <ThemedText type="smallBold" style={styles.value} accessibilityLiveRegion="polite">
          {`${value} ${unit}`}
        </ThemedText>
        {button('+', 1, value >= max)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  button: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  glyph: { fontSize: 22, lineHeight: 26 },
  value: { minWidth: 64, textAlign: 'center' },
});
