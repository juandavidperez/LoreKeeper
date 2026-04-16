# Architecture

LoreKeeper follows a modern, component-based single-page application (SPA) architecture built with React 19.

## System Patterns

### Core Pattern: Layered Context-Driven Architecture
The application uses a hierarchy of React Context providers to manage global concerns (Auth, Theme, Notifications, Sync, and Domain State) before rendering the main UI.

### Routing
- **Method:** Hash-based routing (`window.location.hash`).
- **Implementation:** Custom logic in `App.jsx` using `useState` and `useCallback` to manage the `activeTab`.
- **Views:** Lazy-loaded using `React.lazy` and `Suspense` for performance optimization.

## Key Layers

1.  **Providers Layer (`src/App.jsx` + `src/hooks/` + `src/context/`):**
    -   `ThemeProvider`: UI theme state.
    -   `NotificationProvider`: Global alert system.
    -   `AuthProvider`: Supabase authentication state.
    -   `LorekeeperProvider`: Core domain state (entries, lore).
    -   `SyncProvider`: Handling data synchronization with Supabase.

2.  **Layout Layer (`src/components/MainLayout.jsx`):**
    -   Handles the persistent UI shell (sidebar/tabs).
    -   Wraps the active view.

3.  **View Layer (`src/views/`):**
    -   `ReadingPlan`: Curated lists of content.
    -   `ReadingLog`: The primary user diary/log.
    -   `Encyclopedia`: Reference material and connected entities.
    -   `OracleView`: AI-driven or search-driven exploration.
    -   `WisdomMap`: Visual representation (D3-based).

4.  **Logic Layer (`src/hooks/` & `src/utils/`):**
    -   Custom hooks encapsulate business logic (e.g., `useLorekeeperState`).
    -   Utilities handle side effects like local storage pruning (`src/utils/imageStore.js`).

## Data Flow
1.  **Persistence:** Supabase (Remote) + LocalStorage (Local Sync).
2.  **State Management:** React Context API + `useLorekeeperState` hook.
3.  **Events:** Prop-drilling for view-level interactions (e.g., `onNavigateToEntity`).
