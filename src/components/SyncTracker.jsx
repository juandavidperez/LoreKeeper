import { useEffect, useRef } from 'react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useSync } from '../hooks/useSync';

/**
 * Invisible component that watches Lorekeeper state changes
 * and enqueues them into the sync queue.
 * Lives inside both LorekeeperProvider and SyncProvider.
 */
export function SyncTracker() {
  const { books, phases, schedule, entries, completedWeeks } = useLorekeeperState();
  const { trackChange, canSync } = useSync();

  const prevBooks = useRef(books);
  const prevPhases = useRef(phases);
  const prevSchedule = useRef(schedule);
  const prevEntries = useRef(entries);
  const prevCompletedWeeks = useRef(completedWeeks);
  const mounted = useRef(false);

  useEffect(() => {
    // Skip initial mount to avoid enqueuing the full state on load
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!canSync || !trackChange) return;
    if (prevBooks.current !== books) {
      trackChange('lore-books', 'upsert', books);
      prevBooks.current = books;
    }
  }, [books, canSync, trackChange]);

  useEffect(() => {
    if (!mounted.current || !canSync || !trackChange) return;
    if (prevPhases.current !== phases) {
      trackChange('lore-phases', 'upsert', phases);
      prevPhases.current = phases;
    }
  }, [phases, canSync, trackChange]);

  useEffect(() => {
    if (!mounted.current || !canSync || !trackChange) return;
    if (prevSchedule.current !== schedule) {
      trackChange('lore-schedule', 'upsert', schedule);
      prevSchedule.current = schedule;
    }
  }, [schedule, canSync, trackChange]);

  useEffect(() => {
    if (!mounted.current || !canSync || !trackChange) return;
    if (prevEntries.current !== entries) {
      trackChange('reading-entries', 'upsert', entries);
      prevEntries.current = entries;
    }
  }, [entries, canSync, trackChange]);

  useEffect(() => {
    if (!mounted.current || !canSync || !trackChange) return;
    if (prevCompletedWeeks.current !== completedWeeks) {
      trackChange('completed-weeks', 'upsert', completedWeeks);
      prevCompletedWeeks.current = completedWeeks;
    }
  }, [completedWeeks, canSync, trackChange]);

  return null;
}
