import { Router } from 'express';
import { requireSession } from '../middleware/auth.js';
import { MailSessionService } from '../services/MailSessionService.js';
import { listRawFolders, listMessages, getMessage } from '../services/ImapService.js';
import { sendMail } from '../services/SmtpService.js';
import { mapFolders } from '../services/MailFolderService.js';
import type { SendPayload, ReplyPayload } from '../types.js';

export const mailRouter = Router();
mailRouter.use(requireSession);

function getToken(req: any): string {
  return req.authToken as string;
}

mailRouter.get('/folders', async (req, res) => {
  const session = MailSessionService.getSession(getToken(req))!;
  try {
    const raw = await listRawFolders(session.client);
    const folders = mapFolders(raw as any);
    res.json(folders);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to list folders' });
  }
});

mailRouter.get('/messages', async (req, res) => {
  const session = MailSessionService.getSession(getToken(req))!;
  const folder = (req.query.folder as string) || 'inbox';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);

  try {
    const raw = await listRawFolders(session.client);
    const folders = mapFolders(raw as any);
    const matched = folders.find((f) => f.id === folder);
    if (!matched) {
      res.status(404).json({ error: `Folder '${folder}' not found` });
      return;
    }
    const result = await listMessages(session.client, matched.imapPath, page);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to list messages' });
  }
});

mailRouter.get('/messages/:id', async (req, res) => {
  const session = MailSessionService.getSession(getToken(req))!;
  const folder = (req.query.folder as string) || 'inbox';
  const uid = parseInt(req.params.id);

  if (isNaN(uid)) {
    res.status(400).json({ error: 'Invalid message ID' });
    return;
  }

  try {
    const raw = await listRawFolders(session.client);
    const folders = mapFolders(raw as any);
    const matched = folders.find((f) => f.id === folder);
    if (!matched) {
      res.status(404).json({ error: `Folder '${folder}' not found` });
      return;
    }
    const detail = await getMessage(session.client, matched.imapPath, uid);
    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to get message' });
  }
});

mailRouter.post('/send', async (req, res) => {
  const session = MailSessionService.getSession(getToken(req))!;
  const payload = req.body as SendPayload;

  if (!payload.to || !payload.subject || !payload.html) {
    res.status(400).json({ error: 'to, subject, and html are required' });
    return;
  }

  try {
    await sendMail(session.credentials, payload);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? 'Failed to send email' });
  }
});

mailRouter.post('/reply', async (req, res) => {
  const session = MailSessionService.getSession(getToken(req))!;
  const payload = req.body as ReplyPayload;

  if (!payload.to || !payload.subject || !payload.html) {
    res.status(400).json({ error: 'to, subject, and html are required' });
    return;
  }

  try {
    await sendMail(session.credentials, payload);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? 'Failed to send reply' });
  }
});
