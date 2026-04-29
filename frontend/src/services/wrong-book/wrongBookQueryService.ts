import {
  getWrongBookOverviewFromApi,
  getWrongBookQuestionDetailFromApi,
  listWrongBookQuestionsFromApi,
  listWrongBookSubjectsFromApi,
  listWrongBookTopicsFromApi,
} from '@/src/api/wrongBookApi';
import { ttlCache } from '@/src/cache/ttlCache';
import { isBackendApiEnabled } from '@/src/config/runtime';
import {
  getWrongBookOverview,
  getWrongBookQuestionDetail,
  listWrongBookQuestions,
  listWrongBookSubjects,
  listWrongBookTopics,
} from '@/src/db/repositories/wrongBookRepository';
import { getQuestionsByIds } from '@/src/services/catalog/catalogService';
import type {
  WrongBookQuestionDetail,
  WrongBookQuestionSummary,
  WrongBookScreenData,
} from '@/src/types/domain';

const WRONG_BOOK_CACHE_TTL = 30_000;

export async function getWrongBookScreenData(subjectId?: string): Promise<WrongBookScreenData> {
  const cacheKey = subjectId ? `wrongBook:screenData:${subjectId}` : 'wrongBook:screenData';
  const cached = ttlCache.get<WrongBookScreenData>(cacheKey);

  if (cached) {
    return cached;
  }

  const subjects = isBackendApiEnabled()
    ? await listWrongBookSubjectsFromApi()
    : await listWrongBookSubjects();
  const selectedSubjectId =
    subjectId && subjects.some((subject) => subject.subjectId === subjectId)
      ? subjectId
      : (subjects[0]?.subjectId ?? null);

  if (!selectedSubjectId) {
    const empty: WrongBookScreenData = {
      subjects,
      selectedSubjectId: null,
      overview: { unresolvedCount: 0, resolvedCount: 0, totalWrongCount: 0 },
      topics: [],
      questions: [],
    };

    ttlCache.set(cacheKey, empty, WRONG_BOOK_CACHE_TTL);
    return empty;
  }

  const [overview, topics, questionRows] = await Promise.all([
    isBackendApiEnabled()
      ? getWrongBookOverviewFromApi(selectedSubjectId)
      : getWrongBookOverview(selectedSubjectId),
    isBackendApiEnabled()
      ? listWrongBookTopicsFromApi(selectedSubjectId)
      : listWrongBookTopics(selectedSubjectId),
    isBackendApiEnabled()
      ? listWrongBookQuestionsFromApi({ subjectId: selectedSubjectId })
      : listWrongBookQuestions({ subjectId: selectedSubjectId }),
  ]);

  const enrichedQuestions = isBackendApiEnabled()
    ? questionRows
    : await enrichWrongBookQuestions(questionRows);

  const result: WrongBookScreenData = {
    subjects,
    selectedSubjectId,
    overview,
    topics,
    questions: enrichedQuestions,
  };

  ttlCache.set(cacheKey, result, WRONG_BOOK_CACHE_TTL);
  return result;
}

export async function getWrongQuestionDetail(
  questionId: string,
): Promise<WrongBookQuestionDetail | null> {
  if (isBackendApiEnabled()) {
    return getWrongBookQuestionDetailFromApi(questionId);
  }

  const detail = await getWrongBookQuestionDetail(questionId);

  if (!detail) {
    return null;
  }

  const [question] = await getQuestionsByIds([questionId]);

  if (!question) {
    return detail;
  }

  return {
    ...detail,
    stem: question.stem,
    explanation: question.explanation,
    type: question.type,
    options: question.options,
  };
}

async function enrichWrongBookQuestions(
  questionRows: WrongBookQuestionSummary[],
): Promise<WrongBookQuestionSummary[]> {
  if (questionRows.length === 0) {
    return questionRows;
  }

  const questionMap = new Map(
    (await getQuestionsByIds(questionRows.map((row) => row.questionId))).map((question) => [
      question.id,
      question,
    ]),
  );

  return questionRows.map((row) => ({
    ...row,
    stem: questionMap.get(row.questionId)?.stem ?? row.stem,
  }));
}
