import type { Request, Response, NextFunction } from 'express';
import { MailSessionService } from '../services/MailSessionService.js';

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-auth-token'] as string | undefined;
  if (!token || !MailSessionService.hasSession(token)) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  (req as any).authToken = token;
  next();
}
