/**
 * Single source of truth for colours (light + dark) and spacing. Read colours via useTheme(); never hard-code hex in components.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
    onDanger: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.4)',
    logged: '#DC2626',
    onLogged: '#FFFFFF',
    predicted: '#FECACA',
    onPredicted: '#7F1D1D',
    fertile: '#99F6E4',
    onFertile: '#134E4A',
    ovulation: '#7C3AED',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#5B9DF9',
    onPrimary: '#0B1220',
    danger: '#F87171',
    onDanger: '#1F0A0A',
    overlay: 'rgba(0,0,0,0.6)',
    logged: '#DC2626',
    onLogged: '#FFFFFF',
    predicted: '#5B2024',
    onPredicted: '#FECACA',
    fertile: '#134E4A',
    onFertile: '#99F6E4',
    ovulation: '#A78BFA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  mid: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
