import {
  getMonthToDateRange,
  getPreviousMonthRange,
  isFutureDate,
  isValidDateString,
} from '../src/utils/dates';

describe('Date utility calculations', () => {
  it('validates real calendar dates and rejects invalid ones', () => {
    expect(isValidDateString('2026-10-15')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true); // Leap year
    expect(isValidDateString('2026-02-29')).toBe(false); // Non-leap year
    expect(isValidDateString('2026-04-31')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('15-10-2026')).toBe(false);
  });

  it('detects future dates relative to today', () => {
    expect(isFutureDate('2026-11-13', '2026-11-12')).toBe(true);
    expect(isFutureDate('2026-11-12', '2026-11-12')).toBe(false);
    expect(isFutureDate('2026-11-11', '2026-11-12')).toBe(false);
  });

  it('calculates month-to-date range accurately', () => {
    expect(getMonthToDateRange('2026-10-15')).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-15',
    });
    expect(getMonthToDateRange('2026-03-01')).toEqual({
      startDate: '2026-03-01',
      endDate: '2026-03-01',
    });
  });

  it('calculates previous calendar month across standard, leap year, and year boundaries', () => {
    expect(getPreviousMonthRange('2026-10-15')).toEqual({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    });
    // Year boundary: January -> December of previous year
    expect(getPreviousMonthRange('2026-01-10')).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
    // Leap year: March 2024 -> Feb 1..29
    expect(getPreviousMonthRange('2024-03-18')).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });
    // Non-leap year: March 2026 -> Feb 1..28
    expect(getPreviousMonthRange('2026-03-18')).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
  });
});

