import { afterEach } from 'vitest';

// jsdom doesn't implement window.matchMedia — provide a stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Clean up localStorage and sessionStorage between tests
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
