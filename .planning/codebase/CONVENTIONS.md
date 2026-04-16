# Coding Conventions

LoreKeeper maintains a consistent coding style focused on modern React patterns and clean module boundaries.

## General Patterns
- **Module System:** ES Modules (`import`/`export`).
- **Components:** Functional components using React Hooks (`useState`, `useCallback`, `useEffect`).
- **Styling:** Tailwind CSS 4 utility-first approach. Styles are grouped in `className` props.
- **Entry Points:** Main entry is `src/main.jsx`.

## Naming Conventions
- **Components:** PascalCase (e.g., `WisdomMap.jsx`, `MainLayout.js`).
- **Hooks:** starts with `use` (e.g., `useLorekeeperState.js`, `useNotification.js`).
- **Utilities:** camelCase (e.g., `pruneOrphanedPanels`).
- **Files:** Mostly camelCase or kebab-case, except for components which use PascalCase.

## Code Style & Linting
- **Linting:** Managed by ESLint 9.x with a flat config (`eslint.config.js`).
- **Rules:** 
  - `no-unused-vars` error except for variables starting with uppercase (often used for components or constants).
  - Recommended React Hooks and React Refresh plugins.

## Error Handling
- **Global:** `ErrorBoundary` component wraps the entire `App` in `src/main.jsx`.
- **Local:** Catch blocks used in utility side-effects (e.g., `pruneOrphanedPanels`).

## Data Fetching & Sync
- **Supabase:** Centralized client in `src/lib/supabase.js`.
- **Hooks:** Custom hooks (`useSync`, `useLorekeeperState`) manage data orchestration.
