import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionCard } from '@/src/components/common/SectionCard';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocaleStore } from '@/src/stores/localeStore';

export default function MeTabScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const localePreference = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard
        title={t('me.accountTitle')}
        subtitle={
          authStatus === 'authenticated' && user
            ? t('me.accountSubtitle', { email: user.email })
            : t('me.accountUnauthenticated')
        }
      >
        {authStatus === 'authenticated' && user ? (
          <PrimaryButton
            disabled={isLoggingOut}
            label={isLoggingOut ? t('home.loggingOutButton') : t('home.logoutButton')}
            onPress={() => {
              logout().catch(() => {});
            }}
          />
        ) : (
          <PrimaryButton
            label={t('me.loginButton')}
            onPress={() => {
              router.push('/login');
            }}
          />
        )}
      </SectionCard>

      <SectionCard title={t('locale.title')} subtitle={t('locale.subtitle')}>
        <View style={styles.localeOptions}>
          <LocaleChip
            active={localePreference === 'system'}
            label={t('common.system')}
            onPress={() => {
              setLocale('system').catch(() => {});
            }}
          />
          <LocaleChip
            active={localePreference === 'zh-CN'}
            label={t('locale.zhCN')}
            onPress={() => {
              setLocale('zh-CN').catch(() => {});
            }}
          />
          <LocaleChip
            active={localePreference === 'en'}
            label={t('locale.en')}
            onPress={() => {
              setLocale('en').catch(() => {});
            }}
          />
        </View>
      </SectionCard>

      <SectionCard title={t('privacy.title')} subtitle={t('privacy.entrySubtitle')}>
        <Link
          href={{ pathname: '/privacy', params: { backTitle: t('navigation.tabs.me') } }}
          style={styles.privacyLink}
        >
          {t('privacy.openLink')}
        </Link>
      </SectionCard>
    </ScrollView>
  );
}

function LocaleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text onPress={onPress} style={[styles.localeChip, active ? styles.localeChipActive : null]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    gap: 16,
    padding: 16,
  },
  localeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  localeChip: {
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    overflow: 'hidden',
  },
  localeChipActive: {
    backgroundColor: '#111827',
    color: '#ffffff',
  },
  privacyLink: {
    alignSelf: 'flex-start',
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
});
