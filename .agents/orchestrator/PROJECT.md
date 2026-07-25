# Project: ACME Workcentre Evaluation & Benchmarking

## Architecture
- React 18 + Vite frontend application with Supabase integration, AppContext state management, and React Router navigation.
- Target Audit Components: AdminView, ProjectsView, RecruiterView, RegisterView, AddEmployeeWizard, LedgerReports.
- Target Verified Routes: `/`, `/employee/directory`, `/employee/add`, `/projects`, `/attendance`.
- Database & Persistence: AppContext, Supabase client helpers CRUD, fallback localStorage, mock data loading.
- Build & Performance: Vite build execution, bundle size analysis, asset optimization, zero build errors.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Initial Codebase Exploration & E2E Testing Track | Read codebase, map routes & components, create E2E test harness & publish TEST_READY.md | none | DONE |
| 2 | R1: UI Component & Route Audit & Fixes | Audit target components & routes for broken imports, edge cases, missing navigation, fix issues | M1 | DONE |
| 3 | R2: Database Synchronization & Context Integrity Audit & Fixes | Audit AppContext, Supabase CRUD, fallback localStorage, mock data error handling, fix issues | M1 | DONE |
| 4 | R3: Build & Bundle Performance Benchmark & Optimizations | Benchmark build time, bundle size, optimize assets, verify zero build/syntax errors | M2, M3 | DONE |
| 5 | Final E2E Verification & Report Generation | Run E2E test suite, adversarial coverage hardening, synthesize evaluation_report.md | M1, M2, M3, M4 | IN_PROGRESS |

## Code Layout
- `src/` - React application source code
  - `src/components/` - View & UI components
  - `src/context/` - State management & AppContext
  - `src/lib/` or `src/services/` - Supabase client & storage helpers
  - `src/routes/` or App router setup
- `.agents/` - Orchestrator & subagent metadata workspaces
