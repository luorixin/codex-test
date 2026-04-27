import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { ScreenState } from '@/src/components/common/ScreenState';
import { SectionCard } from '@/src/components/common/SectionCard';
import { PracticeOptionButton } from '@/src/components/practice/PracticeOptionButton';
import {
  loadPracticeSessionState,
  submitPracticeAnswer,
} from '@/src/services/practice/practiceService';
import type { PracticeAnswerRecord, PracticeQuestion, PracticeSessionState } from '@/src/types/domain';

export default function PracticeSessionScreen() {
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [sessionState, setSessionState] = useState<PracticeSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctOptionKeys: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const state = await loadPracticeSessionState(sessionId);

      if (cancelled) {
        return;
      }

      if (state.session.finishedAt || state.answers.length >= state.questions.length) {
        router.replace(`/practice/result/${sessionId}`);
        return;
      }

      setSessionState(state);
      setCurrentQuestionIndex(state.answers.length);
      setSelection([]);
      setFeedback(null);
      setErrorMessage(null);
      setIsLoading(false);
    }

    load().catch((error) => {
      if (!cancelled) {
        setErrorMessage(
          error instanceof Error ? error.message : 'practice.session.loadFailedDescription',
        );
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const currentQuestion = sessionState
    ? sessionState.questions[currentQuestionIndex] ?? null
    : null;
  const progressIndex = sessionState ? currentQuestionIndex + 1 : 0;

  function toggleSelection(optionKey: string) {
    if (!currentQuestion || feedback) {
      return;
    }

    if (currentQuestion.type === 'multiple_choice') {
      setSelection((prev) =>
        prev.includes(optionKey) ? prev.filter((key) => key !== optionKey) : [...prev, optionKey],
      );
      return;
    }

    setSelection([optionKey]);
  }

  async function handleSubmit() {
    if (!sessionId || !currentQuestion || selection.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const submittedQuestionIndex = currentQuestionIndex;
      const result = await submitPracticeAnswer({
        sessionId,
        question: currentQuestion,
        selectedOptionKeys: selection,
      });

      setSessionState((prev) => {
        if (!prev) {
          return prev;
        }

        const nextAnswer: PracticeAnswerRecord = result.answer;
        return {
          ...prev,
          session: {
            ...prev.session,
            correctCount: result.correctCount,
            finishedAt: result.isFinished ? result.answer.answeredAt : prev.session.finishedAt,
          },
          answers: [...prev.answers, nextAnswer],
        };
      });

      setFeedback({
        isCorrect: result.answer.isCorrect,
        correctOptionKeys: result.correctOptionKeys,
      });
      setCurrentQuestionIndex(submittedQuestionIndex);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'practice.session.submitFailedDescription',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (!sessionState || !sessionId) {
      return;
    }

    if (sessionState.answers.length >= sessionState.questions.length) {
      router.replace(`/practice/result/${sessionId}`);
      return;
    }

    setSelection([]);
    setFeedback(null);
    setCurrentQuestionIndex(sessionState.answers.length);
  }

  if (isLoading) {
    return (
      <ScreenState
        title={t('practice.session.loadingTitle')}
        description={t('practice.session.loadingDescription')}
        loading
        fullScreen
      />
    );
  }

  if (!sessionState || !currentQuestion) {
    return (
      <ScreenState
        title={t('practice.session.missingTitle')}
        description={
          errorMessage
            ? getLocalizedPracticeMessage(errorMessage, t)
            : t('practice.session.missingDescription')
        }
        fullScreen
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard
        title={sessionState.session.scopeTitle}
        subtitle={t('practice.session.progressSubtitle', {
          subjectName: sessionState.session.subjectName,
          current: formatNumber(progressIndex),
          total: formatNumber(sessionState.questions.length),
        })}
      >
        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(sessionState.answers.length / sessionState.questions.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {t('practice.session.progressText', {
              answered: formatNumber(sessionState.answers.length),
              correct: formatNumber(sessionState.session.correctCount),
            })}
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title={currentQuestion.topicName}
        subtitle={getQuestionTypeLabel(currentQuestion.type, t)}
      >
        <Text style={styles.stem}>{currentQuestion.stem}</Text>
        <View style={styles.optionsWrap}>
          {currentQuestion.options.map((option) => {
            const isSelected = selection.includes(option.key);
            const isCorrectSelection = feedback
              ? feedback.correctOptionKeys.includes(option.key)
              : false;
            const isIncorrectSelection = feedback
              ? isSelected && !feedback.correctOptionKeys.includes(option.key)
              : false;

            return (
              <PracticeOptionButton
                key={option.id}
                option={option}
                isSelected={isSelected}
                revealResult={Boolean(feedback)}
                disabled={Boolean(feedback)}
                isCorrectSelection={isCorrectSelection}
                isIncorrectSelection={isIncorrectSelection}
                onPress={() => toggleSelection(option.key)}
              />
            );
          })}
        </View>
      </SectionCard>

      {feedback ? (
        <SectionCard
          title={
            feedback.isCorrect
              ? t('practice.session.feedbackCorrectTitle')
              : t('practice.session.feedbackWrongTitle')
          }
          subtitle={
            feedback.isCorrect
              ? t('practice.session.feedbackCorrectSubtitle')
              : t('practice.session.feedbackWrongSubtitle')
          }
        >
          <Text style={styles.explanation}>{currentQuestion.explanation}</Text>
        </SectionCard>
      ) : null}

      {errorMessage ? (
        <SectionCard title={t('practice.session.submitFailedTitle')}>
          <Text style={styles.errorText}>{getLocalizedPracticeMessage(errorMessage, t)}</Text>
        </SectionCard>
      ) : null}

      {!feedback ? (
        <PrimaryButton
          onPress={handleSubmit}
          disabled={selection.length === 0 || isSubmitting}
          label={
            isSubmitting
              ? t('practice.session.submittingButton')
              : t('practice.session.submitButton')
          }
        />
      ) : (
        <PrimaryButton
          onPress={handleNext}
          label={
            sessionState.answers.length >= sessionState.questions.length
              ? t('practice.session.viewResultButton')
              : t('practice.session.nextQuestionButton')
          }
        />
      )}
    </ScrollView>
  );
}

function getQuestionTypeLabel(
  type: PracticeQuestion['type'],
  translate: (key: string, params?: Record<string, unknown>) => string,
) {
  switch (type) {
    case 'single_choice':
      return translate('practice.questionType.singleChoice');
    case 'multiple_choice':
      return translate('practice.questionType.multipleChoice');
    case 'true_false':
      return translate('practice.questionType.trueFalse');
    default:
      return translate('practice.questionType.default');
  }
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
  progressRow: {
    gap: 10,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  progressText: {
    fontSize: 13,
    color: '#475569',
  },
  stem: {
    fontSize: 18,
    lineHeight: 28,
    color: '#111827',
    fontWeight: '600',
  },
  optionsWrap: {
    gap: 12,
    marginTop: 18,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 24,
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#b91c1c',
  },
});
