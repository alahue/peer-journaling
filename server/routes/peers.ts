import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const db = getDb();

  const entries = db.prepare(`
    SELECT * FROM peer_entries
    WHERE target_user_pin = ? AND responded = 0
    ORDER BY created_at DESC
  `).all(userPin);

  res.json(entries);
});

router.post('/:id/respond', (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const { id } = req.params;
  const { what_i_heard, what_im_wondering, what_i_suggest } = req.body;

  if (!what_i_heard || !what_im_wondering || !what_i_suggest) {
    res.status(400).json({ error: 'All three response fields are required' });
    return;
  }

  const db = getDb();
  const peerEntry = db.prepare('SELECT * FROM peer_entries WHERE id = ? AND target_user_pin = ?').get(id, userPin) as any;

  if (!peerEntry) {
    res.status(404).json({ error: 'Peer entry not found' });
    return;
  }

  const responseId = uuidv4();
  db.prepare(`
    INSERT INTO peer_responses (id, peer_entry_id, responder_pin, what_i_heard, what_im_wondering, what_i_suggest)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(responseId, id, userPin, what_i_heard, what_im_wondering, what_i_suggest);

  db.prepare('UPDATE peer_entries SET responded = 1 WHERE id = ?').run(id);

  res.json({ success: true });
});

export default router;
