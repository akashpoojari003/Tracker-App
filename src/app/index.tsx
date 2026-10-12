// src/app/index.tsx — the app opens at "/", which has no screen of its own; send it to the Cycle tab.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/cycle" />;
}
