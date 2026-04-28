import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDate, formatNumber, formatPercent } from '@/src/i18n';
import { CalendarView } from '@/src/components/common/CalendarView';
import { SectionCard } from '@/src/components/common/SectionCard';
import { useScreenData } from '@/src/hooks/useScreenData';
import {
  getCoverageRate,
  getDailyPracticeStats,
  getOverviewAccuracyRate,
  getStatsSummary,
} from '@/src/services/stats/statsService';
import type { CalendarEventMap, CalendarViewProps } from '@/src/components/common/CalendarView';
import type { DailyPracticeStat, PracticeSessionSummary } from '@/src/types/domain';

export default function StatsScreen() {
  const { t } = useTranslation();
  const loadSummary = useCallback(() => getStatsSummary(), []);
  const { data: summary, isLoading } = useScreenData(loadSummary);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [calendarDays, setCalendarDays] = useState<DailyPracticeStat[]>([]);
  const loadedCalendarRanges = useRef(new Set<string>());
  const calendarEventMap = useMemo(
    () => buildLearningCalendarEventMap(calendarDays),
    [calendarDays],
  );
  const defaultCalendarDate =
    summary?.recentSevenDays[summary.recentSevenDays.length - 1]?.dateKey ?? undefined;
  const calendarSelectedDate = selectedCalendarDate ?? defaultCalendarDate;
  const selectedDailyStat = calendarDays.find((day) => day.dateKey === calendarSelectedDate);

  useEffect(() => {
    if (summary) {
      setCalendarDays((currentDays) =>
        mergeDailyPracticeStats(currentDays, summary.recentSevenDays),
      );
    }
  }, [summary]);

  const handleCalendarVisibleRangeChange = useCallback<
    NonNullable<CalendarViewProps['onVisibleRangeChange']>
  >((range) => {
    const rangeKey = `${range.startDate}:${range.endDate}`;

    if (loadedCalendarRanges.current.has(rangeKey)) {
      return;
    }

    loadedCalendarRanges.current.add(rangeKey);

    getDailyPracticeStats(range.startDate, range.endDate)
      .then((days) => {
        setCalendarDays((currentDays) => mergeDailyPracticeStats(currentDays, days));
      })
      .catch(() => {
        loadedCalendarRanges.current.delete(rangeKey);
      });
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      scrollEnabled={isScrollEnabled}
    >
      <SectionCard title={t('stats.title')} subtitle={t('stats.subtitle')}>
        {!isLoading && summary ? (
          <View style={styles.metricGrid}>
            <MetricCard
              label={t('stats.totalAnswers')}
              value={formatNumber(summary.overview.totalAnswers)}
            />
            <MetricCard
              label={t('common.correctRate')}
              value={formatPercent(getOverviewAccuracyRate(summary.overview))}
            />
            <MetricCard
              label={t('common.coverageRate')}
              value={formatPercent(getCoverageRate(summary.overview))}
            />
            <MetricCard
              label={t('common.unresolved')}
              value={formatNumber(summary.overview.unresolvedWrongCount)}
            />
          </View>
        ) : (
          <ActivityIndicator color="#2563eb" />
        )}
      </SectionCard>

      {!isLoading && summary ? (
        <>
          <SectionCard title={t('stats.calendarTitle')} subtitle={t('stats.calendarSubtitle')}>
            <View style={styles.stack}>
              <CalendarView
                selectedDate={calendarSelectedDate}
                eventMap={calendarEventMap}
                onDatePress={setSelectedCalendarDate}
                onSelectedDateChange={setSelectedCalendarDate}
                onVisibleRangeChange={handleCalendarVisibleRangeChange}
                onGestureStart={() => setIsScrollEnabled(false)}
                onGestureEnd={() => setIsScrollEnabled(true)}
              />
              <CalendarDaySummary dateKey={calendarSelectedDate} day={selectedDailyStat} />
            </View>
          </SectionCard>

          <SectionCard
            title={t('stats.recentSevenDaysTitle')}
            subtitle={t('stats.recentSevenDaysSubtitle')}
          >
            <View style={styles.stack}>
              {summary.recentSevenDays.map((day) => (
                <DailyRow key={day.dateKey} day={day} />
              ))}
            </View>
          </SectionCard>

          <SectionCard
            title={t('stats.recentSessionsTitle')}
            subtitle={t('stats.recentSessionsSubtitle')}
          >
            <View style={styles.stack}>
              {summary.recentSessions.length > 0 ? (
                summary.recentSessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))
              ) : (
                <Text style={styles.text}>{t('stats.recentSessionsEmpty')}</Text>
              )}
            </View>
          </SectionCard>

          <SectionCard
            title={t('stats.subjectProgressTitle')}
            subtitle={t('stats.subjectProgressSubtitle')}
          >
            <View style={styles.stack}>
              {summary.subjectProgress.map((subject) => (
                <ProgressRow
                  key={subject.subjectId}
                  title={subject.subjectName}
                  subtitle={t('stats.subjectProgressMeta', {
                    answered: formatNumber(subject.answeredQuestions),
                    total: formatNumber(subject.totalQuestions),
                    unresolved: formatNumber(subject.unresolvedWrongCount),
                  })}
                  completionRate={subject.completionRate}
                  accuracyRate={subject.accuracyRate}
                />
              ))}
            </View>
          </SectionCard>

          <SectionCard
            title={t('stats.topicProgressTitle')}
            subtitle={t('stats.topicProgressSubtitle')}
          >
            <View style={styles.stack}>
              {summary.topicProgress.length > 0 ? (
                summary.topicProgress.map((topic) => (
                  <ProgressRow
                    key={topic.topicId}
                    title={topic.topicName}
                    subtitle={t('stats.topicProgressMeta', {
                      subjectName: topic.subjectName,
                      answered: formatNumber(topic.answeredQuestions),
                      total: formatNumber(topic.totalQuestions),
                    })}
                    completionRate={topic.completionRate}
                    accuracyRate={topic.accuracyRate}
                  />
                ))
              ) : (
                <Text style={styles.text}>{t('stats.topicProgressEmpty')}</Text>
              )}
            </View>
          </SectionCard>
        </>
      ) : null}
    </ScrollView>
  );
}

function CalendarDaySummary({
  dateKey,
  day,
}: {
  dateKey: string | undefined;
  day: DailyPracticeStat | undefined;
}) {
  const { t } = useTranslation();

  if (!dateKey) {
    return <Text style={styles.text}>{t('stats.calendarSelectedEmpty')}</Text>;
  }

  const accuracyRate =
    day && day.answerCount > 0 ? Math.round((day.correctCount / day.answerCount) * 100) : 0;

  return (
    <View style={styles.calendarSummaryCard}>
      <Text style={styles.rowTitle}>
        {formatDate(`${dateKey}T00:00:00Z`, { month: '2-digit', day: '2-digit' })}
      </Text>
      {day && day.answerCount > 0 ? (
        <>
          <Text style={styles.rowSubtitle}>
            {t('stats.calendarSelectedSummary', {
              answerCount: formatNumber(day.answerCount),
              correctCount: formatNumber(day.correctCount),
            })}
          </Text>
          <Text style={styles.calendarSummaryValue}>
            {t('stats.calendarAccuracy', { value: formatPercent(accuracyRate) })}
          </Text>
        </>
      ) : (
        <Text style={styles.rowSubtitle}>{t('stats.calendarSelectedEmpty')}</Text>
      )}
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function buildLearningCalendarEventMap(days: DailyPracticeStat[]): CalendarEventMap {
  return days.reduce<CalendarEventMap>((eventMap, day) => {
    if (day.answerCount === 0) {
      return eventMap;
    }

    const accuracyRate = Math.round((day.correctCount / day.answerCount) * 100);

    eventMap[day.dateKey] = [
      {
        id: `practice-${day.dateKey}`,
        status: getPracticeStatus(accuracyRate),
        count: day.answerCount,
      },
    ];

    return eventMap;
  }, {});
}

function mergeDailyPracticeStats(
  currentDays: DailyPracticeStat[],
  incomingDays: DailyPracticeStat[],
) {
  const dayMap = new Map(currentDays.map((day) => [day.dateKey, day]));

  incomingDays.forEach((day) => {
    dayMap.set(day.dateKey, day);
  });

  return [...dayMap.values()].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function getPracticeStatus(accuracyRate: number) {
  if (accuracyRate >= 80) {
    return 'success';
  }

  if (accuracyRate >= 50) {
    return 'warning';
  }

  return 'danger';
}

function DailyRow({ day }: { day: DailyPracticeStat }) {
  const { t } = useTranslation();

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>
          {formatDate(`${day.dateKey}T00:00:00Z`, { month: '2-digit', day: '2-digit' })}
        </Text>
        <Text style={styles.rowSubtitle}>
          {t('stats.dailyRow', {
            answerCount: formatNumber(day.answerCount),
            correctCount: formatNumber(day.correctCount),
          })}
        </Text>
      </View>
      <Text style={styles.rowValue}>
        {day.answerCount > 0
          ? formatPercent(Math.round((day.correctCount / day.answerCount) * 100))
          : formatPercent(0)}
      </Text>
    </View>
  );
}

function SessionRow({ session }: { session: PracticeSessionSummary }) {
  const { t } = useTranslation();

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{session.scopeTitle}</Text>
        <Text style={styles.rowSubtitle}>
          {t('stats.sessionSummary', {
            subjectName: session.subjectName,
            correctCount: formatNumber(session.correctCount),
            questionCount: formatNumber(session.questionCount),
          })}
        </Text>
      </View>
      <Text style={styles.rowValue}>
        {session.finishedAt ? t('common.completed') : t('common.inProgress')}
      </Text>
    </View>
  );
}

function ProgressRow({
  title,
  subtitle,
  completionRate,
  accuracyRate,
}: {
  title: string;
  subtitle: string;
  completionRate: number;
  accuracyRate: number;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.progressCard}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
      <View style={styles.progressMetaRow}>
        <Text style={styles.progressMetaLabel}>
          {t('stats.completionRate', { value: formatPercent(completionRate) })}
        </Text>
        <Text style={styles.progressMetaLabel}>
          {t('stats.accuracyRate', { value: formatPercent(accuracyRate) })}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
      </View>
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
  stack: {
    gap: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    padding: 16,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rowSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  calendarSummaryCard: {
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  calendarSummaryValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  progressCard: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressMetaLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
});
