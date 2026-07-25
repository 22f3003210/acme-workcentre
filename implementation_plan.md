# Implementation Plan

## Goal
Replace the simple "Add New Employee" modal form in `AdminView.jsx` with the full multi‑step `AddEmployeeWizard` component. The user should be taken directly to the wizard route when clicking the "+ New Employee" button, and the previously‑used modal ( `showOnboardModal` ) will be removed.

## User Review Required
> [!IMPORTANT]
> This change removes the existing `showOnboardModal` overlay entirely. Ensure that no other parts of the application depend on this modal for functionality other than adding a new employee.

## Open Questions
> [!WARNING]
> - Does any other component rely on the `setShowOnboardModal` state or the modal markup (e.g., other quick‑add actions)?
> - Should we keep the `showOnboardModal` state for potential future use, or clean it up completely?

## Proposed Changes
---
### AdminView.jsx
- Update the "+ New Employee" button click handler to navigate to the wizard path `/employee/add` using `useNavigate`.
- Remove the entire modal markup (`{showOnboardModal && ( ... )}`) and related state variables (`showOnboardModal`, `setShowOnboardModal`).
- Clean up any imports or unused variables associated with the modal.

### App.jsx (if needed)
- Ensure the route `/employee/add` is already defined and renders `<AddEmployeeWizard />` (already present).

## Verification Plan
### Automated Tests
- Run `npm run build` to ensure the project compiles without JSX errors.
- Run any existing unit or integration tests (`npm test` if present).

### Manual Verification
- Launch the app locally (`npm run dev`).
- Click the "+ New Employee" button on the dashboard and confirm it navigates to the wizard page.
- Verify the wizard functions correctly (step navigation, form submission).
- Confirm the old modal no longer appears.
