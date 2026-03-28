import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { mediateEntry } from '../services/mediator.js';
import { validateEntry } from '../services/validator.js';
import { generatePeerResponse } from '../services/peer-response.js';

const router = Router();

router.post('/mediate', async (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const { entryId, intention } = req.body;

  if (!entryId || !intention) {
    res.status(400).json({ error: 'entryId and intention are required' });
    return;
  }

  const db = getDb();
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ? AND user_pin = ?').get(entryId, userPin) as any;

  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  try {
    // Step 1: Run mediator
    const mediatorResult = await mediateEntry(entry.content, intention);

    // Step 2: Run validator on polished entry only
    const validatorResult = await validateEntry(mediatorResult.polished_entry);

    res.json({
      polished_entry: mediatorResult.polished_entry,
      explanation: mediatorResult.explanation,
      warning: mediatorResult.warning,
      validation_passed: validatorResult.passed,
      validation_issues: validatorResult.issues || [],
    });
  } catch (error: any) {
    console.error('Mediation error:', error);
    res.status(500).json({ error: 'AI processing failed: ' + error.message });
  }
});

router.post('/approve', async (req: Request, res: Response) => {
  const userPin = (req as any).userPin;
  const { entryId, polished_entry, intention, explanation, warning } = req.body;

  if (!entryId || !polished_entry || !intention) {
    res.status(400).json({ error: 'entryId, polished_entry, and intention are required' });
    return;
  }

  const db = getDb();
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ? AND user_pin = ?').get(entryId, userPin) as any;

  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  // Update the journal entry with sharing data
  db.prepare(`
    UPDATE journal_entries
    SET modified_content = ?, mediator_explanation = ?, mediator_warning = ?,
        intention = ?, shared = 1, approved = 1
    WHERE id = ? AND user_pin = ?
  `).run(polished_entry, explanation || null, warning || null, intention, entryId, userPin);

  // Generate simulated peer response asynchronously
  generatePeerResponse(polished_entry)
    .then((peerResponse) => {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO simulated_peer_responses (id, journal_entry_id, what_i_heard, what_im_wondering, what_i_suggest)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, entryId, peerResponse.what_i_heard, peerResponse.what_im_wondering, peerResponse.what_i_suggest);
      console.log(`Simulated peer response generated for entry ${entryId}`);
    })
    .catch((error) => {
      console.error('Failed to generate simulated peer response:', error);
    });

  res.json({ success: true });
});

router.post('/deny', (req: Request, res: Response) => {
  const { entryId } = req.body;
  // Log the denial but don't modify the entry
  console.log(`Entry ${entryId} was denied for sharing`);
  res.json({ success: true });
});

export default router;
