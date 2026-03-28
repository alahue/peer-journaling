import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, seedUserData } from '../db.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// Admin login - no middleware needed
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid admin password' });
    return;
  }

  const db = getDb();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  db.prepare(`
    INSERT INTO admin_sessions (token, expires_at)
    VALUES (?, ?)
  `).run(token, expiresAt);

  res.json({ token });
});

// All routes below require admin auth
router.get('/users', requireAdmin, (_req: Request, res: Response) => {
  const db = getDb();

  const users = db.prepare(`
    SELECT u.pin, u.created_at, u.is_active,
      (SELECT COUNT(*) FROM journal_entries WHERE user_pin = u.pin) as entry_count,
      (SELECT COUNT(*) FROM peer_entries WHERE target_user_pin = u.pin) as peer_entry_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  res.json(users);
});

router.post('/users', requireAdmin, (req: Request, res: Response) => {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: 'A valid 4-digit PIN is required' });
    return;
  }

  const db = getDb();

  // Check if PIN already exists
  const existing = db.prepare('SELECT pin FROM users WHERE pin = ?').get(pin);
  if (existing) {
    res.status(409).json({ error: 'PIN already exists' });
    return;
  }

  db.prepare('INSERT INTO users (pin) VALUES (?)').run(pin);
  seedUserData(pin);

  res.status(201).json({ success: true, pin });
});

router.delete('/users/:pin', requireAdmin, (req: Request, res: Response) => {
  const { pin } = req.params;
  const db = getDb();

  const result = db.prepare('DELETE FROM users WHERE pin = ?').run(pin);

  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ success: true });
});

router.get('/users/:pin/history', requireAdmin, (req: Request, res: Response) => {
  const { pin } = req.params;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE pin = ?').get(pin);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const journalEntries = db.prepare(`
    SELECT je.*,
      spr.what_i_heard AS sim_what_i_heard,
      spr.what_im_wondering AS sim_what_im_wondering,
      spr.what_i_suggest AS sim_what_i_suggest,
      ra.content AS reflection_content
    FROM journal_entries je
    LEFT JOIN simulated_peer_responses spr ON spr.journal_entry_id = je.id
    LEFT JOIN reflection_addendums ra ON ra.journal_entry_id = je.id
    WHERE je.user_pin = ?
    ORDER BY je.created_at DESC
  `).all(pin);

  const peerEntries = db.prepare(`
    SELECT pe.*,
      pr.what_i_heard, pr.what_im_wondering, pr.what_i_suggest,
      pr.created_at AS response_created_at
    FROM peer_entries pe
    LEFT JOIN peer_responses pr ON pr.peer_entry_id = pe.id
    WHERE pe.target_user_pin = ?
    ORDER BY pe.created_at DESC
  `).all(pin);

  res.json({ user, journalEntries, peerEntries });
});

router.delete('/entries/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const result = db.prepare('DELETE FROM journal_entries WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
