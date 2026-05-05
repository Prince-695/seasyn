# SEASYN — Frontend Product Requirements Document (PRD)

**Version:** 1.0  
**Framework:** Next.js 14 (App Router)  
**Styling:** Tailwind CSS + shadcn/ui  
**State:** Zustand + React Query (TanStack Query)  
**Structure:** Monorepo (Turborepo)  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Monorepo vs Normal Structure — Decision](#2-monorepo-vs-normal-structure--decision)
3. [Tech Stack Decisions](#3-tech-stack-decisions)
4. [Monorepo Structure](#4-monorepo-structure)
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

SEASYN's frontend is a **Next.js 14 web application** that provides:

1. A **Dashboard** for managing projects and migration jobs
2. A **Connection Wizard** for inputting database credentials (never stored)
3. A **Migration Studio** for configuring and monitoring migrations in real-time
4. A **Database Editor** for CRUD operations on live databases

The frontend uses a **Turborepo monorepo** housing both the Next.js app and shared packages (UI components, API client, types). This structure is chosen over a plain repo because SEASYN plans a future CLI, a docs site, and potentially a mobile app — all of which can share the same types and API client.

**Critical frontend principle:** Credentials entered by users exist **only in component state** during a session. They are sent directly to the backend per-request and never written to `localStorage`, `sessionStorage`, cookies, or any persistent browser storage.

---

## 2. Monorepo vs Normal Structure — Decision

### Verdict: **Use a Turborepo Monorepo**

Here is the honest breakdown:

### Why NOT a plain repo

- You will inevitably need to share TypeScript types between the frontend app and any future CLI or docs site
- You will need a shared API client (`@seasyn/api`) that can be used across contexts
- A shared design system (`@seasyn/ui`) means you're not copy-pasting components
- Turborepo's build caching is essentially free performance — a plain repo has no equivalent

### Why NOT a full enterprise monorepo (nx, Bazel)

- Overkill for a personal project / early startup
- Turborepo is simple enough to set up in an afternoon
- The mental overhead is low compared to the value gained

### Trade-offs to accept

| Trade-off | Impact |
|-----------|--------|
| Slightly more complex initial setup | One-time, ~2 hours of setup |
| Need to understand workspace linking | `pnpm workspaces` — learnable in 30 minutes |
| Turborepo config | A 20-line `turbo.json` file |

### Monorepo gives you

- `@seasyn/types` — shared TypeScript types between all packages
- `@seasyn/api` — shared API client (used by both web app and future CLI)
- `@seasyn/ui` — shared design system components
- Turborepo's intelligent caching (only rebuild what changed)
- Single `pnpm install` for everything

---

## 3. Tech Stack Decisions

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 14 (App Router) | SSR for dashboard, RSC for data fetching, API routes available |
| Package Manager | pnpm | Fast, native workspace support, disk efficient |
| Monorepo Tool | Turborepo | Simple, powerful caching, low overhead |
| Styling | Tailwind CSS v3 | Utility-first, pairs well with shadcn |
| Component Library | shadcn/ui | Copy-paste components, full ownership, built on Radix UI |
| Icons | Lucide React | Consistent, tree-shakeable |
| Server State | TanStack Query v5 | Caching, background refetch, optimistic updates |
| Client State | Zustand | Minimal, no boilerplate, TypeScript-native |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders |
| Tables | TanStack Table v8 | Headless, works with shadcn |
| SSE (live migration) | native EventSource | Browser-native, no library needed |
| HTTP Client | Axios (wrapped) | Interceptors for auth, error normalization |
| Testing | Vitest + Testing Library | Fast, Vite-based, same as Jest API |
| E2E | Playwright | Cross-browser, network mocking |
| Linting | ESLint + Prettier | Standard setup |
| Type Checking | TypeScript 5.x strict mode | No `any`, no shortcuts |

---

## 4. Monorepo Structure

```
seasyn/                              # Root of monorepo
├── apps/
│   └── web/                         # Main Next.js application
│       ├── app/                     # App Router directory
│       │   ├── (auth)/              # Route group: public auth pages
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   └── register/
│       │   │       └── page.tsx
│       │   ├── (dashboard)/         # Route group: protected pages
│       │   │   ├── layout.tsx       # Dashboard shell (sidebar + header)
│       │   │   ├── page.tsx         # /dashboard — overview
│       │   │   ├── projects/
│       │   │   │   ├── page.tsx     # /projects — list
│       │   │   │   ├── new/
│       │   │   │   │   └── page.tsx # /projects/new
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx # /projects/:id
│       │   │   ├── migrations/
│       │   │   │   ├── page.tsx     # /migrations — history
│       │   │   │   ├── new/
│       │   │   │   │   └── page.tsx # /migrations/new — migration studio
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx # /migrations/:id — live status
│       │   │   └── editor/
│       │   │       └── page.tsx     # /editor — database editor
│       │   ├── api/                 # Next.js route handlers (BFF proxy)
│       │   │   └── [...path]/
│       │   │       └── route.ts     # Proxies to backend, adds auth header
│       │   ├── layout.tsx           # Root layout (fonts, providers)
│       │   └── globals.css
│       ├── components/              # App-specific components
│       │   ├── migration/
│       │   ├── editor/
│       │   ├── project/
│       │   └── connection/
│       ├── hooks/                   # App-specific custom hooks
│       ├── lib/                     # App utilities (auth helpers, etc.)
│       ├── store/                   # Zustand stores
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── types/                       # @seasyn/types
│   │   ├── src/
│   │   │   ├── database.ts          # DBType, ConnectionConfig, Schema, etc.
│   │   │   ├── migration.ts         # MigrationJob, MigrationStatus, etc.
│   │   │   ├── project.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                         # @seasyn/api
│   │   ├── src/
│   │   │   ├── client.ts            # Axios instance + interceptors
│   │   │   ├── auth.ts              # Auth API calls
│   │   │   ├── migrations.ts        # Migration API calls
│   │   │   ├── editor.ts            # Editor API calls
│   │   │   ├── projects.ts          # Project API calls
│   │   │   ├── schema.ts            # Schema inspection API calls
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui/                          # @seasyn/ui
│       ├── src/
│       │   ├── components/          # Shared shadcn-based components
│       │   │   ├── button.tsx
│       │   │   ├── input.tsx
│       │   │   ├── card.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── data-table.tsx   # Generic table with TanStack Table
│       │   │   ├── connection-form.tsx
│       │   │   └── ...
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace definition
├── package.json                      # Root package
└── tsconfig.base.json                # Shared TS config
```

### Key Config Files

**pnpm-workspace.yaml**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

**Root package.json scripts**
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  }
}
```

---

## 5. Application Architecture

### 5.1 Data Flow

```
User Input (Browser)
     │
     ▼
React Components (UI layer)
     │
     ├── Server Components (RSC) ──▶ Next.js BFF Route Handler ──▶ Backend API
     │        (initial data, SEO)         (adds auth token)
     │
     └── Client Components ──▶ TanStack Query ──▶ @seasyn/api ──▶ Backend API
              (interactivity)    (cache + refetch)   (Axios)
```

### 5.2 Authentication Flow

```
User logs in
     │
     ▼
POST /api/auth/login (Next.js BFF)
     │
     ▼
Backend returns JWT
     │
     ▼
BFF sets httpOnly cookie (not accessible via JS)
     │
     ▼
Subsequent requests: cookie sent automatically
     │
     ▼
Next.js BFF reads cookie, injects Authorization header
     │
     ▼
Backend validates JWT
```

**Why BFF?** The frontend never touches the JWT directly. It lives in an httpOnly cookie handled by the Next.js BFF (Backend For Frontend) layer. This prevents XSS from stealing tokens.

### 5.3 Credential Flow (Critical)

```
User enters DB credentials in ConnectionForm
     │
     ▼
Credentials stored in React component state ONLY
     │
     ▼
User triggers action (test connection / start migration / editor query)
     │
     ▼
Credentials sent in POST request body to Next.js BFF
     │
     ▼
BFF forwards to backend
     │
     ▼
Backend uses credentials, closes connection
     │
CREDENTIALS NEVER WRITTEN TO:
  ✗ localStorage
  ✗ sessionStorage
  ✗ Cookies
  ✗ Zustand persist
  ✗ URL params
  ✗ Any browser storage
```

---

## 6. Pages & Routes Specification

### 6.1 Login Page (`/login`)

**Purpose:** Authenticate existing users  
**Route type:** Public (redirect to dashboard if already authenticated)

**UI Elements:**
- SEASYN logo + tagline
- Email input
- Password input
- "Sign in" button
- "Don't have an account? Register" link
- Error message display

**Behavior:**
- On submit: POST to `/api/auth/login`
- On success: redirect to `/dashboard`
- On failure: display error message
- Form validated with Zod: email format, password min 8 chars

---

### 6.2 Register Page (`/register`)

**Purpose:** Create new account  
**UI Elements:**
- Email, password, confirm password inputs
- "Create account" button
- Validation: real-time Zod schema feedback

---

### 6.3 Dashboard (`/dashboard`)

**Purpose:** Overview of user's activity

**Sections:**
- **Stats bar:** Total projects | Active migrations | Completed migrations | Failed migrations
- **Recent Projects:** Card grid, last 5 projects with link to open
- **Recent Migrations:** Table of last 10 migration jobs with status badges
- **Quick Action buttons:** "New Project" | "Start Migration" | "Open Editor"

**Data fetching:** React Server Component fetches stats on load; client components poll active migration count every 10s.

---

### 6.4 Projects List (`/projects`)

**Purpose:** Manage all user projects

**UI Elements:**
- Search bar (client-side filter)
- "New Project" button
- Project cards in a grid:
  - Project name
  - Description
  - Number of past migrations
  - Created date
  - Actions: Open | Delete

**Data:** TanStack Query, refetch on window focus

---

### 6.5 Project Detail (`/projects/:id`)

**Purpose:** View a single project and its migration history

**Sections:**
- Project metadata (name, description, edit inline)
- Migration history table for this project:
  - Job ID | Source → Destination | Rows | Status | Date
- "Start New Migration" button (navigates to `/migrations/new?project=:id`)

---

### 6.6 Migration Studio (`/migrations/new`) ⭐ Core Feature

**Purpose:** Configure and launch a database migration

**This is the most complex page in the app.** It uses a multi-step wizard UI.

#### Step 1: Select Source Database

- DB Type selector: PostgreSQL | MySQL | MongoDB | SQLite (radio buttons with icons)
- Dynamic connection form based on selected type:
  - For SQL: Host, Port, Database, Username, Password, SSL toggle
  - For MongoDB: Connection string OR host/port/db/user/pass
- "Test Connection" button → calls `/api/connections/test` → shows latency + green check or error
- On success: show detected tables/collections as a preview list

#### Step 2: Select Destination Database

- Same form as Step 1 but for destination
- "Test Connection" same behavior
- Show detected tables/collections

#### Step 3: Configure Migration

- Source table selector (dropdown populated from Step 1 result)
- Destination table/collection input (pre-filled with source name, editable)
- Schema mapping table (see component spec below)
- Options:
  - Batch size slider (100 – 2000, default 500)
  - Truncate destination toggle (with warning)
  - Create if not exists toggle

#### Step 4: Review & Launch

- Summary card: source → destination, table, row estimate, options
- "Start Migration" button
- On launch: redirect to `/migrations/:id` for live monitoring

**Important:** At no point are credentials stored. They live in the wizard's Zustand store scoped to the session only. When the page unloads, they're gone.

---

### 6.7 Migration Monitor (`/migrations/:id`) ⭐ Core Feature

**Purpose:** Real-time monitoring of a running migration

**UI Elements:**

- **Status header:** Job ID | Status badge (Pending / Running / Completed / Failed / Cancelled)
- **Progress bar:** Animated, shows `migrated / total` rows
- **Stats row:** Rows migrated | Rows/sec | Elapsed time | ETA
- **Live log stream:** SSE-powered terminal-style log viewer
  - Auto-scroll to bottom
  - Each line timestamped
  - Color-coded: info (white), warning (yellow), error (red), success (green)
- **Cancel button:** Only visible when status = "running"
- **Retry button:** Only visible when status = "failed"

**SSE Implementation:**
```typescript
// hooks/useMigrationSSE.ts
export function useMigrationSSE(jobId: string) {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const es = new EventSource(`/api/migrations/${jobId}/logs`);

    es.addEventListener('progress', (e) => {
      setProgress(JSON.parse(e.data));
    });

    es.addEventListener('log', (e) => {
      setLogs(prev => [...prev, e.data]);
    });

    es.addEventListener('complete', () => {
      es.close();
    });

    return () => es.close();
  }, [jobId]);

  return { progress, logs };
}
```

---

### 6.8 Database Editor (`/editor`) ⭐ Core Feature

**Purpose:** Browse and edit live database data without storing credentials

**Layout:** Split panel

- **Left panel (Connection + Schema Tree):**
  - Connection form (same as migration wizard Step 1)
  - "Connect" button → fetches schema
  - Collapsible tree: Tables → Columns
  - Click table → loads data in right panel

- **Right panel (Data Grid):**
  - Paginated data table (50 rows per page)
  - Column headers with type badges
  - Inline edit cells (click to edit, Enter to save, Escape to cancel)
  - "Add Row" button → opens a modal form
  - "Delete Row" button per row (with confirmation)
  - Filter bar: filter by column value
  - Sort by column header click
  - Pagination controls

**Credentials behavior:** Credentials entered in the left panel live in local component state. Each action (load table, insert, update, delete) sends them in the request body. Refreshing the page clears them.

---

### 6.9 Migrations History (`/migrations`)

**Purpose:** View all past migration jobs across all projects

**UI Elements:**
- Filter bar: by project | by status | by date range
- Table: Job ID | Project | Source DB | Dest DB | Rows | Status | Duration | Date
- Clickable rows → `/migrations/:id`
- Export as CSV button

---

## 7. Component Specifications

### 7.1 ConnectionForm

**Reused in:** Migration Studio (Step 1 & 2), Database Editor

```typescript
interface ConnectionFormProps {
  onSuccess: (connection: ConnectionConfig, schema: Schema) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}
```

**Internal behavior:**
- DBType selector changes which fields are shown
- "Test Connection" button submits form data to backend
- State: form values stay in RHF state; never persisted
- Shows loading spinner during test, then success/error indicator

---

### 7.2 SchemaMappingTable

**Used in:** Migration Studio Step 3

**Purpose:** Allow users to map source columns to destination columns and override types

```typescript
interface SchemaMappingTableProps {
  sourceSchema: TableSchema;
  destDBType: DBType;
  onChange: (mapping: SchemaMapping) => void;
}
```

**UI:**
- Table with rows: `[Source Column] [Source Type] → [Dest Column (editable)] [Dest Type (select)] [Include toggle]`
- Auto-populated with detected columns
- Editable destination column names
- Type override dropdown per column

---

### 7.3 MigrationProgressCard

**Used in:** Migration Monitor, Dashboard

```typescript
interface MigrationProgressCardProps {
  job: MigrationJob;
  live?: boolean; // If true, subscribes to SSE
}
```

**Shows:** Progress bar + stats + status badge

---

### 7.4 DataGrid

**Used in:** Database Editor

```typescript
interface DataGridProps {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (rowId: string, field: string, value: unknown) => Promise<void>;
  onDelete: (rowId: string) => Promise<void>;
  onInsert: (row: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}
```

Built on TanStack Table v8. Inline editing uses a custom cell renderer that switches between display mode and input mode.

---

### 7.5 TerminalLog

**Used in:** Migration Monitor

```typescript
interface TerminalLogProps {
  logs: LogEntry[];
  autoScroll?: boolean;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}
```

Dark background (`bg-neutral-950`), monospace font, color-coded by level, auto-scroll to bottom on new entry.

---

## 8. State Management Design

### 8.1 What goes in Zustand vs TanStack Query

| Data | Storage |
|------|---------|
| Auth user info | Zustand (`useAuthStore`) |
| Active connection configs (during wizard) | Zustand (`useMigrationWizardStore`) — **never persisted** |
| Editor connection config | Local component state only |
| Projects list | TanStack Query |
| Migration jobs | TanStack Query |
| Schema data (from inspect) | TanStack Query (cached, short TTL) |
| Migration progress | Custom hook (SSE) |
| UI state (sidebar open, theme) | Zustand (`useUIStore`) |

### 8.2 Zustand Store Definitions

```typescript
// store/migrationWizardStore.ts
interface MigrationWizardState {
  step: 1 | 2 | 3 | 4;
  sourceConfig: ConnectionConfig | null;
  sourceSchema: Schema | null;
  destConfig: ConnectionConfig | null;
  destSchema: Schema | null;
  migrationOptions: MigrationOptions;

  setStep: (step: number) => void;
  setSourceConfig: (cfg: ConnectionConfig) => void;
  setSourceSchema: (schema: Schema) => void;
  setDestConfig: (cfg: ConnectionConfig) => void;
  setDestSchema: (schema: Schema) => void;
  setMigrationOptions: (opts: Partial<MigrationOptions>) => void;
  reset: () => void;  // Call when wizard closes or migration starts
}

// CRITICAL: This store uses NO persist middleware
export const useMigrationWizardStore = create<MigrationWizardState>()(
  (set) => ({ /* ... */ })
  // NO persist() wrapper here — credentials must not survive page refresh
);
```

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Auth store can persist user metadata (NOT token — that's in httpOnly cookie)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'seasyn-auth', partialize: (state) => ({ user: state.user }) }
  )
);
```

---

## 9. API Integration Layer

### 9.1 Axios Client (`packages/api/src/client.ts`)

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  timeout: 30000,
  withCredentials: true,  // Send httpOnly cookie
});

// Request interceptor — add correlation ID for debugging
client.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// Response interceptor — normalize errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message ?? 'An unexpected error occurred';
    const code = error.response?.data?.error?.code ?? 'UNKNOWN_ERROR';
    throw new AppError(message, code, error.response?.status ?? 500);
  }
);

export { client };
```

### 9.2 TanStack Query Setup

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30 seconds
      gcTime: 5 * 60 * 1000,      // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,  // Don't retry mutations (idempotency not guaranteed)
    },
  },
});
```

### 9.3 Query Keys Convention

```typescript
// lib/queryKeys.ts
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

SEASYN targets a **dark-mode-first, technical, minimal** aesthetic. Think Vercel dashboard meets database tooling.

- **Primary brand color:** Electric blue `#3B82F6` (Tailwind `blue-500`)
- **Background:** `#0A0A0A` (near black)
- **Surface:** `#111111` (cards, sidebars)
- **Border:** `#222222`
- **Text primary:** `#F5F5F5`
- **Text secondary:** `#888888`
- **Success:** `#22C55E` (green-500)
- **Error:** `#EF4444` (red-500)
- **Warning:** `#F59E0B` (amber-500)
- **Font:** Inter (UI), JetBrains Mono (code, terminal, data)

### 10.2 Status Badge Colors

| Status | Color | Tailwind |
|--------|-------|----------|
| Pending | Gray | `bg-neutral-500` |
| Running | Blue (animated pulse) | `bg-blue-500 animate-pulse` |
| Completed | Green | `bg-green-500` |
| Failed | Red | `bg-red-500` |
| Cancelled | Orange | `bg-orange-500` |

### 10.3 Layout

- **Sidebar width:** 240px (collapsible to 60px icon-only mode)
- **Header height:** 56px
- **Content max-width:** 1280px (centered)
- **Card border-radius:** `rounded-xl` (12px)
- **Responsive breakpoints:** sm (640), md (768), lg (1024), xl (1280)

### 10.4 Animation

- Page transitions: `fade` (150ms ease-out)
- Sidebar collapse: `slide` (200ms ease-in-out)
- Progress bar: smooth continuous animation via CSS
- Loading states: skeleton placeholders (not spinners) for content areas

---

## 11. Security on the Frontend

### 11.1 Rules

| Rule | Implementation |
|------|----------------|
| No credentials in localStorage | `useMigrationWizardStore` has no `persist` middleware |
| No credentials in URL | Connection forms never PUT data in query strings |
| No credentials in Zustand devtools | Use `devtools` middleware only in dev mode; credential stores excluded |
| XSS protection | All user content rendered via React (auto-escaping); no `dangerouslySetInnerHTML` |
| CSP headers | Strict Content-Security-Policy via `next.config.ts` headers |
| CSRF protection | httpOnly cookie + SameSite=Strict; all state-mutating requests include custom header |

### 11.2 Input Sanitization

- All user inputs validated client-side with Zod before submission
- Server-side validation is the source of truth; client validation is UX only
- Connection string inputs are not previewed or echoed back in logs

---

## 12. Performance Requirements

| Metric | Target |
|--------|--------|
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| First Contentful Paint (FCP) | < 1.2s |
| Bundle size (initial JS) | < 200KB gzipped |
| DataGrid rendering (1000 rows) | < 100ms |
| SSE reconnection on drop | < 3 seconds |

### Strategies

- Route-based code splitting (automatic with App Router)
- Lazy load heavy components: `DataGrid`, `TerminalLog`, schema tree
- Virtualize long lists (react-virtual for log viewer with 10k+ entries)
- Image optimization via `next/image`
- Font subsetting via `next/font`

---

## 13. Testing Requirements

### Unit Tests (Vitest + Testing Library)

- Every custom hook has unit tests (mock API, mock stores)
- Form validation logic tested with Zod schemas
- `ConnectionForm`: test all DB type variants, test error states
- `SchemaMappingTable`: test mapping changes, type overrides
- `DataGrid`: test edit, delete, pagination interactions

### Integration Tests

- Migration wizard: full 4-step flow with mock API
- Auth flow: login → redirect → session → logout
- Editor: connect → load table → edit row → delete row

### E2E Tests (Playwright)

- Happy path: register → create project → run Postgres → Postgres migration → view result
- Error paths: invalid credentials, connection timeout, migration failure
- Editor: connect to test DB, insert and delete a row

---

## 14. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Browser support | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ |
| Accessibility | WCAG 2.1 AA minimum (keyboard navigation, ARIA labels) |
| Dark/light mode | Dark mode default; light mode toggle stored in localStorage |
| Responsive | Fully functional on 1024px+; graceful degradation on 768px |
| Internationalization | English only (MVP); i18n-ready via next-intl structure |
| Node.js version | 18 LTS or 20 LTS |
| Build time | < 60 seconds for production build |

---

*End of SEASYN Frontend PRD v1.0*