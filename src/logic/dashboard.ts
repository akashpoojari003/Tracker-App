// src/logic/dashboard.ts — small pure helpers for the cycle dashboard card.
import type { PredictedCycle } from '@/logic/cycle';

export type FertileWindow = { start: string; end: string };

/** First predicted fertile window that hasn't fully passed yet. */
export function upcomingFertileWindow(predicted: PredictedCycle[], today: string): FertileWindow | null {
  const next = predicted.find((p) => p.fertileEnd >= today);
  return next ? { start: next.fertileStart, end: next.fertileEnd } : null;
}
