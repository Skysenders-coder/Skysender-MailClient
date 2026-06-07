import { Router } from 'express';
import { deriveHost } from '../services/MailFolderService.js';
import { connect } from '../services/ImapService.js';
import { MailSessionService } from '../services/MailSessionService.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const host = deriveHost(email);

  try {
    const client = await connect({ email, password, host });
    const token = MailSessionService.createToken();
    MailSessionService.setSession(token, client, { email, password, host });
    res.json({ email, token });
  } catch (err: any) {
    const message = err?.message ?? 'Authentication failed';
    const isAuthError =
      message.toLowerCase().includes('auth') ||
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('credentials');
    res.status(isAuthError ? 401 : 502).json({ error: message });
  }
});

authRouter.post('/logout', async (req, res) => {
  const token = req.headers['x-auth-token'] as string | undefined;
  if (token) {
    await MailSessionService.deleteSession(token);
  }
  res.json({ ok: true });
});
