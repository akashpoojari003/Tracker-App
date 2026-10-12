// src/components/screen.tsx — themed full-screen container that respects the safe area (top by default).
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';

type Props = { children: ReactNode; edges?: Edge[] };

export function Screen({ children, edges = ['top'] }: Props) {
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView edges={edges} style={styles.fill}>
        {children}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
