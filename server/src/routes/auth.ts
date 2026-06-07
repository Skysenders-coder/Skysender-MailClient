import { Router } from 'express';
import { deriveHost } from '../services/MailFolderService';
import { connect } from '../services/ImapService';
import { MailSessionService } from '../services/MailSessionService';

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
    MailSessionService.setClient(req.sessionID, client);
    req.session.credentials = { email, password, host };
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to save session' });
        return;
      }
      res.json({ email });
    });
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
  await MailSessionService.deleteClient(req.sessionID);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});
