import type { PracticeQuestion, QuestionType } from '@/src/types/domain';

export function evaluateAnswer(
  questionType: QuestionType,
  selectedOptionKeys: string[],
  correctOptionKeys: string[],
) {
  const normalizedSelected = normalizeKeys(selectedOptionKeys);
  const normalizedCorrect = normalizeKeys(correctOptionKeys);

  if (questionType === 'single_choice' || questionType === 'true_false') {
    return normalizedSelected.length === 1 && normalizedSelected[0] === normalizedCorrect[0];
  }

  if (normalizedSelected.length !== normalizedCorrect.length) {
    return false;
  }

  return normalizedSelected.every((key, index) => key === normalizedCorrect[index]);
}

export function getCorrectOptionKeys(question: PracticeQuestion) {
  return question.options.filter((option) => option.isCorrect).map((option) => option.key);
}

function normalizeKeys(keys: string[]) {
  return [...keys].sort((left, right) => left.localeCompare(right));
}
