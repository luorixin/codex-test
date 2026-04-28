import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber, formatPercent } from '@/src/i18n';
import { SectionCard } from '@/src/components/common/SectionCard';
import { SubjectListItem } from '@/src/components/common/SubjectListItem';
import { useScreenData } from '@/src/hooks/useScreenData';
import { useResourceDownload } from '@/src/hooks/useResourceDownload';
import { getHomeScreenData } from '@/src/services/home/homeService';
import { getCoverageRate, getOverviewAccuracyRate } from '@/src/services/stats/statsService';
import type { HomeResourceItem } from '@/src/types/domain';

export default function HomeTabScreen() {
  const { t } = useTranslation();
  const loadHome = useCallback(() => getHomeScreenData(), []);
  const { data: screenData, isLoading } = useScreenData(loadHome);
  const {
    resourceStates,
    previewingResources,
    handlePreview,
    handleDownload,
    handleCancel,
    handleOpenDownloaded,
    renderProgressBar,
  } = useResourceDownload(screenData?.resources ?? []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionCard title={t('home.overviewTitle')} subtitle={t('home.overviewSubtitle')}>
        {screenData?.overview ? (
          <>
            <View style={styles.overviewGrid}>
              <OverviewMetric
                label={t('home.totalAnswers')}
                value={formatNumber(screenData.overview.totalAnswers)}
              />
              <OverviewMetric
                label={t('common.correctRate')}
                value={formatPercent(getOverviewAccuracyRate(screenData.overview))}
              />
            </View>
            <View style={styles.overviewGrid}>
              <OverviewMetric
                label={t('home.coveredQuestions')}
                value={formatPercent(getCoverageRate(screenData.overview))}
              />
              <OverviewMetric
                label={t('common.unresolved')}
                value={formatNumber(screenData.overview.unresolvedWrongCount)}
              />
            </View>
            <Text style={styles.overviewMeta}>
              {t('home.overviewMeta', {
                completedSessions: formatNumber(screenData.overview.completedSessions),
                activeDays: formatNumber(screenData.overview.activeDaysLast7),
              })}
            </Text>
          </>
        ) : (
          <ActivityIndicator color="#2563eb" />
        )}
      </SectionCard>

      <SectionCard title={t('home.resources.title')} subtitle={t('home.resources.subtitle')}>
        {screenData?.resources.length ? (
          <View style={styles.resourceList}>
            {screenData.resources.map((resource) => {
              const state = resourceStates[resource.id] ?? {
                status: 'idle',
                progress: 0,
              };
              const isPreviewing = previewingResources.has(resource.id);

              return (
                <View key={resource.id} style={styles.resourceCard}>
                  <View style={styles.resourceCopy}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceType}>
                      {getResourceTypeLabel(resource.fileType, t)}
                    </Text>
                  </View>
                  <View style={styles.resourceActions}>
                    <Pressable onPress={() => handlePreview(resource)} disabled={isPreviewing}>
                      <Text style={[styles.previewLink, isPreviewing && styles.linkDisabled]}>
                        {isPreviewing
                          ? t('home.resources.previewing')
                          : t('home.resources.preview')}
                      </Text>
                    </Pressable>
                    {state.status === 'idle' ||
                    state.status === 'failed' ||
                    state.status === 'cancelled' ? (
                      <Pressable
                        onPress={() => handleDownload(resource)}
                        style={styles.downloadButton}
                      >
                        <Text style={styles.downloadButtonText}>
                          {t('home.resources.download')}
                        </Text>
                      </Pressable>
                    ) : null}
                    {state.status === 'downloading' ? (
                      <Pressable
                        onPress={() => handleCancel(resource.id)}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>
                          {t('home.resources.cancelDownload')}
                        </Text>
                      </Pressable>
                    ) : null}
                    {state.status === 'completed' && state.localUri ? (
                      <Pressable onPress={() => handleOpenDownloaded(resource.id, state.localUri!)}>
                        <Text style={styles.previewLink}>{t('home.resources.openDownloaded')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {state.status === 'downloading' ? renderProgressBar(resource.id, state) : null}
                  {state.status === 'completed' ? (
                    <Text style={styles.resourceSuccessText}>
                      {t('home.resources.downloadCompleted')}
                    </Text>
                  ) : null}
                  {state.status === 'cancelled' ? (
                    <Text style={styles.resourceCancelledText}>
                      {t('home.resources.downloadCancelled')}
                    </Text>
                  ) : null}
                  {state.errorMessage ? (
                    <Text style={styles.resourceErrorText}>{state.errorMessage}</Text>
                  ) : null}
                </View>
              );
            })}
            <Text style={styles.resourceHelperText}>
              {t('home.resources.downloadRequiresLogin')}
            </Text>
          </View>
        ) : (
          <Text style={styles.resourceEmptyText}>{t('home.resources.empty')}</Text>
        )}
      </SectionCard>

      <SectionCard title={t('home.subjectsTitle')} subtitle={t('home.subjectsSubtitle')}>
        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          screenData?.subjects.map((subject) => (
            <SubjectListItem
              key={subject.id}
              subject={subject}
              backTitle={t('navigation.tabs.home')}
            />
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
}

function getResourceTypeLabel(
  fileType: HomeResourceItem['fileType'],
  translate: (key: string, params?: Record<string, unknown>) => string,
) {
  switch (fileType) {
    case 'pdf':
      return translate('home.resources.types.pdf');
    case 'docx':
      return translate('home.resources.types.docx');
    case 'image':
      return translate('home.resources.types.image');
    default:
      return fileType;
  }
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    gap: 16,
    padding: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    padding: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  overviewMeta: {
    marginTop: 14,
    fontSize: 13,
    color: '#64748b',
  },
  resourceList: {
    gap: 12,
  },
  resourceCard: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 14,
    gap: 10,
  },
  resourceCopy: {
    gap: 6,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  resourceType: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#4338ca',
    overflow: 'hidden',
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  linkDisabled: {
    opacity: 0.5,
  },
  downloadButton: {
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButton: {
    borderRadius: 12,
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  resourceHelperText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
  },
  resourceSuccessText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#047857',
  },
  resourceCancelledText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6b7280',
  },
  resourceErrorText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#b91c1c',
  },
  resourceEmptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
  },
});
