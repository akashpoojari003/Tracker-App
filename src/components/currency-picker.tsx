// src/components/currency-picker.tsx — wrap of currency-symbol chips.
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CURRENCY_SYMBOLS } from '@/logic/settings';

type Props = { value: string; onChange: (symbol: string) => void };

export function CurrencyPicker({ value, onChange }: Props) {
  const theme = useTheme();
  const options = CURRENCY_SYMBOLS.includes(value) ? CURRENCY_SYMBOLS : [value, ...CURRENCY_SYMBOLS];

  return (
    <View style={styles.row}>
      {options.map((symbol) => {
        const selected = symbol === value;
        return (
          <Pressable
            key={symbol}
            onPress={() => onChange(symbol)}
            accessibilityRole="button"
            accessibilityLabel={`Currency ${symbol}`}
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              { backgroundColor: theme.backgroundSelected, borderColor: selected ? theme.primary : 'transparent' },
            ]}>
            <ThemedText type={selected ? 'smallBold' : 'small'}>{symbol}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: Spacing.mid,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 2,
  },
});
