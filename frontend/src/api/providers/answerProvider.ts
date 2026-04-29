import {
  evaluateAnswerWithApi,
  type AnswerEvaluationResponse,
} from '@/src/api/answerApi';
import { isBackendApiEnabled } from '@/src/config/runtime';
import { evaluateAnswer, getCorrectOptionKeys } from '@/src/services/practice/evaluateAnswer';
import type { PracticeQuestion } from '@/src/types/domain';

export async function evaluatePracticeAnswer(input: {
  sessionId: string;
  question: PracticeQuestion;
  selectedOptionKeys: string[];
}): Promise<AnswerEvaluationResponse> {
  if (isBackendApiEnabled()) {
    return evaluateAnswerWithApi(input);
  }

  const correctOptionKeys = getCorrectOptionKeys(input.question);
  const selectedOptionKeys = [...input.selectedOptionKeys].sort((left, right) =>
    left.localeCompare(right),
  );

  return {
    questionId: input.question.id,
    sessionId: input.sessionId,
    isCorrect: evaluateAnswer(input.question.type, selectedOptionKeys, correctOptionKeys),
    correctOptionKeys,
    selectedOptionKeys,
    answeredAt: new Date().toISOString(),
  };
}
