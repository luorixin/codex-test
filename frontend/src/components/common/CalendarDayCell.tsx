import { StyleSheet, Text, View } from 'react-native';

import type { CalendarDateCell } from '@/src/components/common/CalendarView';
import { getEventStatusColor } from '@/src/utils/calendarDateUtils';

export function CalendarDayCell({ cell }: { cell: CalendarDateCell }) {
  return (
    <View style={styles.content}>
      <Text
        style={[
          styles.dayNumber,
          cell.isOutsideMonth && styles.outsideMonthText,
          cell.isToday && styles.todayText,
          cell.isSelected && styles.selectedText,
        ]}
      >
        {cell.day}
      </Text>
      <View style={styles.dotRow}>
        {cell.events.slice(0, 3).map((event, index) => (
          <View
            key={event.id ?? `${cell.dateKey}-${index}`}
            style={[
              styles.dot,
              { backgroundColor: event.color ?? getEventStatusColor(event.status) },
            ]}
          />
        ))}
        {cell.events.length > 3 ? (
          <Text style={[styles.overflowText, cell.isSelected && styles.selectedText]}>
            +{cell.events.length - 3}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  outsideMonthText: {
    color: '#94a3b8',
  },
  todayText: {
    color: '#2563eb',
  },
  selectedText: {
    color: '#ffffff',
  },
  dotRow: {
    minHeight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  overflowText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
});
