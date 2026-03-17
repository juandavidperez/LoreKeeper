import { afterEach } from 'vitest';

// Clean up localStorage and sessionStorage between tests
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
