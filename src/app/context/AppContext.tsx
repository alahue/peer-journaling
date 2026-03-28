import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface JournalEntry {
  id: string;
  content: string;
  timestamp: Date;
  modifiedContent?: string;
  intention?: 'support' | 'accountability' | 'perspective';
  peerResponse?: {
    whatIHeard: string;
    whatImWondering: string;
    whatISuggest: string;
  };
  reflectionAddendum?: string;
  shared: boolean;
}

export interface PeerEntry {
  id: string;
  entryId: string;
  content: string;
  timestamp: Date;
  intention: 'support' | 'accountability' | 'perspective';
  responded: boolean;
}

interface AppContextType {
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  peerEntries: PeerEntry[];
  removePeerEntry: (id: string) => void;
  entriesAwaitingReflection: JournalEntry[];
  removeReflectionEntry: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      content: "Today was challenging. I struggled with procrastination on my project deadlines. I know I need to do better but I keep putting things off.",
      timestamp: new Date('2026-02-15T10:30:00'),
      modifiedContent: "I'm facing challenges with procrastination on my project deadlines. Looking for accountability to improve my time management.",
      intention: 'accountability',
      peerResponse: {
        whatIHeard: "You're aware of your procrastination patterns and want to change them.",
        whatImWondering: "What specific triggers cause you to procrastinate? Have you tried breaking tasks into smaller chunks?",
        whatISuggest: "Consider using the Pomodoro technique - work for 25 minutes, then take a 5-minute break. Also, identify your most productive hours and schedule important tasks then."
      },
      reflectionAddendum: "I hadn't noticed that my procrastination might be triggered by feeling overwhelmed. Breaking tasks down seems like a practical step I can start immediately.",
      shared: true
    },
    {
      id: '2',
      content: "Had a great breakthrough in my meditation practice today. Finally feeling more centered and calm.",
      timestamp: new Date('2026-02-17T08:00:00'),
      shared: false
    }
  ]);

  const [peerEntries, setPeerEntries] = useState<PeerEntry[]>([
    {
      id: 'p1',
      entryId: 'peer-entry-1',
      content: "I'm feeling anxious about an upcoming presentation at work. I've prepared thoroughly but still feel nervous about speaking in front of the team. Any perspectives would be helpful.",
      timestamp: new Date('2026-02-18T14:00:00'),
      intention: 'perspective',
      responded: false
    }
  ]);

  const [entriesAwaitingReflection, setEntriesAwaitingReflection] = useState<JournalEntry[]>([
    journalEntries[0] // The entry with peer response
  ]);

  const addJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => [entry, ...prev]);
  };

  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(entry => entry.id !== id));
    // Also remove from reflection queue if present
    setEntriesAwaitingReflection(prev => prev.filter(entry => entry.id !== id));
  };

  const removePeerEntry = (id: string) => {
    setPeerEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const removeReflectionEntry = (id: string) => {
    setEntriesAwaitingReflection(prev => prev.filter(entry => entry.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        journalEntries,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        peerEntries,
        removePeerEntry,
        entriesAwaitingReflection,
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