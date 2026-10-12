// src/hooks/use-currency-symbol.ts — currency symbol from settings (default: rupee sign).
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getSetting } from '@/db/settings';
import { DEFAULT_CURRENCY_SYMBOL } from '@/logic/money';

export const CURRENCY_SETTING_KEY = 'currency_symbol';

export function useCurrencySymbol(): string {
  const [symbol, setSymbol] = useState(DEFAULT_CURRENCY_SYMBOL);

  useFocusEffect(
    useCallback(() => {
      getSetting(CURRENCY_SETTING_KEY)
        .then((v) => setSymbol(v?.trim() || DEFAULT_CURRENCY_SYMBOL))
        .catch(() => setSymbol(DEFAULT_CURRENCY_SYMBOL));
    }, []),
  );

  return symbol;
}
