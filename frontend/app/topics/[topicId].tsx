import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { ScreenState } from '@/src/components/common/ScreenState';
import { SectionCard } from '@/src/components/common/SectionCard';
import { TopicListItem } from '@/src/components/common/TopicListItem';
import { useScreenData } from '@/src/hooks/useScreenData';
import { getTopicScreenData } from '@/src/services/topic/topicService';

export default function TopicScreen() {
  const { t } = useTranslation();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const loadTopic = useCallback(() => {
    if (!topicId) {
      throw new Error('Missing topicId');
    }

    return getTopicScreenData(topicId);
  }, [topicId]);
  const { data: screenData, isLoading, errorMessage } = useScreenData(loadTopic);

  if (isLoading) {
    return (
      <ScreenState
        title={t('topic.loadingTitle')}
        description={t('topic.loadingDescription')}
        loading
        fullScreen
      />
    );
  }

  if (errorMessage) {
    return (
      <ScreenState
        title={t('topic.loadFailedTitle')}
        description={errorMessage}
        tone="error"
        fullScreen
      />
    );
  }

  if (!screenData?.topic || !screenData.snapshot) {
    return (
      <ScreenState
        title={t('topic.missingTitle')}
        description={t('topic.missingDescription')}
        fullScreen
      />
    );
  }

  const { topic, snapshot, children } = screenData;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={topic.name} subtitle={t('topic.sectionSubtitle')}>
        <Text style={styles.metaText}>
          {t('topic.belongsToSubject', { subjectName: topic.subjectName })}
        </Text>
        <View style={styles.metricWrap}>
          <MetricBox label={t('topic.metricChildren')} value={String(snapshot.childTopicCount)} />
          <MetricBox label={t('topic.metricQuestions')} value={String(snapshot.questionCount)} />
          <MetricBox label={t('topic.metricAnswered')} value={String(snapshot.answeredCount)} />
          <MetricBox label={t('topic.metricWrong')} value={String(snapshot.wrongCount)} />
        </View>
      </SectionCard>

      <SectionCard title={t('topic.entryTitle')} subtitle={t('topic.entrySubtitle')}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>{t('topic.entryStartTitle')}</Text>
          <Text style={styles.noticeText}>{t('topic.entryDescription')}</Text>
          {snapshot.questionCount > 0 ? (
            <PrimaryButton
              label={t('topic.entryButton')}
              onPress={() =>
                router.push({
                  pathname: '/practice/intro',
                  params: { topicId: topic.id },
                })
              }
            />
          ) : (
            <Text style={styles.emptyPracticeText}>{t('topic.entryNoQuestions')}</Text>
          )}
        </View>
      </SectionCard>

      {children.length > 0 ? (
        <SectionCard title={t('topic.childrenSectionTitle')}>
          {children.map((child) => (
            <TopicListItem key={child.id} topic={child} />
          ))}
        </SectionCard>
      ) : null}
    </ScrollView>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
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
  metaText: {
    fontSize: 14,
    color: '#475569',
  },
  metricWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metricBox: {
    minWidth: 92,
    borderRadius: 14,
    backgroundColor: '#ecfeff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f766e',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
  },
  noticeBox: {
    borderRadius: 16,
    backgroundColor: '#111827',
    padding: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  noticeText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#d1d5db',
  },
  emptyPracticeText: {
    marginTop: 14,
    fontSize: 13,
    color: '#d1d5db',
  },
});
