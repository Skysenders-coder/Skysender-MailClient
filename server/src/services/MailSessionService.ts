import type { ImapFlow } from 'imapflow';

interface SessionEntry {
  client: ImapFlow;
  created: number;
}

const sessions = new Map<string, SessionEntry>();

const TTL_MS = 24 * 60 * 60 * 1000;

setInterval(async () => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.created > TTL_MS) {
      try {
        await entry.client.logout();
      } catch {
        // already disconnected
      }
      sessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

export const MailSessionService = {
  setClient(sessionId: string, client: ImapFlow): void {
    sessions.set(sessionId, { client, created: Date.now() });
  },

  getClient(sessionId: string): ImapFlow | undefined {
    return sessions.get(sessionId)?.client;
  },

  hasClient(sessionId: string): boolean {
    return sessions.has(sessionId);
  },

  async deleteClient(sessionId: string): Promise<void> {
    const entry = sessions.get(sessionId);
    if (entry) {
      try {
        await entry.client.logout();
      } catch {
        // already disconnected
      }
      sessions.delete(sessionId);
    }
  },
};
