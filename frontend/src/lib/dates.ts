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

