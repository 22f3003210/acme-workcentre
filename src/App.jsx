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

// Clean Production Route Path Mapping
export const getRoutePath = (tabId) => {
  switch (tabId) {
    case "dashboard": return "/dashboard";
    case "directory": return "/employee/directory";
    case "reports":
    case "expenses": return "/expenses";
    case "attendance":
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
    return <Navigate to="/auth/login" replace />;
  }

  const renderActiveView = () => {
    if (activeTab === "projects") {
      return <ProjectsView />;
    }
    if (activeTab === "recruitment") {
      return <RecruiterView />;
    }

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
      <Route path="/payroll" element={<MainWorkspace initialTab="reports" />} />
      <Route path="/expenses" element={<MainWorkspace initialTab="reports" />} />
      <Route path="/time/attendance" element={<MainWorkspace initialTab="attendance" />} />
      <Route path="/attendance" element={<MainWorkspace initialTab="attendance" />} />
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
