import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDayCell } from '@/src/components/common/CalendarDayCell';
import {
  addDays,
  addMonthsClamped,
  chunkCellsByWeek,
  formatCalendarTitle,
  getMonthCells,
  getPageAnchorDate,
  getPageViewportHeight,
  getTodayDateKey,
  getWeekCells,
  getWeekdayLabels,
  normalizeDateKey,
} from '@/src/utils/calendarDateUtils';

export type CalendarMode = 'week' | 'month';
export type CalendarDateKey = string;

export type CalendarEventStatus = 'default' | 'success' | 'warning' | 'danger' | 'info' | string;

export type CalendarEventItem = {
  id?: string;
  status?: CalendarEventStatus;
  label?: string;
  count?: number;
  color?: string;
};

export type CalendarEventMap = Record<CalendarDateKey, CalendarEventItem[]>;

export type CalendarChangeReason = 'press' | 'swipe-week' | 'swipe-month' | 'expand' | 'collapse';

export type CalendarDateCell = {
  dateKey: CalendarDateKey;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isOutsideMonth: boolean;
  events: CalendarEventItem[];
  statuses: CalendarEventStatus[];
};

export type CalendarViewProps = {
  selectedDate?: CalendarDateKey;
  defaultSelectedDate?: CalendarDateKey;

  mode?: CalendarMode;
  defaultMode?: CalendarMode;

  eventMap?: CalendarEventMap;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  weekdayLabels?: string[];
  titleFormatter?: (year: number, month: number) => string;

  onDatePress?: (dateKey: CalendarDateKey, cell: CalendarDateCell) => void;
  onSelectedDateChange?: (
    dateKey: CalendarDateKey,
    context: { reason: CalendarChangeReason; previousDate: CalendarDateKey },
  ) => void;
  onModeChange?: (
    mode: CalendarMode,
    context: { reason: 'expand' | 'collapse'; selectedDate: CalendarDateKey },
  ) => void;
  onVisibleRangeChange?: (range: {
    startDate: CalendarDateKey;
    endDate: CalendarDateKey;
    mode: CalendarMode;
  }) => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;

  renderDay?: (cell: CalendarDateCell) => React.ReactNode;
  disabledDate?: (dateKey: CalendarDateKey) => boolean;
  style?: ViewStyle;
};

type VisibleRange = {
  startDate: CalendarDateKey;
  endDate: CalendarDateKey;
  mode: CalendarMode;
};

type CalendarPage = {
  offset: -1 | 0 | 1;
  anchorDate: CalendarDateKey;
  cells: CalendarDateCell[];
};

const DEFAULT_WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DEFAULT_WEEK_STARTS_ON = 1 as const;
const SWIPE_THRESHOLD = 40;
const GESTURE_LOCK_THRESHOLD = 12;
const WEEK_VIEWPORT_HEIGHT = 58;
const MONTH_ROW_HEIGHT = 52;
const PAGE_OFFSETS: readonly (-1 | 0 | 1)[] = [-1, 0, 1];
const ANIM_DURATION = 180;

export function CalendarView({
  selectedDate,
  defaultSelectedDate,
  mode,
  defaultMode = 'week',
  eventMap = {},
  weekStartsOn = DEFAULT_WEEK_STARTS_ON,
  weekdayLabels = DEFAULT_WEEKDAY_LABELS,
  titleFormatter,
  onDatePress,
  onSelectedDateChange,
  onModeChange,
  onVisibleRangeChange,
  onGestureStart,
  onGestureEnd,
  renderDay,
  disabledDate,
  style,
}: CalendarViewProps) {
  const initialSelected = normalizeDateKey(defaultSelectedDate);
  const [internalSelectedDate, setInternalSelectedDate] = useState(initialSelected);
  const [pageAnchorDate, setPageAnchorDate] = useState(initialSelected);
  const [internalMode, setInternalMode] = useState<CalendarMode>(defaultMode);
  const [pageWidth, setPageWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pendingSelectedDate = useRef<CalendarDateKey | null>(null);
  const gestureAxis = useRef<'horizontal' | 'vertical' | null>(null);

  const pageWidthRef = useRef(pageWidth);
  pageWidthRef.current = pageWidth;
  const resolvedModeRef = useRef(internalMode);

  const lastVisibleRangeRef = useRef<string>('');

  const resolvedSelectedDate = normalizeDateKey(selectedDate ?? internalSelectedDate);
  const resolvedMode = mode ?? internalMode;
  resolvedModeRef.current = resolvedMode;
  const isSelectedDateControlled = selectedDate !== undefined;
  const isModeControlled = mode !== undefined;
  const normalizedPageAnchorDate = normalizeDateKey(pageAnchorDate);

  const todayKey = useMemo(() => getTodayDateKey(), []);
  const onGestureStartRef = useRef(onGestureStart);
  onGestureStartRef.current = onGestureStart;
  const onGestureEndRef = useRef(onGestureEnd);
  onGestureEndRef.current = onGestureEnd;

  const pages = useMemo<CalendarPage[]>(() => {
    return PAGE_OFFSETS.map((offset) => {
      const anchorDate = getPageAnchorDate(resolvedMode, normalizedPageAnchorDate, offset);
      const cells =
        resolvedMode === 'week'
          ? getWeekCells(anchorDate, weekStartsOn, eventMap, todayKey)
          : getMonthCells(anchorDate, weekStartsOn, eventMap, todayKey);

      return { offset, anchorDate, cells };
    });
  }, [eventMap, normalizedPageAnchorDate, resolvedMode, weekStartsOn, todayKey]);

  const visibleRange = useMemo<VisibleRange>(() => {
    const firstCell = pages[0]?.cells[0];
    const lastPage = pages[pages.length - 1];
    const lastCell = lastPage?.cells[lastPage.cells.length - 1];

    return {
      startDate: firstCell?.dateKey ?? resolvedSelectedDate,
      endDate: lastCell?.dateKey ?? resolvedSelectedDate,
      mode: resolvedMode,
    };
  }, [pages, resolvedMode, resolvedSelectedDate]);

  const viewportHeight = useMemo(() => {
    return Math.max(
      ...pages.map((page) =>
        getPageViewportHeight(
          resolvedMode,
          page.cells.length,
          WEEK_VIEWPORT_HEIGHT,
          MONTH_ROW_HEIGHT,
        ),
      ),
    );
  }, [pages, resolvedMode]);
  const viewportHeightAnim = useRef(new Animated.Value(viewportHeight)).current;

  useEffect(() => {
    const key = `${visibleRange.startDate}|${visibleRange.endDate}|${visibleRange.mode}`;

    if (key !== lastVisibleRangeRef.current) {
      lastVisibleRangeRef.current = key;
      onVisibleRangeChange?.(visibleRange);
    }
  }, [onVisibleRangeChange, visibleRange]);

  useEffect(() => {
    if (pendingSelectedDate.current) {
      if (resolvedSelectedDate === pendingSelectedDate.current) {
        pendingSelectedDate.current = null;
      }
      return;
    }

    if (resolvedSelectedDate !== normalizedPageAnchorDate && gestureAxis.current === null) {
      setPageAnchorDate(resolvedSelectedDate);
    }
  }, [normalizedPageAnchorDate, resolvedSelectedDate]);

  useEffect(() => {
    Animated.timing(viewportHeightAnim, {
      toValue: viewportHeight,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start();
  }, [viewportHeight, viewportHeightAnim]);

  useEffect(() => {
    if (pageWidth > 0) {
      translateX.setValue(-pageWidth);
    }
  }, [normalizedPageAnchorDate, pageWidth, resolvedMode, translateX]);

  const updateSelectedDate = useCallback(
    (nextDate: CalendarDateKey, reason: CalendarChangeReason) => {
      if (nextDate === resolvedSelectedDate) return;

      if (!isSelectedDateControlled) {
        setInternalSelectedDate(nextDate);
      }

      onSelectedDateChange?.(nextDate, {
        reason,
        previousDate: resolvedSelectedDate,
      });
    },
    [isSelectedDateControlled, onSelectedDateChange, resolvedSelectedDate],
  );

  const updateMode = useCallback(
    (nextMode: CalendarMode, reason: 'expand' | 'collapse') => {
      if (nextMode === resolvedMode) return;

      if (!isModeControlled) {
        setInternalMode(nextMode);
      }

      onModeChange?.(nextMode, {
        reason,
        selectedDate: resolvedSelectedDate,
      });
    },
    [isModeControlled, onModeChange, resolvedMode, resolvedSelectedDate],
  );

  const commitHorizontalSwipe = useCallback(
    (direction: -1 | 1) => {
      const nextDate =
        resolvedMode === 'week'
          ? addDays(resolvedSelectedDate, direction * 7)
          : addMonthsClamped(resolvedSelectedDate, direction);
      const reason: CalendarChangeReason = resolvedMode === 'week' ? 'swipe-week' : 'swipe-month';

      pendingSelectedDate.current = nextDate;
      setPageAnchorDate(nextDate);
      updateSelectedDate(nextDate, reason);
    },
    [resolvedMode, resolvedSelectedDate, updateSelectedDate],
  );

  const animateToPage = useCallback(
    (toValue: number, onComplete?: () => void) => {
      Animated.timing(translateX, {
        toValue,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onComplete?.();
        }
      });
    },
    [translateX],
  );

  const settleHorizontalSwipe = useCallback(
    (dx: number) => {
      const currentPageWidth = pageWidthRef.current;

      if (currentPageWidth <= 0) {
        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
          commitHorizontalSwipe(dx < 0 ? 1 : -1);
        }
        return;
      }

      if (Math.abs(dx) < SWIPE_THRESHOLD) {
        animateToPage(-currentPageWidth);
        return;
      }

      const direction: -1 | 1 = dx < 0 ? 1 : -1;
      animateToPage(direction === 1 ? -currentPageWidth * 2 : 0, () => {
        commitHorizontalSwipe(direction);
      });
    },
    [animateToPage, commitHorizontalSwipe],
  );

  const handleVerticalSwipe = useCallback(
    (_dx: number, dy: number) => {
      const absDx = Math.abs(_dx);
      const absDy = Math.abs(dy);

      if (absDy > absDx && absDy >= SWIPE_THRESHOLD) {
        if (resolvedModeRef.current === 'week' && dy > 0) {
          updateMode('month', 'expand');
          return;
        }

        if (resolvedModeRef.current === 'month' && dy < 0) {
          updateMode('week', 'collapse');
        }
      }
    },
    [updateMode],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onPanResponderGrant: () => {
          onGestureStartRef.current?.();
        },
        onMoveShouldSetPanResponderCapture: (_, gs) => {
          const absDx = Math.abs(gs.dx);
          const absDy = Math.abs(gs.dy);

          if (Math.max(absDx, absDy) < GESTURE_LOCK_THRESHOLD) return false;

          if (absDx > absDy) {
            gestureAxis.current = 'horizontal';
            return true;
          }

          const currentMode = resolvedModeRef.current;

          if ((currentMode === 'week' && gs.dy > 0) || (currentMode === 'month' && gs.dy < 0)) {
            gestureAxis.current = 'vertical';
            return true;
          }

          return false;
        },
        onMoveShouldSetPanResponder: (_, gs) => {
          const absDx = Math.abs(gs.dx);
          const absDy = Math.abs(gs.dy);

          if (Math.max(absDx, absDy) < GESTURE_LOCK_THRESHOLD) return false;

          if (absDx > absDy) {
            gestureAxis.current = 'horizontal';
            return true;
          }

          const currentMode = resolvedModeRef.current;

          if ((currentMode === 'week' && gs.dy > 0) || (currentMode === 'month' && gs.dy < 0)) {
            gestureAxis.current = 'vertical';
            return true;
          }

          return false;
        },
        onPanResponderMove: (_, gs) => {
          if (gestureAxis.current === 'horizontal') {
            const w = pageWidthRef.current;

            if (w > 0) {
              translateX.setValue(-w + gs.dx);
            }
          }
        },
        onPanResponderRelease: (_, gs) => {
          if (gestureAxis.current === 'horizontal') {
            settleHorizontalSwipe(gs.dx);
          } else if (gestureAxis.current === 'vertical') {
            handleVerticalSwipe(gs.dx, gs.dy);
          }
          gestureAxis.current = null;
          onGestureEndRef.current?.();
        },
        onPanResponderTerminate: (_, gs) => {
          if (gestureAxis.current === 'horizontal') {
            settleHorizontalSwipe(gs.dx);
          } else if (gestureAxis.current === 'vertical') {
            handleVerticalSwipe(gs.dx, gs.dy);
          }
          gestureAxis.current = null;
          onGestureEndRef.current?.();
        },
      }),
    [settleHorizontalSwipe, handleVerticalSwipe, translateX],
  );

  const handleDatePress = useCallback(
    (cell: CalendarDateCell) => {
      if (disabledDate?.(cell.dateKey)) return;

      pendingSelectedDate.current = cell.dateKey;
      setPageAnchorDate(cell.dateKey);
      updateSelectedDate(cell.dateKey, 'press');
      onDatePress?.(cell.dateKey, cell);
    },
    [disabledDate, onDatePress, updateSelectedDate],
  );

  const title = formatCalendarTitle(normalizedPageAnchorDate, titleFormatter);
  const weekdayCells = getWeekdayLabels(weekStartsOn, weekdayLabels);

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth > 0 && nextWidth !== pageWidth) {
      setPageWidth(nextWidth);
      translateX.setValue(-nextWidth);
    }
  }

  return (
    <View
      style={[styles.container, style]}
      onTouchStart={onGestureStart}
      accessibilityRole="tablist"
      accessibilityLabel="Calendar"
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayCells.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <Animated.View
        style={[styles.viewport, { height: viewportHeightAnim }]}
        onLayout={handleLayout}
      >
        <Animated.View
          style={[
            styles.pageTrack,
            pageWidth > 0 ? { width: pageWidth * 3, transform: [{ translateX }] } : undefined,
          ]}
        >
          {pages.map((page) => (
            <View
              key={page.offset}
              style={[styles.page, pageWidth > 0 ? { width: pageWidth } : undefined]}
            >
              <View style={styles.pageGrid}>
                {chunkCellsByWeek(page.cells).map((rowCells) => (
                  <View
                    key={rowCells[0]?.dateKey}
                    style={resolvedMode === 'week' ? styles.weekGridRow : styles.monthGridRow}
                  >
                    {rowCells.map((cell) => {
                      const isDisabled = disabledDate?.(cell.dateKey) ?? false;

                      return (
                        <Pressable
                          key={cell.dateKey}
                          onPress={() => handleDatePress(cell)}
                          disabled={isDisabled}
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel={`${cell.day}日`}
                          accessibilityState={{
                            selected: cell.isSelected,
                            disabled: isDisabled,
                          }}
                          style={({ pressed }) => [
                            styles.dayCell,
                            resolvedMode === 'week' ? styles.weekDayCell : styles.monthDayCell,
                            cell.isOutsideMonth && styles.outsideMonthCell,
                            cell.isToday && styles.todayCell,
                            cell.isSelected && styles.selectedCell,
                            isDisabled && styles.disabledCell,
                            pressed && !isDisabled && styles.pressedCell,
                          ]}
                        >
                          {renderDay ? renderDay(cell) : <CalendarDayCell cell={cell} />}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export {
  normalizeDateKey,
  getTodayDateKey,
  parseDateKey,
  toDateKey,
  addDays,
} from '@/src/utils/calendarDateUtils';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  weekdayRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  viewport: {
    overflow: 'hidden',
  },
  pageTrack: {
    flexDirection: 'row',
  },
  page: {
    flexShrink: 0,
  },
  pageGrid: {
    gap: 4,
  },
  weekGridRow: {
    height: WEEK_VIEWPORT_HEIGHT,
    flexDirection: 'row',
  },
  monthGridRow: {
    height: MONTH_ROW_HEIGHT - 4,
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  weekDayCell: {
    height: WEEK_VIEWPORT_HEIGHT,
  },
  monthDayCell: {
    height: MONTH_ROW_HEIGHT - 4,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  selectedCell: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  outsideMonthCell: {
    opacity: 0.46,
  },
  disabledCell: {
    opacity: 0.28,
  },
  pressedCell: {
    backgroundColor: '#e0f2fe',
  },
});
