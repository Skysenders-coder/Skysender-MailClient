const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body.error ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ email: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  getFolders: () => apiFetch<import('../types').MailFolder[]>('/api/mail/folders'),

  getMessages: (folder: string, page: number) =>
    apiFetch<import('../types').PagedMessages>(
      `/api/mail/messages?folder=${folder}&page=${page}`
    ),

  getMessage: (id: string, folder: string) =>
    apiFetch<import('../types').MessageDetail>(`/api/mail/messages/${id}?folder=${folder}`),

  sendMail: (payload: { to: string; subject: string; html: string; text?: string }) =>
    apiFetch<{ ok: boolean }>('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  replyMail: (payload: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    inReplyTo: string;
    references: string;
  }) =>
    apiFetch<{ ok: boolean }>('/api/mail/reply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
