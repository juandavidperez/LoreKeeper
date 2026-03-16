# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lorekeeper is a reading companion PWA for tracking reading progress, logging entries with metadata (characters, places, glossary, connections), and searching an auto-generated archive. Built with React 19 + Vite 8, styled with Tailwind CSS 4, animated with Framer Motion.

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Production build to `dist/`
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## Architecture

**Entry point**: `index.html` → `src/main.jsx` → `<App />`

**State management**: React Context via `useLorekeeperState` hook (in `src/hooks/`). All app state (books, phases, schedule, entries, completedWeeks) is persisted to localStorage through `useLocalStorage` hook. localStorage keys are prefixed with `lore-` or descriptive names like `reading-entries`, `completed-weeks`, `oracle-replies`.

**Component structure**:
- `src/views/` — Page-level components: `ReadingPlan`, `ReadingLog`, `Encyclopedia`, `EntryForm`
- `src/components/` — Shared UI (`MainLayout` with tab navigation)
- `src/hooks/` — `useLorekeeperState` (context + state logic), `useLocalStorage` (persistence)
- `src/utils/ai.js` — Gemini API integration for metadata extraction and "Oracle" responses, with fallback mocks
- `src/data/mockData.js` — Initial data constants (books, phases, schedule, moods, section types)

**Navigation**: Tab-based (Plan / Log / Archive), managed by `activeTab` state in `App`.

## Key Patterns

- Plain JavaScript (no TypeScript) with JSX
- Dark theme: zinc-950 base, amber-500 accent. Custom fonts: Playfair Display, Inter, Source Serif 4
- Mobile-first with safe-area-bottom for iPhone notch
- PWA with service worker (`public/sw.js`, cache-first strategy) and manifest
- Voice input via Web Speech API (Spanish language)
- Entry metadata sections: characters, places, glossary, world-building notes, connections, manga panels (stored as base64)
- AI features use Gemini API — the API key is expected in the ai.js utility
