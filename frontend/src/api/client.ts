const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export const api = {
  dashboard: {
    stats: () => request<import('../types').DashboardStats>('/dashboard/stats'),
    activities: () => request<import('../types').Activity[]>('/dashboard/activities'),
    trends: () => request<{ date: string; borrowed: number; returned: number }[]>('/dashboard/trends'),
  },
  books: {
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params).toString();
      return request<{ books: import('../types').Book[]; total: number; page: number; limit: number }>(`/books?${q}`);
    },
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
    recent: () => request<import('../types').Borrowing[]>('/circulation/recent'),
    overdueCount: () => request<{ count: number }>('/circulation/overdue-count'),
    checkout: (readerId: string, bookIds: number[]) =>
      request('/circulation/checkout', { method: 'POST', body: JSON.stringify({ readerId, bookIds }) }),
    return: (borrowingId: number) =>
      request('/circulation/return', { method: 'POST', body: JSON.stringify({ borrowingId }) }),
    renew: (borrowingId: number) =>
      request('/circulation/renew', { method: 'POST', body: JSON.stringify({ borrowingId }) }),
    overdue: () => request<import('../types').Borrowing[]>('/circulation/overdue'),
    readerBorrowings: (readerId: string) => request(`/circulation/reader/${readerId}/borrowings`),
  },
  reports: {
    overview: () => request<{
      totalBorrowings: number;
      turnoverRate: number;
      activeReaders: number;
      collectionGrowth: number;
      trends: { borrowings: number; turnover: number; readers: number; growth: number };
    }>('/reports/overview'),
    trends: () => request<{ date: string; borrowed: number; returned: number }[]>('/reports/trends'),
    categories: () => request<{ name: string; count: number; percentage: number }[]>('/reports/categories'),
    logs: (page = 1) => request<{ logs: { date: string; category: string; description: string; value: number; trend: string }[]; total: number }>(`/reports/logs?page=${page}&limit=5`),
  },
  settings: {
    get: () => request<import('../types').Settings>('/settings'),
    update: (data: import('../types').Settings) =>
      request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    auditLogs: () => request<{ id: number; event_type: string; ip_address: string; status: string; created_at: string }[]>('/settings/audit-logs'),
    ipWhitelist: () => request<{ id: number; name: string; ip_range: string }[]>('/settings/ip-whitelist'),
    addIp: (name: string, ip_range: string) =>
      request('/settings/ip-whitelist', { method: 'POST', body: JSON.stringify({ name, ip_range }) }),
    deleteIp: (id: number) => request(`/settings/ip-whitelist/${id}`, { method: 'DELETE' }),
  },
};
