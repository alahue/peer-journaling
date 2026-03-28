import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

export function requirePin(req: Request, res: Response, next: NextFunction): void {
  const pin = req.headers['x-user-pin'] as string;

  if (!pin) {
    res.status(401).json({ error: 'PIN required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT pin FROM users WHERE pin = ? AND is_active = 1').get(pin);

  if (!user) {
    res.status(401).json({ error: 'Invalid PIN' });
    return;
  }

  (req as any).userPin = pin;
  next();
}
