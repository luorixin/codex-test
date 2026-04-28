import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber, formatPercent } from '@/src/i18n';
import { SectionCard } from '@/src/components/common/SectionCard';
import { SubjectListItem } from '@/src/components/common/SubjectListItem';
import { useScreenData } from '@/src/hooks/useScreenData';
import { getHomeScreenData } from '@/src/services/home/homeService';
import { getCoverageRate, getOverviewAccuracyRate } from '@/src/services/stats/statsService';

export default function HomeTabScreen() {
  const { t } = useTranslation();
  const loadHome = useCallback(() => getHomeScreenData(), []);
  const { data: screenData, isLoading } = useScreenData(loadHome);

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

      <SectionCard title={t('home.subjectsTitle')} subtitle={t('home.subjectsSubtitle')}>
        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          screenData?.subjects.map((subject) => (
            <SubjectListItem
              key={subject.id}
              subject={subject}
              backTitle={t('navigation.tabs.home')}
            />
          ))
        )}
      </SectionCard>
    </ScrollView>
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
  overviewMeta: {
    marginTop: 14,
    fontSize: 13,
    color: '#64748b',
  },
});
