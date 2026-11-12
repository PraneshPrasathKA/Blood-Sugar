export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDisplayDate(startDate);
  }
  const [startYear] = startDate.split('-');
  const [endYear] = endDate.split('-');
  if (startYear === endYear) {
    return `${formatShortDate(startDate)} – ${formatDisplayDate(endDate)}`;
  }
  return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
}

export function getDaysInMonth(dateStr: string): number {
  const [year, month] = dateStr.split('-').map(Number);
  if (!year || !month) return 30;
  return new Date(year, month, 0).getDate();
}

export function isCompletedMonthRange(
  startDate: string,
  endDate: string
): boolean {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  if (
    !startYear ||
    !startMonth ||
    !startDay ||
    !endYear ||
    !endMonth ||
    !endDay
  ) {
    return false;
  }

  const sameMonth = startYear === endYear && startMonth === endMonth;
  const startsOnFirst = startDay === 1;
  const endsOnLastDay = endDay === new Date(endYear, endMonth, 0).getDate();
  const isPastMonthEnd = endDate < getTodayDateString();

  return sameMonth && startsOnFirst && endsOnLastDay && isPastMonthEnd;
}
