// src/app/_layout.tsx
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { DISCLAIMER_SETTING_KEY, DisclaimerScreen } from '@/components/disclaimer-screen';
import { Screen } from '@/components/screen';
import { LoadingView } from '@/components/status-views';
import { Colors } from '@/constants/theme';
import { initDatabase } from '@/db';
import { getSetting } from '@/db/settings';

// Without this, the explicitly listed expense-form screen becomes the first (initial) route.
export const unstable_settings = { initialRouteName: '(tabs)' };

/** Navigation (header, modal) colours come from the same palette as the rest of the app. */
function navTheme(dark: boolean): Theme {
  const base = dark ? DarkTheme : DefaultTheme;
  const c = dark ? Colors.dark : Colors.light;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.backgroundSelected,
    },
  };
}

export default function RootLayout() {
  const scheme = useColorScheme();
  // null = still starting up; false = first launch, disclaimer not yet accepted.
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => getSetting(DISCLAIMER_SETTING_KEY))
      .then((value) => setAccepted(value === '1'))
      .catch((e) =>
        setError(() => {
          throw e; // surfaces to the nearest error boundary
        }),
      );
  }, []);

  return (
    <ThemeProvider value={navTheme(scheme === 'dark')}>
      <StatusBar style="auto" />
      {accepted === null ? (
        <Screen>
          <LoadingView fill />
        </Screen>
      ) : accepted ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="expense-form" options={{ presentation: 'modal', headerShown: true }} />
        </Stack>
      ) : (
        <DisclaimerScreen onAccept={() => setAccepted(true)} />
      )}
    </ThemeProvider>
  );
}
