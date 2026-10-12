// src/components/date-field.tsx — 'YYYY-MM-DD' <-> native date picker (iOS inline, Android dialog).
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const FMT = 'YYYY-MM-DD';

type Props = { value: string; onChange: (date: string) => void };

export function DateField({ value, onChange }: Props) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const current = dayjs(value).toDate();

  const handle = (e: DateTimePickerEvent, picked?: Date) => {
    if (e.type === 'set' && picked) onChange(dayjs(picked).format(FMT));
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosRow}>
        <DateTimePicker
          value={current}
          mode="date"
          display="compact"
          themeVariant={scheme === 'dark' ? 'dark' : 'light'}
          accessibilityLabel="Date"
          onChange={handle}
        />
      </View>
    );
  }

  const open = () => DateTimePickerAndroid.open({ value: current, mode: 'date', onChange: handle });

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`Date: ${dayjs(value).format('dddd, D MMMM YYYY')}`}
      accessibilityHint="Opens the date picker"
      style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText>{dayjs(value).format('ddd, D MMM YYYY')}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iosRow: { flexDirection: 'row' },
  button: { borderRadius: 12, padding: Spacing.mid },
});
