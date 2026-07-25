## 2026-07-25T02:52:44Z
You are Worker 3 (Database Synchronization & Context Integrity Remediation Specialist - R2) for ACME Workcentre.
Working Directory: c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_worker_m3

Objective:
Remediate all database synchronization, state context, LocalStorage persistence, and error handling defects in `c:\Users\sayed\OneDrive\Desktop\ACME\src`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Fix Render-Phase Side Effect in `AppContext.jsx`:
   - Move the LocalStorage data version check and key clearing (L42-58) from render body into a `useEffect` hook.
   - Update the version flushing array to also flush `workcentre_current_user_id` and `workcentre_authenticated` (or safely reset `currentUser` state) on version bump.
2. Fix Unpersisted Entities in `AppContext.jsx`:
   - Add LocalStorage initializers and `useEffect` sync hooks for `jobTitles`, `numberSeries`, `departments`, `shifts`, and `weeklyOffs`.
3. Fix Attribute Stripping in `mappedUsers` (`AppContext.jsx` L122-139):
   - Preserve existing local attributes (`attendance`, `password`, `specialization`, `emergencyContact`, `bankUpi`, `inviteToken`, `openingBalance`) when mapping remote database user objects so local user state is not lost.
4. Implement Supabase Write-Back CRUD Integration:
   - Add Supabase API helper functions in `src/lib/supabaseClient.js` for expenses, projects, advance requests, hiring requisitions, and candidates.
   - Call these Supabase API write-back functions in `addExpense`, `verifyExpense`, `addProject`, `updateProject`, `requestAdvance`, `verifyAdvanceRequest`, `addHiringRequisition`, and `addCandidate` in `AppContext.jsx`.
5. Fix Exception Vectors & Unhandled Promises:
   - Wrap all `JSON.parse(localStorage.getItem(...))` calls in `try...catch` blocks with safe fallback defaults.
   - Add `.catch()` rejection handlers to all Supabase async `.then()` chains in `AppContext.jsx`.
6. Add Error Boundaries & Safe Property Access:
   - Create `src/components/ErrorBoundary.jsx` and wrap the application root in `App.jsx` / `main.jsx`.
   - Add optional chaining to `currentUser?.name` and `currentUser?.role` in `UserSwitcher.jsx` and `Layout.jsx`.
7. Run build (`npm run build`) and test verification.
8. Document changes and build results in `handoff.md` in your working directory `c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_worker_m3`.
9. Send a message to parent when complete.
