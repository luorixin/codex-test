import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'quiz-mvp.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subject (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      sortOrder INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topic (
      id TEXT PRIMARY KEY NOT NULL,
      subjectId TEXT NOT NULL,
      parentId TEXT,
      name TEXT NOT NULL,
      sortOrder INTEGER NOT NULL,
      FOREIGN KEY(subjectId) REFERENCES subject(id)
    );

    CREATE TABLE IF NOT EXISTS question (
      id TEXT PRIMARY KEY NOT NULL,
      subjectId TEXT NOT NULL,
      topicId TEXT NOT NULL,
      type TEXT NOT NULL,
      stem TEXT NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT,
      source TEXT,
      FOREIGN KEY(subjectId) REFERENCES subject(id),
      FOREIGN KEY(topicId) REFERENCES topic(id)
    );

    CREATE TABLE IF NOT EXISTS question_option (
      id TEXT PRIMARY KEY NOT NULL,
      questionId TEXT NOT NULL,
      key TEXT NOT NULL,
      content TEXT NOT NULL,
      isCorrect INTEGER NOT NULL,
      FOREIGN KEY(questionId) REFERENCES question(id)
    );

    CREATE TABLE IF NOT EXISTS practice_session (
      id TEXT PRIMARY KEY NOT NULL,
      mode TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      topicId TEXT,
      scopeTitle TEXT NOT NULL DEFAULT '',
      startedAt TEXT NOT NULL,
      finishedAt TEXT,
      questionCount INTEGER NOT NULL DEFAULT 0,
      correctCount INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS practice_session_question (
      sessionId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (sessionId, questionId),
      FOREIGN KEY(sessionId) REFERENCES practice_session(id),
      FOREIGN KEY(questionId) REFERENCES question(id)
    );

    CREATE TABLE IF NOT EXISTS user_answer (
      id TEXT PRIMARY KEY NOT NULL,
      sessionId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      selectedOptionKeys TEXT NOT NULL,
      isCorrect INTEGER NOT NULL,
      answeredAt TEXT NOT NULL,
      FOREIGN KEY(sessionId) REFERENCES practice_session(id),
      FOREIGN KEY(questionId) REFERENCES question(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS user_answer_session_question_idx
    ON user_answer(sessionId, questionId);

    CREATE TABLE IF NOT EXISTS wrong_book_item (
      questionId TEXT PRIMARY KEY NOT NULL,
      subjectId TEXT NOT NULL,
      topicId TEXT NOT NULL,
      firstWrongAt TEXT NOT NULL,
      lastWrongAt TEXT NOT NULL,
      wrongCount INTEGER NOT NULL DEFAULT 1,
      lastSessionId TEXT,
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(questionId) REFERENCES question(id)
    );
  `);

  await ensurePracticeSessionScopeTitleColumn(db);
  await backfillPracticeSessionScopeTitle(db);
}

async function ensurePracticeSessionScopeTitleColumn(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(practice_session)');
  const hasScopeTitle = columns.some((column) => column.name === 'scopeTitle');

  if (!hasScopeTitle) {
    await db.execAsync(
      `ALTER TABLE practice_session ADD COLUMN scopeTitle TEXT NOT NULL DEFAULT '';`,
    );
  }
}

async function backfillPracticeSessionScopeTitle(db: SQLite.SQLiteDatabase) {
  await db.runAsync(
    `
      UPDATE practice_session
      SET scopeTitle = COALESCE(
        NULLIF(scopeTitle, ''),
        (SELECT topic.name FROM topic WHERE topic.id = practice_session.topicId),
        '错题本'
      )
      WHERE scopeTitle = ''
    `,
  );
}
