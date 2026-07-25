## 2026-07-25T03:05:34Z
<USER_REQUEST>
You are Forensic Auditor (Integrity Verification Auditor) for ACME Workcentre.
Working Directory: c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_auditor

Objective:
Perform a complete forensic integrity audit across the codebase `c:\Users\sayed\OneDrive\Desktop\ACME\src`, `vite.config.js`, `package.json`, and `src/__tests__/`.

Verify:
1. Are there any hardcoded test results, expected return values, or verification strings in source code?
2. Are there dummy or facade implementations that produce correct-looking outputs without genuine logic?
3. Are there fabricated verification outputs or attestation artifacts?
4. Does the implementation genuinely fulfill requirements R1 (UI & Routes), R2 (DB Sync & Context Integrity), and R3 (Build Performance)?

Run static checks, code inspections, and execution verification.
Write your audit report `audit_report.md` and handoff report `handoff.md` in `c:\Users\sayed\OneDrive\Desktop\ACME\.agents\teamwork_preview_auditor`.
State your verdict explicitly: `CLEAN` or `INTEGRITY VIOLATION`.
Send a message to parent when complete.
</USER_REQUEST>
