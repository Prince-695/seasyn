# SEASYN — Frontend Implementation Plan

**Framework:** React 18 + Vite 5  
**Language:** TypeScript 5.x (strict)  
**Phases:** 4 (Skeleton → Auth → Core Features → Polish)

---

## How to Read This Document

Every step is a **single, testable unit of work**. Each step tells you:
- **What to do** — the exact action
- **Why** — the reason for this step
- **Verify** — how to confirm it worked before moving on

Do not skip steps. The order is deliberate. Each step builds on the previous one.

---

## Phase 1 — Project Skeleton

**Goal:** A running Vite + React + TypeScript app with routing, Tailwind, shadcn/ui, and the full folder structure. No real features yet — just the scaffold that everything else is built on.

---

### Step 1.1 — Scaffold the Vite project

**What:**

```bash
npm create vite@latest seasyn-frontend -- --template react-ts
cd seasyn-frontend
npm install
```

**Why:** This gives you a minimal React + TypeScript + Vite setup with no opinions beyond that. We add everything ourselves so we understand every dependency.

**Verify:** `npm run dev` opens at `http://localhost:5173` with the default Vite + React page.

---

### Step 1.2 — Configure TypeScript strict mode

**What:** Replace the contents of `tsconfig.json` with:

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
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Why:** Strict mode catches real bugs — null dereferences, wrong types, unused variables. It's painful to add later; add it first so every file you write is correct.

**Verify:** `npm run build` compiles without TypeScript errors.

---

### Step 1.3 — Configure path alias in Vite

**What:** Update `vite.config.ts`:

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
});
```

Install the Node types:
```bash
npm install -D @types/node
```

**Why:** The `@/` alias lets you write `import { Button } from '@/components/ui/button'` instead of `../../../components/ui/button`. The proxy means every `/api` call in development hits your Go backend without CORS issues.

**Verify:** Create a test file importing `@/something`. TypeScript resolves it. `npm run dev` still starts.

---

### Step 1.4 — Install Tailwind CSS

**What:**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.ts`:

```typescript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import fonts */
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/jetbrains-mono/400.css';
```

```bash
npm install @fontsource/inter @fontsource/jetbrains-mono
```

**Why:** Tailwind is the styling foundation. Installing it now means every component you write from this point uses utility classes.

**Verify:** Add `className="text-blue-500 font-bold"` to any element. The color change confirms Tailwind is working.

---

### Step 1.5 — Initialize shadcn/ui

**What:**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config: `tailwind.config.ts`
- Components directory: `src/components/ui`

Then install the specific components you'll need:

```bash
npx shadcn@latest add button input card badge dialog select table tabs progress skeleton switch slider toast
```

**Why:** shadcn/ui copies the component source into your project. You own the code — no package to update, no breaking changes from a library. This also means you can modify any component directly to match the SEASYN design system.

**Verify:** Open `src/components/ui/button.tsx`. It should exist with full source code.

---

### Step 1.6 — Update the CSS variables for SEASYN's design system

**What:** Open `src/index.css` and update the `:root` and `.dark` CSS variable blocks that shadcn generated. Replace the default slate colors with SEASYN's palette:

```css
:root {
  --background: 0 0% 4%;          /* #0A0A0A */
  --foreground: 0 0% 96%;         /* #F5F5F5 */
  --card: 0 0% 7%;                /* #111111 */
  --card-foreground: 0 0% 96%;
  --border: 0 0% 13%;             /* #222222 */
  --input: 0 0% 13%;
  --primary: 217 91% 60%;         /* #3B82F6 blue-500 */
  --primary-foreground: 0 0% 100%;
  --muted: 0 0% 34%;              /* #555555 */
  --muted-foreground: 0 0% 53%;   /* #888888 */
  --accent: 0 0% 11%;
  --destructive: 0 84% 60%;       /* #EF4444 red-500 */
  --radius: 0.75rem;
}
```

Add `dark` class to `<html>` in `index.html` for dark-mode-first:

```html
<html lang="en" class="dark">
```

**Why:** shadcn/ui reads from CSS variables. Setting them here means every shadcn component automatically uses SEASYN's colors — no custom styling needed per component.

**Verify:** Render a `<Card>` and `<Button>` in `App.tsx`. They should appear in SEASYN's dark style.

---

### Step 1.7 — Install remaining dependencies

**What:**

```bash
# Routing
npm install react-router-dom

# Server state
npm install @tanstack/react-query

# Client state
npm install zustand

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Table
npm install @tanstack/react-table

# HTTP client
npm install axios

# Icons
npm install lucide-react

# Toast (from sonner — better than shadcn's default)
npm install sonner
```

**Why:** Installing all dependencies together avoids dependency resolution conflicts and gives you a complete picture of your `package.json`.

**Verify:** `npm install` finishes with no peer dependency errors. `package.json` shows all packages listed.

---

### Step 1.8 — Create the full folder structure

**What:** Create all directories and placeholder `index.ts` files:

```bash
mkdir -p src/types src/api src/store src/hooks src/lib src/pages
mkdir -p src/components/ui   # already exists from shadcn
mkdir -p src/components/layout
mkdir -p src/components/connection
mkdir -p src/components/migration
mkdir -p src/components/editor
mkdir -p src/components/shared

# Create placeholder index files
touch src/types/index.ts
touch src/api/index.ts
touch src/store/authStore.ts
touch src/store/migrationWizardStore.ts
touch src/store/uiStore.ts
touch src/hooks/.gitkeep
touch src/lib/queryClient.ts
touch src/lib/queryKeys.ts
```

**Why:** Having the full structure before writing code means you never wonder "where does this file go?" It also keeps imports clean from the start.

**Verify:** Open your editor. The folder tree matches the structure in the PRD.

---

### Step 1.9 — Write the TypeScript types

**What:** Populate `src/types/`. These match exactly what the backend API returns.

`src/types/database.ts`:
```typescript
export type DBType = 'postgres' | 'mongodb' | 'mysql' | 'sqlite';

export type SeasonType = 'string' | 'int' | 'float' | 'bool' | 'timestamp' | 'json' | 'binary' | 'array' | 'decimal';

export interface ConnectionConfig {
  type: DBType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  sslMode?: string;
}

export interface ColumnSchema {
  name: string;
  dataType: string;
  seasonType: SeasonType;
  nullable: boolean;
  isPrimary: boolean;
  maxLength?: number;
  default?: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKeys: string[];
  rowCount: number;
}

export interface Schema {
  dbType: DBType;
  tables: TableSchema[];
}

export interface ConnectionTestResult {
  connected: boolean;
  latencyMs: number;
  serverVersion: string;
  tablesCount: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
}
```

`src/types/migration.ts`:
```typescript
export interface MigrationOptions {
  batchSize: number;
  truncateDestination: boolean;
  createIfNotExists: boolean;
  schemaMapping: Record<string, string>;
}

export type MigrationState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface MigrationStatus {
  state: MigrationState;
  totalRows: number;
  migratedRows: number;
  progressPercent: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MigrationJob {
  id: string;
  projectId: string;
  sourceDbType: DBType;
  sourceHost?: string;
  sourceDatabase?: string;
  sourceTable: string;
  destDbType: DBType;
  destHost?: string;
  destDatabase?: string;
  destTable: string;
  batchSize: number;
  status: MigrationStatus;
  createdAt: string;
}

export interface MigrationProgress {
  migratedRows: number;
  totalRows: number;
  percent: number;
  rowsPerSecond: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}
```

`src/types/project.ts`:
```typescript
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

`src/types/auth.ts`:
```typescript
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}
```

`src/types/index.ts`:
```typescript
export * from './database';
export * from './migration';
export * from './project';
export * from './auth';
```

**Why:** Types are the contract between frontend and backend. Writing them first means every component and API function is typed from the start — no retrofitting.

**Verify:** `npm run build` — no TypeScript errors.

---

### Step 1.10 — Set up TanStack Query and the query client

**What:** Create `src/lib/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

Create `src/lib/queryKeys.ts`:

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
    inspect: (hash: string) => ['schema', 'inspect', hash] as const,
  },
} as const;
```

**Why:** A single `queryClient` instance ensures the cache is shared. The `queryKeys` factory prevents cache key typos and makes cache invalidation explicit and reliable.

**Verify:** Import `queryClient` in `main.tsx` — no TypeScript errors.

---

### Step 1.11 — Set up the Axios API client

**What:** Create `src/api/client.ts`:

```typescript
import axios from 'axios';

// Access token lives in memory — never in localStorage
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 30_000,
  withCredentials: true,
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.token);
        original.headers['Authorization'] = `Bearer ${data.token}`;
        return apiClient(original);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    const appError = {
      message: error.response?.data?.error?.message ?? 'An unexpected error occurred',
      code: error.response?.data?.error?.code ?? 'UNKNOWN_ERROR',
      status: error.response?.status ?? 500,
    };
    return Promise.reject(appError);
  }
);
```

**Why:** The in-memory token pattern is the safest approach for SPAs. The 401 interceptor automatically refreshes tokens, keeping the user logged in without any manual handling in components.

**Verify:** Import `apiClient` in another file — no TypeScript errors. Token variable is not exported (only the setter is), so it truly cannot leak.

---

### Step 1.12 — Set up routing and the root App component

**What:** Create `src/App.tsx` with React Router. Use `React.lazy` for all pages:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';

// Lazy-loaded pages (each becomes its own JS chunk)
const LoginPage             = lazy(() => import('@/pages/LoginPage'));
const RegisterPage          = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage         = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage          = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage     = lazy(() => import('@/pages/ProjectDetailPage'));
const MigrationNewPage      = lazy(() => import('@/pages/MigrationNewPage'));
const MigrationMonitorPage  = lazy(() => import('@/pages/MigrationMonitorPage'));
const MigrationsHistoryPage = lazy(() => import('@/pages/MigrationsHistoryPage'));
const EditorPage            = lazy(() => import('@/pages/EditorPage'));

// These come later — for now create stub components
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
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
        <Toaster theme="dark" position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

Create all page stubs — each just returns a `<div>` with the page name for now.

Create stub layout components `AppLayout.tsx` and `ProtectedRoute.tsx` that just render `<Outlet />` — implement them properly in Phase 2.

**Why:** Getting the full router defined now means the structure is clear. You can navigate to any URL and get a placeholder. Everything else is filling in the stubs.

**Verify:** `npm run dev`. Navigate to `/login`, `/dashboard`, `/editor`. Each renders its placeholder text.

---

## Phase 2 — Auth + Layout

**Goal:** Login works end-to-end. Protected routes redirect to login. The app shell (sidebar + header) is rendered on all protected pages.

---

### Step 2.1 — Write the auth Zustand store

**What:** Create `src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'seasyn-auth',
      // Only persist user metadata — isLoading always resets to true on reload
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
```

**Verify:** Import and call `useAuthStore.getState().setUser({ id: '1', email: 'test@test.com' })` in the browser console. Check that it persists after reload.

---

### Step 2.2 — Write auth API functions

**What:** Create `src/api/auth.ts`:

```typescript
import { apiClient, setAccessToken } from './client';
import type { User, LoginResponse } from '@/types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    setAccessToken(data.token);
    return data;
  },

  register: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', { email, password });
    setAccessToken(data.token);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.delete('/auth/logout');
    setAccessToken(null);
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
  },

  refresh: async (): Promise<string> => {
    const { data } = await apiClient.post<{ token: string }>('/auth/refresh');
    setAccessToken(data.token);
    return data.token;
  },
};
```

**Verify:** TypeScript is happy with all return types.

---

### Step 2.3 — Write Zod schemas for auth forms

**What:** Create `src/lib/validators.ts` starting with auth schemas:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
```

**Why:** Zod schema defines both the validation rules and the TypeScript types. One source of truth.

**Verify:** `z.infer<typeof loginSchema>` produces `{ email: string; password: string }`.

---

### Step 2.4 — Build the LoginPage

**What:** Replace the stub `src/pages/LoginPage.tsx` with the real implementation.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginFormValues) => authApi.login(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/dashboard');
    },
    onError: (err: { message: string }) => {
      toast.error(err.message ?? 'Login failed');
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign in to SEASYN</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => loginMutation.mutate(v))} className="space-y-4">
            <div>
              <Input type="email" placeholder="Email" {...register('email')} />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Password" {...register('password')} />
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Why:** This is a complete, production-quality login page. RHF handles form state, Zod handles validation, TanStack Query handles the API call lifecycle, Zustand stores the result.

**Verify:** Navigate to `/login`. Submit with bad email → Zod error appears. Submit with valid data → if backend is running, you get redirected. If backend is not running yet, check the network tab shows the right request.

---

### Step 2.5 — Build the RegisterPage

**What:** Follow the exact same pattern as LoginPage but using `registerSchema` and calling `authApi.register`.

**Verify:** Register a new user. Check the backend created the user. Login with those credentials.

---

### Step 2.6 — Implement ProtectedRoute

**What:** Replace the stub `src/components/layout/ProtectedRoute.tsx`:

```typescript
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // On mount, verify session is still valid
    authApi.me()
      .then((user) => setUser(user))
      .catch(() => { setUser(null); setLoading(false); });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Verifying session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Why:** On every page load, `ProtectedRoute` pings `GET /auth/me`. If the token is expired and refresh fails, the user is redirected to login. This is the security gate for the entire app.

**Verify:** Open `/dashboard` without being logged in → redirected to `/login`. Log in → access `/dashboard`. Manually clear localStorage → on next reload, redirect to login (because `/auth/me` returns 401).

---

### Step 2.7 — Build AppLayout (Sidebar + Header)

**What:** Replace the stub `src/components/layout/AppLayout.tsx`. Build `Sidebar.tsx` and `Header.tsx`.

`AppLayout.tsx`:
```typescript
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils'; // shadcn utility

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className={cn('flex flex-col flex-1 overflow-hidden transition-all', sidebarOpen ? 'ml-60' : 'ml-16')}>
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

`Sidebar.tsx`: Navigation links using `NavLink` from react-router-dom (adds active class automatically). Links: Dashboard, Projects, Migrations, Editor. Collapse toggle at the bottom. Uses `useUIStore` for open/close state.

`Header.tsx`: Shows current page breadcrumb (from `useLocation`). User email from `useAuthStore`. Logout button that calls `authApi.logout()` then clears auth store and navigates to `/login`.

**Verify:** Log in. See the sidebar. Click each link. Active link is highlighted. Collapse button works. Logout button works.

---

### Step 2.8 — Build the UI store

**What:** Create `src/store/uiStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  setTheme: (t: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'seasyn-ui' }
  )
);
```

**Verify:** Toggle the sidebar. Refresh the page. Sidebar is still in the same state.

---

## Phase 3 — Core Features

**Goal:** All four core features implemented — Projects, Migration Studio, Migration Monitor, Database Editor.

---

### Step 3.1 — Write project API functions

**What:** Create `src/api/projects.ts`:

```typescript
import { apiClient } from './client';
import type { Project } from '@/types';

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<{ projects: Project[] }>('/projects');
    return data.projects;
  },
  get: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<{ project: Project }>(`/projects/${id}`);
    return data.project;
  },
  create: async (name: string, description: string): Promise<Project> => {
    const { data } = await apiClient.post<{ project: Project }>('/projects', { name, description });
    return data.project;
  },
  update: async (id: string, name: string, description: string): Promise<Project> => {
    const { data } = await apiClient.put<{ project: Project }>(`/projects/${id}`, { name, description });
    return data.project;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
```

**Verify:** TypeScript is satisfied with all return types.

---

### Step 3.2 — Build ProjectsPage and ProjectDetailPage

**What:** Implement `src/pages/ProjectsPage.tsx`.

Uses `useQuery({ queryKey: queryKeys.projects.all, queryFn: projectsApi.list })` to fetch projects. Renders cards in a grid. "New Project" button opens a `Dialog` with a form (name + description). On submit, calls `projectsApi.create` and uses `queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })` to refresh the list.

Delete button: shows a confirmation `Dialog`. On confirm, calls `projectsApi.delete` and invalidates the query.

`ProjectDetailPage.tsx`: Fetches `projectsApi.get(id)`. Shows project info. Shows migration history for this project (from `migrationsApi.listByProject(id)`). "Start New Migration" navigates to `/migrations/new?projectId=${id}`.

**Verify:** Create a project. It appears in the list. Click it. See the detail page. Delete it. It disappears from the list.

---

### Step 3.3 — Write the connection form Zod schemas

**What:** Add to `src/lib/validators.ts`:

```typescript
export const sqlConnectionSchema = z.object({
  type: z.enum(['postgres', 'mysql', 'sqlite']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  sslMode: z.enum(['disable', 'require', 'verify-ca', 'verify-full']).optional(),
});

export const mongoConnectionStringSchema = z.object({
  type: z.literal('mongodb'),
  connectionString: z.string().min(1, 'Connection string is required'),
});

export const mongoManualSchema = z.object({
  type: z.literal('mongodb'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  database: z.string().min(1, 'Database is required'),
  username: z.string(),
  password: z.string(),
});
```

**Verify:** The schema correctly rejects invalid data in tests.

---

### Step 3.4 — Build ConnectionForm and DBTypeSelector

**What:** Create `src/components/connection/DBTypeSelector.tsx` — a row of 4 radio-style buttons (PostgreSQL, MySQL, MongoDB, SQLite), each with its DB type icon and name. Clicking one fires `onChange(dbType)`.

Create `src/components/connection/ConnectionForm.tsx` — the main form that:
1. Shows `DBTypeSelector`
2. Renders the correct fields based on selected DB type (SQL fields vs MongoDB toggle)
3. Has a "Test Connection" button that fires a mutation calling `POST /api/v1/connections/test`
4. Shows `ConnectionStatus` with the result
5. Only calls `onSuccess(config, schema)` when the test passes

```typescript
export function ConnectionForm({ onSuccess, onError, disabled }: ConnectionFormProps) {
  const [dbType, setDbType] = useState<DBType>('postgres');
  const [testResult, setTestResult] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const form = useForm({ resolver: zodResolver(getSchemaForType(dbType)) });

  const testMutation = useMutation({
    mutationFn: (config: ConnectionConfig) => schemaApi.testConnection(config),
    onSuccess: (result, config) => {
      setTestResult('success');
      // Fetch full schema on success
      schemaApi.inspect(config).then((schema) => onSuccess(config, schema));
    },
    onError: (err) => {
      setTestResult('error');
      onError(err.message);
    },
  });

  return (
    <div className="space-y-4">
      <DBTypeSelector value={dbType} onChange={setDbType} />
      {/* Dynamic fields */}
      {/* Test Connection button */}
      <ConnectionStatus state={testResult} />
    </div>
  );
}
```

**Verify:** Select each DB type — different fields appear. Click "Test Connection" while backend is running — see success or error indicator.

---

### Step 3.5 — Build the Migration Wizard store

**What:** Create `src/store/migrationWizardStore.ts`:

```typescript
import { create } from 'zustand';
import type { ConnectionConfig, Schema, MigrationOptions } from '@/types';

// NOTE: NO persist() here — credentials must not survive page refresh
interface MigrationWizardState {
  currentStep: 1 | 2 | 3 | 4;
  sourceConfig: ConnectionConfig | null;
  sourceSchema: Schema | null;
  destConfig: ConnectionConfig | null;
  destSchema: Schema | null;
  migrationOptions: MigrationOptions;
  goToStep: (step: 1|2|3|4) => void;
  setSource: (config: ConnectionConfig, schema: Schema) => void;
  setDest: (config: ConnectionConfig, schema: Schema) => void;
  setOptions: (opts: Partial<MigrationOptions>) => void;
  reset: () => void;
}

const defaultOptions: MigrationOptions = {
  batchSize: 500,
  truncateDestination: false,
  createIfNotExists: true,
  schemaMapping: {},
};

export const useMigrationWizardStore = create<MigrationWizardState>()((set) => ({
  currentStep: 1,
  sourceConfig: null,
  sourceSchema: null,
  destConfig: null,
  destSchema: null,
  migrationOptions: defaultOptions,
  goToStep: (currentStep) => set({ currentStep }),
  setSource: (sourceConfig, sourceSchema) => set({ sourceConfig, sourceSchema }),
  setDest: (destConfig, destSchema) => set({ destConfig, destSchema }),
  setOptions: (opts) => set((s) => ({ migrationOptions: { ...s.migrationOptions, ...opts } })),
  reset: () => set({ currentStep: 1, sourceConfig: null, sourceSchema: null, destConfig: null, destSchema: null, migrationOptions: defaultOptions }),
}));
```

**Verify:** Set source config in the store. Refresh the page. Source config is null — credentials cleared. This is the correct behavior.

---

### Step 3.6 — Build the Migration Wizard (all 4 steps)

**What:** Build each wizard step component. Assemble in `MigrationWizard.tsx`.

`WizardStep1.tsx`: Renders `ConnectionForm`. On `onSuccess` → calls `store.setSource(config, schema)` → calls `store.goToStep(2)`.

`WizardStep2.tsx`: Same as Step 1 but for destination. On success → `store.setDest` → `store.goToStep(3)`.

`WizardStep3.tsx`: Source table selector (dropdown from `store.sourceSchema.tables`). Dest table name input. `SchemaMappingTable` (built in Step 3.7). Options (batch size slider, truncate toggle, create-if-not-exists toggle). "Next" → `store.goToStep(4)`.

`WizardStep4.tsx`: Summary card showing all choices. "Start Migration" button → calls `migrationsApi.start(request)` → on success → `store.reset()` → navigate to `/migrations/:jobId`.

`MigrationWizard.tsx`: Renders the step indicator at top (4 steps with connecting lines). Renders the active step component based on `store.currentStep`. Previous button where appropriate.

**Verify:** Walk through all 4 steps manually with real database credentials. A migration starts and you're redirected to the monitor page.

---

### Step 3.7 — Build SchemaMappingTable

**What:** Create `src/components/migration/SchemaMappingTable.tsx`.

Renders a table. One row per source column. Each row has:
- Source column name (read-only, monospace)
- Source type badge (colored by `SeasonType`)
- Arrow icon
- Destination column name input (editable, pre-filled with source name)
- Destination type select (shows suggested type, overridable)
- Include toggle (switch component)

On any change, calls `onChange` with the full updated mapping array.

**Verify:** Render with a mock schema. Edit a destination column name. Toggle include off. Call `onChange` fires with correct values.

---

### Step 3.8 — Build the Migration Monitor page

**What:** Create `src/pages/MigrationMonitorPage.tsx`.

Reads `jobId` from `useParams()`. Calls `useMigrationSSE(jobId)` for live progress. Also polls `migrationsApi.getStatus(jobId)` every 5s using `useQuery` as a fallback.

Layout:
- Status header with `StatusBadge`
- `Progress` component from shadcn filled to `progress.percent`
- Stats row: migrated rows, rows/sec, elapsed, ETA
- `TerminalLog` component receiving `logs` from SSE hook
- Cancel button (calls `migrationsApi.cancel(jobId)`) — visible when state is "running"

**Verify:** Start a migration. Open the monitor page. Watch progress bar fill and logs scroll. Cancel mid-way — status updates to "cancelled".

---

### Step 3.9 — Build TerminalLog

**What:** Create `src/components/migration/TerminalLog.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import type { LogEntry } from '@/types';

const levelColors = {
  info: 'text-neutral-300',
  warn: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-green-400',
};

export function TerminalLog({ logs, autoScroll = true, maxVisible = 500 }: TerminalLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleLogs = logs.slice(-maxVisible);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll]);

  return (
    <div className="bg-neutral-950 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm border border-border">
      {visibleLogs.map((log, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
          <span className={levelColors[log.level]}>{log.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

**Verify:** Render with 1000 mock log entries. Only last 500 visible. New entries cause auto-scroll.

---

### Step 3.10 — Build the Database Editor

**What:** Create `src/pages/EditorPage.tsx` with `EditorLayout.tsx`, `SchemaTree.tsx`, `DataGrid.tsx`, `InsertRowModal.tsx`, `FilterBar.tsx`.

**EditorPage flow:**
1. Renders `EditorLayout` with connection panel on the left
2. Connection panel has `ConnectionForm` — on success, sets local state `{ config, schema }`
3. `SchemaTree` renders the schema — clicking a table calls `editorApi.queryRows(config, table, page: 1)` and sets local `{ activeTable, rows, totalCount }`
4. `DataGrid` renders the rows with inline editing — each edit calls `editorApi.updateRow(config, table, filter, newValues)`
5. Delete per row calls `editorApi.deleteRow(config, table, filter)` after confirmation popover
6. "Add Row" opens `InsertRowModal` — submit calls `editorApi.insertRow(config, table, values)` then refetches

**Key:** `config` (the `ConnectionConfig`) lives in `EditorPage` local state (`useState`). It is passed as an argument to every API call. It is **never** written to any store.

**Verify:** Connect to a real database. Browse tables. Edit a cell. Delete a row. Insert a new row. Disconnect (refresh) — form is cleared.

---

### Step 3.11 — Build DataGrid

**What:** Create `src/components/editor/DataGrid.tsx` using TanStack Table v8.

Key behaviors:
- Column definitions generated dynamically from `ColumnSchema[]`
- Cell renderer: default renders `<span>{value}</span>`. On click, replaces with `<input>` focused. On Enter, calls `onCellEdit`. On Escape, reverts.
- Each row has a delete button that shows a confirmation `Popover` before calling `onDeleteRow`
- Footer: pagination controls using TanStack Table's `getCanPreviousPage`, `getCanNextPage`, etc.

```typescript
// Custom editable cell
function EditableCell({ value, onSave }: { value: unknown; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  if (!editing) {
    return <span className="cursor-pointer hover:bg-accent px-1 rounded" onClick={() => setEditing(true)}>{String(value ?? '')}</span>;
  }

  return (
    <input
      autoFocus
      className="bg-transparent border-b border-primary outline-none w-full font-mono text-sm"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { onSave(draft).then(() => setEditing(false)); }
        if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false); }
      }}
    />
  );
}
```

**Verify:** Render with 50 mock rows. Click a cell — it becomes an input. Enter saves. Escape reverts. Pagination controls work.

---

### Step 3.12 — Build the Dashboard

**What:** Implement `src/pages/DashboardPage.tsx`.

Fetch projects with `useQuery`. Fetch all migrations with `useQuery`. Derive stats client-side. Render: stats bar (4 cards), recent projects grid (6), recent migrations table (10). "New Project" opens a dialog. "Start Migration" navigates to `/migrations/new`. "Open Editor" navigates to `/editor`.

**Verify:** After creating projects and running migrations, the dashboard shows the correct counts and recent items.

---

## Phase 4 — Polish & Hardening

**Goal:** Loading states, error boundaries, empty states, accessibility, and the Migrations History page. The app is ready to show to users.

---

### Step 4.1 — Add loading skeletons everywhere

**What:** Every `useQuery` call should show a `Skeleton` from shadcn while loading. Replace every `if (isLoading) return null` with proper skeleton layouts that match the shape of the content.

**Verify:** Throttle network in DevTools. Every page shows a skeleton before the data loads.

---

### Step 4.2 — Add ErrorBoundary

**What:** Create `src/components/shared/ErrorBoundary.tsx` as a class component. Wrap the `<Outlet />` in `AppLayout` with it. Show a friendly error card instead of a blank screen on uncaught errors.

**Verify:** Throw an error in a page component. ErrorBoundary catches it and shows the error card.

---

### Step 4.3 — Add empty states

**What:** Create `src/components/shared/EmptyState.tsx`. Use it in: Projects page (no projects yet), Migrations history (no migrations), Editor (no table selected), Dashboard (new user with no data).

**Verify:** Log in as a new user with no data. Every list shows the empty state with a helpful call-to-action.

---

### Step 4.4 — Build Migrations History page

**What:** Implement `src/pages/MigrationsHistoryPage.tsx`.

Fetches all migrations. Client-side filter by status (select) and project (select). TanStack Table for the data table (sortable by date, status, rows). Clickable rows navigate to monitor page. "Export CSV" generates a CSV from current filtered data and triggers a browser download using `URL.createObjectURL`.

**Verify:** Filter by status. Sort by date. Click a row. Export CSV — download triggers.

---

### Step 4.5 — Add keyboard navigation and ARIA

**What:** Audit every interactive element:
- All buttons have descriptive labels or `aria-label`
- Dialog components (from Radix UI) automatically manage focus trapping
- DataGrid table has proper `<thead>`, `<tbody>`, `role="grid"`, `aria-label`
- Form inputs all have associated labels (either `<label>` or `aria-label`)
- Status badges include `aria-label` with the full status text

**Verify:** Use Tab key to navigate the entire login form and dashboard. Everything is reachable by keyboard.

---

### Step 4.6 — Write Vitest unit tests

**What:** Add `vitest` and `@testing-library/react`:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom msw
```

Write tests for:
- `src/store/authStore.ts` — all state transitions
- `src/store/migrationWizardStore.ts` — verify no persistence, verify reset
- `src/hooks/useMigrationSSE.ts` — mock `EventSource`, verify state updates
- `src/components/connection/ConnectionForm.tsx` — all DB type variants
- `src/components/editor/DataGrid.tsx` — edit, cancel, delete

**Verify:** `npm run test` — all tests pass.

---

### Step 4.7 — Write Playwright E2E tests

**What:** Install Playwright and write the happy-path test:

```bash
npm install -D @playwright/test
npx playwright install
```

`tests/migration.spec.ts`:
1. Navigate to `/register` → fill form → submit
2. Land on `/dashboard` → see empty state
3. Create a project
4. Navigate to `/migrations/new`
5. Fill source connection (test Postgres running in Docker) → test connection passes
6. Fill dest connection (same Postgres, different table) → test passes
7. Configure migration → review → launch
8. See monitor page with progress bar filling
9. Wait for "completed" status

**Verify:** `npx playwright test` — test passes.

---

### Step 4.8 — Create `.env.example` and README

**What:** Create `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Create `README.md` with:
- Prerequisites (Node 18+, backend running)
- Setup: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`

**Verify:** A new developer can clone the repo, copy `.env.example` to `.env`, and run `npm run dev` with the app working.

---

### Step 4.9 — Production build verification

**What:**

```bash
npm run build
npm install -g serve
serve dist/
```

Open the production build. Test the full login flow, project creation, and migration wizard in the production bundle.

**Why:** Development mode has different behavior than production. Verifying the production build catches bundling issues, missing env vars, and router issues early.

**Verify:** Production build opens. No console errors. All routes work (try refreshing on `/dashboard` — you need a `_redirects` file or server config to handle client-side routing).

---

### Step 4.10 — Add `_redirects` for SPA deployment

**What:** Create `public/_redirects`:

```
/*    /index.html   200
```

This tells hosting platforms (Netlify, Cloudflare Pages) to serve `index.html` for every path, letting React Router handle routing client-side.

For Nginx, add to server config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Verify:** Deploy the `dist/` folder. Refresh on `/dashboard`. You see the dashboard, not a 404.

---

*End of SEASYN Frontend Implementation Plan*