## 2026-07-24T21:35:34Z
You are Reviewer 2 (Database & Context Integrity Reviewer) for ACME Workcentre.
Working Directory: c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_reviewer_2

Objective:
Review the code changes made in `src/` for AppContext, Supabase integration, and error handling.
Specifically verify:
1. `AppContext.jsx`: Verify `useEffect` data version checking, LocalStorage initializers/sync for 5 entity arrays (`jobTitles`, `numberSeries`, `departments`, `shifts`, `weeklyOffs`), and `useMemo` Provider value memoization.
2. `mappedUsers`: Verify preservation of local user attributes (`attendance`, `password`, `specialization`, `emergencyContact`, `bankUpi`, `inviteToken`, `openingBalance`).
3. Supabase Write-Back CRUD: Verify helper calls in `supabaseClient.js` and `AppContext.jsx` for expenses, projects, advance requests, requisitions, and candidates.
4. Resilience: Verify `try...catch` wrappers around `JSON.parse`, promise `.catch()` handlers, `ErrorBoundary.jsx` integration, and `currentUser` optional chaining (`?.`).

Write your review report `review.md` and handoff report `handoff.md` in `c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_reviewer_2`.
Send a message to parent when complete.
