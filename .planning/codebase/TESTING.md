# Testing Practices

LoreKeeper follows a dual-testing strategy covering unit/integration tests and end-to-end (E2E) flows.

## Test Stack
- **Unit/Integration:** Vitest + React Testing Library.
- **E2E:** Playwright.
- **Environment:** JSDOM for unit tests.

## Test Structure

### Unit & Integration Tests (`src/__tests__/`)
- Focused on component behavior and utility functions.
- Uses `vitest` as the runner.
- Pattern: `[FeatureName].test.jsx` or similar.

### End-to-End Tests (`e2e/`)
- Focused on high-level user flows (e.g., "reading flow").
- Tool: Playwright.
- Config: `playwright.config.js`.
- Key Scenarios: `reading-flow.spec.js`.
- **Base URL:** `http://localhost:5173`.
- **Parallelism:** Enabled.

## Running Tests
- `npm test`: Runs Vitest in one-shot mode.
- `npm run test:watch`: Runs Vitest in watch mode.
- `npm run test:e2e`: Runs Playwright tests.

## Testing Guidelines
- **Components:** Verify user interactions (clicks, input) and DOM updates using React Testing Library.
- **Logic:** Test utility functions for edge cases.
- **Mocks:** Vitest mocks likely used for Supabase and other external dependencies.
