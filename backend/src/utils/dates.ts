export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isFutureDate(dateStr: string, todayStr = getTodayDateString()): boolean {
  return dateStr > todayStr;
}

export function getMonthToDateRange(dateStr: string): {
  startDate: string;
  endDate: string;
} {
  const [yearStr, monthStr] = dateStr.split('-');
  return {
    startDate: `${yearStr}-${monthStr}-01`,
    endDate: dateStr,
  };
}

export function getPreviousMonthRange(dateStr: string): {
  startDate: string;
  endDate: string;
} {
  const [yearStr, monthStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  // Day 0 of `prevMonth` (1-indexed) in Date.UTC(prevYear, prevMonth, 0) gives the last day of prevMonth
  const lastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();

  const mm = String(prevMonth).padStart(2, '0');
  const dd = String(lastDay).padStart(2, '0');

  return {
    startDate: `${prevYear}-${mm}-01`,
    endDate: `${prevYear}-${mm}-${dd}`,
  };
}

