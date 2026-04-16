# Technical Concerns

Analysis of potential risks, technical debt, and areas requiring attention in the LoreKeeper codebase.

## Technical Debt & Fragility

### Custom Hash-Based Routing
- **Location:** `src/App.jsx`
- **Issue:** The project uses a manual `window.location.hash` listener for routing. While lightweight, it lacks features like nested routing, robust search param handling, and scroll restoration provided by libraries like `react-router-dom`.

### Manual Data Synchronization
- **Location:** `src/hooks/useSync.js` (referenced in `App.jsx`)
- **Issue:** Hand-rolling synchronization logic (SyncProvider) is notoriously difficult to get right, especially regarding conflict resolution, offline-to-online transitions, and race conditions.

### Graph Visualization Complexity
- **Location:** `src/views/WisdomMap.jsx`
- **Issue:** The D3 force-directed graph is a powerful but highly imperative piece of the UI. This can lead to maintenance challenges when adding new interactive features or ensuring the graph remains performant with hundreds of nodes.

## Performance Considerations

### Large JSON Fields in DB
- **Location:** `supabase-schema.sql` (entries table)
- **Issue:** Storing `quotes`, `characters`, `places`, `glossary`, `world_rules`, and `connections` as `jsonb` within a single `entries` record is convenient but could lead to performance bottlenecks if a single log entry becomes massive.

### Image Management
- **Issue:** While there is a `pruneOrphanedPanels` utility, managed assets in Supabase Storage need careful tracking to avoid storage leaks if users delete entries.

## Security Audit

### Row Level Security (RLS)
- **Status:** **Strong**. Policies are implemented for all public tables and storage buckets, ensuring `auth.uid() = user_id`.

### Client-Side Validation
- **Status:** Needs verification. The codebase seems to rely heavily on Supabase RLS for safety; however, ensuring frontend validation logic matches DB constraints is crucial for a smooth UX.

## Mobile Implications
- **Capacitor Build Process:** Having a native `android/` folder in the root adds platform-specific build dependencies (Gradle, Android Studio) which increases the complexity for new developers onboarding to the project.
