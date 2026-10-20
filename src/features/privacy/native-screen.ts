import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';
import { createScreenRegistry } from './screen-protection';
// One serial resource registry per Orbe JS runtime; keys never come from users.
const registry = createScreenRegistry({
  available: async () => Platform.OS === 'ios' && await ScreenCapture.isAvailableAsync(),
  prevent: key => ScreenCapture.preventScreenCaptureAsync(key),
  allow: key => Platform.OS === 'ios' ? ScreenCapture.allowScreenCaptureAsync(key) : Promise.resolve(),
  blur: () => ScreenCapture.enableAppSwitcherProtectionAsync(1),
  unblur: () => Platform.OS === 'ios' ? ScreenCapture.disableAppSwitcherProtectionAsync() : Promise.resolve(),
});
export const createNativeScreenPorts = () => registry.create();
