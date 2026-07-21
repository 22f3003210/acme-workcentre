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

// Helper to convert tab name to ERP NXT style route path
export const getRoutePath = (tabId) => {
  switch (tabId) {
    case "dashboard": return "/HBJ_B/Dashboard/default";
    case "directory": return "/HBJ_B/employee/directory";
    case "reports":
    case "expenses": return "/HBJ_B/expenses";
    case "attendance":
    case "punch": return "/HBJ_B/time/attendance";
    case "projects": return "/HBJ_B/projects";
    case "recruitment": return "/HBJ_B/recruiting";
    case "settings": return "/HBJ_B/settings";
    case "ledger": return "/HBJ_B/ledger";
    default: return "/HBJ_B/Dashboard/default";
  }
};

// Route to ActiveTab Mapping
const getTabFromPath = (pathname, role) => {
  const p = pathname.toLowerCase().replace(/\/$/, "");
  if (p === "" || p === "/" || p.includes("dashboard")) return role === "Consultant" ? "punch" : "dashboard";
  if (p.includes("projects")) return "projects";
  if (p.includes("expenses") || p.includes("payroll") || p.includes("reports")) return role === "Consultant" ? "expenses" : "reports";
  if (p.includes("employee") || p.includes("directory")) return "directory";
  if (p.includes("attendance") || p.includes("punch")) return role === "Consultant" ? "punch" : "attendance";
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
    return <Navigate to="/HBJ_B/auth/login" replace />;
  }

  const renderActiveView = () => {
    switch (currentUser.role) {
      case "Admin":
        return <AdminView activeTab={activeTab} setActiveTab={(tab) => navigate(getRoutePath(tab))} />;
      case "Accounts Manager":
        return <AccountsView activeTab={activeTab} />;
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
      {/* Auth Routes (Matching ERP NXT URL Structure) */}
      <Route
        path="/auth/login"
        element={
          isAuthenticated ? <Navigate to="/HBJ_B/Dashboard/default" replace /> : <LoginView onOpenRegister={() => navigate("/HBJ_B/auth/register")} />
        }
      />
      <Route
        path="/HBJ_B/auth/login"
        element={
          isAuthenticated ? <Navigate to="/HBJ_B/Dashboard/default" replace /> : <LoginView onOpenRegister={() => navigate("/HBJ_B/auth/register")} />
        }
      />
      <Route
        path="/auth/register"
        element={
          <RegisterView initialToken={token} onCancel={() => navigate("/HBJ_B/auth/login")} />
        }
      />
      <Route
        path="/HBJ_B/auth/register"
        element={
          <RegisterView initialToken={token} onCancel={() => navigate("/HBJ_B/auth/login")} />
        }
      />

      {/* Workspace App Module Routes (ERP NXT URL Paths) */}
      <Route path="/dashboard" element={<MainWorkspace initialTab="dashboard" />} />
      <Route path="/HBJ_B/Dashboard/default" element={<MainWorkspace initialTab="dashboard" />} />
      <Route path="/HBJ_B/dashboard" element={<MainWorkspace initialTab="dashboard" />} />

      <Route path="/employee" element={<MainWorkspace initialTab="directory" />} />
      <Route path="/employee/directory" element={<MainWorkspace initialTab="directory" />} />
      <Route path="/HBJ_B/employee/directory" element={<MainWorkspace initialTab="directory" />} />
      <Route path="/HBJ_B/employee" element={<MainWorkspace initialTab="directory" />} />

      <Route path="/payroll" element={<MainWorkspace initialTab="reports" />} />
      <Route path="/expenses" element={<MainWorkspace initialTab="reports" />} />
      <Route path="/HBJ_B/expenses" element={<MainWorkspace initialTab="reports" />} />
      <Route path="/HBJ_B/payroll" element={<MainWorkspace initialTab="reports" />} />

      <Route path="/time/attendance" element={<MainWorkspace initialTab="attendance" />} />
      <Route path="/attendance" element={<MainWorkspace initialTab="attendance" />} />
      <Route path="/HBJ_B/time/attendance" element={<MainWorkspace initialTab="attendance" />} />
      <Route path="/HBJ_B/attendance" element={<MainWorkspace initialTab="attendance" />} />

      <Route path="/projects" element={<MainWorkspace initialTab="projects" />} />
      <Route path="/HBJ_B/projects" element={<MainWorkspace initialTab="projects" />} />

      <Route path="/recruiting" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/recruitment" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/HBJ_B/recruiting" element={<MainWorkspace initialTab="recruitment" />} />
      <Route path="/HBJ_B/recruitment" element={<MainWorkspace initialTab="recruitment" />} />

      <Route path="/settings" element={<MainWorkspace initialTab="settings" />} />
      <Route path="/HBJ_B/settings" element={<MainWorkspace initialTab="settings" />} />

      <Route path="/ledger" element={<MainWorkspace initialTab="ledger" />} />
      <Route path="/HBJ_B/ledger" element={<MainWorkspace initialTab="ledger" />} />

      {/* Default Fallback Redirects */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/HBJ_B/Dashboard/default" replace /> : <Navigate to="/HBJ_B/auth/login" replace />
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? <Navigate to="/HBJ_B/Dashboard/default" replace /> : <Navigate to="/HBJ_B/auth/login" replace />
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
