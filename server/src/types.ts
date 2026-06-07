export interface SessionCredentials {
  email: string;
  password: string;
  host: string;
}

export interface MailFolder {
  id: 'inbox' | 'sent' | 'spam';
  name: string;
  imapPath: string;
  count: number;
  unseen: number;
}

export interface MessageSummary {
  id: string;
  uid: number;
  subject: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  date: string;
  seen: boolean;
}

export interface MessageDetail extends MessageSummary {
  htmlBody: string;
  textBody: string;
  messageId: string;
  inReplyTo: string;
  references: string;
  cc: { name: string; address: string }[];
}

export interface PagedMessages {
  messages: MessageSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SendPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ReplyPayload extends SendPayload {
  inReplyTo: string;
  references: string;
}

declare module 'express-session' {
  interface SessionData {
    credentials?: SessionCredentials;
  }
}
