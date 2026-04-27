import { Link } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber, formatPercent } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionCard } from '@/src/components/common/SectionCard';
import { SubjectListItem } from '@/src/components/common/SubjectListItem';
import { useScreenData } from '@/src/hooks/useScreenData';
import { getHomeScreenData } from '@/src/services/home/homeService';
import { getCoverageRate, getOverviewAccuracyRate } from '@/src/services/stats/statsService';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocaleStore } from '@/src/stores/localeStore';

export default function HomeScreen() {
  const { t } = useTranslation();
  const loadHome = useCallback(() => getHomeScreenData(), []);
  const { data: screenData, isLoading } = useScreenData(loadHome);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const localePreference = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={t('home.overviewTitle')} subtitle={t('home.overviewSubtitle')}>
        {screenData?.overview ? (
          <>
            <View style={styles.overviewGrid}>
              <OverviewMetric
                label={t('home.totalAnswers')}
                value={formatNumber(screenData.overview.totalAnswers)}
              />
              <OverviewMetric
                label={t('common.correctRate')}
                value={formatPercent(getOverviewAccuracyRate(screenData.overview))}
              />
            </View>
            <View style={styles.overviewGrid}>
              <OverviewMetric
                label={t('home.coveredQuestions')}
                value={formatPercent(getCoverageRate(screenData.overview))}
              />
              <OverviewMetric
                label={t('common.unresolved')}
                value={formatNumber(screenData.overview.unresolvedWrongCount)}
              />
            </View>
            <Text style={styles.overviewMeta}>
              {t('home.overviewMeta', {
                completedSessions: formatNumber(screenData.overview.completedSessions),
                activeDays: formatNumber(screenData.overview.activeDaysLast7),
              })}
            </Text>
          </>
        ) : (
          <ActivityIndicator color="#2563eb" />
        )}
      </SectionCard>

      <SectionCard title={t('home.recentTitle')} subtitle={t('home.recentSubtitle')}>
        {screenData?.recentSession ? (
          <View style={styles.recentSessionCard}>
            <Text style={styles.recentSessionTitle}>{screenData.recentSession.scopeTitle}</Text>
            <Text style={styles.recentSessionMeta}>
              {t('home.recentSessionMeta', {
                subjectName: screenData.recentSession.subjectName,
                correctCount: formatNumber(screenData.recentSession.correctCount),
                questionCount: formatNumber(screenData.recentSession.questionCount),
              })}
            </Text>
            <Link
              href={
                screenData.recentSession.finishedAt
                  ? `/practice/result/${screenData.recentSession.id}`
                  : `/practice/session/${screenData.recentSession.id}`
              }
              style={styles.recentSessionLink}
            >
              {screenData.recentSession.finishedAt
                ? t('home.recentResultLink')
                : t('home.continuePracticeLink')}
            </Link>
          </View>
        ) : (
          <Text style={styles.placeholderText}>{t('home.recentEmpty')}</Text>
        )}
      </SectionCard>

      <SectionCard title={t('home.shortcutsTitle')}>
        <View style={styles.quickLinks}>
          <Link href="/wrong-book" style={styles.quickLink}>
            {t('home.wrongBookLink')}
          </Link>
          <Link href="/stats" style={styles.quickLink}>
            {t('home.statsLink')}
          </Link>
        </View>
      </SectionCard>

      <SectionCard
        title={t('home.accountTitle')}
        subtitle={
          user ? t('home.accountSubtitle', { email: user.email }) : t('home.accountUnavailable')
        }
      >
        <View style={styles.localeStack}>
          <Text style={styles.localeLabel}>{t('locale.title')}</Text>
          <Text style={styles.localeSubtitle}>{t('locale.subtitle')}</Text>
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
        </View>
        <PrimaryButton
          disabled={isLoggingOut}
          label={isLoggingOut ? t('home.loggingOutButton') : t('home.logoutButton')}
          onPress={() => {
            logout().catch(() => {});
          }}
        />
      </SectionCard>

      <SectionCard title={t('home.subjectsTitle')} subtitle={t('home.subjectsSubtitle')}>
        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          screenData?.subjects.map((subject) => (
            <SubjectListItem key={subject.id} subject={subject} />
          ))
        )}
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

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    padding: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
  },
  recentSessionCard: {
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    padding: 16,
  },
  recentSessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  recentSessionMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  recentSessionLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  overviewMeta: {
    marginTop: 14,
    fontSize: 13,
    color: '#64748b',
  },
  quickLinks: {
    gap: 12,
  },
  quickLink: {
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  localeStack: {
    gap: 8,
  },
  localeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  localeSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
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
});
