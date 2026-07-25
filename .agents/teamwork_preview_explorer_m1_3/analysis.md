# Comprehensive Technical Analysis: Build Performance, Dependency Graph & Test Infrastructure

**Target System:** ACME Workcentre (Jewelry Business Development Portal)  
**Evaluator:** Explorer 3 (Build Performance & Test Infra Specialist)  
**Date:** July 2026  
**Workspace Path:** `c:\Users\sayed\OneDrive\Desktop\ACME`

---

## Executive Summary

ACME Workcentre is a React 19 single-page application built with Vite 8 and React Router DOM v7. It interfaces with Supabase as its backend database and provides multi-role administrative, financial, project advisory, and HR features.

This analysis details the current state of the project's build setup, dependency tree, performance bottlenecks, compilation integrity, and test infrastructure. Key findings include:
- **Missing Infrastructure:** Zero test runners (Vitest, Jest, Playwright, Cypress) exist. No TypeScript configuration (`tsconfig.json`) or type-checking scripts are present, despite `@types/react` being installed without `typescript` in `package.json`.
- **Bundle & Performance Bottlenecks:** Vite configuration is minimal with no code-splitting/manualChunks strategy, resulting in monolithic JS/CSS bundles. `AppContext.jsx` is a massive 1,228-line unmemoized state container causing application-wide re-renders on any state change.
- **Styling Architecture:** Styling relies exclusively on custom CSS with CSS variables in `src/index.css` (3,043 lines). Neither Tailwind CSS nor PostCSS is installed or configured.
- **Build Integrity:** Production build output (`dist/`) builds successfully, but lacks static type validation, automated tests, and bundle optimization.

---

## 1. Build Configuration & Dependency Graph Analysis

### 1.1 Vite Configuration (`vite.config.js`)
* **Path:** `c:\Users\sayed\OneDrive\Desktop\ACME\vite.config.js`
* **Content:**
  ```javascript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
    server: {
      port: 8080,
      strictPort: false
    }
  })
  ```
* **Evaluation & Deficiencies:**
  1. **Config Format:** Written as JavaScript (`.js`) instead of TypeScript (`.ts`), missing IDE autocomplete and type safety for build options.
  2. **No Path Aliasing:** `@/` path alias is not configured. All imports across views and components use relative paths (e.g. `../../context/AppContext`, `../assets/logo.png`), which increases refactoring fragility.
  3. **No Chunk Splitting Strategy:** Lacks `build.rollupOptions.output.manualChunks`. By default, Vite bundles vendor libraries (`react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`) and all view components into a single chunk (`dist/assets/index-DxZxWv2m.js`), exceeding recommended initial load budgets.
  4. **No Build Target or Compression:** Lacks compression plugins (`vite-plugin-compression` or Brotli/Gzip) and explicit target ES directives.
  5. **No Sourcemap Strategy:** `build.sourcemap` is unset (defaults to `false`), preventing production error tracking/debugging.

### 1.2 Package Dependencies (`package.json`)
* **Path:** `c:\Users\sayed\OneDrive\Desktop\ACME\package.json`
* **Dependencies:**
  ```json
  "dependencies": {
    "@supabase/supabase-js": "^2.110.8",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "oxlint": "^1.71.0",
    "vite": "^8.1.1"
  }
  ```
* **Evaluation & Missing Packages:**
  1. **Missing `typescript`:** Type definitions `@types/react` and `@types/react-dom` are installed, but `typescript` itself is not declared in `devDependencies` or `dependencies`.
  2. **Missing Test Dependencies:** Zero testing libraries are installed (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `playwright`, `cypress`, `msw`).
  3. **Missing NPM Scripts:**
     - No `"test"` script.
     - No `"type-check"` script (e.g., `"tsc --noEmit"`).
     - Current scripts are limited to: `"dev": "vite"`, `"build": "vite build"`, `"lint": "oxlint"`, `"preview": "vite preview"`.

### 1.3 TypeScript Configuration (`tsconfig.json`)
* **Status:** **NON-EXISTENT / MISSING**
* **Impact:** The codebase uses JavaScript (`.jsx`/`.js`). Without a `tsconfig.json` or `jsconfig.json`, the editor and CI pipeline cannot enforce prop-types, interface contracts, or strict null checks.

### 1.4 CSS & Styling Settings (PostCSS / Tailwind)
* **Status:** Neither Tailwind CSS (`tailwind.config.js`) nor PostCSS (`postcss.config.js`) is present.
* **Architecture:** Styling is managed via vanilla CSS in `src/index.css` (3,043 lines) and `src/App.css` (340 lines).
* **Evaluation:**
  - `src/index.css` contains CSS custom properties (design tokens for colors, typography, shadows, borders) and a global 90° square edge override (`border-radius: 0px !important`).
  - While simple, maintaining 3,000+ lines of custom CSS without SCSS modules, Tailwind, or CSS Modules increases the risk of selector collisions and duplicate class definitions.

### 1.5 Asset Bundling & Directory Hygiene
* **Assets Directory:** `src/assets/` contains static images (`logo.png`, `hero.png`, `illustration.png`, `react.svg`, `vite.svg`) along with utility Python scripts (`clean_and_crop.py`, `crop_illustration.py`).
* **Recommendation:** Python image utility scripts should be removed from `src/assets/` to avoid polluting client source directories.

---

## 2. Build Verification & Code Quality Analysis

### 2.1 Build Execution & Output Analysis
* Running `vite build` generates the `dist/` folder:
  - `dist/index.html` (859 B)
  - `dist/assets/index-DxZxWv2m.js` (~520 KB)
  - `dist/assets/index-g4O5SaYq.css` (~61 KB)
  - `dist/assets/logo-CAg5eV9Q.png`
* **Observation:** The build succeeds without throwing fatal Rollup syntax errors. However, all application views (`AdminView`, `AccountsView`, `ConsultantView`, `ProjectsView`, `RecruiterView`, `AddEmployeeWizard`) are bundled together into `index-DxZxWv2m.js`.

### 2.2 Compilation & Architecture Vulnerabilities

1. **Massive Monolithic State Container (`src/context/AppContext.jsx`):**
   - **Line Count:** 1,228 lines.
   - **Responsibility:** Manages state for Users, Expenses, Settings, Advance Requests, Projects, Hiring Requisitions, Candidates, Job Titles, Number Series, Departments, Shifts, Weekly Offs, Current User, Auth State, and Toast messages.
   - **Performance Issue:** The provider value (line 1160) is instantiated as a plain object literal on every render without `useMemo`. Any update (e.g. typing in a search box or ticking a checklist item) triggers a complete re-render of every component consuming `useApp()`.

2. **Absence of Route Code Splitting:**
   - In `src/App.jsx`, all view components are imported top-level via static imports:
     ```javascript
     import LoginView from "./views/LoginView";
     import AdminView from "./views/AdminView";
     import AccountsView from "./views/AccountsView";
     import ConsultantView from "./views/ConsultantView";
     import RegisterView from "./views/RegisterView";
     import AddEmployeeWizard from "./views/AddEmployeeWizard";
     ```
   - **Recommendation:** Implement dynamic imports with `React.lazy()` and `React.Suspense` for modular route loading.

3. **Hardcoded Fallbacks & Bypass Logic:**
   - `src/lib/supabaseClient.js` (lines 3-4): Hardcoded Supabase URL and JWT Anon key fallbacks.
   - `src/context/AppContext.jsx` (lines 355-356): Hardcoded admin login bypass (`acmeadmin` / `123`).
   - `src/context/AppContext.jsx` (line 395): Hardcoded OTP verification bypass (`123456` or `000000`).

4. **Data Version Invalidation Mechanism (`AppContext.jsx` lines 39-58):**
   - Uses `DATA_VERSION = "v13"` to clear localStorage. If structural changes occur in `initialData.js` without updating `DATA_VERSION`, clients experience runtime errors from incompatible stored state.

---

## 3. Test Infrastructure Evaluation

### 3.1 Current Test Coverage Assessment
* **Unit Tests:** 0 tests found.
* **Integration Tests:** 0 tests found.
* **End-to-End (E2E) Tests:** 0 tests found.
* **Test Runners / Libraries Installed:** None (`vitest`, `jest`, `playwright`, `cypress`, `@testing-library/react` are all missing).

### 3.2 High-Risk Untested Business Logic
1. **Financial Ledger Computation (`AppContext.jsx` lines 623-716):** `getEmployeeLedger()` calculates daily opening balance, food/stay/travel category breakdowns, expense deductions, refill additions, and closing balances for petty cash accounting. Errors here affect financial reporting accuracy.
2. **Attendance & Worked Hours Calculation (`AppContext.jsx` lines 719-776):** `checkInConsultant()` and `checkOutConsultant()` parse time strings ("08:15 AM") into minutes from midnight, calculate worked hours, and flag late check-ins against configured thresholds.
3. **Role-Based Access Control (RBAC):** Routing in `src/App.jsx` conditionally renders views based on `currentUser.role` ("Admin", "Accounts Manager", "Consultant"). No automated assertions verify that unauthorized roles are blocked from administrative routes.
4. **Recruitment Pipeline (`src/views/RecruiterView.jsx`):** Stage transitions (Sourced -> Interview -> Offered -> Hired) and requisition linking.

---

## 4. Requirements & Blueprint for E2E and Unit/Integration Testing Framework

To establish robust quality assurance for ACME Workcentre, the following test infrastructure should be implemented:

### 4.1 Unit & Integration Testing Layer (Vitest + React Testing Library)
* **Stack:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
* **Configuration File:** Create `vitest.config.js`:
  ```javascript
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  });
  ```
* **Key Unit Test Suites:**
  - `AppContext.test.jsx`: Assert `getEmployeeLedger()` arithmetic accuracy across 31-day months.
  - `parseTimeToMinutes.test.js`: Test boundary conditions for 12:00 AM, 12:00 PM, invalid formats.
  - `UserSwitcher.test.jsx`: Verify user role switching updates active context correctly.

### 4.2 End-to-End (E2E) Testing Layer (Playwright)
* **Stack:** `@playwright/test`.
* **Configuration File:** `playwright.config.ts` targeting `http://localhost:8080`.

#### E2E Route & Feature Test Matrix:
| Module / Route | User Role | Test Scenarios |
|---|---|---|
| `/auth/login` | Unauthenticated | 1. Login with valid credentials (`admin` / `123`).<br>2. Login with phone OTP flow.<br>3. Verify invalid login displays error. |
| `/auth/register` | Candidate / Consultant | 1. Access via token URL `/auth/register?token=INV-12345`.<br>2. Complete password set & profile creation.<br>3. Redirect to dashboard upon completion. |
| `/dashboard` | Admin / Consultant | 1. Verify role-specific dashboard metrics.<br>2. Test UserSwitcher role toggling. |
| `/employee/directory` | Admin | 1. Search employee by name/code.<br>2. Delete employee record.<br>3. Verify employee list updates. |
| `/employee/add` | Admin | 1. Navigate 4-step Add Employee wizard.<br>2. Submit form and verify candidate invite generation. |
| `/expenses` & `/ledger` | Accounts Manager / Consultant | 1. Consultant submits expense claim.<br>2. Accounts Manager approves claim.<br>3. Verify ledger summary total update. |
| `/time/attendance` | Consultant | 1. Perform Check In with project selection.<br>2. Perform Check Out and verify calculated hours worked. |
| `/projects` | Consultant / Admin | 1. Filter projects by status.<br>2. Toggle project audit checklist item.<br>3. Post project discussion note. |
| `/recruiting` | Admin / Recruiter | 1. Create hiring requisition.<br>2. Drag/move candidate through recruitment stages. |

### 4.3 CI/CD Integration Recommendations
Add the following scripts to `package.json`:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "oxlint",
  "type-check": "tsc --noEmit",
  "test:unit": "vitest run",
  "test:e2e": "playwright test",
  "preview": "vite preview"
}
```

---

## 5. Summary of Actionable Recommendations

1. **Configure TypeScript Infrastructure:** Add `typescript` to `devDependencies`, create `tsconfig.json` (or `jsconfig.json`), and add `"type-check": "tsc --noEmit"` to `package.json`.
2. **Optimize Vite Build Strategy:** Configure path alias `@/` -> `src/` and code-splitting (`manualChunks` for vendor & view splitting) in `vite.config.js`.
3. **Implement Vitest for Business Logic:** Add unit tests for `getEmployeeLedger`, time parser, and expense calculations.
4. **Implement Playwright for E2E Coverage:** Deploy Playwright E2E test harness testing all 19 application routes across Admin, Accounts Manager, and Consultant roles.
5. **Optimize AppContext Performance:** Wrap context provider value in `useMemo` and consider splitting `AppContext` into smaller domain context providers (`AuthContext`, `EmployeeContext`, `ExpenseContext`, `ProjectContext`).
