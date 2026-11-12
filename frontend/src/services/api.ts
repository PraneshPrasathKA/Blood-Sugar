import {
  ApiSuccessResponse,
  DailyReport,
  PaginationMeta,
  RangeReport,
  Reading,
  TimeSlot,
  User,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const TOKEN_STORAGE_KEY = 'sweety_access_token';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message || 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status, payload?.errors);
  }

  return (payload as ApiSuccessResponse<T>).data;
}

export const authApi = {
  register(input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }) {
    return apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  logout() {
    return apiRequest<undefined>('/auth/logout', { method: 'POST' });
  },

  me() {
    return apiRequest<{ user: User }>('/auth/me');
  },
};

export const readingsApi = {
  list(params: {
    page?: number;
    limit?: number;
    date?: string;
    from?: string;
    to?: string;
  } = {}) {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.date) search.set('date', params.date);
    if (params.from) search.set('from', params.from);
    if (params.to) search.set('to', params.to);
    const qs = search.toString();
    return apiRequest<{ readings: Reading[]; pagination: PaginationMeta }>(
      `/readings${qs ? `?${qs}` : ''}`
    );
  },

  create(input: {
    reading_date: string;
    time_slot: TimeSlot;
    glucose_value: number;
  }) {
    return apiRequest<{ reading: Reading }>('/readings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(
    id: string,
    input: {
      reading_date?: string;
      time_slot?: TimeSlot;
      glucose_value?: number;
    }
  ) {
    return apiRequest<{ reading: Reading }>(`/readings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  remove(id: string) {
    return apiRequest<undefined>(`/readings/${id}`, {
      method: 'DELETE',
    });
  },
};

export const reportsApi = {
  daily(date: string) {
    return apiRequest<DailyReport>(
      `/reports/daily?date=${encodeURIComponent(date)}`
    );
  },

  monthToDate(date: string) {
    return apiRequest<RangeReport>(
      `/reports/month-to-date?date=${encodeURIComponent(date)}`
    );
  },

  monthly(date: string) {
    return apiRequest<RangeReport>(
      `/reports/monthly?date=${encodeURIComponent(date)}`
    );
  },
};

