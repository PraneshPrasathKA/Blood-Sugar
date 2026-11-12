'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: () => reportsApi.daily(date),
    enabled: Boolean(date),
  });
}

export function useMonthToDateReport(date: string) {
  return useQuery({
    queryKey: ['reports', 'month-to-date', date],
    queryFn: () => reportsApi.monthToDate(date),
    enabled: Boolean(date),
  });
}

export function useMonthlyReport(date: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', date],
    queryFn: () => reportsApi.monthly(date),
    enabled: Boolean(date),
  });
}

