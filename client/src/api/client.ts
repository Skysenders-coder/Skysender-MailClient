const TOKEN_KEY = 'skysender_auth_token';
const EMAIL_KEY = 'skysender_auth_email';

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY) ?? '',
  getEmail: () => sessionStorage.getItem(EMAIL_KEY),
  set: (token: string, email: string) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EMAIL_KEY, email);
  },
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
  },
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
      ...options?.headers,
    },
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
  login: async (email: string, password: string) => {
    const res = await apiFetch<{ email: string; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    tokenStore.set(res.token, res.email);
    return res;
  },

  logout: async () => {
    const res = await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    tokenStore.clear();
    return res;
  },

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
    to: string; subject: string; html: string; text?: string;
    inReplyTo: string; references: string;
  }) =>
    apiFetch<{ ok: boolean }>('/api/mail/reply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
