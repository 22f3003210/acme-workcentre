import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";

// Dynamic view loader helper: handles automatic reloads on chunk hash deployment changes.
const lazyView = (importFn) => {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    let Comp = null;
    const promise = importFn().then((m) => { Comp = m.default || m; });
    return (props) => {
      if (Comp) return <Comp {...props} />;
      throw promise;
    };
  }

  return lazy(() =>
    importFn().catch((err) => {
      const hasReloaded = typeof window !== "undefined" ? window.sessionStorage.getItem("acme_chunk_reloaded") : null;
      if (!hasReloaded && (err?.message?.includes("dynamically imported module") || err?.message?.includes("Failed to fetch"))) {
        window.sessionStorage.setItem("acme_chunk_reloaded", "true");
        window.location.reload();
        return new Promise(() => {}); // pause render while browser reloads fresh assets
      }
      if (typeof window !== "undefined") window.sessionStorage.removeItem("acme_chunk_reloaded");
      throw err;
    })
  );
};

// Route View Components Lazy Loaded
const LoginView = lazyView(() => import("./views/LoginView"));
const AdminView = lazyView(() => import("./views/AdminView"));
const AccountsView = lazyView(() => import("./views/AccountsView"));
const ConsultantView = lazyView(() => import("./views/ConsultantView"));
const RegisterView = lazyView(() => import("./views/RegisterView"));
const AddEmployeeWizard = lazyView(() => import("./views/AddEmployeeWizard"));
const ProjectsView = lazyView(() => import("./views/ProjectsView"));
const RecruiterView = lazyView(() => import("./views/RecruiterView"));
const LedgerReports = lazyView(() => import("./components/LedgerReports"));
const AttendanceManager = lazyView(() => import("./components/AttendanceManager"));
const ClaimsDesk = lazyView(() => import("./components/ClaimsDesk"));
const ScheduleCalendarView = lazyView(() => import("./views/ScheduleCalendarView"));

// Clean Production Route Path Mapping
export const getRoutePath = (tabId, role = "") => {
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
    case "reports":
    case "expenses": return role === "Consultant" ? "/my-expenses" : "/expenses";
    case "attendance":
    case "punch": return role === "Consultant" ? "/consultant/attendance" : "/time/attendance";
    case "leaves": return "/leaves";
    case "payslips": return "/payslips";
    case "projects": return role === "Consultant" ? "/my-projects" : "/projects";
    case "calendar": return "/calendar";
    case "recruitment": return "/recruiting";
    case "settings": return "/settings";
    case "ledger": return "/ledger";
    default: return "/dashboard";
  }
};

// Route to ActiveTab Mapping
const getTabFromPath = (pathname, role) => {
  const p = pathname.toLowerCase().replace(/\/$/, "");
  if (p === "" || p === "/" || p.includes("dashboard")) return "dashboard";
  if (p.includes("job-titles")) return "job-titles";
  if (p.includes("number-series")) return "number-series";
  if (p.includes("departments")) return "departments";
  if (p.includes("org-tree")) return "org-tree";
  if (p.includes("logins")) return "logins";
  if (p.includes("profile-changes")) return "profile-changes";
  if (p.includes("probation")) return "probation";
  if (p.includes("leaves")) return "leaves";
  if (p.includes("payslips")) return "payslips";
  if (p.includes("my-projects") || p.includes("projects")) return "projects";
  if (p.includes("calendar")) return "calendar";
  if (p.includes("my-expenses") || p.includes("expenses") || p.includes("payroll") || p.includes("reports")) return role === "Consultant" ? "expenses" : "reports";
  if (p.includes("employee") || p.includes("directory")) return "directory";
  if (p.includes("attendance") || p.includes("punch")) return "attendance";
  if (p.includes("recruiting") || p.includes("recruitment")) return "recruitment";
  if (p.includes("settings")) return "settings";
  if (p.includes("ledger")) return "ledger";
  return "dashboard";
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
    if (activeTab === "calendar") {
      return <ScheduleCalendarView />;
    }
    switch (currentUser.role) {
      case "Admin":
        return <AdminView activeTab={activeTab} setActiveTab={(tab) => navigate(getRoutePath(tab, currentUser?.role))} />;
      case "Accountant":
      case "Accounts Manager":
      case "Finance":
        return <AccountsView activeTab={activeTab} />;
      case "Consultant":
      case "Employee":
      case "Staff":
      default:
        return <ConsultantView activeTab={activeTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab}>
      <Suspense fallback={<LoadingSpinner />}>
        {renderActiveView()}
      </Suspense>
    </Layout>
  );
}

export function AppRoutes() {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();

  const tokenMatch = window.location.hash.match(/token=([^&]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";

  return (
    <Suspense fallback={<LoadingSpinner />}>
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
        <Route path="/employee/add" element={isAuthenticated ? <AddEmployeeWizard /> : <Navigate to="/auth/login" replace />} />
        <Route path="/employee/job-titles" element={<MainWorkspace initialTab="job-titles" />} />
        <Route path="/employee/number-series" element={<MainWorkspace initialTab="number-series" />} />
        <Route path="/employee/departments" element={<MainWorkspace initialTab="departments" />} />
        <Route path="/employee/org-tree" element={<MainWorkspace initialTab="org-tree" />} />
        <Route path="/employee/logins" element={<MainWorkspace initialTab="logins" />} />
        <Route path="/employee/profile-changes" element={<MainWorkspace initialTab="profile-changes" />} />
        <Route path="/employee/probation" element={<MainWorkspace initialTab="probation" />} />
        <Route path="/payroll" element={<MainWorkspace initialTab="reports" />} />
        <Route path="/expenses" element={<MainWorkspace initialTab="reports" />} />
        <Route path="/my-expenses" element={<MainWorkspace initialTab="expenses" />} />
        <Route path="/time/attendance" element={<MainWorkspace initialTab="attendance" />} />
        <Route path="/attendance" element={<MainWorkspace initialTab="attendance" />} />
        <Route path="/consultant/attendance" element={<MainWorkspace initialTab="attendance" />} />
        <Route path="/leaves" element={<MainWorkspace initialTab="leaves" />} />
        <Route path="/payslips" element={<MainWorkspace initialTab="payslips" />} />
        <Route path="/projects" element={<MainWorkspace initialTab="projects" />} />
        <Route path="/projects/:projectId" element={<MainWorkspace initialTab="projects" />} />
        <Route path="/my-projects" element={<MainWorkspace initialTab="projects" />} />
        <Route path="/consultant/projects" element={<MainWorkspace initialTab="projects" />} />
        <Route path="/calendar" element={<MainWorkspace initialTab="calendar" />} />
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
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toast />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
