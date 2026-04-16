# Technology Stack

LoreKeeper is a modern web and mobile application built with React, Supabase, and Tailwind CSS. It focuses on high-quality visuals and interactive experiences.

## Core Runtime & Languages
- **Runtime:** Node.js (Vite-based development)
- **Languages:** JavaScript (ESM), SQL (Supabase/PostgreSQL)
- **Framework:** React 19.x
- **Build Tool:** Vite 7.x

## Frontend Stack
- **Styling:** Tailwind CSS 4.x (via `@tailwindcss/vite`)
- **Animations:** Framer Motion 12.x
- **Icons:** Lucide React 0.577.x
- **Visualization:** D3.js (via `d3-force`) for network/graph layouts

## Testing & Quality
- **Unit/Integration Testing:** Vitest 4.x
- **UI Testing:** React Testing Library 16.x
- **E2E Testing:** Playwright 1.59.x
- **Linting:** ESLint 9.x

## Mobile & PWA
- **Mobile Wrapper:** Capacitor (detected via `capacitor.config.json` and `android/` directory)
- **PWA:** `vite-plugin-pwa` for offline capabilities and installation

## Infrastructure
- **Hosting:** Vercel (detected via `vercel.json`)
- **Database/Auth:** Supabase (Postgres, Row Level Security)
