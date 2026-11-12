'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readingsApi } from '@/services/api';
import { TimeSlot } from '@/types';

export const READING_KEYS = {
  all: ['readings'] as const,
  list: (params: Record<string, unknown>) => ['readings', 'list', params] as const,
};

export function useReadings(params: {
  page?: number;
  limit?: number;
  date?: string;
  from?: string;
  to?: string;
} = {}) {
  return useQuery({
    queryKey: READING_KEYS.list(params),
    queryFn: () => readingsApi.list(params),
  });
}

export function useCreateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      reading_date: string;
      time_slot: TimeSlot;
      glucose_value: number;
    }) => readingsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        reading_date?: string;
        time_slot?: TimeSlot;
        glucose_value?: number;
      };
    }) => readingsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => readingsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

