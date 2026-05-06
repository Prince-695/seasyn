# SEASYN — Frontend Product Requirements Document (PRD)

**Version:** 1.1  
**Framework:** React 18 + Vite 5  
**Styling:** Tailwind CSS + shadcn/ui  
**State:** Zustand + TanStack Query v5  
**Router:** React Router v6  
**Structure:** Standard single-app repository  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Structure Decision — Why Standard React + Vite](#2-structure-decision--why-standard-react--vite)
3. [Tech Stack Decisions](#3-tech-stack-decisions)
4. [Project Structure](#4-project-structure)
5. [Application Architecture](#5-application-architecture)
6. [Pages & Routes Specification](#6-pages--routes-specification)
7. [Component Specifications](#7-component-specifications)
8. [State Management Design](#8-state-management-design)
9. [API Integration Layer](#9-api-integration-layer)
10. [Design System](#10-design-system)
11. [Security on the Frontend](#11-security-on-the-frontend)
12. [Performance Requirements](#12-performance-requirements)
13. [Testing Requirements](#13-testing-requirements)
14. [Non-Functional Requirements](#14-non-functional-requirements)

---

## 1. Executive Summary

SEASYN's frontend is a **React 18 + Vite 5 single-page application** that provides:

1. A **Dashboard** for managing projects and migration jobs
2. A **Connection Wizard** for inputting database credentials (never stored)
3. A **Migration Studio** for configuring and monitoring migrations in real-time
4. A **Database Editor** for CRUD operations on live databases

The frontend lives in a single, self-contained repository with no monorepo tooling. This keeps the setup fast to understand, easy to deploy, and free of unnecessary complexity for a project at this stage. Everything — components, API layer, types, stores — lives in one `src/` directory with clear internal conventions.

**Critical frontend principle:** Credentials entered by users exist **only in component state** during a session. They are sent directly to the backend per-request and never written to `localStorage`, `sessionStorage`, cookies, or any persistent browser storage.

---

## 2. Structure Decision — Why Standard React + Vite

### Verdict: Standard React + Vite, single repository

### Why Vite over Next.js

SEASYN's frontend has no need for server-side rendering or static site generation at this stage. The entire app is behind authentication — search engines do not index it, and there is no public-facing content that needs SEO. Next.js would add complexity (server components, route handlers, build-time vs runtime behavior) without any benefit.

Vite gives:
- Near-instant dev server startup (under 500ms)
- Lightning-fast hot module replacement
- Simple, predictable build output (static files)
- Zero server to maintain — deploy to any CDN or object storage

### Why NOT a monorepo

A monorepo makes sense when multiple separate applications need to share code. SEASYN currently has one frontend application. Adding Turborepo or pnpm workspaces for a single app introduces extra tooling to learn and maintain, workspace linking errors that can waste hours, more config files, and a steeper onboarding experience for contributors.

When SEASYN grows to need a CLI or a separate docs site, migrating from a standard repo to a monorepo is a one-day task. Building on top of unnecessary monorepo tooling from day one is a permanent cost with no current payoff.

### Trade-offs accepted

| Trade-off | Mitigation |
|-----------|-----------|
| Types not shared with a future CLI | Types isolated in `src/types/` — easy to extract to a package later |
| No cross-package build caching | Vite's native build is fast enough for this project size |
| Single `package.json` | Actually a benefit — clear, auditable dependency list |

---

## 3. Tech Stack Decisions

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | React 18 | Stable, best ecosystem, hooks-based |
| Build Tool | Vite 5 | Fast dev server, native ESM, minimal config |
| Language | TypeScript 5.x (strict mode) | No `any`, catches bugs at compile time |
| Package Manager | npm (or pnpm) | No workspace features needed |
| Routing | React Router v6 | Industry standard SPA routing |
| Styling | Tailwind CSS v3 | Utility-first, excellent with shadcn |
| Component Library | shadcn/ui | Copy-paste Radix UI components, full ownership |
| Icons | Lucide React | Consistent, tree-shakeable |
| Server State | TanStack Query v5 | Caching, background refetch, optimistic updates |
| Client State | Zustand | Minimal boilerplate, TypeScript-native |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders |
| Tables | TanStack Table v8 | Headless, composable with shadcn |
| SSE | Native `EventSource` | Browser-native, no library needed |
| HTTP Client | Axios (thin wrapper) | Interceptors for auth + error normalization |
| Testing | Vitest + Testing Library | Fast, Vite-native, Jest-compatible API |
| E2E | Playwright | Cross-browser, reliable |
| Linting | ESLint + Prettier | Standard TypeScript rules |

---

## 4. Project Structure

```
seasyn-frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
│
├── src/
│   ├── main.tsx                     # Entry point (ReactDOM.createRoot)
│   ├── App.tsx                      # Root component: router + providers
│   │
│   ├── types/                       # All TypeScript interfaces and types
│   │   ├── database.ts              # DBType, ConnectionConfig, Schema, ColumnSchema
│   │   ├── migration.ts             # MigrationJob, MigrationStatus, MigrationOptions
│   │   ├── project.ts               # Project, ConnectionMeta
│   │   ├── auth.ts                  # User, AuthState
│   │   └── index.ts                 # Re-exports all types
│   │
│   ├── api/                         # All backend communication lives here
│   │   ├── client.ts                # Axios instance + request/response interceptors
│   │   ├── auth.ts                  # Login, register, refresh, logout, me
│   │   ├── projects.ts              # CRUD for projects
│   │   ├── migrations.ts            # Start, status, cancel, list migrations
│   │   ├── editor.ts                # Query, insert, update, delete via editor
│   │   ├── schema.ts                # Schema inspect, table list, preview
│   │   └── index.ts                 # Re-exports all api modules
│   │
│   ├── store/                       # Zustand stores (client-only state)
│   │   ├── authStore.ts             # Authenticated user metadata
│   │   ├── migrationWizardStore.ts  # Wizard state — NO persist middleware
│   │   └── uiStore.ts               # Sidebar, theme — persisted safely
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useMigrationSSE.ts       # EventSource subscription for live progress
│   │   ├── useConnectionTest.ts     # Test-connection mutation + state management
│   │   ├── useSchema.ts             # TanStack Query hook: schema inspection
│   │   ├── useProjects.ts           # TanStack Query hooks: projects CRUD
│   │   └── useMigrations.ts         # TanStack Query hooks: migrations
│   │
│   ├── lib/                         # Pure utilities (no side effects)
│   │   ├── queryClient.ts           # TanStack QueryClient configuration
│   │   ├── queryKeys.ts             # Query key factory functions
│   │   ├── validators.ts            # Zod schemas for all forms
│   │   ├── typeMapping.ts           # DBType -> display name, icon, color helpers
│   │   └── formatters.ts            # Duration, row counts, date display
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui base components (auto-generated via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── slider.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx        # Sidebar + header shell for protected pages
│   │   │   ├── Sidebar.tsx          # Navigation links, logo, collapse toggle
│   │   │   ├── Header.tsx           # User avatar, breadcrumb, theme toggle
│   │   │   └── ProtectedRoute.tsx   # Redirects unauthenticated users to /login
│   │   │
│   │   ├── connection/
│   │   │   ├── ConnectionForm.tsx   # Universal DB connection input form
│   │   │   ├── DBTypeSelector.tsx   # PostgreSQL / MySQL / MongoDB / SQLite picker
│   │   │   └── ConnectionStatus.tsx # Ping result display (success / fail / loading)
│   │   │
│   │   ├── migration/
│   │   │   ├── MigrationWizard.tsx  # Orchestrates the 4-step wizard UI
│   │   │   ├── WizardStep1.tsx      # Source DB selection + test
│   │   │   ├── WizardStep2.tsx      # Destination DB selection + test
│   │   │   ├── WizardStep3.tsx      # Schema mapping + options
│   │   │   ├── WizardStep4.tsx      # Review summary + launch
│   │   │   ├── SchemaMappingTable.tsx
│   │   │   ├── MigrationProgressCard.tsx
│   │   │   └── TerminalLog.tsx      # SSE-powered dark terminal log viewer
│   │   │
│   │   ├── editor/
│   │   │   ├── EditorLayout.tsx     # Horizontal split panel layout
│   │   │   ├── SchemaTree.tsx       # Left panel: collapsible table/column tree
│   │   │   ├── DataGrid.tsx         # Right panel: paginated editable data table
│   │   │   ├── InsertRowModal.tsx   # Modal form for inserting a new row
│   │   │   └── FilterBar.tsx        # Column-based filter controls
│   │   │
│   │   └── shared/
│   │       ├── StatusBadge.tsx      # Colored badge: Pending / Running / Completed / Failed
│   │       ├── EmptyState.tsx       # Placeholder for empty lists/tables
│   │       ├── ErrorBoundary.tsx
│   │       └── PageHeader.tsx       # Title + optional action button slot
│   │
│   └── pages/                       # One file per route
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       ├── DashboardPage.tsx
│       ├── ProjectsPage.tsx
│       ├── ProjectDetailPage.tsx
│       ├── MigrationNewPage.tsx     # Hosts MigrationWizard
│       ├── MigrationMonitorPage.tsx # Live migration status view
│       ├── MigrationsHistoryPage.tsx
│       └── EditorPage.tsx
│
├── index.html                       # Vite HTML entry
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

### Key Config Files

**vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
  },
});
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

**.env.example**
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 5. Application Architecture

### 5.1 Data Flow

```
User Input (Browser)
     │
     ▼
React Components
     │
     ├── TanStack Query hooks ──▶ src/api/ (Axios) ──▶ Vite dev proxy ──▶ Go Backend
     │        (server state + caching)
     │
     ├── Zustand stores (wizard state, UI, auth metadata)
     │
     └── EventSource (SSE) ──▶ Go Backend /migrations/:id/logs
```

### 5.2 Router Setup (`src/App.tsx`)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { lazy, Suspense } from 'react';

const LoginPage             = lazy(() => import('@/pages/LoginPage'));
const RegisterPage          = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage         = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage          = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage     = lazy(() => import('@/pages/ProjectDetailPage'));
const MigrationNewPage      = lazy(() => import('@/pages/MigrationNewPage'));
const MigrationMonitorPage  = lazy(() => import('@/pages/MigrationMonitorPage'));
const MigrationsHistoryPage = lazy(() => import('@/pages/MigrationsHistoryPage'));
const EditorPage            = lazy(() => import('@/pages/EditorPage'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/"                   element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"           element={<DashboardPage />} />
                <Route path="/projects"            element={<ProjectsPage />} />
                <Route path="/projects/:id"        element={<ProjectDetailPage />} />
                <Route path="/migrations"          element={<MigrationsHistoryPage />} />
                <Route path="/migrations/new"      element={<MigrationNewPage />} />
                <Route path="/migrations/:id"      element={<MigrationMonitorPage />} />
                <Route path="/editor"              element={<EditorPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 5.3 Authentication Flow

Since this is a plain SPA (no BFF), the JWT access token is stored in an **in-memory Axios module variable** — never in `localStorage`. The backend sets a `httpOnly` refresh token cookie.

```
POST /api/v1/auth/login
  └─▶ Backend sets httpOnly refresh token cookie
  └─▶ Returns short-lived access token in body

Frontend stores access token in Axios module variable (memory only)

Every request: Axios interceptor attaches token as Authorization header

On 401: Axios interceptor calls POST /api/v1/auth/refresh (cookie auto-sent)
  └─▶ New access token received → retry original request
  └─▶ On refresh failure → clear state → redirect to /login
```

### 5.4 Credential Flow (Critical Security Invariant)

```
User types credentials into ConnectionForm
   (stored in React Hook Form local state)
         │
         ▼
User clicks "Test Connection" or "Start Migration" or editor action
         │
         ▼
Credentials read from form state → sent in POST request body
         │
         ▼
Backend uses credentials → closes connection → returns result
         │
CREDENTIALS ARE NEVER WRITTEN TO:
  ✗ localStorage
  ✗ sessionStorage
  ✗ Any cookie
  ✗ Zustand stores (wizard store holds ConnectionConfig only for active session)
  ✗ URL query parameters
  ✗ Window history state
```

---

## 6. Pages & Routes Specification

### 6.1 Login Page (`/login`)

**Access:** Public; redirect to `/dashboard` if already authenticated

**UI:**
- SEASYN logo centered
- Email input, password input with show/hide toggle
- "Sign in" button with loading spinner state
- Error alert (red, dismissable) for bad credentials
- "Don't have an account? Register" link

**Behavior:** Zod validation on submit (email format, password min 8 chars). On success: store token, navigate to `/dashboard`.

---

### 6.2 Register Page (`/register`)

**UI:** Email, password, confirm-password inputs. Real-time Zod validation per field (border turns red + message appears). "Create account" button. Link back to login.

---

### 6.3 Dashboard (`/dashboard`)

**Sections:**

- **Stats bar** (4 stat cards): Total Projects | Running Migrations | Completed | Failed
- **Recent Projects** (6 cards): Name, description, migration count, date, "Open" button
- **Recent Migrations** (table, last 10): Source → Dest | Rows | Status | Date | "View" link
- **Quick Actions**: "New Project" | "Start Migration" | "Open Editor" buttons

Data refetches every 30 seconds.

---

### 6.4 Projects List (`/projects`)

**UI:** Page header with "New Project" button (opens modal). Client-side search. Project card grid with name, description, migration count, date, "Open" and "Delete" (confirmation dialog) actions. Empty state illustration when list is empty.

---

### 6.5 Project Detail (`/projects/:id`)

**UI:** Editable project name and description (click to edit, auto-save on blur). "Start New Migration" button (navigates to `/migrations/new?projectId=:id`). Migration history table for this project. "Delete Project" button with name-confirmation modal.

---

### 6.6 Migration Studio (`/migrations/new`) — Core Feature

Multi-step wizard. Steps shown in a progress indicator at the top.

**Step 1 — Source Database:**
- `DBTypeSelector`: PostgreSQL | MySQL | MongoDB | SQLite
- `ConnectionForm`: dynamic fields by DB type
- "Test Connection" button → `ConnectionStatus` shows latency + table count preview

**Step 2 — Destination Database:**
- Identical to Step 1 but for the destination
- Both must pass a connection test before Step 3 is reachable

**Step 3 — Configure Migration:**
- Source table dropdown (from Step 1 schema)
- Destination table/collection name input (editable, pre-filled)
- `SchemaMappingTable`: per-column mapping, type overrides, include/exclude toggles
- Options panel: batch size slider, truncate toggle (with orange warning), create-if-not-exists toggle

**Step 4 — Review & Launch:**
- Summary card: source info, dest info, options, row estimate
- "Start Migration" → `POST /api/v1/migrations` → navigate to `/migrations/:id`

---

### 6.7 Migration Monitor (`/migrations/:id`) — Core Feature

**UI:**
- Status header: Job ID (monospace) | Status badge | Source → Destination labels
- Animated progress bar: `3,500 / 10,000 rows`
- Stats row: Rows Migrated | Rows/sec | Elapsed | ETA
- `TerminalLog`: dark terminal, SSE-powered, auto-scrolling
- Cancel button (only when running)
- Retry button (only when failed)

**SSE hook (`src/hooks/useMigrationSSE.ts`):**
```typescript
export function useMigrationSSE(jobId: string) {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/migrations/${jobId}/logs`;
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener('progress', (e) => setProgress(JSON.parse(e.data)));
    es.addEventListener('log', (e) => setLogs((p) => [...p, JSON.parse(e.data)]));
    es.addEventListener('complete', () => { setIsComplete(true); es.close(); });
    es.addEventListener('error', () => { setIsComplete(true); es.close(); });

    return () => es.close();
  }, [jobId]);

  return { progress, logs, isComplete };
}
```

---

### 6.8 Database Editor (`/editor`) — Core Feature

**Layout:** Horizontal split — left panel 280px, right panel fills remaining space.

**Left Panel:**
- `DBTypeSelector`
- `ConnectionForm`
- "Connect" button → fetches schema → populates tree
- `SchemaTree`: collapsible table/collection list → click to load data

**Right Panel:**
- Toolbar: table name | row count | "Add Row" | "Refresh"
- `FilterBar`: column + value filter
- `DataGrid`: paginated (50 rows), sortable columns, click-to-edit cells, per-row delete
- Pagination controls

Credentials live in `ConnectionForm` RHF state. Every grid action sends them fresh in the request body.

---

### 6.9 Migrations History (`/migrations`)

Table of all migrations across all projects. Filterable by project, status, date range. Sortable columns. "Export CSV" button (client-side generation). Clickable rows navigate to monitor page.

---

## 7. Component Specifications

### 7.1 ConnectionForm

```typescript
interface ConnectionFormProps {
  onSuccess: (config: ConnectionConfig, schema: Schema) => void;
  onError: (message: string) => void;
  defaultValues?: Partial<ConnectionConfig>;
  disabled?: boolean;
}
```

Uses RHF + Zod. `DBTypeSelector` drives conditional field rendering. "Test Connection" calls `POST /api/v1/connections/test` using current `getValues()`. On success, calls `onSuccess` with config and schema — parent decides what to do.

---

### 7.2 SchemaMappingTable

```typescript
interface SchemaMappingTableProps {
  sourceColumns: ColumnSchema[];
  destDBType: DBType;
  onChange: (mappings: ColumnMapping[]) => void;
}

interface ColumnMapping {
  sourceColumn: string;
  destColumn: string;
  destType: string;
  include: boolean;
}
```

Table with one row per source column. Each row: source name (read-only) | source type badge | arrow | dest column name input (editable) | dest type select | include toggle. Auto-populated with smart type mapping suggestions.

---

### 7.3 MigrationProgressCard

```typescript
interface MigrationProgressCardProps {
  jobId: string;
  sourceName: string;
  destName: string;
  live?: boolean;  // If true, polls every 3s (for dashboard)
}
```

Shows progress bar, migrated/total rows, status badge, elapsed time.

---

### 7.4 DataGrid

```typescript
interface DataGridProps {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onCellEdit: (rowIndex: number, column: string, value: unknown) => Promise<void>;
  onDeleteRow: (row: Record<string, unknown>) => Promise<void>;
  onInsertRow: (row: Record<string, unknown>) => Promise<void>;
}
```

Built on TanStack Table. Cells switch between `<span>` and `<input>` on click. Enter confirms, Escape cancels. `React.memo` on row components prevents full re-render on single-cell edits.

---

### 7.5 TerminalLog

```typescript
interface TerminalLogProps {
  logs: LogEntry[];
  autoScroll?: boolean;
  maxVisible?: number;  // Default 500 — only render last N lines for DOM safety
}
```

Dark background `bg-neutral-950`, `font-mono`. Colors: info = `text-neutral-300`, warn = `text-amber-400`, error = `text-red-400`, success = `text-green-400`. Auto-scroll via `useEffect` + `scrollIntoView` on the last-entry ref.

---

### 7.6 ProtectedRoute

```typescript
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

On mount, fires `GET /api/v1/auth/me`. 401 clears auth state and redirects.

---

## 8. State Management Design

### 8.1 What Goes Where

| Data | Storage | Reason |
|------|---------|--------|
| Access token | Axios module variable (memory) | XSS-safe; clears on refresh |
| User metadata | Zustand `authStore` with `persist` | Safe (no secrets) |
| Wizard in-progress state | Zustand `migrationWizardStore` — **no persist** | Must clear on refresh |
| DB credentials | React Hook Form local state | Never leaves component |
| Projects list | TanStack Query cache | Server state |
| Migration jobs | TanStack Query cache | Server state |
| Schema data | TanStack Query (5 min TTL) | Server state |
| Live progress | `useMigrationSSE` local state | Ephemeral stream |
| Sidebar / theme | Zustand `uiStore` with `persist` | Safe to persist |

### 8.2 Store Definitions

```typescript
// store/authStore.ts — persisted, no secrets
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'seasyn-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// store/migrationWizardStore.ts — NO persist, intentionally
export const useMigrationWizardStore = create<MigrationWizardState>()((set) => ({
  currentStep: 1,
  sourceConfig: null,   // ConnectionConfig — set from ConnectionForm onSuccess
  sourceSchema: null,
  destConfig: null,
  destSchema: null,
  migrationOptions: { batchSize: 500, truncateDestination: false, createIfNotExists: true, schemaMapping: {} },
  goToStep: (step) => set({ currentStep: step as 1|2|3|4 }),
  setSource: (config, schema) => set({ sourceConfig: config, sourceSchema: schema }),
  setDest: (config, schema) => set({ destConfig: config, destSchema: schema }),
  setOptions: (opts) => set((s) => ({ migrationOptions: { ...s.migrationOptions, ...opts } })),
  reset: () => set({ currentStep: 1, sourceConfig: null, sourceSchema: null, destConfig: null, destSchema: null }),
}));

// store/uiStore.ts — safe to persist
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark' as const,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'seasyn-ui' }
  )
);
```

---

## 9. API Integration Layer

### 9.1 Axios Client (`src/api/client.ts`)

```typescript
import axios from 'axios';

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers['Authorization'] = `Bearer ${accessToken}`;
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.token);
        original.headers['Authorization'] = `Bearer ${data.token}`;
        return apiClient(original);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
      }
    }
    const msg = error.response?.data?.error?.message ?? 'Unexpected error';
    const code = error.response?.data?.error?.code ?? 'UNKNOWN';
    return Promise.reject({ message: msg, code, status: error.response?.status ?? 500 });
  }
);
```

### 9.2 Query Key Factory (`src/lib/queryKeys.ts`)

```typescript
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  migrations: {
    all: ['migrations'] as const,
    byProject: (projectId: string) => ['migrations', 'project', projectId] as const,
    detail: (id: string) => ['migrations', id] as const,
  },
  schema: {
    inspect: (connHash: string) => ['schema', 'inspect', connHash] as const,
  },
} as const;
```

---

## 10. Design System

### 10.1 Visual Language

Dark-mode-first, technical, minimal. Clean like Vercel, functional like a database tool.

- **Primary:** `#3B82F6` (blue-500)
- **Background:** `#0A0A0A`
- **Surface:** `#111111`
- **Surface elevated:** `#1A1A1A`
- **Border:** `#222222`
- **Text primary:** `#F5F5F5`
- **Text secondary:** `#888888`
- **Success:** `#22C55E`
- **Error:** `#EF4444`
- **Warning:** `#F59E0B`
- **UI Font:** Inter (via `@fontsource/inter`)
- **Code/Data Font:** JetBrains Mono (via `@fontsource/jetbrains-mono`)

### 10.2 Status Badges

| Status | Classes |
|--------|---------|
| Pending | `bg-neutral-800 text-neutral-400` |
| Running | `bg-blue-900 text-blue-300 animate-pulse` |
| Completed | `bg-green-900 text-green-300` |
| Failed | `bg-red-900 text-red-300` |
| Cancelled | `bg-orange-900 text-orange-300` |

### 10.3 Layout

- Sidebar: 240px (collapsed: 60px icon-only)
- Header: 56px
- Content padding: 24px
- Card radius: `rounded-xl`
- Max content width: 1280px centered

### 10.4 shadcn/ui Init

```bash
npx shadcn@latest init
# Style: Default, Base color: Slate, CSS variables: Yes
```

Override CSS variables in `src/index.css` to match SEASYN palette.

---

## 11. Security on the Frontend

| Rule | Implementation |
|------|----------------|
| Token in memory only | Module-scoped variable in `client.ts`, never in Web Storage |
| Refresh token inaccessible | httpOnly cookie; JS cannot read it |
| No credentials in stores | `migrationWizardStore` has no `persist`; credentials stay in RHF |
| No credentials in URLs | Navigation never includes password or connection string in query params |
| XSS prevention | React auto-escaping; no `dangerouslySetInnerHTML` |
| Sensitive data stripped from logs | `console.log` stripped from production build via Vite |
| CORS handled by backend | Frontend makes no cross-origin requests in production (same origin or configured CORS) |

---

## 12. Performance Requirements

| Metric | Target |
|--------|--------|
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Initial JS bundle | < 200KB gzipped |
| DataGrid (1000 rows) | < 100ms render |
| SSE reconnect on drop | < 3 seconds |
| Vite dev server cold start | < 500ms |

**Strategies:** React Router lazy loading for all pages, `React.memo` on DataGrid rows, `TerminalLog` limited to last 500 visible lines, TanStack Table for virtual DOM efficiency, fontsource packages for no-CDN font loading.

---

## 13. Testing Requirements

### Unit Tests (Vitest + Testing Library)

- All custom hooks tested with `msw` (Mock Service Worker)
- `ConnectionForm`: DB type variants, validation errors, test-connection states
- `SchemaMappingTable`: mapping changes, type override, include toggle
- `DataGrid`: pagination, inline edit, delete confirmation
- `TerminalLog`: auto-scroll behavior, level color classes
- All Zustand stores: isolated action and state tests

### Integration Tests

- Full 4-step wizard with MSW intercepting API
- Auth: login → protected access → logout → redirect
- Editor: connect → load table → edit → delete

### E2E (Playwright)

- Full happy path: register → project → migration → monitor → complete
- Editor: connect → insert → edit → delete
- Error path: invalid credentials → error shown, form intact

---

## 14. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Browser support | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ |
| Accessibility | WCAG 2.1 AA (keyboard nav, ARIA via Radix UI primitives) |
| Default theme | Dark mode; light mode toggle persisted in `uiStore` |
| Responsive | Fully functional at 1024px+; sidebar collapses at 768px |
| Node.js version | 18 LTS or 20 LTS |
| Build output | Pure static files — deployable to Cloudflare Pages, Vercel, S3, or any CDN |
| i18n readiness | English only for MVP; no hardcoded strings in non-component files |

---

*End of SEASYN Frontend PRD v1.1*