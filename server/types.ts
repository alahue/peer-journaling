export interface User {
  pin: string;
  created_at: string;
  is_active: number;
}

export interface JournalEntry {
  id: string;
  user_pin: string;
  content: string;
  modified_content: string | null;
  mediator_explanation: string | null;
  mediator_warning: string | null;
  intention: 'support' | 'accountability' | 'perspective' | 'connection' | null;
  shared: number;
  approved: number;
  created_at: string;
}

export interface PeerEntry {
  id: string;
  target_user_pin: string;
  content: string;
  intention: 'support' | 'accountability' | 'perspective' | 'connection';
  responded: number;
  created_at: string;
}

export interface PeerResponse {
  id: string;
  peer_entry_id: string;
  responder_pin: string;
  what_i_heard: string;
  what_im_wondering: string;
  what_i_suggest: string;
  created_at: string;
}

export interface SimulatedPeerResponse {
  id: string;
  journal_entry_id: string;
  what_i_heard: string;
  what_im_wondering: string;
  what_i_suggest: string;
  created_at: string;
}

export interface ReflectionAddendum {
  id: string;
  journal_entry_id: string;
  user_pin: string;
  content: string;
  created_at: string;
}

export interface AdminSession {
  token: string;
  created_at: string;
  expires_at: string;
}

export interface MediatorResult {
  polished_entry: string;
  explanation: string;
  warning: string | null;
}

export interface ValidatorResult {
  passed: boolean;
  issues: string[];
}

export interface SimulatedResponseResult {
  what_i_heard: string;
  what_im_wondering: string;
  what_i_suggest: string;
}
