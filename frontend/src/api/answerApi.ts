import { httpClient } from '@/src/api/client';
import type { PracticeQuestion } from '@/src/types/domain';

export type AnswerEvaluationResponse = {
  questionId: string;
  sessionId: string | null;
  isCorrect: boolean;
  correctOptionKeys: string[];
  selectedOptionKeys: string[];
  answeredAt: string;
};

export async function evaluateAnswerWithApi(input: {
  sessionId: string;
  question: PracticeQuestion;
  selectedOptionKeys: string[];
}): Promise<AnswerEvaluationResponse> {
  return httpClient.post<AnswerEvaluationResponse>('/answers', {
    sessionId: input.sessionId,
    questionId: input.question.id,
    selectedOptionKeys: input.selectedOptionKeys,
  });
}
