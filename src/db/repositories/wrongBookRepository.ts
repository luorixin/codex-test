import { getDatabase } from '@/src/db/database';
import type {
  PracticeAnswerRecord,
  PracticeQuestionOption,
  WrongBookOverview,
  WrongBookQuestionDetail,
  WrongBookQuestionSummary,
  WrongBookSubjectSummary,
  WrongBookTopicSummary,
} from '@/src/types/domain';

export async function getWrongBookOverview(subjectId?: string): Promise<WrongBookOverview> {
  const db = await getDatabase();
  const params = subjectId ? [subjectId, subjectId, subjectId] : [];
  const subjectClause = subjectId ? 'WHERE subjectId = ?' : '';
  const subjectClauseResolved = subjectId ? 'WHERE subjectId = ? AND resolved = 1' : 'WHERE resolved = 1';
  const subjectClauseUnresolved = subjectId ? 'WHERE subjectId = ? AND resolved = 0' : 'WHERE resolved = 0';

  const row = await db.getFirstAsync<WrongBookOverview>(
    `
      SELECT
        (SELECT COUNT(*) FROM wrong_book_item ${subjectClauseUnresolved}) as unresolvedCount,
        (SELECT COUNT(*) FROM wrong_book_item ${subjectClauseResolved}) as resolvedCount,
        (SELECT COALESCE(SUM(wrongCount), 0) FROM wrong_book_item ${subjectClause}) as totalWrongCount
    `,
    params,
  );

  return row ?? { unresolvedCount: 0, resolvedCount: 0, totalWrongCount: 0 };
}

export async function listWrongBookSubjects(): Promise<WrongBookSubjectSummary[]> {
  const db = await getDatabase();

  return db.getAllAsync<WrongBookSubjectSummary>(
    `
      SELECT
        subject.id as subjectId,
        subject.name as subjectName,
        COUNT(*) as unresolvedCount
      FROM wrong_book_item
      INNER JOIN subject ON subject.id = wrong_book_item.subjectId
      WHERE wrong_book_item.resolved = 0
      GROUP BY subject.id
      ORDER BY subject.sortOrder ASC, subject.name ASC
    `,
  );
}

export async function listWrongBookTopics(subjectId: string): Promise<WrongBookTopicSummary[]> {
  const db = await getDatabase();

  return db.getAllAsync<WrongBookTopicSummary>(
    `
      SELECT
        topic.id as topicId,
        topic.name as topicName,
        subject.id as subjectId,
        subject.name as subjectName,
        SUM(CASE WHEN wrong_book_item.resolved = 0 THEN 1 ELSE 0 END) as unresolvedCount,
        COALESCE(SUM(wrong_book_item.wrongCount), 0) as totalWrongCount,
        MAX(wrong_book_item.lastWrongAt) as lastWrongAt
      FROM wrong_book_item
      INNER JOIN topic ON topic.id = wrong_book_item.topicId
      INNER JOIN subject ON subject.id = wrong_book_item.subjectId
      WHERE wrong_book_item.subjectId = ?
      GROUP BY topic.id
      HAVING totalWrongCount > 0
      ORDER BY unresolvedCount DESC, lastWrongAt DESC, topic.sortOrder ASC
    `,
    [subjectId],
  );
}

export async function listWrongBookQuestions(input: {
  subjectId: string;
  topicId?: string;
  includeResolved?: boolean;
}): Promise<WrongBookQuestionSummary[]> {
  const db = await getDatabase();
  const params: string[] = [input.subjectId];
  const topicClause = input.topicId ? 'AND wrong_book_item.topicId = ?' : '';
  if (input.topicId) {
    params.push(input.topicId);
  }
  const resolvedClause = input.includeResolved ? '' : 'AND wrong_book_item.resolved = 0';

  return db.getAllAsync<WrongBookQuestionSummary>(
    `
      SELECT
        wrong_book_item.questionId,
        question.stem,
        subject.id as subjectId,
        subject.name as subjectName,
        topic.id as topicId,
        topic.name as topicName,
        wrong_book_item.wrongCount,
        wrong_book_item.resolved,
        wrong_book_item.lastWrongAt
      FROM wrong_book_item
      INNER JOIN question ON question.id = wrong_book_item.questionId
      INNER JOIN topic ON topic.id = wrong_book_item.topicId
      INNER JOIN subject ON subject.id = wrong_book_item.subjectId
      WHERE wrong_book_item.subjectId = ?
      ${topicClause}
      ${resolvedClause}
      ORDER BY wrong_book_item.resolved ASC, wrong_book_item.lastWrongAt DESC
    `,
    params,
  ).then((rows) =>
    rows.map((row) => ({
      ...row,
      resolved: Boolean(row.resolved),
    })),
  );
}

export async function listWrongBookQuestionIds(input: {
  subjectId: string;
  topicId?: string;
}): Promise<string[]> {
  const rows = await listWrongBookQuestions({
    subjectId: input.subjectId,
    topicId: input.topicId,
    includeResolved: false,
  });

  return rows.map((row) => row.questionId);
}

export async function getWrongBookQuestionDetail(
  questionId: string,
): Promise<WrongBookQuestionDetail | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    questionId: string;
    stem: string;
    explanation: string;
    type: WrongBookQuestionDetail['type'];
    subjectId: string;
    subjectName: string;
    topicId: string;
    topicName: string;
    wrongCount: number;
    firstWrongAt: string;
    lastWrongAt: string;
    resolved: number;
  }>(
    `
      SELECT
        wrong_book_item.questionId,
        question.stem,
        question.explanation,
        question.type,
        subject.id as subjectId,
        subject.name as subjectName,
        topic.id as topicId,
        topic.name as topicName,
        wrong_book_item.wrongCount,
        wrong_book_item.firstWrongAt,
        wrong_book_item.lastWrongAt,
        wrong_book_item.resolved
      FROM wrong_book_item
      INNER JOIN question ON question.id = wrong_book_item.questionId
      INNER JOIN subject ON subject.id = wrong_book_item.subjectId
      INNER JOIN topic ON topic.id = wrong_book_item.topicId
      WHERE wrong_book_item.questionId = ?
    `,
    [questionId],
  );

  if (!row) {
    return null;
  }

  const [optionRows, answerRows] = await Promise.all([
    db.getAllAsync<{
      id: string;
      key: string;
      content: string;
      isCorrect: number;
    }>(
      `
        SELECT id, key, content, isCorrect
        FROM question_option
        WHERE questionId = ?
        ORDER BY key ASC
      `,
      [questionId],
    ),
    db.getAllAsync<{
      id: string;
      sessionId: string;
      questionId: string;
      selectedOptionKeys: string;
      isCorrect: number;
      answeredAt: string;
    }>(
      `
        SELECT
          id,
          sessionId,
          questionId,
          selectedOptionKeys,
          isCorrect,
          answeredAt
        FROM user_answer
        WHERE questionId = ?
        ORDER BY answeredAt DESC
        LIMIT 5
      `,
      [questionId],
    ),
  ]);

  const options: PracticeQuestionOption[] = optionRows.map((option) => ({
    id: option.id,
    key: option.key,
    content: option.content,
    isCorrect: option.isCorrect === 1,
  }));

  const recentAnswers: PracticeAnswerRecord[] = answerRows.map((answer) => ({
    id: answer.id,
    sessionId: answer.sessionId,
    questionId: answer.questionId,
    selectedOptionKeys: JSON.parse(answer.selectedOptionKeys) as string[],
    isCorrect: answer.isCorrect === 1,
    answeredAt: answer.answeredAt,
  }));

  return {
    ...row,
    resolved: row.resolved === 1,
    options,
    recentAnswers,
  };
}
