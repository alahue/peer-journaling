import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'journal.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    initializeDb();
  }
  return db;
}

export function initializeDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      pin TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now')),
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_pin TEXT NOT NULL,
      content TEXT NOT NULL,
      modified_content TEXT,
      mediator_explanation TEXT,
      mediator_warning TEXT,
      intention TEXT CHECK(intention IN ('support','accountability','perspective','connection')),
      shared INTEGER DEFAULT 0,
      approved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_pin) REFERENCES users(pin) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS peer_entries (
      id TEXT PRIMARY KEY,
      target_user_pin TEXT NOT NULL,
      content TEXT NOT NULL,
      intention TEXT CHECK(intention IN ('support','accountability','perspective','connection')),
      responded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (target_user_pin) REFERENCES users(pin) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS peer_responses (
      id TEXT PRIMARY KEY,
      peer_entry_id TEXT NOT NULL,
      responder_pin TEXT NOT NULL,
      what_i_heard TEXT NOT NULL,
      what_im_wondering TEXT NOT NULL,
      what_i_suggest TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (peer_entry_id) REFERENCES peer_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (responder_pin) REFERENCES users(pin) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS simulated_peer_responses (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL,
      what_i_heard TEXT NOT NULL,
      what_im_wondering TEXT NOT NULL,
      what_i_suggest TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reflection_addendums (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL,
      user_pin TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (user_pin) REFERENCES users(pin) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
  `);
}

const SAMPLE_JOURNAL_ENTRY = `I keep telling myself I'll feel calmer once I catch up, but the finish line keeps moving. Today I stared at my laptop for almost an hour, flipping between my research notes and random tabs, and then felt guilty for wasting time. I'm frustrated because on paper I'm doing fine with classes, part-time lab hours, and a social life that looks normal, but inside it feels like I'm constantly behind, constantly disappointing someone (usually myself).
I also had that awkward moment where I almost cried in the hallway after my meeting with Dr. L. She wasn't harsh, but she asked, "What's your plan for the next two weeks?" and I froze like my brain went blank. I mumbled something about drafting the methods section and then immediately replayed it in my head all afternoon. I'm worried she thinks I'm not serious. The truth is I am serious; I'm just scared that if I submit a draft, it'll prove I'm not good enough.
On top of that, I'm irritated at Ricardo (my roommate) for having friends over late again. I snapped and said, "Some of us have deadlines," which came out more judgmental than I meant. He rolled his eyes and said I'm always stressed and that my stress controls the apartment. That really stung. I don't want to be the person who makes everyone walk on eggshells, but I also don't think it's unreasonable to want quiet after midnight. I can't tell if I'm being unfair or if I'm just finally setting boundaries. I'd genuinely like perspective on how to handle this without escalating it into a bigger fight.
Accountability-wise, I need to stop negotiating with myself. My concrete plan for tomorrow: write for 25 minutes before checking messages, outline the next section in bullet points even if it's messy, and go for a 20-minute walk instead of doomscrolling when I feel stuck. If I do those three things, I'll feel like I didn't lose the day.
Also, in case I actually decide to ask someone for support instead of isolating: I'm Maya Patel, and my number is (555) 013-2846. My campus mail address is 1432 Juniper Lane, Apt 5B, Cambridge, MA 02139, and my email is maya.patel27@outlook.com. Writing that out feels weirdly vulnerable, but maybe it's good practice to admit I don't have to do everything alone.`;

const SAMPLE_PEER_ENTRY = `I've been stuck in this loop about whether I should take an internship offer for the summer or stick with my original plan to go home and spend the time with my family. The internship is a solid opportunity and the work sounds genuinely interesting, but the idea of relocating for a few months makes me feel oddly tense. At the same time, when I picture turning it down, I feel this immediate rush of relief followed by a quieter worry that I'm choosing comfort over growth. I can't tell if my hesitation is a reasonable signal that I'm already stretched thin, or if it's just fear dressed up as being practical.
What's making it harder is that the people around me are giving totally different narratives: some frame it like a straightforward career move, while others emphasize the value of rest and relationships. I'm trying to step outside my own head and see the bigger picture: how do you decide when an opportunity is worth the disruption, especially when both options have real value? I'd really appreciate perspective on what kinds of questions actually help clarify a decision like this, beyond just which choice sounds more impressive.`;

export function seedUserData(pin: string): void {
  const journalId = `seed-journal-${pin}`;
  const peerId = `seed-peer-${pin}`;

  db.prepare(`
    INSERT OR IGNORE INTO journal_entries (id, user_pin, content, shared, approved, created_at)
    VALUES (?, ?, ?, 0, 0, datetime('now', '-2 days'))
  `).run(journalId, pin, SAMPLE_JOURNAL_ENTRY);

  db.prepare(`
    INSERT OR IGNORE INTO peer_entries (id, target_user_pin, content, intention, responded, created_at)
    VALUES (?, ?, ?, 'perspective', 0, datetime('now', '-1 day'))
  `).run(peerId, pin, SAMPLE_PEER_ENTRY);
}
