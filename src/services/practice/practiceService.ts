import { ttlCache } from '@/src/cache/ttlCache';
import { createId } from '@/src/utils/createId';
import {
  createPracticeSessionRecord,
  getPracticeSessionState,
  runPracticeTransaction,
  savePracticeAnswerRecord,
  updatePracticeSessionProgress,
} from '@/src/db/repositories/practiceRepository';
import { listWrongBookQuestionIds } from '@/src/db/repositories/wrongBookRepository';
import { getQuestionsForPractice, getTopicById } from '@/src/services/catalog/catalogService';
import { evaluateAnswer, getCorrectOptionKeys } from '@/src/services/practice/evaluateAnswer';
import { syncWrongBookOutcome } from '@/src/services/wrong-book/wrongBookService';
import type { PracticeQuestion, PracticeSessionState } from '@/src/types/domain';

export async function startTopicPracticeSession(topicId: string) {
  const [topic, questions] = await Promise.all([
    getTopicById(topicId),
    getQuestionsForPractice(topicId),
  ]);

  if (!topic) {
    throw new Error('practice.errors.topicMissing');
  }

  if (questions.length === 0) {
    throw new Error('practice.errors.noQuestions');
  }

  const sessionId = createId('session');
  const startedAt = new Date().toISOString();

  await createPracticeSessionRecord({
    id: sessionId,
    mode: 'topic_practice',
    subjectId: topic.subjectId,
    topicId,
    scopeTitle: topic.name,
    questionCount: questions.length,
    startedAt,
    questionIds: questions.map((question) => question.id),
  });

  return sessionId;
}

export async function startWrongBookPracticeSession(input: {
  subjectId: string;
  topicId?: string;
  scopeTitle: string;
}) {
  const questionIds = await listWrongBookQuestionIds({
    subjectId: input.subjectId,
    topicId: input.topicId,
  });

  if (questionIds.length === 0) {
    throw new Error('practice.errors.noWrongBookQuestions');
  }

  const sessionId = createId('session');
  const startedAt = new Date().toISOString();

  await createPracticeSessionRecord({
    id: sessionId,
    mode: 'wrong_book',
    subjectId: input.subjectId,
    topicId: input.topicId ?? null,
    scopeTitle: input.scopeTitle,
    questionCount: questionIds.length,
    startedAt,
    questionIds,
  });

  return sessionId;
}

export async function loadPracticeSessionState(sessionId: string): Promise<PracticeSessionState> {
  const state = await getPracticeSessionState(sessionId);

  if (!state) {
    throw new Error('practice.errors.sessionMissing');
  }

  return state;
}

export async function submitPracticeAnswer(input: {
  sessionId: string;
  question: PracticeQuestion;
  selectedOptionKeys: string[];
}) {
  const state = await loadPracticeSessionState(input.sessionId);

  if (state.session.finishedAt) {
    throw new Error('practice.errors.sessionFinished');
  }

  if (state.answers.some((answer) => answer.questionId === input.question.id)) {
    throw new Error('practice.errors.answerAlreadySubmitted');
  }

  const correctOptionKeys = getCorrectOptionKeys(input.question);
  const isCorrect = evaluateAnswer(
    input.question.type,
    input.selectedOptionKeys,
    correctOptionKeys,
  );
  const answerId = createId('answer');
  const answeredAt = new Date().toISOString();
  const nextCorrectCount = state.session.correctCount + (isCorrect ? 1 : 0);
  const nextAnsweredCount = state.answers.length + 1;
  const isFinished = nextAnsweredCount >= state.questions.length;
  const finishedAt = isFinished ? answeredAt : undefined;

  await runPracticeTransaction(async () => {
    await savePracticeAnswerRecord({
      id: answerId,
      sessionId: input.sessionId,
      questionId: input.question.id,
      selectedOptionKeys: input.selectedOptionKeys,
      isCorrect,
      answeredAt,
    });

    await syncWrongBookOutcome({
      questionId: input.question.id,
      subjectId: state.session.subjectId,
      topicId: input.question.topicId,
      sessionId: input.sessionId,
      answeredAt,
      isCorrect,
    });

    await updatePracticeSessionProgress({
      sessionId: input.sessionId,
      correctCount: nextCorrectCount,
      finishedAt,
    });
  });

  ttlCache.deleteByPrefix('stats:');
  ttlCache.deleteByPrefix('home:');
  ttlCache.deleteByPrefix('topic:');
  ttlCache.deleteByPrefix('wrongBook:');

  return {
    answer: {
      id: answerId,
      sessionId: input.sessionId,
      questionId: input.question.id,
      selectedOptionKeys: input.selectedOptionKeys,
      isCorrect,
      answeredAt,
    },
    correctOptionKeys,
    isFinished,
    correctCount: nextCorrectCount,
    answeredCount: nextAnsweredCount,
  };
}
