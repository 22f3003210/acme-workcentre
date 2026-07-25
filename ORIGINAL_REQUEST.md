# Original User Request

## Initial Request — 2026-07-25T02:47:27Z

An autonomous evaluation and benchmarking suite designed to audit, test, and measure performance across all UI components, React Router paths, Supabase database synchronization, and Vite build bundles in the ACME Workcentre codebase.

Working directory: c:\Users\sayed\OneDrive\Desktop\ACME
Integrity mode: development

## Requirements

### R1. UI Component & Route Audit
Execute a comprehensive evaluation across all view components (AdminView, ProjectsView, RecruiterView, RegisterView, AddEmployeeWizard, LedgerReports) and verified route paths (/, /employee/directory, /employee/add, /projects, /attendance). Detect broken imports, unhandled state edge cases, or missing navigation links.

### R2. Database Synchronization & Context Integrity
Verify data operations in AppContext and Supabase client helpers to ensure CRUD operations, fallback local storage persistence, and mock data loading operate cleanly without uncaught promise rejections or state corruption.

### R3. Production Build & Bundle Performance Benchmark
Benchmark production bundle size, Vite build execution time, asset optimization, and ensure static analysis produces zero build errors or broken JSX syntax.

## Acceptance Criteria

### Automated Build & Lint Verification
- `npm run build` completes with exit code 0 and zero compilation errors.
- No missing React imports, broken component bindings, or dead route references exist across src/.

### Functional Coverage & Report Generation
- A structured evaluation report (evaluation_report.md) is generated summarizing test results, code audit coverage, state resilience metrics, and recommended optimizations.
