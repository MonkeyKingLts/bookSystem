const BASE = '/api';
const TOKEN_KEY = 'lexis_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers: { ...headers, ...options?.headers } });

  if (res.status === 401) {
    clearToken();
    if (!url.includes('/auth/login') && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('未登录或令牌已过期');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }

  if (res.headers.get('content-type')?.includes('application/pdf')) {
    return res.blob() as unknown as T;
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: import('../types').User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<import('../types').User>('/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  },
  search: (q: string) =>
    request<{ books: { id: number; title: string; author: string; isbn: string }[]; readers: { id: number; name: string; reader_id: string }[] }>(`/search?q=${encodeURIComponent(q)}`),
  notifications: {
    list: () => request<import('../types').Notification[]>('/notifications'),
    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  },
  dashboard: {
    stats: () => request<import('../types').DashboardStats>('/dashboard/stats'),
    activities: (limit = 10) => request<import('../types').Activity[]>(`/dashboard/activities?limit=${limit}`),
    trends: () => request<{ date: string; borrowed: number; returned: number }[]>('/dashboard/trends'),
  },
  books: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params).toString();
      return request<{ books: import('../types').Book[]; total: number; page: number; limit: number }>(`/books?${q}`);
    },
    getByIsbn: (isbn: string) => request<import('../types').Book>(`/books/by-isbn/${encodeURIComponent(isbn)}`),
    categories: () => request<string[]>('/books/categories'),
    create: (data: Partial<import('../types').Book>) =>
      request<{ id: number }>('/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('../types').Book>) =>
      request('/books/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request('/books/' + id, { method: 'DELETE' }),
  },
  readers: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params).toString();
      return request<{ readers: import('../types').Reader[]; total: number }>(`/readers?${q}`);
    },
    getByReaderId: (readerId: string) => request<import('../types').Reader>(`/readers/by-reader-id/${readerId}`),
    create: (data: Partial<import('../types').Reader>) =>
      request<{ id: number; reader_id: string }>('/readers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('../types').Reader>) =>
      request('/readers/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  },
  circulation: {
    recent: (limit = 10) => request<import('../types').Borrowing[]>(`/circulation/recent?limit=${limit}`),
    overdueCount: () => request<{ count: number }>('/circulation/overdue-count'),
    checkout: (readerId: string, bookIds: number[]) =>
      request<import('../types').CheckoutResult>('/circulation/checkout', { method: 'POST', body: JSON.stringify({ readerId, bookIds }) }),
    return: (borrowingId: number) =>
      request<{ success: boolean; fine?: number }>('/circulation/return', { method: 'POST', body: JSON.stringify({ borrowingId }) }),
    returnByIsbn: (isbn: string, readerId?: string) =>
      request<{ success: boolean; fine?: number }>('/circulation/return-by-isbn', { method: 'POST', body: JSON.stringify({ isbn, readerId }) }),
    renew: (borrowingId: number) =>
      request<{ success: boolean; newDueDate: string }>('/circulation/renew', { method: 'POST', body: JSON.stringify({ borrowingId }) }),
    overdue: () => request<import('../types').ActiveBorrowing[]>('/circulation/overdue'),
    readerBorrowings: (readerId: string) =>
      request<import('../types').ActiveBorrowing[]>(`/circulation/reader/${readerId}/borrowings`),
  },
  reports: {
    overview: (days = 30) => request<{
      totalBorrowings: number; turnoverRate: number; activeReaders: number; collectionGrowth: number;
      trends: { borrowings: number; turnover: number; readers: number; growth: number };
    }>(`/reports/overview?days=${days}`),
    trends: (days = 30) => request<{ date: string; borrowed: number; returned: number }[]>(`/reports/trends?days=${days}`),
    categories: () => request<{ name: string; count: number; percentage: number }[]>('/reports/categories'),
    logs: (page = 1) => request<{ logs: { date: string; category: string; description: string; value: number; trend: string }[]; total: number }>(`/reports/logs?page=${page}&limit=5`),
    exportPdf: async (days = 30) => {
      const token = getToken();
      const res = await fetch(`${BASE}/reports/export/pdf?days=${days}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('导出失败');
      return res.blob();
    },
  },
  settings: {
    get: () => request<import('../types').Settings>('/settings'),
    update: (data: import('../types').Settings) =>
      request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    backup: () => request<{ success: boolean; timestamp: string }>('/settings/backup', { method: 'POST' }),
    auditLogs: () => request<{ id: number; event_type: string; ip_address: string; status: string; created_at: string }[]>('/settings/audit-logs'),
    ipWhitelist: () => request<{ id: number; name: string; ip_range: string }[]>('/settings/ip-whitelist'),
    addIp: (name: string, ip_range: string) =>
      request('/settings/ip-whitelist', { method: 'POST', body: JSON.stringify({ name, ip_range }) }),
    deleteIp: (id: number) => request(`/settings/ip-whitelist/${id}`, { method: 'DELETE' }),
  },
};
