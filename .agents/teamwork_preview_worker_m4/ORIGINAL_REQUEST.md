## 2026-07-24T21:32:30Z
You are Worker 4 (Build Performance & Optimization Specialist - R3) for ACME Workcentre.
Working Directory: c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_worker_m4

Objective:
Optimize production build, bundle performance, and route code-splitting for ACME Workcentre according to requirement R3.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Update `package.json`:
   - Add `typescript` to `devDependencies` if missing.
   - Verify `"scripts"` include `"dev"`, `"build"`, `"test"`, `"lint"`, `"preview"`.
2. Optimize `vite.config.js`:
   - Add `@` path alias pointing to `./src`.
   - Add Rollup `manualChunks` output configuration:
     - Chunk `vendor-react` (`react`, `react-dom`, `react-router-dom`).
     - Chunk `vendor-supabase` (`@supabase/supabase-js`).
     - Chunk `vendor-icons` (`lucide-react`).
   - Enable asset minification, target `esnext`, and sourcemaps.
3. Route Code Splitting in `src/App.jsx`:
   - Refactor view components (`AdminView`, `ProjectsView`, `RecruiterView`, `RegisterView`, `AddEmployeeWizard`, `LedgerReports`, `AttendanceManager`, `ClaimsDesk`) to use `React.lazy()` dynamic imports.
   - Wrap main routes in `<Suspense fallback={<LoadingSpinner />}>` with a clean loading component.
4. Memoize `AppContext` Provider value:
   - In `src/context/AppContext.jsx`, wrap the provider value object in `useMemo` with proper dependencies so context consumers do not trigger unnecessary global re-renders.
5. Verification:
   - Run `npm run build` and measure build time, bundle size before vs after optimization, chunk sizes, and verify 0 compilation errors.
   - Run `npm run test` to ensure all 43 unit/integration/E2E tests pass 100%.
6. Write a comprehensive report in `handoff.md` inside `c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_worker_m4\handoff.md` detailing build time, bundle sizes, chunk breakdown, and optimization metrics.
7. Send a message to parent when complete.
