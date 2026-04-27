import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18n, t } from '@/src/i18n';
import { BootStatusScreen } from '@/src/components/common/BootStatusScreen';
import { ScreenState } from '@/src/components/common/ScreenState';
import { useAuthRedirect } from '@/src/hooks/useAuthRedirect';
import { useAppStore } from '@/src/stores/appStore';
import { useLocaleStore } from '@/src/stores/localeStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const status = useAppStore((state) => state.status);
  const errorMessage = useAppStore((state) => state.errorMessage);
  const bootstrap = useAppStore((state) => state.bootstrap);
  useLocaleStore((state) => state.resolvedLocale);
  const redirectReason = useAuthRedirect();

  useEffect(() => {
    bootstrap().catch(() => {});
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

  if (status !== 'ready') {
    return (
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <BootStatusScreen
            errorMessage={status === 'error' ? errorMessage : undefined}
            onRetry={() => {
              bootstrap().catch(() => {});
            }}
          />
        </SafeAreaProvider>
      </I18nextProvider>
    );
  }

  if (redirectReason === 'login_required') {
    return (
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <ScreenState
            title={t('state.redirectingToLoginTitle')}
            description={t('state.redirectingToLoginDescription')}
            loading
            fullScreen
          />
        </SafeAreaProvider>
      </I18nextProvider>
    );
  }

  if (redirectReason === 'reentry') {
    return (
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <ScreenState
            title={t('state.redirectingToAppTitle')}
            description={t('state.redirectingToAppDescription')}
            loading
            fullScreen
          />
        </SafeAreaProvider>
      </I18nextProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerShadowVisible: false,
            headerTintColor: '#111827',
            contentStyle: { backgroundColor: '#f3f4f6' },
          }}
        >
          <Stack.Screen
            name="login"
            options={{ title: t('navigation.login'), headerShown: false }}
          />
          <Stack.Screen name="index" options={{ title: t('navigation.home') }} />
          <Stack.Screen name="subjects/[subjectId]" options={{ title: t('navigation.subjects') }} />
          <Stack.Screen name="topics/[topicId]" options={{ title: t('navigation.topicDetail') }} />
          <Stack.Screen name="practice/intro" options={{ title: t('navigation.practiceIntro') }} />
          <Stack.Screen
            name="practice/session/[sessionId]"
            options={{ title: t('navigation.practiceSession') }}
          />
          <Stack.Screen
            name="practice/result/[sessionId]"
            options={{ title: t('navigation.practiceResult') }}
          />
          <Stack.Screen name="stats/index" options={{ title: t('navigation.stats') }} />
          <Stack.Screen name="wrong-book/index" options={{ title: t('navigation.wrongBook') }} />
          <Stack.Screen
            name="wrong-book/[questionId]"
            options={{ title: t('navigation.wrongBookDetail') }}
          />
        </Stack>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
