import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { palette } from '@/components/ui';

const icons = { overview: '◉', movements: '↕', portfolio: '▤', settings: '☷' } as const;
export default function TabLayout() {
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: palette.accent,
    tabBarInactiveTintColor: palette.muted,
    tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.line },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    tabBarIcon: ({ color }) => <Text accessible={false} style={{ color, fontSize: 24 }}>{icons[route.name as keyof typeof icons] ?? '○'}</Text>,
  })}>
    <Tabs.Screen name="overview" options={{ title: 'Visão geral' }} />
    <Tabs.Screen name="movements" options={{ title: 'Movimentações' }} />
    <Tabs.Screen name="portfolio" options={{ title: 'Carteira' }} />
    <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
  </Tabs>;
}
