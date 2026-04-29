import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { ScreenState } from '@/src/components/common/ScreenState';
import { SectionCard } from '@/src/components/common/SectionCard';
import { useScreenData } from '@/src/hooks/useScreenData';
import { getPracticeIntroData } from '@/src/services/topic/topicService';
import { startTopicPracticeSession } from '@/src/services/practice/practiceService';

export default function PracticeIntroScreen() {
  const { t } = useTranslation();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const loadIntro = useCallback(() => {
    if (!topicId) {
      throw new Error('Missing topicId');
    }

    return getPracticeIntroData(topicId);
  }, [topicId]);
  const { data: screenData, isLoading, errorMessage: loadError } = useScreenData(loadIntro);
  const errorMessage = loadError ?? startError;

  async function handleStart() {
    if (!topicId) {
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
      const sessionId = await startTopicPracticeSession(topicId);
      router.replace(`/practice/session/${sessionId}`);
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : 'practice.intro.startFailedDescription',
      );
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenState
        title={t('practice.intro.loadingTitle')}
        description={t('practice.intro.loadingDescription')}
        loading
        fullScreen
      />
    );
  }

  if (!screenData?.topic || !screenData.snapshot) {
    return (
      <View style={styles.centered}>
        <ScreenState
          title={t('practice.intro.missingTitle')}
          description={t('practice.intro.missingDescription')}
          fullScreen
        />
        <Link href="/" style={styles.link}>
          {t('common.backHome')}
        </Link>
      </View>
    );
  }

  const hasQuestions = screenData.snapshot.questionCount > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={t('practice.intro.title')} subtitle={t('practice.intro.subtitle')}>
        <Text style={styles.title}>{screenData.topic.name}</Text>
        <Text style={styles.meta}>
          {t('practice.intro.subjectMeta', { subjectName: screenData.topic.subjectName })}
        </Text>
        <View style={styles.metricRow}>
          <MetricPill
            label={t('practice.intro.questionCount')}
            value={formatNumber(screenData.snapshot.questionCount)}
          />
          <MetricPill
            label={t('practice.intro.answeredCount')}
            value={formatNumber(screenData.snapshot.answeredCount)}
          />
          <MetricPill
            label={t('practice.intro.wrongCount')}
            value={formatNumber(screenData.snapshot.wrongCount)}
          />
        </View>
      </SectionCard>

      <SectionCard title={t('practice.intro.guideTitle')}>
        <Text style={styles.bodyText}>{t('practice.intro.guideLineOne')}</Text>
        <Text style={styles.bodyText}>{t('practice.intro.guideLineTwo')}</Text>
        <Text style={styles.bodyText}>{t('practice.intro.guideLineThree')}</Text>
      </SectionCard>

      {errorMessage ? (
        <SectionCard title={t('practice.intro.actionFailedTitle')}>
          <Text style={styles.errorText}>{getLocalizedPracticeMessage(errorMessage, t)}</Text>
        </SectionCard>
      ) : null}

      <PrimaryButton
        disabled={!hasQuestions || isStarting}
        onPress={handleStart}
        label={
          isStarting
            ? t('practice.intro.startingButton')
            : hasQuestions
              ? t('practice.intro.startButton')
              : t('practice.intro.noQuestionsButton')
        }
      />
    </ScrollView>
  );
}

function getLocalizedPracticeMessage(
  message: string,
  translate: (key: string, params?: Record<string, unknown>) => string,
) {
  if (message.startsWith('practice.') || message.startsWith('app.')) {
    return translate(message);
  }

  return message;
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
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
  centered: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  link: {
    alignSelf: 'center',
    marginTop: 10,
    fontSize: 15,
    color: '#2563eb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metricPill: {
    minWidth: 88,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4338ca',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#b91c1c',
  },
});
