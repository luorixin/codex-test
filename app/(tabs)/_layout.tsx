import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerShadowVisible: false,
        headerTintColor: '#111827',
        sceneStyle: { backgroundColor: '#f3f4f6' },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarLabel: t('navigation.tabs.home'),
        }}
      />
      <Tabs.Screen
        name="recent"
        options={{
          title: t('navigation.recent'),
          tabBarLabel: t('navigation.tabs.recent'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('navigation.me'),
          tabBarLabel: t('navigation.tabs.me'),
        }}
      />
    </Tabs>
  );
}
