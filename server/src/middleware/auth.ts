import type { Request, Response, NextFunction } from 'express';
import { MailSessionService } from '../services/MailSessionService';

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.credentials) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (!MailSessionService.hasClient(req.sessionID)) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Session expired, please log in again' });
    return;
  }
  next();
}
