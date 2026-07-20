import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import LoginView from "./views/LoginView";
import AdminView from "./views/AdminView";
import AccountsView from "./views/AccountsView";
import RegisterView from "./views/RegisterView";

function AppContent() {
  const { currentUser, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showRegister, setShowRegister] = useState(() => {
    return window.location.hash.includes("register");
  });

  useEffect(() => {
    const handleHash = () => {
      setShowRegister(window.location.hash.includes("register"));
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Reset default view tab on user switch
  useEffect(() => {
    if (currentUser.role === "Consultant") {
      setActiveTab("punch");
    } else {
      setActiveTab("dashboard");
    }
  }, [currentUser]);

  if (showRegister) {
    const tokenMatch = window.location.hash.match(/token=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : "";
    return (
      <>
        <RegisterView initialToken={token} onCancel={() => { window.location.hash = ""; setShowRegister(false); }} />
        <Toast />
      </>
    );
  }

  // If user is not authenticated, load the landing login page
  if (!isAuthenticated) {
    return (
      <>
        <LoginView onOpenRegister={() => setShowRegister(true)} />
        <Toast />
      </>
    );
  }

  const renderActiveView = () => {
    switch (currentUser.role) {
      case "Admin":
        return <AdminView activeTab={activeTab} setActiveTab={setActiveTab} />;
      case "Accounts Manager":
        return <AccountsView activeTab={activeTab} />;
      case "Consultant":
        return <ConsultantView activeTab={activeTab} />;
      default:
        return (
          <div className="empty-state-card glass-card text-center">
            <h3>Invalid Access</h3>
            <p>Please log out and sign in with a registered account.</p>
          </div>
        );
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderActiveView()}
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toast />
    </AppProvider>
  );
}
