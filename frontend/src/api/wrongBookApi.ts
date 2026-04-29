import { httpClient } from '@/src/api/client';
import type {
  WrongBookOverview,
  WrongBookQuestionDetail,
  WrongBookQuestionSummary,
  WrongBookSubjectSummary,
  WrongBookTopicSummary,
} from '@/src/types/domain';

export async function getWrongBookOverviewFromApi(subjectId?: string): Promise<WrongBookOverview> {
  return httpClient.get<WrongBookOverview>('/wrong-book/overview', {
    params: subjectId ? { subjectId } : undefined,
  });
}

export async function listWrongBookSubjectsFromApi(): Promise<WrongBookSubjectSummary[]> {
  return httpClient.get<WrongBookSubjectSummary[]>('/wrong-book/subjects');
}

export async function listWrongBookTopicsFromApi(subjectId: string): Promise<WrongBookTopicSummary[]> {
  return httpClient.get<WrongBookTopicSummary[]>('/wrong-book/topics', {
    params: { subjectId },
  });
}

export async function listWrongBookQuestionsFromApi(input: {
  subjectId: string;
  topicId?: string;
  includeResolved?: boolean;
}): Promise<WrongBookQuestionSummary[]> {
  return httpClient.get<WrongBookQuestionSummary[]>('/wrong-book/questions', {
    params: input,
  });
}

export async function getWrongBookQuestionDetailFromApi(
  questionId: string,
): Promise<WrongBookQuestionDetail> {
  return httpClient.get<WrongBookQuestionDetail>(`/wrong-book/questions/${questionId}`);
}
