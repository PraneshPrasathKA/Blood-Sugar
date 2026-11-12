export type TimeSlot =
  | 'MORNING_FASTING'
  | 'AFTER_BREAKFAST'
  | 'AFTER_LUNCH'
  | 'AFTER_DINNER';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Reading {
  id: string;
  user_id: string;
  reading_date: string;
  time_slot: TimeSlot;
  glucose_value: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

export interface DailyReport {
  type: 'daily';
  selectedDate: string;
  range: { startDate: string; endDate: string };
  summary: ReportSummary;
  readings: Reading[];
}

export interface RangeReport {
  type: 'month-to-date' | 'monthly';
  selectedDate: string;
  range: { startDate: string; endDate: string };
  summary: ReportSummary;
  dailySeries: DailySeriesPoint[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

