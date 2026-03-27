import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement('div', { ...filterProps(props), ref }, children)
    ),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

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

function filterProps(props) {
  const filtered = {};
  for (const [key, value] of Object.entries(props)) {
    if (!['initial', 'animate', 'exit', 'transition', 'layoutId', 'whileHover', 'whileTap'].includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

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
    expect(screen.getByText('Plan')).toBeTruthy();
    expect(screen.getByText('Archivo')).toBeTruthy();
  });

  it('has skip-to-content link', () => {
    render(React.createElement(App));
    expect(screen.getByText('Saltar al contenido')).toBeTruthy();
  });
});
