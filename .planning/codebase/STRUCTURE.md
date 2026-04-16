# Project Structure

LoreKeeper is organized as a Vite-powered React project with a clear separation between logic, components, and views.

## Root Directory layout

- `.agent/`, `.agents/`, `.claude/`: AI-related configurations and skills.
- `android/`: Native Android project files for Capacitor.
- `api/`: Serverless functions or backend logic (likely Vercel-bound).
- `docs/`: Project documentation.
- `public/`: Static assets (images, favicon, manifest).
- `src/`: Main source code.
- `supabase-schema.sql`: Database schema definition for Supabase.

## Source Code Layout (`src/`)

- `main.jsx`: Application entry point.
- `App.jsx`: Root component and routing logic.
- `index.css`: Global styles (Tailwind 4 + custom CSS).
- `__tests__/`: Global test files.
- `assets/`: UI assets (logos, images).
- `components/`:
  - UI components (Button, Card, etc.).
  - Layout components (`MainLayout`).
  - Feature-specific components (`ReloadPrompt`, `ErrorBoundary`).
- `context/`: React Context definitions (e.g., `ThemeProvider`).
- `data/`: JSON constants or static lore data.
- `hooks/`: Custom React hooks for business logic and data fetching.
- `lib/`: Third-party library initializations (e.g., `supabase.js`).
- `utils/`: Reusable helper functions (formatting, storage, math).
- `views/`: Page-level components (lazy-loaded).

## Key Files
- `src/lib/supabase.js`: Supabase client initialization.
- `src/hooks/useLorekeeperState.js`: Main state management hook.
- `src/views/WisdomMap.jsx`: D3.js visualization container.
- `vite.config.js`: Build and plugin configuration.
- `capacitor.config.json`: Mobile bridge settings.
