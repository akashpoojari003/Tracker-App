// src/logic/money.ts — integer minor units (paise/cents) <-> text. Pure, no floats for storage.
export const DEFAULT_CURRENCY_SYMBOL = '₹';

/** Keep digits and one '.', max 2 decimals. Accepts ',' as a decimal separator. */
export function sanitizeAmountInput(text: string): string {
  const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

/** '12.5' -> 1250. Returns null for empty/invalid input or unsafe sizes. */
export function toMinor(input: string): number | null {
  const m = /^(\d*)(?:\.(\d{0,2}))?$/.exec(input.trim().replace(',', '.'));
  if (!m || (m[1] === '' && !m[2])) return null;
  const minor = Number(m[1] || '0') * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** 1250 -> '12.50', 1200 -> '12'. For prefilling an input. */
export function fromMinor(minor: number): string {
  const abs = Math.abs(minor);
  const frac = abs % 100;
  const fraction = frac ? `.${String(frac).padStart(2, '0')}` : '';
  return `${minor < 0 ? '-' : ''}${Math.trunc(abs / 100)}${fraction}`;
}

/** Indian lakh grouping for the rupee sign (12,34,567); thousands grouping otherwise. */
function groupDigits(whole: string, indian: boolean): string {
  if (!indian || whole.length <= 3) return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const head = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${whole.slice(-3)}`;
}

export function formatMoney(minor: number, symbol: string = DEFAULT_CURRENCY_SYMBOL): string {
  const abs = Math.abs(minor);
  const whole = groupDigits(String(Math.trunc(abs / 100)), symbol === DEFAULT_CURRENCY_SYMBOL);
  return `${minor < 0 ? '-' : ''}${symbol}${whole}.${String(abs % 100).padStart(2, '0')}`;
}
