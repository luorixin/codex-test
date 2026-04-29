import options from '@/assets/question-bank/options.json';
import questions from '@/assets/question-bank/questions.json';
import subjects from '@/assets/question-bank/subjects.json';
import topics from '@/assets/question-bank/topics.json';
import { validateQuestionBank } from '@/src/db/seed/validateQuestionBank';
import type { CatalogSnapshotDto } from '@/src/types/domain';

let snapshot: CatalogSnapshotDto | null = null;

export async function getCatalogSnapshotFromMock(): Promise<CatalogSnapshotDto> {
  if (!snapshot) {
    snapshot = validateQuestionBank({
      subjects,
      topics,
      questions,
      options,
    });
  }

  return snapshot;
}
