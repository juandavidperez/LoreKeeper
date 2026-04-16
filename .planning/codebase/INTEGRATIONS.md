# External Integrations

LoreKeeper relies on several external services and platform integrations to provide its functionality.

## Core Services

### Supabase
- **Role:** Primary backend-as-a-service.
- **Components Used:**
  - **PostgreSQL Database:** Storing project data, lore, and maps.
  - **Authentication:** User signup, login, and session management.
  - **Storage:** Likely used for map assets or character images.
- **Client Library:** `@supabase/supabase-js`.
- **Configuration:** Managed via `.env` variables and `supabase-schema.sql`.

### Vercel
- **Role:** Web hosting and deployment.
- **Configuration:** `vercel.json`.

## Platform Integrations

### Capacitor
- **Role:** Native mobile bridging.
- **Platforms:** Android (and likely iOS, though only `android/` was seen in the root).
- **Configuration:** `capacitor.config.json`.

### Progressive Web App (PWA)
- **Role:** Offline support and "Add to Home Screen" functionality.
- **Plugin:** `vite-plugin-pwa`.

## Data Flows

1. **Client ↔ Supabase:** Direct interaction for data fetching and real-time updates.
2. **Client ↔ Vercel:** Serving the static assets and serverless functions (if any).
3. **App ↔ Native Hardware:** Via Capacitor APIs for mobile-specific features.
