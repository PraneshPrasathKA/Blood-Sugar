import {
  getMonthToDateRange,
  getPreviousMonthRange,
} from '../../utils/dates';
import { reportsRepository } from './reports.repository';

export const reportsService = {
  async getDailyReport(userId: string, date: string) {
    const [summary, readings] = await Promise.all([
      reportsRepository.getSummaryForRange(userId, date, date),
      reportsRepository.getReadingsForDate(userId, date),
    ]);

    return {
      type: 'daily' as const,
      selectedDate: date,
      range: {
        startDate: date,
        endDate: date,
      },
      summary,
      readings,
    };
  },

  async getMonthToDateReport(userId: string, date: string) {
    const { startDate, endDate } = getMonthToDateRange(date);
    const [summary, dailySeries] = await Promise.all([
      reportsRepository.getSummaryForRange(userId, startDate, endDate),
      reportsRepository.getDailySeriesForRange(userId, startDate, endDate),
    ]);

    return {
      type: 'month-to-date' as const,
      selectedDate: date,
      range: {
        startDate,
        endDate,
      },
      summary,
      dailySeries,
    };
  },

  async getMonthlyReport(userId: string, date: string) {
    const { startDate, endDate } = getPreviousMonthRange(date);
    const [summary, dailySeries] = await Promise.all([
      reportsRepository.getSummaryForRange(userId, startDate, endDate),
      reportsRepository.getDailySeriesForRange(userId, startDate, endDate),
    ]);

    return {
      type: 'monthly' as const,
      selectedDate: date,
      range: {
        startDate,
        endDate,
      },
      summary,
      dailySeries,
    };
  },
};

