export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export type QuestionBankSubject = {
  id: string;
  name: string;
  sortOrder: number;
};

export type QuestionBankTopic = {
  id: string;
  subjectId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
};

export type QuestionBankQuestion = {
  id: string;
  subjectId: string;
  topicId: string;
  type: QuestionType;
  stem: string;
  explanation: string;
  difficulty?: string;
  source?: string;
};

export type QuestionBankOption = {
  id: string;
  questionId: string;
  key: string;
  content: string;
  isCorrect: boolean;
};

export type QuestionBank = {
  subjects: QuestionBankSubject[];
  topics: QuestionBankTopic[];
  questions: QuestionBankQuestion[];
  options: QuestionBankOption[];
};

export type CatalogSubjectDto = QuestionBankSubject;
export type CatalogTopicDto = QuestionBankTopic;
export type CatalogQuestionDto = QuestionBankQuestion;
export type CatalogQuestionOptionDto = QuestionBankOption;

export type CatalogSnapshotDto = {
  subjects: CatalogSubjectDto[];
  topics: CatalogTopicDto[];
  questions: CatalogQuestionDto[];
  options: CatalogQuestionOptionDto[];
};

export type SubjectSummary = {
  id: string;
  name: string;
  sortOrder: number;
  topicCount: number;
  questionCount: number;
};

export type SubjectDetail = SubjectSummary & {
  rootTopicCount: number;
};

export type TopicTreeSummary = {
  id: string;
  subjectId: string;
  name: string;
  sortOrder: number;
  childTopicCount: number;
  questionCount: number;
};

export type TopicDetail = {
  id: string;
  subjectId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  subjectName: string;
};

export type TopicProgressSnapshot = {
  childTopicCount: number;
  questionCount: number;
  answeredCount: number;
  wrongCount: number;
};

export type HomeOverview = {
  subjectCount: number;
  topicCount: number;
  questionCount: number;
  totalSessions: number;
  completedSessions: number;
  totalAnswers: number;
  correctAnswers: number;
  answeredUniqueQuestions: number;
  unresolvedWrongCount: number;
  activeDaysLast7: number;
};

export type PracticeMode = 'topic_practice' | 'wrong_book';

export type PracticeQuestionOption = {
  id: string;
  key: string;
  content: string;
  isCorrect: boolean;
};

export type PracticeQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  type: QuestionType;
  stem: string;
  explanation: string;
  options: PracticeQuestionOption[];
};

export type PracticeSessionDetail = {
  id: string;
  mode: PracticeMode;
  subjectId: string;
  subjectName: string;
  topicId: string | null;
  scopeTitle: string;
  startedAt: string;
  finishedAt: string | null;
  questionCount: number;
  correctCount: number;
};

export type PracticeAnswerRecord = {
  id: string;
  sessionId: string;
  questionId: string;
  selectedOptionKeys: string[];
  isCorrect: boolean;
  answeredAt: string;
};

export type PracticeSessionState = {
  session: PracticeSessionDetail;
  questions: PracticeQuestion[];
  answers: PracticeAnswerRecord[];
};

export type PracticeSessionSummary = {
  id: string;
  mode: PracticeMode;
  topicId: string | null;
  scopeTitle: string;
  subjectName: string;
  questionCount: number;
  correctCount: number;
  startedAt: string;
  finishedAt: string | null;
};

export type WrongBookOverview = {
  unresolvedCount: number;
  resolvedCount: number;
  totalWrongCount: number;
};

export type WrongBookSubjectSummary = {
  subjectId: string;
  subjectName: string;
  unresolvedCount: number;
};

export type WrongBookTopicSummary = {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  unresolvedCount: number;
  totalWrongCount: number;
  lastWrongAt: string;
};

export type WrongBookQuestionSummary = {
  questionId: string;
  stem: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  wrongCount: number;
  resolved: boolean;
  lastWrongAt: string;
};

export type WrongBookQuestionDetail = {
  questionId: string;
  stem: string;
  explanation: string;
  type: QuestionType;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  wrongCount: number;
  firstWrongAt: string;
  lastWrongAt: string;
  resolved: boolean;
  options: PracticeQuestionOption[];
  recentAnswers: PracticeAnswerRecord[];
};

export type DailyPracticeStat = {
  dateKey: string;
  label: string;
  answerCount: number;
  correctCount: number;
};

export type SubjectProgressStat = {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  answeredQuestions: number;
  answerCount: number;
  correctCount: number;
  unresolvedWrongCount: number;
  completionRate: number;
  accuracyRate: number;
};

export type TopicProgressStat = {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  answeredQuestions: number;
  answerCount: number;
  correctCount: number;
  completionRate: number;
  accuracyRate: number;
};

export type StatsSummary = {
  overview: HomeOverview;
  recentSevenDays: DailyPracticeStat[];
  subjectProgress: SubjectProgressStat[];
  topicProgress: TopicProgressStat[];
  recentSessions: PracticeSessionSummary[];
};

export type HomeScreenData = {
  overview: HomeOverview;
  subjects: SubjectSummary[];
  recentSession: PracticeSessionSummary | null;
};

export type SubjectScreenData = {
  subject: SubjectDetail | null;
  topics: TopicTreeSummary[];
};

export type TopicScreenData = {
  topic: TopicDetail | null;
  snapshot: TopicProgressSnapshot | null;
  children: TopicTreeSummary[];
};

export type PracticeIntroData = {
  topic: TopicDetail | null;
  snapshot: TopicProgressSnapshot | null;
};

export type WrongBookScreenData = {
  subjects: WrongBookSubjectSummary[];
  selectedSubjectId: string | null;
  overview: WrongBookOverview;
  topics: WrongBookTopicSummary[];
  questions: WrongBookQuestionSummary[];
};

export type AuthUser = {
  email: string;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string | null;
  user: AuthUser;
};

export type AuthSession = AuthLoginResponse;

export type AuthRefreshTokenRequest = {
  refreshToken: string;
};

export type AuthRefreshTokenResponse = AuthSession;

export type AuthStatus =
  | 'idle'
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated';

export type AuthLogoutReason = 'manual' | 'unauthorized' | 'restore_failed';

export type AuthLoginScreenConfig = {
  initialEmail: string;
  initialPassword: string;
};

export type ApiSuccessResponse<T> = {
  code?: number | string;
  message?: string;
  success?: boolean;
  data: T;
};

export type SupportedLocale = 'zh-CN' | 'en';

export type LocalePreference = SupportedLocale | 'system';
