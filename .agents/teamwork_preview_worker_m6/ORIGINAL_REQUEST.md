## 2026-07-25T03:06:53Z
You are Worker 6 (UI Component & Route Refinement Specialist) for ACME Workcentre.
Working Directory: c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_worker_m6

Objective:
Address the 3 specific review feedback items from Reviewer 1:

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. `src/views/RecruiterView.jsx`:
   - Inspect where `showAddCandidateModal` and `handleAddCandidateSubmit` are defined.
   - Insert the complete JSX modal markup `{showAddCandidateModal && (<div className="modal-overlay">...</div>)}` inside the returned JSX tree of `RecruiterView.jsx`.
   - Ensure the modal includes inputs for Candidate Name, Phone, Email, City, Sourcing Channel, and Notes, with Cancel (setting `setShowAddCandidateModal(false)`) and Submit buttons.
2. `src/App.jsx`:
   - Update the `/employee/add` route guard so it checks both `isAuthenticated` and user role (`currentUser?.role === 'Admin' || currentUser?.role === 'Accounts Manager'`).
   - If unauthorized, redirect to `/dashboard` or `/auth/login`.
3. `src/views/AddEmployeeWizard.jsx`:
   - In Step 3 (Onboarding & Leave Setup), add clean UI controls (a toggle/checkbox for `enableOnboarding` and a text input for `holidayList` items) bound to `enableOnboarding` and `holidayList` state hooks.
4. Verification:
   - Run `npm run build` and `npm run test` to verify zero errors and 100% test pass.
5. Document your changes and verification output in `handoff.md` in `c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_worker_m6\handoff.md`.
6. Send a message to parent when complete.
