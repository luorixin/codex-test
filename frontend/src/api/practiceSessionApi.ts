import { httpClient } from '@/src/api/client';
import type {
  PracticeMode,
  PracticeSessionState,
  PracticeSessionSummary,
} from '@/src/types/domain';

export type CreatePracticeSessionResponse = {
  sessionId: string;
  session: PracticeSessionSummary;
};

export type SubmitPracticeSessionAnswerResponse = {
  answer: {
    id: string;
    sessionId: string;
    questionId: string;
    selectedOptionKeys: string[];
    isCorrect: boolean;
    answeredAt: string;
  };
  correctOptionKeys: string[];
  isFinished: boolean;
  correctCount: number;
  answeredCount: number;
};

export async function createPracticeSessionWithApi(input: {
  mode: PracticeMode;
  subjectId: string;
  topicId?: string | null;
  scopeTitle: string;
}): Promise<CreatePracticeSessionResponse> {
  return httpClient.post<CreatePracticeSessionResponse>('/practice-sessions', input);
}

export async function getPracticeSessionStateFromApi(
  sessionId: string,
): Promise<PracticeSessionState> {
  return httpClient.get<PracticeSessionState>(`/practice-sessions/${sessionId}`);
}

export async function submitPracticeSessionAnswerWithApi(input: {
  sessionId: string;
  questionId: string;
  selectedOptionKeys: string[];
}): Promise<SubmitPracticeSessionAnswerResponse> {
  return httpClient.post<SubmitPracticeSessionAnswerResponse>(
    `/practice-sessions/${input.sessionId}/answers`,
    {
      questionId: input.questionId,
      selectedOptionKeys: input.selectedOptionKeys,
    },
  );
}
