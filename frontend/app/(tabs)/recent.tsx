import { Link } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/src/i18n';
import { SectionCard } from '@/src/components/common/SectionCard';
import { useScreenData } from '@/src/hooks/useScreenData';
import { getHomeScreenData } from '@/src/services/home/homeService';

export default function RecentTabScreen() {
  const { t } = useTranslation();
  const loadHome = useCallback(() => getHomeScreenData(), []);
  const { data: screenData, isLoading } = useScreenData(loadHome);
  const backTitle = t('navigation.tabs.recent');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={t('recent.title')} subtitle={t('recent.subtitle')}>
        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : screenData?.recentSession ? (
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
              href={{
                pathname: screenData.recentSession.finishedAt
                  ? '/practice/result/[sessionId]'
                  : '/practice/session/[sessionId]',
                params: { sessionId: screenData.recentSession.id, backTitle },
              }}
              style={styles.actionLink}
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

      <SectionCard title={t('recent.toolsTitle')} subtitle={t('recent.toolsSubtitle')}>
        <View style={styles.quickLinks}>
          <Link
            href={{ pathname: '/wrong-book', params: { backTitle } }}
            style={styles.quickLink}
          >
            {t('home.wrongBookLink')}
          </Link>
          <Link href={{ pathname: '/stats', params: { backTitle } }} style={styles.quickLink}>
            {t('home.statsLink')}
          </Link>
        </View>
      </SectionCard>
    </ScrollView>
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
  actionLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
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
});
