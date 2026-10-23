import {palette} from '@/components/theme';
import { FinanceProvider } from '@/features/finance/provider';
import { ScreenProtectionProvider } from '@/features/privacy/provider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/provider';
import { DemoProvider } from '@/data/demo/store';
import { PrivacyProvider } from '@/components/privacy';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ScreenProtectionProvider><AuthProvider><PrivacyProvider><FinanceProvider><DemoProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }} />
      </DemoProvider></FinanceProvider></PrivacyProvider></AuthProvider></ScreenProtectionProvider>
    </SafeAreaProvider>
  );
}
