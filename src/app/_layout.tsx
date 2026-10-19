import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/provider';
import { DemoProvider } from '@/data/demo/store';
import { PrivacyProvider } from '@/components/privacy';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider><PrivacyProvider><DemoProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F8F3' } }} />
      </DemoProvider></PrivacyProvider></AuthProvider>
    </SafeAreaProvider>
  );
}
