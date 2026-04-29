import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isBackendApiEnabled } from '@/src/config/runtime';
import { formatDate, formatNumber } from '@/src/i18n';
import { ScreenState } from '@/src/components/common/ScreenState';
import { SectionCard } from '@/src/components/common/SectionCard';
import { getWrongQuestionDetail } from '@/src/services/wrong-book/wrongBookQueryService';
import type { WrongBookQuestionDetail } from '@/src/types/domain';

export default function WrongBookQuestionDetailScreen() {
  const { t } = useTranslation();
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const [detail, setDetail] = useState<WrongBookQuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!questionId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const row = await getWrongQuestionDetail(questionId);

      if (!cancelled) {
        setDetail(row);
        setIsLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [questionId]);

  if (isLoading) {
    return (
      <ScreenState
        title={t('wrongBook.detailLoadingTitle')}
        description={t('wrongBook.detailLoadingDescription')}
        loading
        fullScreen
      />
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <ScreenState
          title={t('wrongBook.detailMissingTitle')}
          description={t('wrongBook.detailMissingDescription')}
          fullScreen
        />
        <Link href="/wrong-book" style={styles.link}>
          {t('wrongBook.backToWrongBook')}
        </Link>
      </View>
    );
  }

  const correctOptionKeys = detail.correctOptionKeys ?? [];
  const correctOptions = detail.options.filter(
    (option) => option.isCorrect === true || correctOptionKeys.includes(option.key),
  );
  const hasCorrectAnswers = correctOptions.length > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard
        title={detail.topicName}
        subtitle={`${detail.subjectName} · ${
          detail.resolved ? t('wrongBook.resolved') : t('wrongBook.unresolved')
        }`}
      >
        <Text style={styles.stem}>{detail.stem}</Text>
      </SectionCard>

      <SectionCard title={t('wrongBook.correctAnswerTitle')}>
        {hasCorrectAnswers ? (
          <View style={styles.optionList}>
            {detail.options.map((option) => {
              const isCorrect =
                option.isCorrect === true || correctOptionKeys.includes(option.key);

              return (
                <View
                  key={option.id}
                  style={[styles.optionRow, isCorrect ? styles.correctOptionRow : null]}
                >
                  <Text style={styles.optionKey}>{option.key}</Text>
                  <Text style={styles.optionContent}>{option.content}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <>
            <Text style={styles.bodyText}>{t('wrongBook.correctAnswerUnavailable')}</Text>
            {isBackendApiEnabled() ? (
              <Text style={styles.metaText}>{t('wrongBook.correctAnswerUnavailableHint')}</Text>
            ) : null}
          </>
        )}
      </SectionCard>

      <SectionCard title={t('wrongBook.analysisTitle')}>
        <Text style={styles.bodyText}>{detail.explanation}</Text>
        <Text style={styles.metaText}>
          {t('wrongBook.wrongCountSummary', {
            wrongCount: formatNumber(detail.wrongCount),
          })}
        </Text>
        <Text style={styles.metaText}>
          {t('wrongBook.firstWrongAt', {
            value: formatTime(detail.firstWrongAt),
          })}
        </Text>
        <Text style={styles.metaText}>
          {t('wrongBook.lastWrongAt', {
            value: formatTime(detail.lastWrongAt),
          })}
        </Text>
      </SectionCard>

      <SectionCard
        title={t('wrongBook.answerHistoryTitle')}
        subtitle={t('wrongBook.answerHistorySubtitle')}
      >
        <View style={styles.answerHistory}>
          {detail.recentAnswers.length > 0 ? (
            detail.recentAnswers.map((answer) => (
              <View
                key={answer.id}
                style={[styles.answerCard, answer.isCorrect ? styles.answerCardCorrect : styles.answerCardWrong]}
              >
                <Text style={styles.answerTitle}>
                  {answer.isCorrect
                    ? t('wrongBook.answerCorrect')
                    : t('wrongBook.answerWrong')}{' '}
                  · {answer.selectedOptionKeys.join('、')}
                </Text>
                <Text style={styles.answerTime}>{formatTime(answer.answeredAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.bodyText}>{t('wrongBook.answerHistoryEmpty')}</Text>
          )}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

function formatTime(value: string) {
  return formatDate(value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    backgroundColor: '#f3f4f6',
    flex: 1,
  },
  link: {
    alignSelf: 'center',
    marginTop: 10,
    fontSize: 15,
    color: '#2563eb',
  },
  stem: {
    fontSize: 18,
    lineHeight: 28,
    color: '#111827',
    fontWeight: '600',
  },
  optionList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  correctOptionRow: {
    backgroundColor: '#f0fdf4',
  },
  optionKey: {
    width: 24,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  optionContent: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  metaText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
  },
  answerHistory: {
    gap: 10,
  },
  answerCard: {
    borderRadius: 14,
    padding: 14,
  },
  answerCardCorrect: {
    backgroundColor: '#f0fdf4',
  },
  answerCardWrong: {
    backgroundColor: '#fef2f2',
  },
  answerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  answerTime: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
});
