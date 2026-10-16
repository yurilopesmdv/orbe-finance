import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Orbe Finance', slug: 'orbe-finance', version: '0.1.0',
  platforms: ['ios'], orientation: 'portrait', userInterfaceStyle: 'light',
  ios: { supportsTablet: false },
  plugins: ['expo-router'],
  extra: { dataMode: 'synthetic', liveIntegrationEnabled: false },
};
export default config;
