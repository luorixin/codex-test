import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SectionCard } from '@/src/components/common/SectionCard';

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={t('privacy.title')} subtitle={t('privacy.subtitle')}>
        <Text style={styles.body}>{t('privacy.bodyIntro')}</Text>
        <Text style={styles.body}>{t('privacy.bodyUsage')}</Text>
        <Text style={styles.body}>{t('privacy.bodyStorage')}</Text>
        <Text style={styles.body}>{t('privacy.bodyContact')}</Text>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
  },
  body: {
    fontSize: 14,
    lineHeight: 24,
    color: '#374151',
  },
});
