import { getDatabase } from '@/src/db/database';
import type {
  PracticeAnswerRecord,
  PracticeMode,
  PracticeQuestion,
  PracticeQuestionOption,
  PracticeSessionDetail,
  PracticeSessionState,
  PracticeSessionSummary,
} from '@/src/types/domain';

type PracticeQuestionRow = {
  id: string;
  topicId: string;
  topicName: string;
  type: PracticeQuestion['type'];
  stem: string;
  explanation: string;
};

type PracticeOptionRow = {
  id: string;
  questionId: string;
  key: string;
  content: string;
  isCorrect: number;
};

export async function runPracticeTransaction(operations: () => Promise<void>): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(operations);
}

export async function listPracticeQuestionsByTopic(topicId: string): Promise<PracticeQuestion[]> {
  const db = await getDatabase();

  const questionRows = await db.getAllAsync<PracticeQuestionRow>(
    `
      WITH RECURSIVE subtree(id) AS (
        SELECT id FROM topic WHERE id = ?
        UNION ALL
        SELECT topic.id
        FROM topic
        INNER JOIN subtree ON topic.parentId = subtree.id
      )
      SELECT
        question.id,
        question.topicId,
        topic.name as topicName,
        question.type,
        question.stem,
        question.explanation
      FROM question
      INNER JOIN topic ON topic.id = question.topicId
      WHERE question.topicId IN (SELECT id FROM subtree)
      ORDER BY topic.sortOrder ASC, question.id ASC
    `,
    [topicId],
  );

  const optionRows = await db.getAllAsync<PracticeOptionRow>(
    `
      WITH RECURSIVE subtree(id) AS (
        SELECT id FROM topic WHERE id = ?
        UNION ALL
        SELECT topic.id
        FROM topic
        INNER JOIN subtree ON topic.parentId = subtree.id
      )
      SELECT
        question_option.id,
        question_option.questionId,
        question_option.key,
        question_option.content,
        question_option.isCorrect
      FROM question_option
      INNER JOIN question ON question.id = question_option.questionId
      WHERE question.topicId IN (SELECT id FROM subtree)
      ORDER BY question_option.questionId ASC, question_option.key ASC
    `,
    [topicId],
  );

  const optionMap = new Map<string, PracticeQuestionOption[]>();
  for (const row of optionRows) {
    const options = optionMap.get(row.questionId) ?? [];
    options.push({
      id: row.id,
      key: row.key,
      content: row.content,
      isCorrect: row.isCorrect === 1,
    });
    optionMap.set(row.questionId, options);
  }

  return questionRows.map((row) => ({
    ...row,
    options: optionMap.get(row.id) ?? [],
  }));
}

export async function createPracticeSessionRecord(input: {
  id: string;
  mode: PracticeMode;
  subjectId: string;
  topicId: string | null;
  scopeTitle: string;
  questionCount: number;
  startedAt: string;
  questionIds: string[];
}) {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `
        INSERT INTO practice_session
          (id, mode, subjectId, topicId, scopeTitle, startedAt, questionCount, correctCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `,
      [
        input.id,
        input.mode,
        input.subjectId,
        input.topicId,
        input.scopeTitle,
        input.startedAt,
        input.questionCount,
      ],
    );

    for (const [index, questionId] of input.questionIds.entries()) {
      await db.runAsync(
        `
          INSERT INTO practice_session_question
            (sessionId, questionId, position)
          VALUES (?, ?, ?)
        `,
        [input.id, questionId, index],
      );
    }
  });
}

export async function getPracticeSessionState(
  sessionId: string,
): Promise<PracticeSessionState | null> {
  const db = await getDatabase();

  const session = await db.getFirstAsync<PracticeSessionDetail>(
    `
      SELECT
        practice_session.id,
        practice_session.mode,
        practice_session.subjectId,
        subject.name as subjectName,
        practice_session.topicId,
        practice_session.scopeTitle,
        practice_session.startedAt,
        practice_session.finishedAt,
        practice_session.questionCount,
        practice_session.correctCount
      FROM practice_session
      INNER JOIN subject ON subject.id = practice_session.subjectId
      WHERE practice_session.id = ?
    `,
    [sessionId],
  );

  if (!session) {
    return null;
  }

  const [questions, answers] = await Promise.all([
    listPracticeQuestionsBySession(session),
    listPracticeAnswersBySession(sessionId),
  ]);

  return {
    session,
    questions,
    answers,
  };
}

async function listPracticeQuestionsBySession(
  session: PracticeSessionDetail,
): Promise<PracticeQuestion[]> {
  const db = await getDatabase();

  const questionRows = await db.getAllAsync<PracticeQuestionRow>(
    `
      SELECT
        question.id,
        question.topicId,
        topic.name as topicName,
        question.type,
        question.stem,
        question.explanation
      FROM practice_session_question
      INNER JOIN question ON question.id = practice_session_question.questionId
      INNER JOIN topic ON topic.id = question.topicId
      WHERE practice_session_question.sessionId = ?
      ORDER BY practice_session_question.position ASC
    `,
    [session.id],
  );

  if (questionRows.length > 0) {
    return hydratePracticeQuestions(questionRows);
  }

  if (session.mode === 'topic_practice' && session.topicId) {
    return listPracticeQuestionsByTopic(session.topicId);
  }

  return [];
}

export async function listPracticeAnswersBySession(
  sessionId: string,
): Promise<PracticeAnswerRecord[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
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
      WHERE sessionId = ?
      ORDER BY answeredAt ASC, id ASC
    `,
    [sessionId],
  );

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    questionId: row.questionId,
    selectedOptionKeys: JSON.parse(row.selectedOptionKeys) as string[],
    isCorrect: row.isCorrect === 1,
    answeredAt: row.answeredAt,
  }));
}

export async function savePracticeAnswerRecord(input: {
  id: string;
  sessionId: string;
  questionId: string;
  selectedOptionKeys: string[];
  isCorrect: boolean;
  answeredAt: string;
}) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO user_answer
        (id, sessionId, questionId, selectedOptionKeys, isCorrect, answeredAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.sessionId,
      input.questionId,
      JSON.stringify(input.selectedOptionKeys),
      input.isCorrect ? 1 : 0,
      input.answeredAt,
    ],
  );
}

export async function updatePracticeSessionProgress(input: {
  sessionId: string;
  correctCount: number;
  finishedAt?: string;
}) {
  const db = await getDatabase();

  if (input.finishedAt) {
    await db.runAsync(
      `
        UPDATE practice_session
        SET correctCount = ?, finishedAt = ?
        WHERE id = ?
      `,
      [input.correctCount, input.finishedAt, input.sessionId],
    );
    return;
  }

  await db.runAsync(
    `
      UPDATE practice_session
      SET correctCount = ?
      WHERE id = ?
    `,
    [input.correctCount, input.sessionId],
  );
}

export async function getLatestPracticeSessionSummary(): Promise<PracticeSessionSummary | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<PracticeSessionSummary>(
    `
      SELECT
        practice_session.id,
        practice_session.mode,
        practice_session.topicId,
        practice_session.scopeTitle,
        subject.name as subjectName,
        practice_session.questionCount,
        practice_session.correctCount,
        practice_session.startedAt,
        practice_session.finishedAt
      FROM practice_session
      INNER JOIN subject ON subject.id = practice_session.subjectId
      ORDER BY COALESCE(practice_session.finishedAt, practice_session.startedAt) DESC
      LIMIT 1
    `,
  );

  return row ?? null;
}

async function hydratePracticeQuestions(
  questionRows: PracticeQuestionRow[],
): Promise<PracticeQuestion[]> {
  const db = await getDatabase();
  const questionIds = questionRows.map((row) => row.id);

  if (questionIds.length === 0) {
    return [];
  }

  const placeholders = questionIds.map(() => '?').join(', ');
  const optionRows = await db.getAllAsync<PracticeOptionRow>(
    `
      SELECT
        question_option.id,
        question_option.questionId,
        question_option.key,
        question_option.content,
        question_option.isCorrect
      FROM question_option
      WHERE question_option.questionId IN (${placeholders})
      ORDER BY question_option.questionId ASC, question_option.key ASC
    `,
    questionIds,
  );

  const optionMap = new Map<string, PracticeQuestionOption[]>();
  for (const row of optionRows) {
    const options = optionMap.get(row.questionId) ?? [];
    options.push({
      id: row.id,
      key: row.key,
      content: row.content,
      isCorrect: row.isCorrect === 1,
    });
    optionMap.set(row.questionId, options);
  }

  return questionRows.map((row) => ({
    ...row,
    options: optionMap.get(row.id) ?? [],
  }));
}
