import { getDatabase } from '@/src/db/database';

export async function syncWrongBookOutcome(input: {
  questionId: string;
  subjectId: string;
  topicId: string;
  sessionId: string;
  answeredAt: string;
  isCorrect: boolean;
}) {
  const db = await getDatabase();

  if (input.isCorrect) {
    await db.runAsync(
      `
        UPDATE wrong_book_item
        SET resolved = 1, lastSessionId = ?
        WHERE questionId = ?
      `,
      [input.sessionId, input.questionId],
    );
    return;
  }

  await db.runAsync(
    `
      INSERT INTO wrong_book_item
        (questionId, subjectId, topicId, firstWrongAt, lastWrongAt, wrongCount, lastSessionId, resolved)
      VALUES (?, ?, ?, ?, ?, 1, ?, 0)
      ON CONFLICT(questionId) DO UPDATE SET
        lastWrongAt = excluded.lastWrongAt,
        wrongCount = wrong_book_item.wrongCount + 1,
        lastSessionId = excluded.lastSessionId,
        resolved = 0
    `,
    [
      input.questionId,
      input.subjectId,
      input.topicId,
      input.answeredAt,
      input.answeredAt,
      input.sessionId,
    ],
  );
}
