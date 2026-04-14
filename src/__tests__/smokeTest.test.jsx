import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const MOTION_FILTER_KEYS = ['initial', 'animate', 'exit', 'transition', 'layoutId', 'whileHover', 'whileTap', 'custom'];

function filterProps(props) {
  const filtered = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_FILTER_KEYS.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Mock framer-motion — proxy covers all motion.* tags (div, span, etc.)
vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_, tag) =>
      React.forwardRef(({ children, ...props }, ref) =>
        React.createElement(tag, { ...filterProps(props), ref }, children)
      ),
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock virtual:pwa-register/react
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

// Mock Supabase client (no env vars in test)
vi.mock('../lib/supabase', () => ({
  supabase: null,
}));

import App from '../App';

// Helpers
function seedLocalStorage({ schedule = [], entries = [], books = [] } = {}) {
  localStorage.setItem('lore-onboarding-done', '1'); // suppress onboarding overlay
  if (schedule.length) localStorage.setItem('lore-schedule', JSON.stringify(schedule));
  if (entries.length) localStorage.setItem('reading-entries', JSON.stringify(entries));
  if (books.length) localStorage.setItem('lore-books', JSON.stringify(books));
}

describe('Smoke test', () => {
  it('renders the app without crashing', () => {
    render(React.createElement(App));
    expect(screen.getByText('LOREKEEPER')).toBeTruthy();
  });

  it('renders the Crónicas tab by default', () => {
    render(React.createElement(App));
    expect(screen.getAllByText('Crónicas').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the navigation tabs', () => {
    render(React.createElement(App));
    // Inactive tabs show via aria-label (text label is hidden, only active tab shows it)
    expect(screen.getByRole('tab', { name: 'Plan' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Archivo' })).toBeTruthy();
  });

  it('has skip-to-content link', () => {
    render(React.createElement(App));
    expect(screen.getByText('Saltar al contenido')).toBeTruthy();
  });
});

describe('Stats widgets (Plan tab)', () => {
  beforeEach(() => {
    window.location.hash = '#plan';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('renders ArchivalStats labels when schedule exists', async () => {
    seedLocalStorage({ schedule: [{ week: 1, book: 'Berserk', target: 5 }] });
    render(React.createElement(App));
    expect(await screen.findByText('Semanas Selladas')).toBeTruthy();
    expect(await screen.findByText('Racha Actual')).toBeTruthy();
    expect(await screen.findByText('Tiempo Total')).toBeTruthy();
  });

  it('shows formatted readingTime total in Tiempo Total stat', async () => {
    seedLocalStorage({
      schedule: [{ week: 1, book: 'Berserk', target: 5 }],
      entries: [
        { id: '1', book: 'Berserk', date: '2026-01-01', summary: 'Cap 1', readingTime: 45 },
        { id: '2', book: 'Berserk', date: '2026-01-02', summary: 'Cap 2', readingTime: 30 },
      ],
    });
    render(React.createElement(App));
    // 45 + 30 = 75min → 1h 15m
    expect(await screen.findByText('1h 15m')).toBeTruthy();
  });

  it('shows — for Tiempo Total when no entries have readingTime', async () => {
    seedLocalStorage({
      schedule: [{ week: 1, book: 'Berserk', target: 5 }],
      entries: [
        { id: '1', book: 'Berserk', date: '2026-01-01', summary: 'Cap 1', readingTime: 0 },
      ],
    });
    render(React.createElement(App));
    await screen.findByText('Semanas Selladas');
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('renders activity and habit chart labels when entries exist', async () => {
    seedLocalStorage({
      entries: [
        { id: '1', book: 'Berserk', date: '2026-01-01', summary: 'Cap 1', readingTime: 20 },
      ],
    });
    render(React.createElement(App));
    expect(await screen.findByText('Hábito · Últimas 8 semanas')).toBeTruthy();
    expect(await screen.findByText('Actividad · Últimos 30 días')).toBeTruthy();
  });
});
