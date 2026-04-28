import type {
  CalendarDateKey,
  CalendarEventMap,
  CalendarDateCell,
  CalendarMode,
} from '@/src/components/common/CalendarView';

export const emptyEventMap: CalendarEventMap = {};

export function isValidDateKey(dateKey: string | undefined): dateKey is CalendarDateKey {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const { year, monthIndex, day } = splitDateKey(dateKey);
  const date = new Date(year, monthIndex, day, 12, 0, 0, 0);

  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day;
}

export function normalizeDateKey(dateKey: string | undefined): CalendarDateKey {
  return isValidDateKey(dateKey) ? dateKey : getTodayDateKey();
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function parseDateKey(dateKey: CalendarDateKey) {
  const normalizedDateKey = normalizeDateKey(dateKey);
  const { year, monthIndex, day } = splitDateKey(normalizedDateKey);
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

export function toDateKey(date: Date): CalendarDateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: CalendarDateKey, days: number): CalendarDateKey {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function addMonthsClamped(dateKey: CalendarDateKey, delta: number): CalendarDateKey {
  const date = parseDateKey(dateKey);
  const targetFirstDay = new Date(date.getFullYear(), date.getMonth() + delta, 1, 12, 0, 0, 0);
  const targetDay = Math.min(
    date.getDate(),
    getDaysInMonth(targetFirstDay.getFullYear(), targetFirstDay.getMonth()),
  );

  return toDateKey(
    new Date(targetFirstDay.getFullYear(), targetFirstDay.getMonth(), targetDay, 12, 0, 0, 0),
  );
}

export function getPageAnchorDate(
  mode: CalendarMode,
  selectedDate: CalendarDateKey,
  offset: -1 | 0 | 1,
) {
  if (mode === 'week') {
    return addDays(selectedDate, offset * 7);
  }

  return addMonthsClamped(selectedDate, offset);
}

export function getWeekCells(
  selectedDate: CalendarDateKey,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  eventMap: CalendarEventMap,
  todayKey: CalendarDateKey,
) {
  const normalizedSelectedDate = normalizeDateKey(selectedDate);
  const weekStart = getWeekStart(normalizedSelectedDate, weekStartsOn);
  const monthDate = normalizedSelectedDate;

  return Array.from({ length: 7 }, (_, index) =>
    buildCell(addDays(weekStart, index), normalizedSelectedDate, monthDate, eventMap, todayKey),
  );
}

export function getMonthCells(
  selectedDate: CalendarDateKey,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  eventMap: CalendarEventMap,
  todayKey: CalendarDateKey,
) {
  const normalizedSelectedDate = normalizeDateKey(selectedDate);
  const selected = parseDateKey(normalizedSelectedDate);
  const firstOfMonth = toDateKey(new Date(selected.getFullYear(), selected.getMonth(), 1, 12));
  const lastOfMonth = toDateKey(new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 12));
  const gridStart = getWeekStart(firstOfMonth, weekStartsOn);
  const gridEnd = getWeekEnd(lastOfMonth, weekStartsOn);
  const days = getInclusiveDayDistance(gridStart, gridEnd) + 1;

  return Array.from({ length: days }, (_, index) =>
    buildCell(
      addDays(gridStart, index),
      normalizedSelectedDate,
      normalizedSelectedDate,
      eventMap,
      todayKey,
    ),
  );
}

export function buildCell(
  dateKey: CalendarDateKey,
  selectedDate: CalendarDateKey,
  monthDate: CalendarDateKey,
  eventMap: CalendarEventMap,
  todayKey: CalendarDateKey,
): CalendarDateCell {
  const normalizedDateKey = normalizeDateKey(dateKey);
  const date = parseDateKey(normalizedDateKey);
  const month = parseDateKey(monthDate);
  const events = eventMap[normalizedDateKey] ?? [];

  return {
    dateKey: normalizedDateKey,
    day: date.getDate(),
    isToday: normalizedDateKey === todayKey,
    isSelected: normalizedDateKey === normalizeDateKey(selectedDate),
    isCurrentMonth:
      date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(),
    isOutsideMonth:
      date.getFullYear() !== month.getFullYear() || date.getMonth() !== month.getMonth(),
    events,
    statuses: events.map((event) => event.status ?? 'default'),
  };
}

export function getWeekdayLabels(weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6, labels: string[]) {
  return Array.from({ length: 7 }, (_, index) => labels[(weekStartsOn + index) % 7]);
}

export function chunkCellsByWeek(cells: CalendarDateCell[]) {
  const rows: CalendarDateCell[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
}

export function getPageViewportHeight(
  mode: CalendarMode,
  cellCount: number,
  weekHeight: number,
  monthRowHeight: number,
) {
  if (mode === 'week') {
    return weekHeight;
  }

  return Math.ceil(cellCount / 7) * monthRowHeight;
}

export function getEventStatusColor(status: string = 'default') {
  switch (status) {
    case 'success':
      return '#16a34a';
    case 'warning':
      return '#f59e0b';
    case 'danger':
      return '#dc2626';
    case 'info':
      return '#2563eb';
    case 'default':
    default:
      return '#64748b';
  }
}

export function formatCalendarTitle(
  dateKey: CalendarDateKey,
  format?: (year: number, month: number) => string,
) {
  const date = parseDateKey(dateKey);
  const month = date.getMonth() + 1;

  if (format) {
    return format(date.getFullYear(), month);
  }

  return `${date.getFullYear()}年${String(month).padStart(2, '0')}月`;
}

function getWeekStart(
  dateKey: CalendarDateKey,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): CalendarDateKey {
  const date = parseDateKey(dateKey);
  const distance = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - distance);
  return toDateKey(date);
}

function getWeekEnd(
  dateKey: CalendarDateKey,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): CalendarDateKey {
  return addDays(getWeekStart(dateKey, weekStartsOn), 6);
}

function getInclusiveDayDistance(startDate: CalendarDateKey, endDate: CalendarDateKey) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / dayMs);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0, 12, 0, 0, 0).getDate();
}

function splitDateKey(dateKey: CalendarDateKey) {
  const [yearPart, monthPart, dayPart] = dateKey.split('-');

  return {
    year: Number(yearPart),
    monthIndex: Number(monthPart) - 1,
    day: Number(dayPart),
  };
}
