import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
  INITIAL_BOOKS, 
  INITIAL_PHASES, 
  INITIAL_SCHEDULE, 
  INITIAL_ENTRIES 
} from '../data/mockData';

const LorekeeperContext = createContext();

function aggregateEntities(entries, field, type) {
  const data = {};
  entries.forEach(entry => {
    entry[field]?.forEach(item => {
      if (!data[item.name]) {
        data[item.name] = { name: item.name, type, book: entry.book, tags: item.tags || [], mentions: [] };
      }
      data[item.name].mentions.push({ date: entry.date, text: item.content, book: entry.book });
      data[item.name].tags = [...new Set([...data[item.name].tags, ...(item.tags || [])])];
    });
  });
  return Object.values(data);
}

export function LorekeeperProvider({ children }) {
  const [books, setBooks] = useLocalStorage('lore-books', INITIAL_BOOKS);
  const [phases, setPhases] = useLocalStorage('lore-phases', INITIAL_PHASES);
  const [schedule, setSchedule] = useLocalStorage('lore-schedule', INITIAL_SCHEDULE);
  const [entries, setEntries] = useLocalStorage('reading-entries', INITIAL_ENTRIES);
  const [completedWeeks, setCompletedWeeks] = useLocalStorage('completed-weeks', []);

  const archive = useMemo(() => ({
    personajes: aggregateEntities(entries, 'characters', 'personaje'),
    lugares: aggregateEntities(entries, 'places', 'lugar'),
    glosario: aggregateEntities(entries, 'glossary', 'glosario'),
  }), [entries]);

  const value = {
    books, setBooks,
    phases, setPhases,
    schedule, setSchedule,
    entries, setEntries,
    completedWeeks, setCompletedWeeks,
    archive
  };

  // Using React.createElement instead of JSX to allow .js extension and avoid build tools picky about JSX in JS files
  return React.createElement(LorekeeperContext.Provider, { value: value }, children);
}

export function useLorekeeperState() {
  const context = useContext(LorekeeperContext);
  if (!context) {
    throw new Error('useLorekeeperState must be used within a LorekeeperProvider');
  }
  return context;
}
