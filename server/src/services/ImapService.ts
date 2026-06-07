import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail, type AddressObject } from 'mailparser';
import sanitizeHtml from 'sanitize-html';
import type { SessionCredentials, MessageSummary, MessageDetail, PagedMessages } from '../types';

export async function connect(creds: SessionCredentials): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: creds.host,
    port: 993,
    secure: true,
    auth: { user: creds.email, pass: creds.password },
    logger: false,
  });
  await client.connect();
  return client;
}

export async function listRawFolders(client: ImapFlow) {
  return client.list();
}

export async function listMessages(
  client: ImapFlow,
  imapPath: string,
  page: number,
  pageSize = 50
): Promise<PagedMessages> {
  const lock = await client.getMailboxLock(imapPath);
  try {
    const mailbox = client.mailbox as { exists?: number } | undefined;
    const total = mailbox?.exists ?? 0;

    if (total === 0) {
      return { messages: [], total: 0, page, pageSize };
    }

    const end = Math.max(0, total - (page - 1) * pageSize);
    const start = Math.max(1, end - pageSize + 1);

    if (end < 1) {
      return { messages: [], total, page, pageSize };
    }

    const summaries: MessageSummary[] = [];

    for await (const msg of client.fetch(`${start}:${end}`, {
      envelope: true,
      flags: true,
      uid: true,
    })) {
      const env = msg.envelope;
      summaries.push({
        id: String(msg.uid),
        uid: msg.uid,
        subject: env?.subject ?? '(no subject)',
        from: {
          name: env?.from?.[0]?.name ?? '',
          address: env?.from?.[0]?.address ?? '',
        },
        to: (env?.to ?? []).map((a) => ({ name: a.name ?? '', address: a.address ?? '' })),
        date: env?.date?.toISOString() ?? new Date(0).toISOString(),
        seen: msg.flags?.has('\\Seen') ?? false,
      });
    }

    summaries.reverse();
    return { messages: summaries, total, page, pageSize };
  } finally {
    lock.release();
  }
}

function parseAddresses(addr: AddressObject | AddressObject[] | undefined): { name: string; address: string }[] {
  if (!addr) return [];
  const list = Array.isArray(addr) ? addr : [addr];
  return list.flatMap((a) => a.value.map((v) => ({ name: v.name ?? '', address: v.address ?? '' })));
}

export async function getMessage(
  client: ImapFlow,
  imapPath: string,
  uid: number
): Promise<MessageDetail> {
  const lock = await client.getMailboxLock(imapPath);
  try {
    const msg = await client.fetchOne(
      String(uid),
      { source: true, flags: true, uid: true },
      { uid: true }
    );

    if (!msg) throw new Error('Message not found');
    if (!msg.source) throw new Error('Message source unavailable');

    const parsed: ParsedMail = await (simpleParser as unknown as (source: Buffer) => Promise<ParsedMail>)(msg.source);

    const rawHtml = parsed.html || '';
    const htmlBody = rawHtml
      ? sanitizeHtml(rawHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
            'caption', 'colgroup', 'col', 'span', 'div', 'p', 'br', 'hr',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          ]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['style', 'class'],
            img: ['src', 'alt', 'width', 'height'],
            a: ['href', 'target'],
          },
          allowedSchemes: ['http', 'https', 'mailto'],
        })
      : '';

    const refsHeader = parsed.headers?.get('references');
    const refsValue = typeof refsHeader === 'string' ? refsHeader : '';

    return {
      id: String(uid),
      uid,
      subject: parsed.subject ?? '(no subject)',
      from: parseAddresses(parsed.from)[0] ?? { name: '', address: '' },
      to: parseAddresses(parsed.to),
      cc: parseAddresses(parsed.cc),
      date: parsed.date?.toISOString() ?? new Date(0).toISOString(),
      seen: msg.flags?.has('\\Seen') ?? false,
      htmlBody,
      textBody: parsed.text ?? '',
      messageId: parsed.messageId ?? '',
      inReplyTo: parsed.inReplyTo ?? '',
      references: refsValue,
    };
  } finally {
    lock.release();
  }
}

export async function markSeen(
  client: ImapFlow,
  imapPath: string,
  uid: number
): Promise<void> {
  const lock = await client.getMailboxLock(imapPath);
  try {
    await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
  } finally {
    lock.release();
  }
}
