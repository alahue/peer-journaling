import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as api from '../utils/api';

export interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  modified_content?: string | null;
  mediator_explanation?: string | null;
  mediator_warning?: string | null;
  intention?: 'support' | 'accountability' | 'perspective' | 'connection' | null;
  shared: boolean;
  approved?: boolean;
  // Simulated peer response (joined from DB)
  sim_what_i_heard?: string | null;
  sim_what_im_wondering?: string | null;
  sim_what_i_suggest?: string | null;
  // Reflection addendum (joined from DB)
  reflection_content?: string | null;
}

export interface PeerEntry {
  id: string;
  content: string;
  created_at: string;
  intention: 'support' | 'accountability' | 'perspective' | 'connection';
  responded: boolean;
}

interface AppContextType {
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
  journalEntries: JournalEntry[];
  peerEntries: PeerEntry[];
  entriesAwaitingReflection: JournalEntry[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addJournalEntry: (content: string) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  removePeerEntry: (id: string) => void;
  removeReflectionEntry: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapEntry(raw: any): JournalEntry {
  return {
    ...raw,
    shared: !!raw.shared,
    approved: !!raw.approved,
  };
}

function mapPeerEntry(raw: any): PeerEntry {
  return {
    ...raw,
    responded: !!raw.responded,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [peerEntries, setPeerEntries] = useState<PeerEntry[]>([]);
  const [entriesAwaitingReflection, setEntriesAwaitingReflection] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [entries, peers, reflections] = await Promise.all([
        api.getEntries(),
        api.getPeerEntries(),
        api.getPendingReflections(),
      ]);

      setJournalEntries(entries.map(mapEntry));
      setPeerEntries(peers.map(mapPeerEntry));
      setEntriesAwaitingReflection(reflections.map(mapEntry));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentUser = useCallback((user: string | null) => {
    setCurrentUserState(user);
    if (user) {
      api.setApiPin(user);
    } else {
      api.setApiPin(null);
      setJournalEntries([]);
      setPeerEntries([]);
      setEntriesAwaitingReflection([]);
    }
  }, []);

  const addJournalEntry = useCallback(async (content: string) => {
    await api.createEntry(content);
    await refreshData();
  }, [refreshData]);

  const deleteJournalEntry = useCallback(async (id: string) => {
    await api.deleteEntry(id);
    await refreshData();
  }, [refreshData]);

  const removePeerEntry = useCallback((id: string) => {
    setPeerEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const removeReflectionEntry = useCallback((id: string) => {
    setEntriesAwaitingReflection(prev => prev.filter(entry => entry.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        journalEntries,
        peerEntries,
        entriesAwaitingReflection,
        loading,
        error,
        refreshData,
        addJournalEntry,
        deleteJournalEntry,
        removePeerEntry,
        removeReflectionEntry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
