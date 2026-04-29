import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { t } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionCard } from '@/src/components/common/SectionCard';
import { getLoginScreenConfig } from '@/src/services/auth/authService';
import { useAuthStore } from '@/src/stores/authStore';

export default function LoginScreen() {
  const { t } = useTranslation();
  const screenConfig = getLoginScreenConfig();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const lastLogoutReason = useAuthStore((state) => state.lastLogoutReason);
  const [email, setEmail] = useState(screenConfig.initialEmail);
  const [password, setPassword] = useState(screenConfig.initialPassword);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  async function handleSubmit() {
    try {
      await login(email, password);
    } catch {
      // Error message is already normalized by the auth store.
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('auth.heroEyebrow')}</Text>
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </View>

        <SectionCard
          title={t('auth.loginCardTitle')}
          subtitle={t('auth.loginCardSubtitle')}
        >
          <View style={styles.form}>
            {lastLogoutReason ? (
              <View
                style={[
                  styles.noticeCard,
                  lastLogoutReason === 'unauthorized'
                    ? styles.noticeCardWarning
                    : null,
                ]}
              >
                <Text style={styles.noticeTitle}>
                  {getLogoutNoticeTitle(lastLogoutReason)}
                </Text>
                <Text style={styles.noticeText}>
                  {getLogoutNoticeDescription(lastLogoutReason)}
                </Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.emailLabel')}</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(value) => {
                  clearError();
                  setEmail(value);
                }}
                placeholder={screenConfig.initialEmail}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
              <TextInput
                onChangeText={(value) => {
                  clearError();
                  setPassword(value);
                }}
                placeholder={screenConfig.initialPassword}
                placeholderTextColor="#94a3b8"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>
                {getLocalizedAuthErrorMessage(errorMessage)}
              </Text>
            ) : null}

            <PrimaryButton
              disabled={!email.trim() || !password || isLoggingIn}
              label={isLoggingIn ? t('auth.loggingInButton') : t('auth.loginButton')}
              onPress={handleSubmit}
            />
          </View>
        </SectionCard>

        <SectionCard title={t('auth.helperTitle')}>
          <Text style={styles.mockText}>
            {t('auth.helperEmail', { email: screenConfig.initialEmail })}
          </Text>
          <Text style={styles.mockText}>
            {t('auth.helperPassword', { password: screenConfig.initialPassword })}
          </Text>
        </SectionCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e5eefc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
    padding: 20,
  },
  hero: {
    gap: 8,
    paddingHorizontal: 4,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  noticeCard: {
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    padding: 14,
    gap: 6,
  },
  noticeCardWarning: {
    backgroundColor: '#fef3c7',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#475569',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#b91c1c',
  },
  mockText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
});

function getLogoutNoticeTitle(reason: NonNullable<ReturnType<typeof useAuthStore.getState>['lastLogoutReason']>) {
  switch (reason) {
    case 'manual':
      return t('auth.logoutTitle');
    case 'unauthorized':
      return t('auth.unauthorizedTitle');
    case 'restore_failed':
      return t('auth.restoreFailedTitle');
    default:
      return t('auth.reloginTitle');
  }
}

function getLogoutNoticeDescription(reason: NonNullable<ReturnType<typeof useAuthStore.getState>['lastLogoutReason']>) {
  switch (reason) {
    case 'manual':
      return t('auth.logoutDescription');
    case 'unauthorized':
      return t('auth.unauthorizedDescription');
    case 'restore_failed':
      return t('auth.restoreFailedDescription');
    default:
      return t('auth.reloginDescription');
  }
}

function getLocalizedAuthErrorMessage(message: string) {
  if (message.startsWith('auth.')) {
    return t(message);
  }

  return message;
}
