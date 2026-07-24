import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import LoginView from "./views/LoginView";
import AdminView from "./views/AdminView";
import AccountsView from "./views/AccountsView";
import ConsultantView from "./views/ConsultantView";
import RegisterView from "./views/RegisterView";
import AddEmployeeWizard from "./views/AddEmployeeWizard";

// Clean Production Route Path Mapping
// Clean Production Route Path Mapping
export const getRoutePath = (tabId) => {
  switch (tabId) {
    case "dashboard": return "/dashboard";
    case "directory": return "/employee/directory";
    case "add-employee": return "/employee/add";
    case "job-titles": return "/employee/job-titles";
    case "number-series": return "/employee/number-series";
    case "departments": return "/employee/departments";
    case "org-tree": return "/employee/org-tree";
    case "logins": return "/employee/logins";
    case "profile-changes": return "/employee/profile-changes";
    case "probation": return "/employee/probation";
    case "expenses": return "/expenses";
    case "attendance":
    case "time-dashboard": return "/time/dashboard";
    case "time-approvals": return "/time/approvals";
    case "time-shifts": return "/time/shifts";
    case "time-assignments": return "/time/shifts/assignments";
    case "time-weekly-offs": return "/time/shifts/weekly-offs";
    case "time-shift-rules": return "/time/shifts/rules";
    case "time-leave": return "/time/leave";
    case "time-reports": return "/time/reports";
    case "time-settings": return "/time/settings";
    case "punch": return "/time/attendance";
    case "projects": return "/projects";
    case "recruitment": return "/recruiting";
    case "settings": return "/settings";
    case "ledger": return "/ledger";
    default: return "/dashboard";
  }
};

// Route to ActiveTab Mapping
const getTabFromPath = (pathname, role) => {
  const p = pathname.toLowerCase().replace(/\/$/, "");
  if (p === "" || p === "/") return role === "Consultant" ? "punch" : "dashboard";
  if (p.includes("job-titles")) return "job-titles";
  if (p.includes("number-series")) return "number-series";
  if (p.includes("departments")) return "departments";
  if (p.includes("org-tree")) return "org-tree";
  if (p.includes("logins")) return "logins";
  if (p.includes("profile-changes")) return "profile-changes";
  if (p.includes("probation")) return "probation";
  if (p.includes("projects")) return "projects";
  if (p.includes("expenses") || p.includes("payroll")) return role === "Consultant" ? "expenses" : "reports";
  if (p.includes("employee") || p.includes("directory")) return "directory";

  // Time & Attendance Sub-Routes
  if (p.includes("shifts/assignments") || p === "/time/assignments") return "time-assignments";
  if (p.includes("shifts/weekly-offs") || p === "/time/weekly-offs") return "time-weekly-offs";
  if (p.includes("shifts/rules") || p === "/time/shift-rules") return "time-shift-rules";
  if (p.includes("time/approvals")) return "time-approvals";
  if (p.includes("time/shifts")) return "time-shifts";
  if (p.includes("time/leave")) return "time-leave";
  if (p.includes("time/reports")) return "time-reports";
  if (p.includes("time/settings")) return "time-settings";
  if (p.includes("time/dashboard") || p.includes("attendance") || p.includes("punch")) return role === "Consultant" ? "punch" : "time-dashboard";
  if (p.includes("dashboard")) return role === "Consultant" ? "punch" : "dashboard";

  if (p.includes("recruiting") || p.includes("recruitment")) return "recruitment";
  if (p.includes("settings")) return "settings";
  if (p.includes("ledger")) return "ledger";
  return role === "Consultant" ? "punch" : "dashboard";
};

// Main Authenticated Workspace Frame
function MainWorkspace({ initialTab }) {
  const { currentUser, isAuthenticated } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = initialTab || getTabFromPath(location.pathname, currentUser ? currentUser.role : "Admin");

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const renderActiveView = () => {
    switch (currentUser.role) {
      case "Admin":
      case "Accounts Manager":
        return <AdminView activeTab={activeTab} setActiveTab={(tab) => navigate(getRoutePath(tab))} />;
      case "Consultant":
        return <ConsultantView activeTab={activeTab} />;
      default:
        return (
          <div className="empty-state-card glass-card text-center" style={{ padding: "40px" }}>
            <h3>Invalid Access</h3>
            <p>Please log out and sign in with a registered account.</p>
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab}>
      {renderActiveView()}
    </Layout>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();

  const tokenMatch = window.location.hash.match(/token=([^&]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";

  return (
    <Routes>
      {/* Clean Auth Routes */}
      <Route
        path="/auth/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView onOpenRegister={() => navigate("/auth/register")} />
        }
      />
      <Route
        path="/auth/register"
        element={
          <RegisterView initialToken={token} onCancel={() => navigate("/auth/login")} />
        }
      />

      {/* Clean Workspace Module Routes */}
      <Route path="/dashboard" element={<MainWorkspace initialTab="dashboard" />} />
      <Route path="/employee" element={<MainWorkspace initialTab="directory" />} />
      <Route path="/employee/directory" element={<MainWorkspace initialTab="directory" />} />
      <Route path="/employee/add" element={<AddEmployeeWizard />} />
      <Route path="/employee/job-titles" element={<MainWorkspace initialTab="job-titles" />} />
      <Route path="/employee/number-series" element={<MainWorkspace initialTab="number-series" />} />
      <Route path="/employee/departments" element={<MainWorkspace initialTab="departments" />} />
      <Route path="/employee/org-tree" element={<MainWorkspace initialTab="org-tree" />} />
      <Route path="/employee/logins" element={<MainWorkspace initialTab="logins" />} />
      <Route path="/employee/profile-changes" element={<MainWorkspace initialTab="profile-changes" />} />
      <Route path="/employee/probation" element={<MainWorkspace initialTab="probation" />} />
      <Route path="/payroll" element={<MainWorkspace initialTab="reports" />} />
      <Route path="/expenses" element={<MainWorkspace initialTab="reports" />} />

      {/* Time & Attendance Sub-Routes */}
      <Route path="/time/attendance" element={<MainWorkspace initialTab="time-dashboard" />} />
      <Route path="/time/dashboard" element={<MainWorkspace initialTab="time-dashboard" />} />
      <Route path="/time/approvals" element={<MainWorkspace initialTab="time-approvals" />} />
      <Route path="/time/shifts" element={<MainWorkspace initialTab="time-shifts" />} />
      <Route path="/time/shifts/assignments" element={<MainWorkspace initialTab="time-assignments" />} />
      <Route path="/time/assignments" element={<MainWorkspace initialTab="time-assignments" />} />
      <Route path="/time/shifts/weekly-offs" element={<MainWorkspace initialTab="time-weekly-offs" />} />
      <Route path="/time/weekly-offs" element={<MainWorkspace initialTab="time-weekly-offs" />} />
      <Route path="/time/shifts/rules" element={<MainWorkspace initialTab="time-shift-rules" />} />
      <Route path="/time/shift-rules" element={<MainWorkspace initialTab="time-shift-rules" />} />
      <Route path="/time/leave" element={<MainWorkspace initialTab="time-leave" />} />
      <Route path="/time/reports" element={<MainWorkspace initialTab="time-reports" />} />
      <Route path="/time/settings" element={<MainWorkspace initialTab="time-settings" />} />
      <Route path="/attendance" element={<MainWorkspace initialTab="time-dashboard" />} />

      <Route path="/projects" element={<MainWorkspace initialTab="projects" />} />
      <Route path="/recruiting" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/recruitment" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/settings" element={<MainWorkspace initialTab="settings" />} />
      <Route path="/ledger" element={<MainWorkspace initialTab="ledger" />} />
      <Route path="/projects" element={<MainWorkspace initialTab="projects" />} />
      <Route path="/recruiting" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/recruitment" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/settings" element={<MainWorkspace initialTab="settings" />} />
      <Route path="/ledger" element={<MainWorkspace initialTab="ledger" />} />

      {/* Fallback Redirects */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toast />
      </BrowserRouter>
    </AppProvider>
  );
}
