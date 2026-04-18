Compressing manually. Here's caveman version:

# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

## Project Overview

Lorekeeper — reading companion PWA. Track progress, log entries with metadata (characters, places, glossary, quotes, world rules, connections), search auto-generated archive. React 19 + Vite 7, Tailwind CSS 4, Framer Motion.

## Commands

- `npm run dev` — Dev server with HMR
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — Preview production build
- `npm run test` — Vitest single run
- `npm run test:watch` — Vitest watch mode

## Architecture

**Entry point**: `index.html` → `src/main.jsx` → `<App />`

**State management**: React Context via `useLorekeeperState` hook (`src/hooks/`). All state (books, phases, schedule, entries, completedWeeks) persisted to localStorage through `useLocalStorage` hook. Keys prefixed `lore-` or descriptive: `reading-entries`, `completed-weeks`, `oracle-replies`, `lore-entry-draft`.

**Auth & Sync** (optional — degrades gracefully if Supabase env vars absent):
- `src/lib/supabase.js` — Supabase client singleton; returns `null` if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` not set. All auth/sync checks `!!supabase` before executing.
- `useAuth` (`src/hooks/useAuth.js`) — Supabase magic-link auth. Detects first login by checking rows in `books` table; runs one-time backup via `migrateLocalToSupabase` on first sign-in. Redirects to `window.location.origin`.
- `useSync` (`src/hooks/useSync.js`) — Cloud backup context. Exposes `{ status, backup, restore }`. `backup()` full upsert local state to Supabase; `restore()` pulls all data, overwrites local + React state. Auto-backup on tab hidden (`visibilitychange`). 15s timeout.
- `src/utils/syncEngine.js` — `TABLE_MAP` (field transforms between localStorage shape and Supabase columns), `backupToSupabase(userId, localData)`, `restoreFromSupabase(userId)`. Local always source of truth — no merge.
- `src/utils/migration.js` — Reads localStorage directly, calls `backupToSupabase`. Used on first sign-in before React state available.
- `AuthBanner` (`src/components/AuthBanner.jsx`) — Collapsible sign-in/sign-out widget. Email form → magic link → "link sent" state. Only renders if `isConfigured`.
- `SyncIndicator` (`src/components/SyncIndicator.jsx`) — Header icon showing backup status (idle/saving/saved/error/offline). Click triggers manual backup. Only renders if authenticated + configured.

**Component structure**:
- `src/views/` — Page-level: `ReadingPlan`, `ReadingLog`, `Encyclopedia`, `EntryForm`, `OracleView`, `WisdomMap`
- `src/components/` — Shared UI: `MainLayout` (tab nav, offline banner, install banner, landscape compact), `ErrorBoundary`, `ReloadPrompt` (PWA updates), `InstallBanner` (PWA install), `AuthBanner`, `SyncIndicator`, `GlobalSearch`, `OnboardingOverlay`, `ShareQuote`, `ConfirmModal`
- `src/context/` — `ThemeContext.jsx`: `ThemeProvider` + `useTheme()`. `ThemeProvider` wraps `App` in `App.jsx` (not `main.jsx`). localStorage key: `lorekeeper-theme`
- `src/hooks/` — `useLorekeeperState` (context + state + export/import with schema validation), `useLocalStorage` (persistence + shape validation + quota handling), `useNotification` (toasts), `useSpeechRecognition` (voice input + error handling), `useKeyboardShortcuts` (generic shortcut hook), `useNetworkStatus` (online/offline), `useInstallPrompt` (PWA install logic), `useReadingReminder` (dormancy warning + push notification), `useAuth` (Supabase magic-link + first-login backup), `useSync` (cloud backup — backup/restore + auto-backup on tab hide)
- `src/utils/ai.js` — Gemini API with retry/backoff, metadata extraction, "Oracle" responses, fallback mocks
- `src/utils/imageStore.js` — IndexedDB wrapper for manga panel storage (large images outside localStorage)
- `src/utils/mapImages.js` — Map asset preloader + archetype/landmark detection. Assets in `public/assets/map/characters/` and `public/assets/map/landmarks/`. Archetypes: monster, antihero, master, scholar, hero, warrior, creature, person. Detection: tag-based first, name-based fallback.
- `src/data/mockData.js` — Initial data constants (books, phases, schedule, moods, section types)

**Navigation**: Tab-based (Plan / Crónicas / Archivo / Oráculo / Mapa), managed by `activeTab` in `App`. All views lazy-loaded via `React.lazy`/`Suspense`. WisdomMap also embeddable as toggle inside Archivo (Encyclopedia) via map button — both entry points render same `<WisdomMap />`.

## Key Patterns

- Plain JavaScript (no TypeScript) with JSX
- Hooks in `.js` files use `React.createElement` not JSX (avoids `react-refresh/only-export-components` lint error when exporting components + hooks from same file)
- Dark/light theme via `ThemeContext` (`src/context/ThemeContext.jsx`). `useTheme()` exposes `{ theme, toggleTheme }`. Persisted under `lorekeeper-theme`. Defaults to system preference via `prefers-color-scheme`. `ThemeProvider` in `App.jsx`.
- Dark: zinc-950 base, amber-500 accent. Light: parchment tones (#f4ead5 base, amber-700 accent)
- Fonts: Playfair Display, Inter, Source Serif 4 (loaded via `<link>` in `index.html`, not CSS `@import`)
- Mobile-first with safe-area-bottom for iPhone notch
- PWA via vite-plugin-pwa (generateSW, `registerType: 'prompt'`). Manifest from `vite.config.js`. Offline fallback at `public/offline.html`. `ReloadPrompt` handles updates
- Voice input via Web Speech API (Spanish, `es-ES`)
- Entry metadata: characters, places, glossary, quotes, world rules, connections, manga panels (WebP in IndexedDB via `imageStore.js`), `readingTime` (minutes, integer, optional, defaults 0)
- AI: Gemini API, 2 retries + exponential backoff. Key via `VITE_GEMINI_API_KEY` or proxy `VITE_API_PROXY_URL`. Falls back to mocks. Warns prod if key exposed without proxy. See `.env.example`
- Form auto-save: drafts to `lore-entry-draft` (debounced 500ms), cleared on save/cancel
- `beforeunload` warning on unsaved EntryForm changes
- Pagination: ReadingLog + Encyclopedia show 20 items, "load more" button
- `React.memo` on `LogCard` and `EntityCard`
- Export/Import: JSON backup from Plan Maestro header (Download/Upload icons). Import has schema validation + confirmation
- Unique IDs via `uid()` (timestamp + counter + random) not `Date.now()`
- Shortcuts: Cmd+K (search), Cmd+1–5 (tabs: Plan/Crónicas/Archivo/Oráculo/Mapa)
- Offline banner: `useNetworkStatus` monitors `online`/`offline`. When offline, `MainLayout` shows fixed banner ("El Éter guarda silencio · sin conexión") with `WifiOff` icon
- PWA install: `useInstallPrompt` captures `beforeinstallprompt`. `InstallBanner` shows CTA for Android (native) and iOS (manual). Dismissed state in `lore-install-dismissed`
- Landscape compact: `MainLayout` listens `(orientation: landscape) and (max-height: 500px)`. Header + nav shrink to 2.5rem
- Back gesture: swipe left/right on `<main>` navigates tabs (touch handlers in `MainLayout`)
- Haptic: `navigator.vibrate?.()` on mic button (20ms) and week sealing ([10, 60, 25])
- Reminders: `useReadingReminder(entries)` from `AppContent`. Warns if dormant 2+ days. Checks every minute if past reminder time (`lore-reminder-time`, default `21:00`), fires push via `navigator.serviceWorker.ready` if no entry today. Midnight resets flag. Enabled via `lore-reminder` (`'1'`). Time picker in `MainLayout`.

## Data Validation

- **localStorage shape** (`useLocalStorage`): validates array keys (`lore-books`, `reading-entries`, etc.) have proper shapes on load. Falls back to defaults if corrupted
- **Import schema** (`useLorekeeperState.importData`): validates top-level object, array fields, book titles, entry IDs
- **EntryForm**: validates book selection, non-empty names for characters/places/glossary/rules, non-empty quotes, requires summary or ≥1 knowledge item
- **Phase**: end week >= start week
- **Cascade delete**: deleting book prompts to delete associated entries

## Accessibility

- Skip-to-content link (visible on keyboard focus)
- `role="tablist"` / `role="tab"` / `aria-selected` on tab navigations
- `aria-label` on icon-only buttons (save, cancel, delete, mic, export, import)
- `aria-expanded` on collapsible sections (EntitySection toggles)
- `aria-label` on search inputs
- `htmlFor`/`id` on form labels (Libro, Ubicación, Reingreso, Tiempo de lectura)
- Focus moves to `<main>` on tab switch
- `<noscript>` fallback in `index.html`
- Min contrast: `--text-muted` = `#a1a1aa` (~6.3:1 on dark bg). Avoid `text-zinc-600`+
- Global `focus-visible` amber outline on interactives
- Min touch targets: `p-3`/`p-2.5` on form buttons
- Descriptive `alt` on manga panel images
- `loading="lazy"` on manga `<img>` tags

## Testing

**Framework**: Vitest + jsdom + @testing-library/react

**Test files** (`src/__tests__/`):
- `setup.js` — Clears localStorage/sessionStorage after each test; stubs `window.matchMedia`
- `useLocalStorage.test.js` — 14 tests: read/write, initialValue, updaters, corrupted JSON, shape validation, quota errors
- `aggregateEntities.test.js` — 9 tests: empty, single/multi aggregation, dedup, tag merge, cross-book
- `importData.test.js` — 28 tests: valid/partial data, invalid JSON, null/array top-level, field types, book/entry validation, readingTime (string/null/boolean rejected, float→round, negative→0, absent→0)
- `callGemini.test.js` — 12 tests: success, 4xx fail, 429/500 retries, network retries, backoff, mocks
- `entryFormValidation.test.js` — 14 tests: valid entry, missing book, empty names/quotes, no content, metadata-only
- `smokeTest.test.jsx` — 8 tests: renders, default tab, nav tabs, skip-to-content; + 4 stats tests (ArchivalStats labels, Tiempo Total formatted, — when no readingTime, HabitGraph/ActivityGrid labels). Uses `seedLocalStorage` to suppress OnboardingOverlay.
- `syncEngine.test.js` — 9 tests: entry field mappings (readingTime↔reading_time, summary, worldRules↔world_rules, JSONB null defaults), phase mappings (desc↔description)
- `migration.test.js` — 2 tests: error when supabase null or userId null

**Notes**:
- Validation logic extracted/replicated in tests, not full React rendering
- `vi.useFakeTimers()` for backoff tests; real timers for exhausted-retry (avoids unhandled rejections)
- Smoke test uses `Proxy`-based framer-motion mock covering all `motion.*` tags, not only `motion.div`
- Nav tab test uses `getByRole('tab', { name })` — inactive tabs expose label only via `aria-label`

## Stats & Visualizations

Stats in `ReadingPlan` view (Plan tab), below header when not editing and `schedule.length > 0`.

- **`ArchivalStats`** — 4-stat grid (cols-2 mobile / cols-4 sm): Semanas Selladas, Racha Actual (✦ + streak), Progreso %, Tiempo Total (sum `entry.readingTime`). Streak: unique sorted dates reversed, starts from today/yesterday. Format: `Xh Ym` / `Xm` / `—`.
- **`ActivityGrid`** — 30-day dot grid (`grid-cols-30`). Amber = entry day, amber/50 = past active, stone = none. Shown when `entries.length > 0`.
- **`HabitGraph`** — 8-week bar chart (CSS height %). Current week full amber + glow; past amber/40; zero = 4px stub. Count above non-zero bars. Shown when `entries.length > 0`.
- **`BookStats`** — Per-book horizontal bars (≥1 entry). If any `readingTime > 0`, bars = time; else entry count. Shows last entry date, total entries, formatted time. Bar color = `book.color`. Shown when `entries.length > 0`.
- **readingTime inline edit (LogCard)** — Card header shows `Clock` chip. If `readingTime > 0`, formatted amber time; if 0, `+` on hover. Tap opens inline input (auto-focus); blur/Enter commits via `onUpdateTime`; Escape cancels. Updates in-place via `setEntries` without EntryForm.

## Onboarding

`OnboardingOverlay` (`src/components/OnboardingOverlay.jsx`) — 4-step modal on first visit (`lore-onboarding-done` absent).

- **Step I** "El Grimorio Despierta" — intro, animated feather
- **Step II** "Los Cinco Rituales" — lists 5 tabs: Plan Maestro, Crónicas, Archivo, Oráculo, Mapa de Sabiduría
- **Step III** "La Primera Crónica" — mock entry card, mentions readingTime
- **Step IV** "El Oráculo Aguarda" — oracle glow + CTA

`AnimatePresence` for direction-aware slides. Clickable dots to jump. Bottom sheet on mobile (rounded-t-xl), centered modal on sm+. CSS variables (`bg-header-bg`, `text-muted`) — no hardcoded colors.

## Pending Work

### Infrastructure
- **E2E tests** — None yet (Playwright/Cypress)
- **Supabase RLS** — Defined in `supabase-schema.sql` for all tables. Must be applied via Supabase SQL Editor if not already run.

### Features
- **Restore UI** — `useSync` exposes `restore()` but no UI surface to trigger it. No user-facing restore.
- **Social/sharing** — `ShareQuote` shares via `navigator.share` (mobile) or clipboard (desktop). No full entry/progress sharing.
- **i18n** — All UI hardcoded Spanish. No i18n system.
- **Wisdom Map** — SVG map of characters/places. Working: deterministic layout + collision resolution, archetype detection, pan/zoom, book filter, tooltip, co-occurrence lines ("hilos"), conversation history. Pending: d3-force layout, landmark clustering.

### Technical Improvements
- **Data retention** — Oracle history capped at 10 conversations. localStorage can fill with entries + manga refs. IndexedDB orphaned panels pruned on app mount via `pruneOrphanedPanels` in `imageStore.js`; no proactive cleanup for entry data itself.
- **WisdomMap images** — Characters use parchment-bg PNGs. Need transparent-bg versions (remove.bg or similar).

## Design Context

### Usuarios
Juan David, lector habitual de manga y novelas ligeras. Usa LoreKeeper como un diario de lectura personal e íntimo para registrar progreso, personajes, lugares y reglas del mundo narrativo ("Lore"). Aunque es personal, el diseño debe ser sólido y coherente para uso externo sin fricción.

**Job to be done**: Capturar el conocimiento del mundo narrativo antes de que se olvide. La app es un grimorio vivo que crece con cada sesión de lectura.

### Personalidad de Marca
**Solemne · Vivo · Íntimo**

Voz de un archivero anciano — serio pero apasionado por los descubrimientos. No es frío ni casual. El acto de leer merece rituales.
**Vocabulario canónico**: Crónicas (entradas), El Archivo (enciclopedia), Oráculo (IA), SELLADO (completado), Forjar, Invocar, Desvanecer, el Éter (red).

### Dirección Estética
- **Canónico**: Grimorio dorado sobre fondo oscuro o pergamino medieval.
- **Aesthetic Link**: La vista de `ReadingLog` es el modelo ideal de diseño actual.
- **Modo Oscuro**: `#0c0a08` base, `#f59e0b` acento ámbar sagrado.
- **Modo Claro (Referencia)**: `#f4ead5` pergamino, `#b45309` ámbar oscuro — paleta líder.
- **Tipografía**: Playfair Display (títulos), Inter (UI), Source Serif 4 (cuerpo).

**Anti-referencias**:
- ❌ Apps de productividad genéricas (Notion, Todoist).
- ❌ Dashboards corporativos (métricas frías).
- ❌ Estética anime/gaming (neón, HUD, brillo excesivo).
- ❌ Social media / feed (cards infinitas).

### Principios de Diseño
1. **El Ámbar es Sagrado.** Solo para estado activo, acción primaria y momentos de logro. Nunca decoración genérica.
2. **La UI es Narrativa.** Cada string, gesto y estado vacío debe coincidir con el vocabulario del grimorio.
3. **Normalización de Saberes.** Priorizar la consistencia textual y visual en todas las vistas de la aplicación.
4. **El Pergamino Lidera.** El modo pergamino es la referencia para evaluar cualquier decisión del sistema de diseño.
5. **Rituales, no Confeti.** Las animaciones y estados de éxito deben tener solemnidad orgánica, no urgencia digital.