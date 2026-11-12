import { pool } from '../../config/database';
import { ReadingRecord } from '../readings/readings.types';

export interface ReportSummary {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
}

export interface DailySeriesPoint {
  reading_date: string;
  average: number;
  highest: number;
  lowest: number;
  count: number;
}

const SLOT_ORDER_SQL = `
  CASE time_slot
    WHEN 'MORNING_FASTING' THEN 1
    WHEN 'AFTER_BREAKFAST' THEN 2
    WHEN 'AFTER_LUNCH' THEN 3
    WHEN 'AFTER_DINNER' THEN 4
  END
`;

export const reportsRepository = {
  async getSummaryForRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ReportSummary> {
    const result = await pool.query<ReportSummary>(
      `SELECT
         COUNT(*)::int AS count,
         MAX(glucose_value)::int AS highest,
         MIN(glucose_value)::int AS lowest,
         CASE
           WHEN COUNT(*) > 0 THEN ROUND(AVG(glucose_value)::numeric, 1)::float
           ELSE NULL
         END AS average
       FROM readings
       WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date <= $3`,
      [userId, startDate, endDate]
    );

    return (
      result.rows[0] ?? {
        count: 0,
        highest: null,
        lowest: null,
        average: null,
      }
    );
  },

  async getReadingsForDate(
    userId: string,
    readingDate: string
  ): Promise<ReadingRecord[]> {
    const result = await pool.query<ReadingRecord>(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY ${SLOT_ORDER_SQL} ASC`,
      [userId, readingDate]
    );
    return result.rows;
  },

  async getDailySeriesForRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailySeriesPoint[]> {
    const result = await pool.query<DailySeriesPoint>(
      `SELECT
         reading_date,
         ROUND(AVG(glucose_value)::numeric, 1)::float AS average,
         MAX(glucose_value)::int AS highest,
         MIN(glucose_value)::int AS lowest,
         COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date <= $3
       GROUP BY reading_date
       ORDER BY reading_date ASC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  },
};

