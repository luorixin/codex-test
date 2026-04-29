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

function getBackTitle(route: { params?: object }) {
  const params = route.params;
  const backTitle = params && 'backTitle' in params ? params.backTitle : undefined;
  return typeof backTitle === 'string' ? backTitle : undefined;
}

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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{ title: t('navigation.login'), headerShown: false }}
          />
          <Stack.Screen
            name="subjects/[subjectId]"
            options={({ route }) => ({
              title: t('navigation.subjects'),
              headerBackTitle: getBackTitle(route),
            })}
          />
          <Stack.Screen name="topics/[topicId]" options={{ title: t('navigation.topicDetail') }} />
          <Stack.Screen name="practice/intro" options={{ title: t('navigation.practiceIntro') }} />
          <Stack.Screen
            name="practice/session/[sessionId]"
            options={({ route }) => ({
              title: t('navigation.practiceSession'),
              headerBackTitle: getBackTitle(route),
            })}
          />
          <Stack.Screen
            name="practice/result/[sessionId]"
            options={({ route }) => ({
              title: t('navigation.practiceResult'),
              headerBackTitle: getBackTitle(route),
            })}
          />
          <Stack.Screen
            name="stats/index"
            options={({ route }) => ({
              title: t('navigation.stats'),
              headerBackTitle: getBackTitle(route),
            })}
          />
          <Stack.Screen
            name="wrong-book/index"
            options={({ route }) => ({
              title: t('navigation.wrongBook'),
              headerBackTitle: getBackTitle(route),
            })}
          />
          <Stack.Screen
            name="wrong-book/[questionId]"
            options={{ title: t('navigation.wrongBookDetail') }}
          />
          <Stack.Screen
            name="privacy"
            options={({ route }) => ({
              title: t('navigation.privacy'),
              headerBackTitle: getBackTitle(route),
            })}
          />
        </Stack>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
