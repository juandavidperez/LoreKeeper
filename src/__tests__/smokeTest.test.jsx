import { describe, it, expect, vi } from 'vitest';
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
