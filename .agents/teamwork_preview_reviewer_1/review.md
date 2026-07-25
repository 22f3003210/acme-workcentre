# UI Component & Route Review Report

## Review Summary

**Verdict**: REQUEST_CHANGES

**Summary Rationale**:
During the review of UI components and React Router navigation code changes in `src/`, a **Critical Integrity Violation (Facade Implementation)** was discovered in `src/views/RecruiterView.jsx`. While state triggers (`showAddCandidateModal`) and submit handlers (`handleAddCandidateSubmit`) are defined, the Add Candidate Modal JSX block is completely missing from the rendered component tree. In addition, a **Major Security Finding** was identified in `src/App.jsx` where `/employee/add` is protected only by authentication without role verification, permitting non-admin users (such as Consultants) to access the employee onboarding wizard. Finally, `src/views/AddEmployeeWizard.jsx` contains state declarations and submission payload integration for `enableOnboarding` and `holidayList`, but omits corresponding UI form inputs.

---

## Findings

### [Critical] Finding 1: INTEGRITY VIOLATION - Facade Implementation of Add Candidate Modal in `src/views/RecruiterView.jsx`

- **What**: Facade implementation where candidate modal state and handler exist, but no JSX markup for the modal is rendered.
- **Where**: `src/views/RecruiterView.jsx`, Line 36, Line 296, Line 727, Lines 1261-1365.
- **Why**: 
  - Line 36 declares `const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);`.
  - Line 727 renders `<button onClick={() => setShowAddCandidateModal(true)}>+ Add Candidate</button>`.
  - Line 296 defines `const handleAddCandidateSubmit = (e) => { ... }`.
  - However, in lines 1261-1365, only `{showCreateJobModal && (...)}` and `{showCreateScorecardModal && (...)}` are present in the JSX tree.
  - Clicking "+ Add Candidate" sets `showAddCandidateModal` to `true`, but no modal dialog appears on screen. The candidate creation form cannot be accessed or submitted by users.
- **Tag**: `INTEGRITY VIOLATION` (Facade / Dummy implementation pattern).
- **Suggestion**: Implement the missing `{showAddCandidateModal && (...)}` modal JSX dialog in `RecruiterView.jsx` with input fields for candidate name, phone, email, city, relocation preference, channel, and summary, bound to `handleAddCandidateSubmit`.

---

### [Major] Finding 2: Security Guard on `/employee/add` Lacks Role-Based Access Control (RBAC)

- **What**: The route `/employee/add` checks `isAuthenticated` but does not enforce role authorization (e.g. `Admin` or `Accounts Manager`).
- **Where**: `src/App.jsx`, Line 147; `src/views/AddEmployeeWizard.jsx`, Lines 5-17.
- **Why**:
  - `src/App.jsx` Line 147: `<Route path="/employee/add" element={isAuthenticated ? <AddEmployeeWizard /> : <Navigate to="/auth/login" replace />} />`.
  - While `MainWorkspace` restricts workspace views based on `currentUser.role` (lines 94-98), `/employee/add` is rendered as a standalone route outside `MainWorkspace`.
  - Any authenticated user—including users with the `Consultant` role—can navigate directly to `/employee/add` and submit new employee records with arbitrary roles, titles, and CTC compensation details.
  - `AddEmployeeWizard.jsx` does not perform internal role checking or redirection either.
- **Suggestion**: Update line 147 in `App.jsx` (or add an internal check in `AddEmployeeWizard.jsx`) to verify `currentUser?.role === "Admin"` or `currentUser?.role === "Accounts Manager"`, redirecting unauthorized users to `/dashboard` or an access denied state.

---

### [Minor] Finding 3: Omission of Interactive UI Inputs for `enableOnboarding` and `holidayList` in `AddEmployeeWizard.jsx`

- **What**: `enableOnboarding` and `holidayList` are declared as state and included in the submit payload, but lack UI form controls in Step 3.
- **Where**: `src/views/AddEmployeeWizard.jsx`, Lines 45, 47, 139, 141, 410-487.
- **Why**:
  - Line 45: `const [enableOnboarding, setEnableOnboarding] = useState(true);`
  - Line 47: `const [holidayList, setHolidayList] = useState([]);`
  - Submit payload (lines 139 & 141): `enableOnboarding` and `holidayList` are forwarded to `newEmpData` and passed to `addUser(newEmpData)`.
  - However, in Step 3 ("WORK DETAILS", lines 410-487), while `inviteToLogin` (line 415) and `attendanceTracking` (line 434) have interactive checkboxes, there is no checkbox control for `enableOnboarding` nor any select/multi-select input for `holidayList`.
- **Suggestion**: Add a checkbox control for `enableOnboarding` and a dropdown/multi-select control for `holidayList` in Step 3 of `AddEmployeeWizard.jsx` so users can configure these values during onboarding.

---

## Verified Claims

1. **`AddEmployeeWizard.jsx` State & Payload Verification**:
   - Claim: `enableOnboarding` and `holidayList` state declarations and submit payload exist.
   - Verification Method: Inspected `src/views/AddEmployeeWizard.jsx` lines 45, 47, 139, 141.
   - Result: **PASS (with UI caveat)** — State variables exist and are included in payload, though missing UI controls.

2. **`AdminView.jsx` `/ledger` Route Verification**:
   - Claim: `/ledger` route handling (`activeTab === "ledger"` rendering `LedgerReports`).
   - Verification Method: Inspected `src/App.jsx` line 163 and `src/views/AdminView.jsx` lines 3962 & 4022-4025.
   - Result: **PASS** — `/ledger` maps to `AdminView` with `activeTab="ledger"`, which defaults `activeExpenseTab` to `"manage_expenses"` and renders `<LedgerReports />`.

3. **`App.jsx` Lazy Loading & Suspense Verification**:
   - Claim: Dynamic view loading via `React.lazy` + `Suspense`.
   - Verification Method: Inspected `src/App.jsx` lines 1-34, 112, 127. Ran `npm run build`.
   - Result: **PASS** — Dynamic imports are wrapped with `lazyView` helper and `<Suspense fallback={<LoadingSpinner />}>` boundaries. Vite build completes cleanly in 624ms.

4. **Test Suite Verification**:
   - Claim: Application passes existing test suite.
   - Verification Method: Executed `npm test` (`vitest run`).
   - Result: **PASS** — 43 tests across 5 test suites passed.

---

## Coverage Gaps

- **Role Authorization Edge Cases**: Navigation guards for direct URL entry across sub-routes (e.g. `/employee/job-titles`, `/employee/departments`) when accessed by non-admin users. Recommendation: Ensure `MainWorkspace` or layout routes enforce consistent RBAC checks.

---

## Unverified Items

- **Backend Supabase RLS policies**: Local review verified client-side routes and components; database RLS policy enforcement on `users` table for `/employee/add` was not verified against live Supabase backend.
