import type {
  QuestionBank,
  QuestionBankOption,
  QuestionBankQuestion,
  QuestionBankSubject,
  QuestionBankTopic,
} from '@/src/types/domain';

type UnknownQuestionBank = {
  subjects: unknown;
  topics: unknown;
  questions: unknown;
  options: unknown;
};

export function validateQuestionBank(input: UnknownQuestionBank): QuestionBank {
  const subjects = ensureSubjects(input.subjects);
  const topics = ensureTopics(input.topics);
  const questions = ensureQuestions(input.questions);
  const options = ensureOptions(input.options);

  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const topicIds = new Set(topics.map((topic) => topic.id));
  const questionIds = new Set(questions.map((question) => question.id));

  for (const topic of topics) {
    if (!subjectIds.has(topic.subjectId)) {
      throw new Error(`Seed error: topic ${topic.id} references missing subject ${topic.subjectId}.`);
    }

    if (topic.parentId && !topicIds.has(topic.parentId)) {
      throw new Error(`Seed error: topic ${topic.id} references missing parent topic ${topic.parentId}.`);
    }
  }

  for (const question of questions) {
    if (!subjectIds.has(question.subjectId)) {
      throw new Error(
        `Seed error: question ${question.id} references missing subject ${question.subjectId}.`,
      );
    }

    if (!topicIds.has(question.topicId)) {
      throw new Error(`Seed error: question ${question.id} references missing topic ${question.topicId}.`);
    }
  }

  const optionsByQuestion = new Map<string, QuestionBankOption[]>();
  for (const option of options) {
    if (!questionIds.has(option.questionId)) {
      throw new Error(
        `Seed error: option ${option.id} references missing question ${option.questionId}.`,
      );
    }

    const optionList = optionsByQuestion.get(option.questionId) ?? [];
    optionList.push(option);
    optionsByQuestion.set(option.questionId, optionList);
  }

  for (const question of questions) {
    const questionOptions = optionsByQuestion.get(question.id) ?? [];

    if (questionOptions.length < 2) {
      throw new Error(`Seed error: question ${question.id} must have at least two options.`);
    }

    if (!questionOptions.some((option) => option.isCorrect)) {
      throw new Error(`Seed error: question ${question.id} must have at least one correct option.`);
    }

    if (question.type === 'true_false' && questionOptions.length !== 2) {
      throw new Error(`Seed error: true_false question ${question.id} must have exactly two options.`);
    }
  }

  return {
    subjects,
    topics,
    questions,
    options,
  };
}

function ensureSubjects(input: unknown): QuestionBankSubject[] {
  if (!Array.isArray(input)) {
    throw new Error('Seed error: subjects must be an array.');
  }

  return input.map((item) => ensureSubject(item));
}

function ensureSubject(input: unknown): QuestionBankSubject {
  const row = ensureRecord(input, 'subject');
  return {
    id: ensureString(row.id, 'subject.id'),
    name: ensureString(row.name, 'subject.name'),
    sortOrder: ensureNumber(row.sortOrder, 'subject.sortOrder'),
  };
}

function ensureTopics(input: unknown): QuestionBankTopic[] {
  if (!Array.isArray(input)) {
    throw new Error('Seed error: topics must be an array.');
  }

  return input.map((item) => ensureTopic(item));
}

function ensureTopic(input: unknown): QuestionBankTopic {
  const row = ensureRecord(input, 'topic');
  return {
    id: ensureString(row.id, 'topic.id'),
    subjectId: ensureString(row.subjectId, 'topic.subjectId'),
    parentId: row.parentId == null ? null : ensureString(row.parentId, 'topic.parentId'),
    name: ensureString(row.name, 'topic.name'),
    sortOrder: ensureNumber(row.sortOrder, 'topic.sortOrder'),
  };
}

function ensureQuestions(input: unknown): QuestionBankQuestion[] {
  if (!Array.isArray(input)) {
    throw new Error('Seed error: questions must be an array.');
  }

  return input.map((item) => ensureQuestion(item));
}

function ensureQuestion(input: unknown): QuestionBankQuestion {
  const row = ensureRecord(input, 'question');
  const type = ensureString(row.type, 'question.type');

  if (type !== 'single_choice' && type !== 'multiple_choice' && type !== 'true_false') {
    throw new Error(`Seed error: unsupported question type ${type}.`);
  }

  return {
    id: ensureString(row.id, 'question.id'),
    subjectId: ensureString(row.subjectId, 'question.subjectId'),
    topicId: ensureString(row.topicId, 'question.topicId'),
    type,
    stem: ensureString(row.stem, 'question.stem'),
    explanation: ensureString(row.explanation, 'question.explanation'),
    difficulty: row.difficulty == null ? undefined : ensureString(row.difficulty, 'question.difficulty'),
    source: row.source == null ? undefined : ensureString(row.source, 'question.source'),
  };
}

function ensureOptions(input: unknown): QuestionBankOption[] {
  if (!Array.isArray(input)) {
    throw new Error('Seed error: options must be an array.');
  }

  return input.map((item) => ensureOption(item));
}

function ensureOption(input: unknown): QuestionBankOption {
  const row = ensureRecord(input, 'option');
  return {
    id: ensureString(row.id, 'option.id'),
    questionId: ensureString(row.questionId, 'option.questionId'),
    key: ensureString(row.key, 'option.key'),
    content: ensureString(row.content, 'option.content'),
    isCorrect: ensureBoolean(row.isCorrect, 'option.isCorrect'),
  };
}

function ensureRecord(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`Seed error: ${label} must be an object.`);
  }

  return input as Record<string, unknown>;
}

function ensureString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Seed error: ${label} must be a non-empty string.`);
  }

  return value;
}

function ensureNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Seed error: ${label} must be a number.`);
  }

  return value;
}

function ensureBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Seed error: ${label} must be a boolean.`);
  }

  return value;
}
