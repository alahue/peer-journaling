import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const db = getDb();

  const entries = db.prepare(`
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
  `).all(userPin);

  res.json(entries);
});

router.post('/', (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO journal_entries (id, user_pin, content, shared, approved)
    VALUES (?, ?, ?, 0, 0)
  `).run(id, userPin, content);

  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  res.status(201).json(entry);
});

router.put('/:id', (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const { id } = req.params;
  const updates = req.body;

  const db = getDb();
  const existing = db.prepare('SELECT * FROM journal_entries WHERE id = ? AND user_pin = ?').get(id, userPin);

  if (!existing) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  const allowedFields = ['content', 'modified_content', 'mediator_explanation', 'mediator_warning', 'intention', 'shared', 'approved'];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  values.push(id, userPin);
  db.prepare(`UPDATE journal_entries SET ${setClauses.join(', ')} WHERE id = ? AND user_pin = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const { id } = req.params;

  const db = getDb();
  const result = db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_pin = ?').run(id, userPin);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
