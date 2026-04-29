import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isBackendApiEnabled } from '@/src/config/runtime';
import { formatNumber, formatPercent } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { ScreenState } from '@/src/components/common/ScreenState';
import { SectionCard } from '@/src/components/common/SectionCard';
import { loadPracticeSessionState } from '@/src/services/practice/practiceService';
import type { PracticeAnswerRecord, PracticeQuestion, PracticeSessionState } from '@/src/types/domain';

export default function PracticeResultScreen() {
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [sessionState, setSessionState] = useState<PracticeSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const state = await loadPracticeSessionState(sessionId);

      if (!cancelled) {
        setSessionState(state);
        setIsLoading(false);
      }
    }

    load().catch((error) => {
      if (!cancelled) {
        setErrorMessage(
          error instanceof Error ? error.message : 'practice.result.loadFailedDescription',
        );
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <ScreenState
        title={t('practice.result.loadingTitle')}
        description={t('practice.result.loadingDescription')}
        loading
        fullScreen
      />
    );
  }

  if (!sessionState) {
    return (
      <ScreenState
        title={t('practice.result.missingTitle')}
        description={
          errorMessage
            ? getLocalizedPracticeMessage(errorMessage, t)
            : t('practice.result.missingDescription')
        }
        fullScreen
      />
    );
  }

  const incorrectCount = sessionState.answers.length - sessionState.session.correctCount;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard
        title={t('practice.result.title')}
        subtitle={`${sessionState.session.subjectName} · ${sessionState.session.scopeTitle}`}
      >
        <View style={styles.metricRow}>
          <ResultMetric
            label={t('practice.result.totalQuestions')}
            value={formatNumber(sessionState.questions.length)}
          />
          <ResultMetric
            label={t('practice.result.correctCount')}
            value={formatNumber(sessionState.session.correctCount)}
          />
          <ResultMetric
            label={t('practice.result.incorrectCount')}
            value={formatNumber(incorrectCount)}
          />
        </View>
        <Text style={styles.summaryText}>
          {t('practice.result.summaryText', {
            value: formatPercent(
              getAccuracy(sessionState.session.correctCount, sessionState.questions.length),
            ),
          })}
        </Text>
      </SectionCard>

      <SectionCard title={t('practice.result.actionsTitle')}>
        {sessionState.session.mode === 'topic_practice' && sessionState.session.topicId ? (
          <>
            <PrimaryButton
              onPress={() =>
                router.replace({
                  pathname: '/practice/intro',
                  params: { topicId: sessionState.session.topicId ?? '' },
                })
              }
              label={t('practice.result.retakeButton')}
            />
            <Link
              href={{
                pathname: '/topics/[topicId]',
                params: { topicId: sessionState.session.topicId },
              }}
              style={styles.secondaryLink}
            >
              {t('practice.result.backToTopic')}
            </Link>
          </>
        ) : (
          <Link href="/wrong-book" style={styles.secondaryLink}>
            {t('practice.result.backToWrongBook')}
          </Link>
        )}
      </SectionCard>

      <SectionCard
        title={t('practice.result.reviewTitle')}
        subtitle={t('practice.result.reviewSubtitle')}
      >
        <View style={styles.reviewList}>
          {sessionState.answers.map((answer) => {
            const question = sessionState.questions.find((item) => item.id === answer.questionId);

            if (!question) {
              return null;
            }

            return (
              <QuestionReviewCard
                key={answer.id}
                answer={answer}
                question={question}
              />
            );
          })}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuestionReviewCard({
  answer,
  question,
}: {
  answer: PracticeAnswerRecord;
  question: PracticeQuestion;
}) {
  const { t } = useTranslation();
  const separator = t('common.listSeparator');
  const selectedText = answer.selectedOptionKeys.join(separator);
  const correctOptionKeys = question.options
    .filter((option) => option.isCorrect === true)
    .map((option) => option.key)
    .join(separator);
  const canRevealCorrectAnswer = correctOptionKeys.length > 0;
  const showBackendNotice = !canRevealCorrectAnswer && isBackendApiEnabled();

  return (
    <View style={[styles.reviewCard, answer.isCorrect ? styles.reviewCorrect : styles.reviewWrong]}>
      <Text style={styles.reviewTitle}>{question.stem}</Text>
      <Text style={styles.reviewMeta}>
        {t('practice.result.yourAnswer', {
          value: selectedText || t('practice.result.notAnswered'),
        })}
      </Text>
      {!answer.isCorrect ? (
        <Text style={styles.reviewMeta}>
          {canRevealCorrectAnswer
            ? t('practice.result.correctAnswer', { value: correctOptionKeys })
            : t('practice.result.correctAnswerUnavailable')}
        </Text>
      ) : null}
      {!answer.isCorrect && showBackendNotice ? (
        <Text style={styles.reviewMeta}>{t('practice.result.correctAnswerUnavailableHint')}</Text>
      ) : null}
      <Text style={styles.reviewExplanation}>{question.explanation}</Text>
    </View>
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

function getAccuracy(correctCount: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((correctCount / total) * 100);
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
  metricRow: {
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
  summaryText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  secondaryLink: {
    marginTop: 12,
    fontSize: 15,
    color: '#2563eb',
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
  },
  reviewCorrect: {
    backgroundColor: '#f0fdf4',
  },
  reviewWrong: {
    backgroundColor: '#fef2f2',
  },
  reviewTitle: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    color: '#111827',
  },
  reviewMeta: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
  },
  reviewExplanation: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 22,
    color: '#374151',
  },
});
