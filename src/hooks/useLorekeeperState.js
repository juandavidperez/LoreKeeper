import React, { createContext, useContext, useMemo, useCallback } from 'react';
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
      const mentionKey = `${entry.date}|${entry.book}|${item.content}`;
      const isDuplicate = data[item.name].mentions.some(
        m => `${m.date}|${m.book}|${m.text}` === mentionKey
      );
      if (!isDuplicate) {
        data[item.name].mentions.push({ date: entry.date, text: item.content, book: entry.book });
      }
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

  // Expose setters so SyncProvider can update state after pull
  const stateSetters = useMemo(() => ({
    'lore-books': setBooks,
    'lore-phases': setPhases,
    'lore-schedule': setSchedule,
    'reading-entries': setEntries,
    'completed-weeks': setCompletedWeeks,
  }), [setBooks, setPhases, setSchedule, setEntries, setCompletedWeeks]);

  const archive = useMemo(() => ({
    personajes: aggregateEntities(entries, 'characters', 'personaje'),
    lugares: aggregateEntities(entries, 'places', 'lugar'),
    glosario: aggregateEntities(entries, 'glossary', 'glosario'),
    reglas: aggregateEntities(entries, 'worldRules', 'regla')
  }), [entries]);

  const exportData = useCallback(async () => {
    const data = { books, phases, schedule, entries, completedWeeks, exportedAt: new Date().toISOString() };
    const fileName = `lorekeeper-backup-${new Date().toISOString().split('T')[0]}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    // Check if we can use the Share API (standard for "Save to Files" on iOS PWA)
    if (navigator.canShare && navigator.share) {
      try {
        const file = new File([jsonString], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Lorekeeper Backup',
            text: 'Copia de seguridad de mi Archivo Dorado.'
          });
          return;
        }
      } catch (err) {
        // Carry on to fallback if share fails or is cancelled
        console.warn('Share API failed, falling back to download:', err);
      }
    }

    // Fallback: standard blob download for desktop
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [books, phases, schedule, entries, completedWeeks]);

  const importData = useCallback((jsonString) => {
    const data = JSON.parse(jsonString);

    // Validate top-level shape
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('El archivo no contiene un objeto JSON válido.');
    }

    // Validate arrays where expected
    if (data.books !== undefined && !Array.isArray(data.books)) throw new Error('Campo "books" debe ser un array.');
    if (data.phases !== undefined && !Array.isArray(data.phases)) throw new Error('Campo "phases" debe ser un array.');
    if (data.schedule !== undefined && !Array.isArray(data.schedule)) throw new Error('Campo "schedule" debe ser un array.');
    if (data.entries !== undefined && !Array.isArray(data.entries)) throw new Error('Campo "entries" debe ser un array.');
    if (data.completedWeeks !== undefined && !Array.isArray(data.completedWeeks)) throw new Error('Campo "completedWeeks" debe ser un array.');

    // Validate each book has required fields
    if (data.books) {
      for (const book of data.books) {
        if (!book.title || typeof book.title !== 'string') {
          throw new Error('Cada libro debe tener un campo "title" de tipo texto.');
        }
      }
    }

    // Validate each entry has required fields
    if (data.entries) {
      for (const entry of data.entries) {
        if (!entry.id) throw new Error('Cada entrada debe tener un campo "id".');
        if (!entry.book || typeof entry.book !== 'string') {
          throw new Error('Cada entrada debe tener un campo "book" de tipo texto.');
        }
      }
    }

    if (data.books) setBooks(data.books);
    if (data.phases) setPhases(data.phases);
    if (data.schedule) setSchedule(data.schedule);
    if (data.entries) setEntries(data.entries);
    if (data.completedWeeks) setCompletedWeeks(data.completedWeeks);
  }, [setBooks, setPhases, setSchedule, setEntries, setCompletedWeeks]);

  const value = {
    books, setBooks,
    phases, setPhases,
    schedule, setSchedule,
    entries, setEntries,
    completedWeeks, setCompletedWeeks,
    archive,
    exportData, importData,
    stateSetters,
  };

  return React.createElement(LorekeeperContext.Provider, { value }, children);
}

export function useLorekeeperState() {
  const context = useContext(LorekeeperContext);
  if (!context) {
    throw new Error('useLorekeeperState must be used within a LorekeeperProvider');
  }
  return context;
}
