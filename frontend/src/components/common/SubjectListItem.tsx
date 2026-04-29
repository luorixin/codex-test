import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNumber } from '@/src/i18n';
import type { SubjectSummary } from '@/src/types/domain';

type SubjectListItemProps = {
  subject: SubjectSummary;
  backTitle?: string;
};

export function SubjectListItem({ subject, backTitle }: SubjectListItemProps) {
  const { t } = useTranslation();
  const href = backTitle
    ? {
        pathname: '/subjects/[subjectId]' as const,
        params: { subjectId: subject.id, backTitle },
      }
    : `/subjects/${subject.id}`;

  return (
    <Link href={href} asChild>
      <Pressable style={styles.container}>
        <View style={styles.copy}>
          <Text style={styles.title}>{subject.name}</Text>
          <Text style={styles.meta}>
            {t('subjectCard.meta', {
              topicCount: formatNumber(subject.topicCount),
              questionCount: formatNumber(subject.questionCount),
            })}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
  },
  arrow: {
    fontSize: 24,
    color: '#94a3b8',
  },
});
