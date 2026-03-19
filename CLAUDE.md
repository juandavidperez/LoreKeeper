# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lorekeeper is a reading companion PWA for tracking reading progress, logging entries with metadata (characters, places, glossary, quotes, world rules, connections), and searching an auto-generated archive. Built with React 19 + Vite 7, styled with Tailwind CSS 4, animated with Framer Motion.

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — Preview production build
- `npm run test` — Run Vitest test suite (single run)
- `npm run test:watch` — Run Vitest in watch mode

## Architecture

**Entry point**: `index.html` → `src/main.jsx` → `<App />`

**State management**: React Context via `useLorekeeperState` hook (in `src/hooks/`). All app state (books, phases, schedule, entries, completedWeeks) is persisted to localStorage through `useLocalStorage` hook. localStorage keys are prefixed with `lore-` or descriptive names like `reading-entries`, `completed-weeks`, `oracle-replies`, `lore-theme`, `lore-entry-draft`.

**Component structure**:
- `src/views/` — Page-level components: `ReadingPlan`, `ReadingLog`, `Encyclopedia`, `EntryForm`
- `src/components/` — Shared UI (`MainLayout` with tab navigation, theme toggle, `ErrorBoundary`, `ReloadPrompt` for PWA updates)
- `src/hooks/` — `useLorekeeperState` (context + state logic + export/import with schema validation), `useLocalStorage` (persistence with shape validation and quota error handling), `useNotification` (toast system), `useSpeechRecognition` (voice input with error handling), `useKeyboardShortcuts` (generic keyboard shortcut hook)
- `src/utils/ai.js` — Gemini API integration with retry/backoff, metadata extraction and "Oracle" responses, with fallback mocks
- `src/utils/imageStore.js` — IndexedDB wrapper for manga panel image storage (saves large images outside localStorage)
- `src/data/mockData.js` — Initial data constants (books, phases, schedule, moods, section types)

**Navigation**: Tab-based (Plan / Log / Archive), managed by `activeTab` state in `App`.

## Key Patterns

- Plain JavaScript (no TypeScript) with JSX
- Hooks in `.js` files use `React.createElement` instead of JSX (to avoid `react-refresh/only-export-components` lint error when exporting both components and hooks from the same file)
- Dark/light theme via CSS custom properties in `index.css`. Theme toggled via `.light` class on root div. Uses `useLocalStorage('lore-theme')` for persistence. Defaults to system preference via `prefers-color-scheme`
- Dark theme: zinc-950 base, amber-500 accent. Light theme: parchment tones (#f4ead5 base, amber-700 accent)
- Custom fonts: Playfair Display, Inter, Source Serif 4 (loaded via `<link>` in `index.html`, not CSS `@import`)
- Mobile-first with safe-area-bottom for iPhone notch
- PWA with vite-plugin-pwa (generateSW mode, `registerType: 'prompt'`). Manifest generated from `vite.config.js`. Offline fallback page at `public/offline.html`. `ReloadPrompt` component handles update notifications
- Voice input via Web Speech API (Spanish language, `es-ES`)
- Entry metadata sections: characters, places, glossary, quotes, world rules, connections, manga panels (compressed to WebP, stored in IndexedDB via `imageStore.js`)
- AI features use Gemini API with retry (2 retries, exponential backoff). API key via `VITE_GEMINI_API_KEY` or proxy via `VITE_API_PROXY_URL`. Falls back to mock responses if neither is set. Warns in production if API key is exposed without proxy. See `.env.example`
- Form auto-save: new entries save drafts to `lore-entry-draft` in localStorage (debounced 500ms), cleared on save/cancel
- `beforeunload` warning when EntryForm has unsaved changes
- Pagination: ReadingLog and Encyclopedia show 20 items at a time with "load more" button
- `React.memo` on `LogCard` and `EntityCard` to avoid unnecessary re-renders
- Export/Import: JSON backup available from Plan Maestro header (Download/Upload icons). Import includes schema validation and confirmation dialog
- Unique entry IDs via `uid()` function (timestamp + counter + random) instead of `Date.now()`
- Keyboard shortcuts: Cmd+K (focus search), Cmd+1/2/3 (tab switching)

## Data Validation

- **localStorage shape validation** (`useLocalStorage`): validates that array keys (`lore-books`, `reading-entries`, etc.) contain proper shapes on load. Falls back to defaults if corrupted
- **Import schema validation** (`useLorekeeperState.importData`): validates top-level object, array fields, book titles, entry IDs before importing
- **EntryForm validation**: validates book selection, non-empty names for characters/places/glossary/rules, non-empty quotes, requires at least summary or one knowledge item
- **Phase validation**: validates that end week >= start week in reading plan phases
- **Cascade delete**: deleting a book prompts to also delete associated entries

## Accessibility

- Skip-to-content link (visible on keyboard focus)
- `role="tablist"` / `role="tab"` / `aria-selected` on all tab navigations
- `aria-label` on icon-only buttons (save, cancel, delete, mic, export, import)
- `aria-expanded` on collapsible sections (EntitySection toggle buttons)
- `aria-label` on search inputs
- `htmlFor`/`id` associations on form labels (Libro, Ubicación, Reingreso)
- Focus moves to `<main>` when switching tabs
- `<noscript>` fallback in `index.html`
- Minimum contrast: `--text-muted` is `#a1a1aa` (~6.3:1 ratio on dark bg). Avoid `text-zinc-600`+ for readable text
- Global `focus-visible` styles with amber outline on interactive elements
- Minimum touch targets: `p-3`/`p-2.5` on form buttons
- Descriptive `alt` on manga panel images
- `loading="lazy"` on manga panel `<img>` tags

## Testing

**Framework**: Vitest + jsdom + @testing-library/react

**Test files** (`src/__tests__/`):
- `setup.js` — Clears localStorage/sessionStorage after each test
- `useLocalStorage.test.js` — 14 tests: read/write, initialValue, updater functions, corrupted JSON, shape validation for books/entries, quota error handling
- `aggregateEntities.test.js` — 9 tests: empty entries, single/multi entry aggregation, deduplication, tag merging, cross-book aggregation
- `importData.test.js` — 16 tests: valid data, partial data, invalid JSON, null/array top-level, field type validation, book/entry field validation
- `callGemini.test.js` — 12 tests: success, 4xx immediate fail, 429/500 retries, network error retries, exponential backoff, mock responses
- `entryFormValidation.test.js` — 14 tests: valid entry, missing book, empty names, empty quotes, no content, entries with only metadata
- `smokeTest.test.jsx` — 4 tests: app renders, default tab, navigation tabs, skip-to-content link (mocks framer-motion and virtual:pwa-register/react)

**Notes**:
- Pure validation logic is extracted/replicated in tests rather than testing full React rendering
- `vi.useFakeTimers()` for testing exponential backoff; real timers for exhausted-retry tests to avoid unhandled rejections
- Smoke test uses `filterProps` helper to strip framer-motion props from mocked components

## Pending Work

### Infrastructure
- **Cloud backup** — Not implementable without external infrastructure (OAuth + Google Drive/Dropbox API)
- **E2E tests** — No end-to-end tests yet (Playwright/Cypress)

### Features
- **Auth/multi-user** — Everything is local, single user. No authentication system
- **Push notifications** — PWA has offline support but no reading reminders
- **Advanced stats/visualizations** — Has streaks and weekly progress, but no reading time charts, habit graphs, or richer visualizations
- **Social/sharing** — No way to share entries, quotes, or progress
- **Oracle history** — Oracle generates responses but there's no navigable conversation history with the AI
- **i18n** — All UI is hardcoded in Spanish. No internationalization system
- **Onboarding/tutorial** — No guide for new users explaining features

### Technical Improvements
- **Lazy loading routes** — All views load at once (no `React.lazy`/`Suspense`)
- **Manifest screenshots** — `screenshots` field in PWA manifest is empty (improves Android install experience)
- **Data retention policy** — localStorage can fill up with no automatic cleanup
- **Better API error UX** — When Gemini API retries are exhausted, user only sees a generic error

## Design Context

### Users
Juan David, lector habitual de manga y novelas ligeras. Usa LoreKeeper como diario de lectura personal: registra progreso semanal, personajes, lugares, citas y reglas del mundo narrativo. Contexto de uso íntimo — abre el app mientras lee o justo después de un capítulo. Las decisiones deben escalar para un segundo usuario sin contexto previo.

**Job to be done**: Capturar el conocimiento del mundo narrativo antes de que se olvide. El app es un grimorio vivo que crece con cada sesión de lectura.

### Brand Personality
**Solemne · Vivo · Íntimo**

La voz es la de un archivero anciano que toma su oficio en serio pero se emociona con los descubrimientos. No frío ni burocrático; no casual ni juguetón. El acto de leer merece rituales.

**Vocabulario canónico**: Crónicas (entradas), El Archivo (enciclopedia), Oráculo (IA), SELLADO (completado), Forjar, Invocar, Desvanecer, el Éter (red).

### Aesthetic Direction
- **Canónico**: Grimorio dorado — amber sobre fondo oscuro o pergamino medieval
- **Dark**: `#0c0a08` base, `#f59e0b` amber acento sagrado
- **Light (preferida)**: `#f4ead5` pergamino, `#b45309` amber oscuro — paleta más auténtica, debe liderar las decisiones de diseño
- **Tipografía**: Playfair Display (títulos), Inter (UI), Source Serif 4 (cuerpo)
- **Modelo estético**: La página `offline.html` (Archivo Silencioso) con doble borde manuscrito está más cerca del ideal que el app principal

**Anti-referencias**:
- ❌ Apps de productividad genéricas (Notion plain, Todoist)
- ❌ Dashboards corporativos (métricas frías, gráficas de barra)
- ❌ Estética anime/gaming (neon, glow, HUD)
- ❌ Social media / feed (cards infinitas, espacio público)

### Design Principles
1. **El amber es sagrado** — reservar exclusivamente para: estado activo, acción primaria, momentos de logro. No usarlo como decoración genérica.
2. **La UI es parte del mundo narrativo** — cada string, gesto y estado vacío debe ser coherente con el vocabulario del grimorio. La experiencia de usar el app es extensión de leer.
3. **El contenido primero, el chrome mínimo** — en mobile, reducir capas de navegación sticky es prioridad funcional y estética.
4. **El pergamino lidera** — el light mode parchment es la paleta de referencia desde la que se evalúa el sistema de diseño.
5. **Los momentos de deleite son rituales, no confeti** — animaciones y micro-interactions con solemnidad, no urgencia. Una semana sellada merece pausa, no bounce.
