# Handoff Report: Database Synchronization & State Context Audit

**Agent**: Explorer 2 (Database & Context Integrity Specialist)  
**Working Directory**: `c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_explorer_m1_2`  
**Target Path**: `c:\Users\sayed\OneDrive\Desktop\ACME\src`  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

Direct code examination of `src/` revealed the following exact observations:

1. **Render-Phase Side Effect & Flushed Keys**:
   - `src/context/AppContext.jsx:42-58`: Synchronous LocalStorage clearing occurs directly in `AppProvider` render body:
     ```javascript
     (() => {
       const stored = localStorage.getItem("workcentre_data_version");
       if (stored !== DATA_VERSION) {
         const keys = [
           "workcentre_users",
           "workcentre_expenses",
           "workcentre_settings",
           "workcentre_advance_requests",
           "workcentre_projects",
           "workcentre_hiring_requisitions",
           "workcentre_candidates"
         ];
         keys.forEach(k => localStorage.removeItem(k));
         localStorage.setItem("workcentre_data_version", DATA_VERSION);
       }
     })();
     ```
   - `keys` omits `workcentre_current_user_id` and `workcentre_authenticated`.

2. **Unpersisted State Entities**:
   - `src/context/AppContext.jsx:95-99`: `jobTitles`, `numberSeries`, `departments`, `shifts`, and `weeklyOffs` are initialized as empty arrays `[]`. Lines 308-345 contain no LocalStorage sync effects for these 5 states.

3. **Supabase Integration Asymmetry**:
   - `src/context/AppContext.jsx:114-306`: Initial fetch queries 11 tables (`users`, `expenses`, `advance_requests`, `hiring_requisitions`, `candidates`, `projects`, `job_titles`, `employee_number_series`, `departments`, `shifts`, `weekly_offs`).
   - `src/context/AppContext.jsx:778-1020`: `addExpense`, `verifyExpense`, `addProject`, `updateProject`, `requestAdvance`, `verifyAdvanceRequest`, `addHiringRequisition`, `addCandidate` do **NOT** invoke Supabase API functions; they only update React state and LocalStorage.

4. **Destructive User Mapping (`mappedUsers`)**:
   - `src/context/AppContext.jsx:122-139`:
     ```javascript
     const mappedUsers = data.map(dbU => ({
       id: dbU.id,
       empCode: dbU.emp_code || dbU.empCode || "",
       name: dbU.name,
       email: dbU.email,
       phone: dbU.phone,
       role: dbU.role,
       title: dbU.title,
       department: dbU.department,
       location: dbU.location,
       status: dbU.status || "Active",
       avatar: dbU.avatar || ...,
       advanceAmount: Number(dbU.advance_amount) || 0,
       shift: dbU.shift || "",
       weeklyOff: dbU.weekly_off || "",
       reportingManager: dbU.reporting_manager || ""
     }));
     setUsers(mappedUsers);
     ```
   - Attributes omitted: `attendance`, `password`, `specialization`, `emergencyContact`, `bankUpi`, `inviteToken`, `openingBalance`.

5. **Unprotected Storage Deserialization & Unhandled Promise Rejections**:
   - `src/context/AppContext.jsx:61-91`: `JSON.parse(localStorage.getItem(...))` has no `try...catch` block.
   - `src/context/AppContext.jsx:117,145,165,180,196,216`: Supabase `.then()` callbacks lack `.catch()` rejection handlers.

6. **Unprotected UI Property Access & Error Boundaries**:
   - `src/components/UserSwitcher.jsx:12,19`: Direct property access `currentUser.name` and `currentUser.id`.
   - `src/components/Layout.jsx:52`: Direct access `currentUser.name`.
   - `src/main.jsx:1-11` & `src/App.jsx:157-166`: Zero Error Boundaries present in component tree.

---

## 2. Logic Chain

1. **Side Effect in Render Body** (`AppContext.jsx:42-58`) $\rightarrow$ Executes before React commit phase $\rightarrow$ Runs on every render under StrictMode $\rightarrow$ Mutates LocalStorage prematurely.
2. **Incomplete Flushing Array** (`AppContext.jsx:46-57`) $\rightarrow$ Bumping `DATA_VERSION` wipes `workcentre_users` but leaves `workcentre_current_user_id` and `workcentre_authenticated = "true"` intact $\rightarrow$ `users.find()` fails to find saved user ID $\rightarrow$ `currentUser` falls back to `users[0]` while auth state stays `true`, producing corrupted session context.
3. **Asymmetric Database API Invocation** (`AppContext.jsx:778-1020`) $\rightarrow$ App loads 11 tables from Supabase, but CRUD operations for 5 major entities (`expenses`, `projects`, `advanceRequests`, `hiringRequisitions`, `candidates`) update only local React state $\rightarrow$ Changes made by users are never persisted to Supabase database $\rightarrow$ Data desynchronizes immediately upon page refresh or fetch.
4. **`mappedUsers` Attribute Omission** (`AppContext.jsx:122-139`) $\rightarrow$ Supabase user query returns records $\rightarrow$ `data.map` strips out local fields (`attendance`, `password`, `bankUpi`) $\rightarrow$ `setUsers(mappedUsers)` overwrites local state $\rightarrow$ `useEffect` syncs to LocalStorage (`AppContext.jsx:310`) $\rightarrow$ User attendance records, passwords, and UPI details are permanently deleted from LocalStorage.
5. **Unprotected `JSON.parse` and Missing Error Boundaries** (`AppContext.jsx:61-91`, `App.jsx:157-166`) $\rightarrow$ Invalid or corrupted string in LocalStorage triggers `SyntaxError` during state initialization $\rightarrow$ No Error Boundary catches the exception $\rightarrow$ Entire React application unmounts to a white screen.

---

## 3. Caveats

- **Network Environment**: Live Supabase connection could not be queried over remote network during CODE_ONLY mode, so behavior was evaluated against static code flow and API mock semantics.
- **Backend Schema Constraints**: Database column names in Supabase schema beyond the 11 audited tables were inferred from query properties in `AppContext.jsx`.

---

## 4. Conclusion

The database synchronization and state context mechanisms in ACME Workcentre (`src/`) contain critical state loss bugs, async read/write asymmetries, data-stripping defects in remote mapping, and unhandled runtime exception vectors. 

Addressing these requires:
1. Moving side effects to `useEffect` and updating `mappedUsers` to merge local state attributes.
2. Implementing Supabase write-back calls for `expenses`, `projects`, `advance_requests`, `hiring_requisitions`, and `candidates`.
3. Wrapping `JSON.parse` in `try...catch` and implementing a root React Error Boundary.

---

## 5. Verification Method

### Independent Verification Steps:

1. **Verify Unpersisted Entities**:
   - Inspect `src/context/AppContext.jsx` lines 95–99 and lines 308–345. Confirm `jobTitles`, `numberSeries`, `departments`, `shifts`, `weeklyOffs` lack LocalStorage initializer functions and `useEffect` sync hooks.

2. **Verify Asymmetric Supabase Write-Backs**:
   - Inspect `addExpense` (`AppContext.jsx:779`), `addProject` (`AppContext.jsx:796`), `requestAdvance` (`AppContext.jsx:935`), `addHiringRequisition` (`AppContext.jsx:975`), `addCandidate` (`AppContext.jsx:991`). Confirm none call `supabase.from(...)`.

3. **Verify Attribute Stripping in `mappedUsers`**:
   - Inspect `src/context/AppContext.jsx` lines 122–139. Confirm `attendance`, `password`, `specialization`, `emergencyContact`, `bankUpi`, `inviteToken`, `openingBalance` are absent from the returned object map.

4. **Verify Unprotected Property Access & Lack of Error Boundary**:
   - Inspect `src/components/UserSwitcher.jsx` line 12 (`currentUser.name`) and `src/components/Layout.jsx` line 52 (`currentUser.name`).
   - Inspect `src/App.jsx` lines 157–166. Confirm `<AppProvider>` and `<BrowserRouter>` are not enclosed within an `<ErrorBoundary>`.
