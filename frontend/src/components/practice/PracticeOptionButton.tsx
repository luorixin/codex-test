import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PracticeQuestionOption } from '@/src/types/domain';

type PracticeOptionButtonProps = {
  option: PracticeQuestionOption;
  isSelected: boolean;
  revealResult: boolean;
  disabled?: boolean;
  isCorrectSelection?: boolean;
  isIncorrectSelection?: boolean;
  onPress: () => void;
};

export function PracticeOptionButton({
  option,
  isSelected,
  revealResult,
  disabled,
  isCorrectSelection,
  isIncorrectSelection,
  onPress,
}: PracticeOptionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isSelected ? styles.selected : null,
        revealResult && isCorrectSelection ? styles.correct : null,
        revealResult && isIncorrectSelection ? styles.incorrect : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <View style={styles.keyBadge}>
        <Text style={styles.keyText}>{option.key}</Text>
      </View>
      <Text style={styles.content}>{option.content}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  correct: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  incorrect: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  pressed: {
    opacity: 0.9,
  },
  keyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  keyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
});
