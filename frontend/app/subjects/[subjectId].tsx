import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SectionCard } from '@/src/components/common/SectionCard';
import { ScreenState } from '@/src/components/common/ScreenState';
import { TopicListItem } from '@/src/components/common/TopicListItem';
import { useScreenData } from '@/src/hooks/useScreenData';
import { getSubjectScreenData } from '@/src/services/topic/topicService';

export default function SubjectScreen() {
  const { t } = useTranslation();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const loadSubject = useCallback(() => {
    if (!subjectId) {
      throw new Error('Missing subjectId');
    }

    return getSubjectScreenData(subjectId);
  }, [subjectId]);
  const { data: screenData, isLoading, errorMessage } = useScreenData(loadSubject);

  if (isLoading) {
    return (
      <ScreenState
        title={t('subject.loadingTitle')}
        description={t('subject.loadingDescription')}
        loading
        fullScreen
      />
    );
  }

  if (errorMessage) {
    return (
      <ScreenState
        title={t('subject.loadFailedTitle')}
        description={errorMessage}
        tone="error"
        fullScreen
      />
    );
  }

  if (!screenData?.subject) {
    return (
      <View style={styles.centered}>
        <ScreenState
          title={t('subject.missingTitle')}
          description={t('subject.missingDescription')}
          fullScreen
        />
        <Link href="/" style={styles.link}>
          {t('common.backHome')}
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={screenData.subject.name} subtitle={t('subject.sectionSubtitle')}>
        <View style={styles.summaryRow}>
          <SummaryPill
            label={t('subject.pillarChapters')}
            value={String(screenData.subject.rootTopicCount)}
          />
          <SummaryPill
            label={t('subject.pillarTopics')}
            value={String(screenData.subject.topicCount)}
          />
          <SummaryPill
            label={t('subject.pillarQuestions')}
            value={String(screenData.subject.questionCount)}
          />
        </View>
      </SectionCard>

      <SectionCard title={t('subject.sectionListTitle')}>
        {screenData.topics.map((topic) => (
          <TopicListItem key={topic.id} topic={topic} />
        ))}
      </SectionCard>
    </ScrollView>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
  centered: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  link: {
    alignSelf: 'center',
    marginTop: -12,
    fontSize: 15,
    color: '#2563eb',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryPill: {
    minWidth: 88,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4338ca',
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
  },
});
