/**
 * Centralized API Client for AgentHub Frontend -> Laravel Backend
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

import { InternalUser, UniversityDetails, ApiWorkspace } from '../types';

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: (() => Promise<string | null>) | null) {
  tokenGetter = getter;
}

async function getAuthToken(): Promise<string | null> {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) return token;
    } catch {
      // Fall through to window.Clerk
    }
  }

  // Fallback to globally attached Clerk session
  if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
    try {
      const token = await (window as any).Clerk.session.getToken();
      if (token) return token;
    } catch {
      // Fall through
    }
  }

  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response
    }
    throw new ApiError(
      errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  // If response is 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // Get current internal authenticated user profile & permissions
  getMe: () => request<{ user: InternalUser }>('/me'),

  // Health check helper to verify connection with Laravel backend
  checkHealth: () => request<{ status: string; app: string; timestamp: string }>('/health'),

  // University Endpoints
  getUniversity: () => request<{ university: UniversityDetails }>('/university'),
  updateUniversity: (data: {
    name?: string;
    code?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    website?: string | null;
  }) => request<{ message: string; university: UniversityDetails }>('/university', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Workspace Endpoints
  getWorkspaces: () => request<{ workspaces: ApiWorkspace[] }>('/workspaces'),
  getWorkspace: (id: string | number) => request<{ workspace: ApiWorkspace }>(`/workspaces/${id}`),
  createWorkspace: (data: {
    name: string;
    description?: string | null;
    status?: string;
  }) => request<{ message: string; workspace: ApiWorkspace }>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateWorkspace: (id: string | number, data: {
    name?: string;
    description?: string | null;
    status?: string;
  }) => request<{ message: string; workspace: ApiWorkspace }>(`/workspaces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
