import type { MailFolder } from '../types';

export function deriveHost(email: string): string {
  const domain = email.split('@')[1];
  return `mail.${domain}`;
}

interface RawFolder {
  path: string;
  name: string;
  specialUse?: string;
  specialUseAttribs?: string[];
}

export function mapFolders(rawFolders: RawFolder[]): MailFolder[] {
  const result: MailFolder[] = [];

  const sentNames = ['sent', 'sent items', 'sent mail'];
  const spamNames = ['spam', 'junk', 'junk e-mail'];

  let inbox: RawFolder | undefined;
  let sent: RawFolder | undefined;
  let spam: RawFolder | undefined;

  for (const f of rawFolders) {
    const specialUse = (f.specialUse || '').toLowerCase();
    const attribs = (f.specialUseAttribs || []).map((a) => a.toLowerCase());
    const nameLower = f.name.toLowerCase();

    if (f.path.toUpperCase() === 'INBOX' || nameLower === 'inbox') {
      inbox = f;
    } else if (
      specialUse === '\\sent' ||
      attribs.includes('\\sent') ||
      sentNames.includes(nameLower)
    ) {
      sent = sent ?? f;
    } else if (
      specialUse === '\\junk' ||
      attribs.includes('\\junk') ||
      spamNames.includes(nameLower)
    ) {
      spam = spam ?? f;
    }
  }

  if (inbox) {
    result.push({ id: 'inbox', name: 'Inbox', imapPath: inbox.path, count: 0, unseen: 0 });
  }
  if (sent) {
    result.push({ id: 'sent', name: 'Sent', imapPath: sent.path, count: 0, unseen: 0 });
  }
  if (spam) {
    result.push({ id: 'spam', name: 'Spam', imapPath: spam.path, count: 0, unseen: 0 });
  }

  return result;
}
