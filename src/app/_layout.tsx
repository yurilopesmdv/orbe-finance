import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PrivacyProvider } from '@/components/privacy';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PrivacyProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F8F3' } }} />
      </PrivacyProvider>
    </SafeAreaProvider>
  );
}
