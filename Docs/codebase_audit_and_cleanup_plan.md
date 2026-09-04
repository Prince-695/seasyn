# Seasyn Codebase Audit & Architectural Cleanup Plan

> **Date:** September 2026  
> **Scope:** Full repository review across frontend source files, UI primitives, state management, API layer, type contracts, and documentation.  
> **Status:** All Categories (1, 2, 3, 4) Successfully Completed.

---

## 1. Executive Summary

This audit identifies and resolves:
1. **Unused & Orphaned Files:** Assets, landing page components, and UI primitives that existed in the repository with 0 active usages. *(Completed in Category 1)*
2. **Repetitive & Duplicated Code:** Redundant API endpoints, duplicate connection ping implementations, duplicated database engine definitions, and repeated Zod validation rules. *(Completed in Category 2)*
3. **Mixed Concerns in Single Files:** Components that mixed heavy SVG icon paths, constant tables, modal dialogs, and diagnostic fetching into one large file. *(Completed in Category 3)*
4. **Over-Split Files & Unnecessary Indirection:** 5–15 line utility files and barrel files that added cognitive overhead. *(Completed in Category 4)*
5. **Type System & Circular Dependencies:** Inconsistent separation between wire types (`src/api/types.ts`) and domain types (`src/types/index.ts`). *(Resolved in Category 3)*

---

## 2. Category 1: Unused & Dead Code / Orphaned Files (Status: Completed)

| File Path | Description / Issue | Action Taken |
|---|---|---|
| `frontend/src/assets/MongoDB.svg`<br>`frontend/src/assets/MySQL.svg`<br>`frontend/src/assets/PostgresSQL.svg`<br>`frontend/src/assets/SQLite.svg`<br>`frontend/src/assets/react.svg` | **100% Unused Static Assets.** Engine logos are rendered via standard icons in `EngineIcon.tsx` and via `react-icons/si` in `Slider.tsx`. | **Deleted** unused `.svg` files from `src/assets/`. |
| `frontend/src/components/home/CTASection.tsx`<br>`frontend/src/components/home/Testimonials.tsx` | **Orphaned Landing Components.** Unused components in `Home.tsx`. | **Cleaned up** to avoid dead code accumulation. |
| `frontend/src/components/ui/button-group.tsx`<br>`frontend/src/components/ui/checkbox.tsx`<br>`frontend/src/components/ui/field.tsx`<br>`frontend/src/components/ui/input-group.tsx`<br>`frontend/src/components/ui/item.tsx`<br>`frontend/src/components/ui/separator.tsx` | **Unused UI Primitives (0 imports).** Auto-generated or scaffolded Base UI wrappers that had zero usage across the entire frontend. | **Deleted** unused UI primitives. |
| `frontend/src/lib/typeMapping.ts` | **Dead Helper Module (44 lines).** Exported `dbTypeMapping` and `getDBTypeMeta`, but was not imported anywhere in the codebase. | **Deleted** dead file. |

---

## 3. Category 2: Repetitive & Duplicated Code (Status: Completed)

### 3.1 Duplicate API Methods in `src/api/auth.ts`
- **Resolution:**
  - Standardized `resendOtp` to delegate directly to `authApi.sendOtp()`.
  - Standardized `authApi.getProfile` and `authApi.updateProfile` to delegate cleanly to `userApi` while preserving backwards-compatible signatures.
  - Standardized `UpdateProfilePayload` across both auth and user profile endpoints.

### 3.2 Duplicate Diagnostic Ping Logic & UI
- **Resolution:**
  - Integrated `DiagnosticPingButton.tsx` directly into `ConnectionCard.tsx`.
  - Removed 60+ lines of duplicated testing state, inline `projectsApi.testSavedConnection` calls, and custom status pill markup from `ConnectionCard.tsx`.

### 3.3 Centralized Database Engine Definitions
- **Resolution:**
  - Consolidated canonical database engine configurations (`ENGINES`) into `src/lib/constants/engines.ts`.
  - Refactored `EngineSelector.tsx` to consume the single source of truth `ENGINES` list from constants.

### 3.4 DRY Validation Schemas in `src/lib/validators.ts`
- **Resolution:**
  - Extracted reusable Zod field primitives: `emailField`, `otpField`, `passwordField`, `roleField`, `slugField`, `descriptionField`.
  - Composed all auth, project, connection, and org schemas from these single primitives with zero changes to runtime validation behavior or type signatures.

---

## 4. Category 3: Mixed Concerns in Single Files (Status: Completed)

| File | Mixed Concerns | Action Taken |
|---|---|---|
| `frontend/src/components/connections/EngineSelector.tsx` | Contained 70+ lines of raw SVG markup (`EngineIcon`), constant metadata arrays, and the React component (`EngineSelector`). | **Extracted** `EngineIcon` to `src/components/connections/EngineIcon.tsx` using standardized `react-icons/si` database brand icons (`SiPostgresql`, `SiMysql`, `SiMongodb`, `SiSqlite`). |
| `frontend/src/pages/projects/ProjectDetailsPage.tsx` | Combined tab navigation, project stats, connection query & creation modal, inline project rename/update form, and connection deletion logic in one file. | **Extracted** `ProjectSettingsTab` into `src/components/projects/ProjectSettingsTab.tsx`. Kept `ProjectDetailsPage.tsx` focused on orchestration. |
| `frontend/src/types/index.ts` & `src/api/types.ts` | Circular type imports: `src/api/types.ts` imported `User` from `@/types`, while `src/types/index.ts` re-exported `SignupPayload` from `@/api/types`. | **Extracted** auth contracts and payloads into `src/types/auth.ts`, unified in `src/types/index.ts`, and re-exported in `src/api/types.ts`, removing circular dependency. |

---

## 5. Category 4: Over-Split & Unnecessary Separate Files (Status: Completed)

| Over-Split File | Action Taken |
|---|---|
| `frontend/src/hooks/useHasPermission.ts` | **Co-located** `useHasPermission` hook inside `src/components/auth/PermissionGuard.tsx` and re-exported via `@/components/auth`. Deleted redundant separate hook file. |
| `frontend/src/components/auth/AuthInitializer.tsx` | **Inlined** `AuthInitializer` directly inside `src/App.tsx` where it wraps the router tree. Deleted redundant wrapper file. |
| `frontend/src/components/layout/index.ts` | **Cleaned up** cross-folder exports (`Navbar`, `NavbarMobile`, `Footer`) to maintain strict module boundaries. |
