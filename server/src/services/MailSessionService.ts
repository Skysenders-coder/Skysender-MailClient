import type { ImapFlow } from 'imapflow';
import type { SessionCredentials } from '../types.js';
import crypto from 'crypto';

interface SessionEntry {
  client: ImapFlow;
  credentials: SessionCredentials;
  created: number;
}

const sessions = new Map<string, SessionEntry>();

const TTL_MS = 24 * 60 * 60 * 1000;

setInterval(async () => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.created > TTL_MS) {
      try { await entry.client.logout(); } catch { /* already disconnected */ }
      sessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

export const MailSessionService = {
  createToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  setSession(token: string, client: ImapFlow, credentials: SessionCredentials): void {
    sessions.set(token, { client, credentials, created: Date.now() });
  },

  getSession(token: string): SessionEntry | undefined {
    return sessions.get(token);
  },

  hasSession(token: string): boolean {
    return sessions.has(token);
  },

  async deleteSession(token: string): Promise<void> {
    const entry = sessions.get(token);
    if (entry) {
      try { await entry.client.logout(); } catch { /* already disconnected */ }
      sessions.delete(token);
    }
  },

  // Legacy aliases for compatibility
  setClient(sessionId: string, client: ImapFlow): void {
    sessions.set(sessionId, { client, credentials: {} as SessionCredentials, created: Date.now() });
  },
  getClient(sessionId: string): ImapFlow | undefined {
    return sessions.get(sessionId)?.client;
  },
  hasClient(sessionId: string): boolean {
    return sessions.has(sessionId);
  },
  async deleteClient(sessionId: string): Promise<void> {
    return this.deleteSession(sessionId);
  },
};
