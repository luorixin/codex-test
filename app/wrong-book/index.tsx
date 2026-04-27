import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { ScreenState } from '@/src/components/common/ScreenState';
import { SectionCard } from '@/src/components/common/SectionCard';
import { startWrongBookPracticeSession } from '@/src/services/practice/practiceService';
import { getWrongBookScreenData } from '@/src/services/wrong-book/wrongBookQueryService';
import type { WrongBookScreenData, WrongBookTopicSummary } from '@/src/types/domain';

export default function WrongBookScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ subjectId?: string }>();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [screenData, setScreenData] = useState<WrongBookScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const candidateSubjectId = selectedSubjectId ?? params.subjectId;
    const nextScreenData = await getWrongBookScreenData(candidateSubjectId);
    setScreenData(nextScreenData);
    setSelectedSubjectId(nextScreenData.selectedSubjectId);
    setIsLoading(false);
  }, [params.subjectId, selectedSubjectId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      load().catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? getLocalizedPracticeMessage(error.message, t)
              : t('wrongBook.loadFailedTitle'),
          );
          setIsLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const selectedSubject = useMemo(
    () => screenData?.subjects.find((subject) => subject.subjectId === selectedSubjectId) ?? null,
    [screenData?.subjects, selectedSubjectId],
  );

  async function handleStartSubjectRetry() {
    if (!selectedSubjectId || !selectedSubject) {
      return;
    }

    setIsStarting(`subject:${selectedSubjectId}`);

    try {
      const sessionId = await startWrongBookPracticeSession({
        subjectId: selectedSubjectId,
        scopeTitle: t('wrongBook.subjectRetryTitle', {
          subjectName: selectedSubject.subjectName,
        }),
      });
      router.push(`/practice/session/${sessionId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? getLocalizedPracticeMessage(error.message, t)
          : t('practice.errors.noWrongBookQuestions'),
      );
    } finally {
      setIsStarting(null);
    }
  }

  async function handleStartTopicRetry(topic: WrongBookTopicSummary) {
    setIsStarting(`topic:${topic.topicId}`);

    try {
      const sessionId = await startWrongBookPracticeSession({
        subjectId: topic.subjectId,
        topicId: topic.topicId,
        scopeTitle: `${topic.topicName} ${t('wrongBook.retryButton')}`,
      });
      router.push(`/practice/session/${sessionId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? getLocalizedPracticeMessage(error.message, t)
          : t('practice.errors.noWrongBookQuestions'),
      );
    } finally {
      setIsStarting(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={t('wrongBook.title')} subtitle={t('wrongBook.subtitle')}>
        {!isLoading && screenData?.overview ? (
          <View style={styles.metricRow}>
            <MetricCard
              label={t('wrongBook.unresolved')}
              value={formatNumber(screenData.overview.unresolvedCount)}
            />
            <MetricCard
              label={t('wrongBook.resolved')}
              value={formatNumber(screenData.overview.resolvedCount)}
            />
            <MetricCard
              label={t('wrongBook.totalWrongCount')}
              value={formatNumber(screenData.overview.totalWrongCount)}
            />
          </View>
        ) : (
          <ScreenState
            title={t('wrongBook.loadingTitle')}
            description={t('wrongBook.loadingDescription')}
            loading
          />
        )}
      </SectionCard>

      <SectionCard title={t('wrongBook.filterTitle')}>
        {errorMessage ? (
          <ScreenState
            title={t('wrongBook.loadFailedTitle')}
            description={errorMessage}
            tone="error"
          />
        ) : isLoading ? (
          <ScreenState
            title={t('wrongBook.filterLoadingTitle')}
            description={t('wrongBook.filterLoadingDescription')}
            loading
          />
        ) : screenData && screenData.subjects.length > 0 ? (
          <View style={styles.filterWrap}>
            {screenData.subjects.map((subject) => (
              <PrimaryButtonChip
                key={subject.subjectId}
                label={`${subject.subjectName} · ${formatNumber(subject.unresolvedCount)}`}
                active={selectedSubjectId === subject.subjectId}
                onPress={() => setSelectedSubjectId(subject.subjectId)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.text}>{t('wrongBook.empty')}</Text>
        )}
      </SectionCard>

      {selectedSubject ? (
        <SectionCard
          title={t('wrongBook.subjectRetryTitle', {
            subjectName: selectedSubject.subjectName,
          })}
          subtitle={t('wrongBook.subjectRetrySubtitle')}
        >
          <PrimaryButton
            onPress={handleStartSubjectRetry}
            disabled={screenData?.overview.unresolvedCount === 0 || isStarting !== null}
            label={
              isStarting === `subject:${selectedSubject.subjectId}`
                ? t('wrongBook.creatingSessionButton')
                : t('wrongBook.subjectRetryButton')
            }
          />
        </SectionCard>
      ) : null}

      {screenData && screenData.topics.length > 0 ? (
        <SectionCard title={t('wrongBook.topicRetryTitle')}>
          <View style={styles.topicList}>
            {screenData.topics.map((topic) => (
              <View key={topic.topicId} style={styles.topicCard}>
                <View style={styles.topicCardCopy}>
                  <Text style={styles.topicCardTitle}>{topic.topicName}</Text>
                  <Text style={styles.topicCardMeta}>
                    {t('wrongBook.topicRetryMeta', {
                      unresolvedCount: formatNumber(topic.unresolvedCount),
                      totalWrongCount: formatNumber(topic.totalWrongCount),
                    })}
                  </Text>
                </View>
                <PrimaryButton
                  onPress={() => handleStartTopicRetry(topic)}
                  disabled={topic.unresolvedCount === 0 || isStarting !== null}
                  label={
                    isStarting === `topic:${topic.topicId}`
                      ? t('wrongBook.creatingButton')
                      : t('wrongBook.retryButton')
                  }
                />
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {screenData && screenData.questions.length > 0 ? (
        <SectionCard
          title={t('wrongBook.questionListTitle')}
          subtitle={t('wrongBook.questionListSubtitle')}
        >
          <View style={styles.questionList}>
            {screenData.questions.map((question) => (
              <Link
                key={question.questionId}
                href={{
                  pathname: '/wrong-book/[questionId]',
                  params: { questionId: question.questionId },
                }}
                asChild
              >
                <Pressable style={styles.questionCard}>
                  <Text style={styles.questionTitle}>{question.stem}</Text>
                  <Text style={styles.questionMeta}>
                    {t('wrongBook.questionMeta', {
                      topicName: question.topicName,
                      status: question.resolved
                        ? t('wrongBook.resolved')
                        : t('wrongBook.unresolved'),
                      wrongCount: formatNumber(question.wrongCount),
                    })}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </SectionCard>
      ) : selectedSubject ? (
        <SectionCard title={t('wrongBook.questionListTitle')}>
          <Text style={styles.text}>{t('wrongBook.questionEmpty')}</Text>
        </SectionCard>
      ) : null}
    </ScrollView>
  );
}

function PrimaryButtonChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active ? styles.filterChipActive : null]}>
      <Text style={[styles.filterChipLabel, active ? styles.filterChipLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: '#111827',
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipLabelActive: {
    color: '#ffffff',
  },
  topicList: {
    gap: 12,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  topicCardCopy: {
    flex: 1,
  },
  topicCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  topicCardMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
  },
  questionList: {
    gap: 12,
  },
  questionCard: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  questionTitle: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    color: '#111827',
  },
  questionMeta: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
  },
});
