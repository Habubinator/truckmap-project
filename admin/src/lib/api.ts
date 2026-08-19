export const ENDPOINTS = {
  login: '/api/admin/login',
  logout: '/api/admin/logout',
  refresh: '/api/auth/refresh',
  users: '/api/admin/users',
  companies: '/api/admin/companies',
  points: '/api/admin/points',
  instructions: '/api/admin/point-instructions',
  questions: '/api/admin/questions',
  answers: '/api/admin/answers',
  reports: '/api/admin/reports',
  tariffs: '/api/admin/tariffs',
  chats: '/api/admin/chats',
  dashboardStats: '/api/admin/dashboard/stats',
  dashboardChart: '/api/admin/dashboard/chart',
  systemStatus: '/api/admin/system/status',
} as const;

type ApiEnvelope<T> = { success: boolean; data?: T; message?: string };

let accessToken = localStorage.getItem('accessToken');

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

async function parse<T>(res: Response): Promise<ApiEnvelope<T>> {
  return (await res.json()) as ApiEnvelope<T>;
}

async function refreshAccessToken(): Promise<boolean> {
  const res = await fetch(ENDPOINTS.refresh, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const body = await parse<{ accessToken: string }>(res);
  if (res.ok && body.success && body.data?.accessToken) {
    setAccessToken(body.data.accessToken);
    return true;
  }
  setAccessToken(null);
  localStorage.removeItem('userInfo');
  return false;
}

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: unknown,
): Promise<ApiEnvelope<T>> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken ?? ''}`,
    'Content-Type': 'application/json',
  };

  const init: RequestInit = { method, headers, credentials: 'include' };
  if (data !== undefined) init.body = JSON.stringify(data);

  let res = await fetch(endpoint, init);
  if (res.status === 401) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error('UNAUTHORIZED');
    headers.Authorization = `Bearer ${accessToken ?? ''}`;
    res = await fetch(endpoint, { ...init, headers });
  }

  return parse<T>(res);
}

export function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === '') return;
    search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}
