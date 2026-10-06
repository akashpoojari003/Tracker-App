App: offline-first tracker for iOS + Android with 2 features: Period Tracker and Expense Tracker. No backend, no login.
Stack: React Native, Expo (current SDK), TypeScript, Expo Router (tabs + modals), expo-sqlite, react-native-calendars, dayjs.
Folders: app/ (screens and routes), src/db/ (SQLite helpers), src/logic/ (pure functions: cycle.ts, money.ts), src/components/, src/theme.ts.
Data: dates are stored as 'YYYY-MM-DD' strings. Money is stored as integer minor units (paise/cents). Only user-entered data is stored. Predictions are always computed from period_logs and never saved.
Tables: period_logs(id, start_date, end_date), categories(id, name, icon, color, is_default), expenses(id, amount_minor, category_id, date, note, created_at), settings(key, value).
Rules: output only new or changed files. Max 3 lines of explanation. Do not rewrite unrelated code. Reuse existing helpers and components. Keep functions small and typed.
