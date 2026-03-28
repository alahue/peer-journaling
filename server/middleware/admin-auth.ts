import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-admin-token'] as string;

  if (!token) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  const db = getDb();
  const session = db.prepare(
    'SELECT token FROM admin_sessions WHERE token = ? AND expires_at > datetime(\'now\')'
  ).get(token);

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired admin session' });
    return;
  }

  next();
}
