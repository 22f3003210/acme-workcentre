import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import logoImg from "../assets/logo.png";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { currentUser, users, logout } = useApp();

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileView, setProfileView] = useState("menu"); // "menu" | "edit" | "password"

  // Search Bar Autocomplete States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMoreEmployees, setShowMoreEmployees] = useState(false);

  // Full Employee Profile Modal State
  const [viewingProfileUser, setViewingProfileUser] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState("TIME");
  const [timeSubTab, setTimeSubTab] = useState("Attendance");

  // Listen for global open-employee-profile event (from View Profile buttons anywhere)
  useEffect(() => {
    const handleOpenProfile = (e) => {
      if (e.detail && e.detail.user) {
        setViewingProfileUser(e.detail.user);
      }
    };
    window.addEventListener("open-employee-profile", handleOpenProfile);
    return () => window.removeEventListener("open-employee-profile", handleOpenProfile);
  }, []);

  // Filter employees for top search bar
  const filteredEmployees = (users || []).filter(u => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.empCode?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.title?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q)
    );
  });

  // Edit profile form
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    address: currentUser.address || "",
    city: currentUser.city || "",
    pinCode: currentUser.pinCode || "",
  });

  // Password form
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });
  const [showOld, setShowOld]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConf, setShowConf]   = useState(false);

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const sessionId = Math.floor(10000 + Math.random() * 90000);

  const openModal = () => { setProfileView("menu"); setShowProfileModal(true); };
  const closeModal = () => setShowProfileModal(false);

  const getNavItems = () => {
    const projectIcon = (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );

    switch (currentUser.role) {
      case "Admin":
        return [
          { id: "dashboard", label: "Home", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
          { id: "projects",  label: "Projects", icon: projectIcon },
          { id: "reports",   label: "Expenses", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>) },
          { id: "directory", label: "Directory", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
          { id: "attendance", label: "Attendance", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) },
          { id: "settings",  label: "Settings", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>) },
        ];
      case "Accounts Manager":
        return [
          { id: "dashboard", label: "Finance Dashboard", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
          { id: "projects",  label: "Projects Hub", icon: projectIcon },
          { id: "expenses",  label: "Expense Verification", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>) },
          { id: "reports",   label: "Ledger Reports", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
        ];
      case "Consultant":
        return [
          { id: "punch",    label: "Daily Attendance", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) },
          { id: "expenses", label: "Expense Portal", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>) },
          { id: "projects", label: "Projects", icon: projectIcon },
          { id: "ledger",   label: "My Sourcing Ledger", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
        ];
      default: return [];
    }
  };

  const navItems = getNavItems();

  /* ── shared input style ── */
  const fieldStyle = {
    width: "100%", padding: "10px 14px", fontSize: "0.9rem",
    border: "1px solid #d1d5db", borderRadius: "6px",
    outline: "none", boxSizing: "border-box", background: "#fff",
  };
  const labelStyle = { fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" };

  // 9-Dots App Launcher State
  const [showAppsMenu, setShowAppsMenu] = useState(false);

  const appMenuItems = [
    {
      name: "Homepage",
      bgColor: "#fdf4ff",
      borderColor: "#f5d0fe",
      iconColor: "#c026d3",
      tabId: "dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      name: "Employee",
      bgColor: "#ecfeff",
      borderColor: "#a5f3fc",
      iconColor: "#0891b2",
      tabId: currentUser.role === "Admin" ? "directory" : "dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      name: "Payroll",
      bgColor: "#fff1f2",
      borderColor: "#fecdd3",
      iconColor: "#e11d48",
      tabId: "reports",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      )
    },
    {
      name: "Workforce Management",
      subtitle: "(Formerly Leave & Attendance)",
      bgColor: "#f3e8ff",
      borderColor: "#e9d5ff",
      iconColor: "#9333ea",
      tabId: currentUser.role === "Consultant" ? "punch" : "attendance",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      name: "Projects",
      subtitle: "(Retail Jewellery BD Projects)",
      bgColor: "#eff6ff",
      borderColor: "#bfdbfe",
      iconColor: "#2563eb",
      tabId: "projects",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      name: "Expense",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      iconColor: "#d97706",
      tabId: currentUser.role === "Consultant" ? "expenses" : "reports",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ];

  return (
    <div className={`app-container ${currentUser.role === "Admin" ? "theme-admin" : ""}`} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="sea-top-navbar" style={{ position: "sticky", top: 0, zIndex: 900 }}>
        <div className="sea-nav-left" style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          
          {/* 1. 9-Dots Launcher Button (Blue marked region at far left) */}
          <button
            type="button"
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: showAppsMenu ? "#dbeafe" : "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#2563eb",
              transition: "all 0.15s ease",
              boxShadow: showAppsMenu ? "0 0 0 3px rgba(37,99,235,0.2)" : "0 2px 5px rgba(37,99,235,0.08)",
              flexShrink: 0
            }}
            title="Your Apps Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="5" r="2.2" />
              <circle cx="12" cy="5" r="2.2" />
              <circle cx="19" cy="5" r="2.2" />
              <circle cx="5" cy="12" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="19" cy="12" r="2.2" />
              <circle cx="5" cy="19" r="2.2" />
              <circle cx="12" cy="19" r="2.2" />
              <circle cx="19" cy="19" r="2.2" />
            </svg>
          </button>

          {/* 2. Acme Consulting Oval Logo (Moved to red circle position) */}
          <img
            src={logoImg}
            alt="Acme Consulting"
            style={{ height: "48px", objectFit: "contain", display: "block" }}
          />

          {/* Brand Text Header */}
          <div className="brand-text-header" style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.02em", lineHeight: "1.05" }}>Acme Consulting</h2>
            <p style={{ fontSize: "0.68rem", color: "#2563eb", fontWeight: "900", letterSpacing: "0.1em", textTransform: "uppercase", margin: "3px 0 0 0" }}>Internal Portal</p>
          </div>

          {/* 3. Apps Dropdown Menu (Popup when 9-dots button is clicked) */}
          {showAppsMenu && (
            <>
              <div
                onClick={() => setShowAppsMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 999 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "54px",
                  left: "0",
                  width: "320px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.2)",
                  padding: "16px",
                  zIndex: 1000,
                  animation: "fadeIn 0.15s ease-out"
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", marginBottom: "12px", paddingLeft: "4px" }}>
                  Your Apps
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "460px", overflowY: "auto" }}>
                  {appMenuItems.map(app => (
                    <button
                      key={app.name}
                      onClick={() => {
                        if (app.tabId) setActiveTab(app.tabId);
                        setShowAppsMenu(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: app.bgColor,
                          border: `1px solid ${app.borderColor}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: app.iconColor,
                          flexShrink: 0
                        }}
                      >
                        {app.icon}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>{app.name}</span>
                        {app.subtitle && (
                          <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "1px" }}>{app.subtitle}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
        {/* Top Search Bar with Interactive Dropdown (Matching Keka HR Screenshot) */}
        <div className="sea-search-wrapper" style={{ position: "relative" }}>
          <span className="sea-search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </span>
          <input 
            type="text" 
            className="sea-search-input" 
            placeholder="Search employees or actions (Ex: Apply Leave)" 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
            onFocus={() => setIsSearchOpen(true)}
            style={{ width: "380px", borderRadius: isSearchOpen && searchQuery ? "10px 10px 0 0" : "20px" }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem" }}
            >
              ⊗
            </button>
          )}

          {/* Autocomplete Dropdown Panel matching Keka HR screenshot */}
          {isSearchOpen && searchQuery.trim() && (
            <>
              <div 
                onClick={() => setIsSearchOpen(false)} 
                style={{ position: "fixed", inset: 0, zIndex: 998 }} 
              />
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "480px",
                background: "#ffffff",
                borderRadius: "0 0 16px 16px",
                border: "1px solid #e2e8f0",
                borderTop: "none",
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2)",
                zIndex: 999,
                padding: "16px",
                maxHeight: "520px",
                overflowY: "auto",
                animation: "fadeIn 0.15s ease-out"
              }}>
                
                {/* Section 1: Employees */}
                <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                  Employees
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filteredEmployees.length > 0 ? (
                    (showMoreEmployees ? filteredEmployees : filteredEmployees.slice(0, 3)).map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setViewingProfileUser(emp);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #f1f5f9",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                      >
                        <img 
                          src={emp.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"} 
                          alt={emp.name} 
                          style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} 
                        />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "#0f172a" }}>{emp.name}</span>
                            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{emp.title || "Systems Operator"} |</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#2563eb" }}>#{emp.empCode || "HBJ00007"}</span>
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px", display: "flex", gap: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            <span>👤 {emp.department || "IT & SYSTEMS SUPPORT"}</span>
                            <span>✉ {emp.email}</span>
                            <span>📍 {emp.location || "Mehdipatnam"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.82rem", color: "#94a3b8", padding: "8px" }}>No employees match '{searchQuery}'</div>
                  )}

                  {filteredEmployees.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowMoreEmployees(!showMoreEmployees)}
                      style={{
                        margin: "4px auto 0 auto",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "20px",
                        padding: "4px 14px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      {showMoreEmployees ? "View Less ∧" : `View ${filteredEmployees.length - 3} More ∨`}
                    </button>
                  )}
                </div>

                {/* Section 2: Quick Actions */}
                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "14px", paddingTop: "12px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>
                    Quick Actions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div
                      onClick={() => { setActiveTab("directory"); setIsSearchOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: "1rem" }}>👥</span>
                      <div>
                        <div style={{ fontSize: "0.84rem", fontWeight: "600", color: "#0f172a" }}>Employee Directory</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Find your colleagues.</div>
                      </div>
                    </div>

                    <div
                      onClick={() => { setActiveTab("reports"); setIsSearchOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: "1rem" }}>💼</span>
                      <div>
                        <div style={{ fontSize: "0.84rem", fontWeight: "600", color: "#0f172a" }}>Expenses and Travel Summary</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Monitor and analyze expenses and travel-related data.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "8px", display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.7rem", color: "#94a3b8" }}>
                  <span>Navigate ↑ ↓</span>
                  <span>To select ↵</span>
                </div>

              </div>
            </>
          )}
        </div>
        <div className="sea-nav-right">
          <img
            src={currentUser.avatar}
            className="sea-user-avatar"
            alt={`${currentUser.name} avatar`}
            onClick={openModal}
            style={{ cursor: "pointer" }}
          />
        </div>
      </div>

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "16px", width: "380px",
              maxWidth: "95vw", overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)"
            }}
          >

            {/* ── VIEW: MENU ── */}
            {profileView === "menu" && (
              <>
                {/* Header card */}
                <div style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                  padding: "20px 20px 24px", color: "#fff"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", opacity: 0.7, marginBottom: "16px" }}>
                    <span>Session ID : {sessionId}</span>
                    <span>{today}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }}
                    />
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", letterSpacing: "0.04em" }}>
                        {currentUser.role?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: "2px" }}>{currentUser.name}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: "8px 0" }}>
                  {[
                    {
                      label: "Profile", icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/>
                        </svg>
                      ), action: () => setProfileView("edit")
                    },
                    {
                      label: "Change Password", icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      ), action: () => { setPwForm({ old: "", newPw: "", confirm: "" }); setProfileView("password"); }
                    },
                    {
                      label: "Support", icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z"/>
                        </svg>
                      ), action: () => {}
                    },
                    {
                      label: "Logout", icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                        </svg>
                      ), action: () => { closeModal(); logout(); }
                    },
                  ].map(({ label, icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        width: "100%", padding: "14px 24px",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "1rem", color: label === "Logout" ? "#ef4444" : "#111827",
                        fontWeight: "500", textAlign: "left",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ color: label === "Logout" ? "#ef4444" : "#6b7280" }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={closeModal}
                  style={{
                    width: "100%", padding: "16px",
                    background: "#22a74a", color: "#fff",
                    border: "none", fontSize: "1rem", fontWeight: "700",
                    cursor: "pointer", letterSpacing: "0.04em"
                  }}
                >
                  Close
                </button>
              </>
            )}

            {/* ── VIEW: EDIT PROFILE ── */}
            {profileView === "edit" && (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <button onClick={() => setProfileView("menu")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "#374151", display: "flex", alignItems: "center" }}>‹</button>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#111827" }}>Edit Profile</h3>
                </div>

                <div style={{ padding: "16px 20px 20px", maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Avatar row */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "4px" }}>
                    <img src={currentUser.avatar} alt="" style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e5e7eb" }} />
                    <div style={{ flex: 1, border: "1.5px dashed #d1d5db", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 12px", cursor: "pointer", color: "#374151", fontSize: "0.88rem", fontWeight: "500", gap: "8px" }}>
                      <span>⬆</span> Upload Profile Image
                    </div>
                  </div>

                  {/* Name + Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input style={{ ...fieldStyle, borderColor: "#22c55e" }} value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Id</label>
                      <input style={fieldStyle} value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>

                  {/* Phone + City */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>Mobile No.</label>
                      <input style={fieldStyle} value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input style={fieldStyle} value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label style={labelStyle}>Address</label>
                    <input style={fieldStyle} value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
                  </div>

                  {/* Pin Code */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>Pin Code</label>
                      <input style={fieldStyle} value={profileForm.pinCode} onChange={e => setProfileForm(f => ({ ...f, pinCode: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <input style={{ ...fieldStyle, background: "#f9fafb", color: "#9ca3af" }} value={currentUser.role} readOnly />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                  <button onClick={() => setProfileView("menu")} style={{ padding: "16px", background: "#f1f5f9", border: "none", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", color: "#374151" }}>Close</button>
                  <button onClick={() => { setProfileView("menu"); }} style={{ padding: "16px", background: "#22a74a", color: "#fff", border: "none", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" }}>Update Profile</button>
                </div>
              </>
            )}

            {/* ── VIEW: CHANGE PASSWORD ── */}
            {profileView === "password" && (
              <>
                <div style={{ padding: "20px 20px 8px", borderBottom: "1px solid #f1f5f9" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#111827" }}>Change Password</h3>
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[
                    { label: "Old Password", key: "old", show: showOld, toggle: () => setShowOld(v => !v) },
                    { label: "New Password", key: "newPw", show: showNew, toggle: () => setShowNew(v => !v) },
                    { label: "Confirm Password", key: "confirm", show: showConf, toggle: () => setShowConf(v => !v) },
                  ].map(({ label, key, show, toggle }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={show ? "text" : "password"}
                          placeholder={`Enter ${label}`}
                          value={pwForm[key]}
                          onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                          style={{ ...fieldStyle, paddingRight: "44px" }}
                        />
                        <button
                          type="button"
                          onClick={toggle}
                          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
                        >
                          {show ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setProfileView("menu")}
                    style={{ width: "100%", padding: "14px", background: "#22a74a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "1rem", fontWeight: "700", cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setProfileView("menu")}
                    style={{ width: "100%", padding: "14px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Main Body Layout under Top Navbar */}
      <div className="app-body-layout" style={{ display: "flex", flexGrow: 1, width: "100%", minHeight: "calc(100vh - 80px)", position: "relative" }}>
        
        {/* Main Content Area (Full 100% Width) */}
        <div className="main-wrapper" style={{ flex: 1, width: "100%", maxWidth: "100%" }}>
          <header className="mobile-header">
            <div className="mobile-brand">
              <span className="brand-logo">
                <img src={logoImg} alt="Acme Logo" style={{ width: "30px", height: "30px", objectFit: "contain", display: "inline-block", verticalAlign: "middle" }} />
              </span>
              <h1>Acme</h1>
            </div>
            <div className="mobile-user-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={currentUser.avatar} alt={currentUser.name} className="mobile-avatar" onClick={openModal} style={{ cursor: "pointer" }} />
              <button onClick={logout} style={{ fontSize: "0.75rem", color: "var(--color-error)", border: "1px solid var(--color-error)", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>Log Out</button>
            </div>
          </header>

          <main className="main-content">
            {children}
          </main>

          <nav className="mobile-bottom-nav">
            {navItems.map((item) => (
              <button key={item.id} className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Standalone Full-Page View for Employee Profile (Matching User Request) ── */}
      {viewingProfileUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#f8fafc",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Top Full-Width Header Bar */}
          <div style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", height: "48px", flexShrink: 0 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", letterSpacing: "0.03em", textTransform: "uppercase" }}>
              EMPLOYEE PROFILE — {viewingProfileUser.empCode || "HBJ00007"}
            </span>
            <button
              type="button"
              onClick={() => setViewingProfileUser(null)}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: "700",
                color: "#475569"
              }}
              title="Close Profile View"
            >
              ✕
            </button>
          </div>

          {/* Full-Height Standalone Page Content Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
            
            {/* Keka HR Style Banner Header */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
                
                {/* Purple Wavy Gradient Banner */}
                <div style={{ position: "relative", height: "150px", background: "linear-gradient(135deg, #4c478a 0%, #312e5c 50%, #1e1b4b 100%)" }}>
                  <div style={{ position: "absolute", bottom: "16px", left: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
                    <img 
                      src={viewingProfileUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"} 
                      alt={viewingProfileUser.name}
                      style={{ width: "96px", height: "96px", borderRadius: "50%", border: "4px solid #ffffff", objectFit: "cover" }}
                    />
                    <div style={{ color: "#ffffff" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h1 style={{ fontSize: "1.6rem", fontWeight: "700", margin: 0, color: "#ffffff" }}>{viewingProfileUser.name}</h1>
                        <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "700" }}>
                          IN
                        </span>
                        <span style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase" }}>
                          WEEKLY OFF
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#e2e8f0", marginTop: "4px" }}>
                        🧰 {viewingProfileUser.title || "Systems Operator"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info Strip */}
                <div style={{ padding: "12px 20px", background: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "24px", fontSize: "0.82rem", color: "#475569", flexWrap: "wrap" }}>
                  <span>✉ {viewingProfileUser.email}</span>
                  <span>📞 {viewingProfileUser.phone || "+91-7569099549"}</span>
                  <span>📍 {viewingProfileUser.location || "Mehdipatnam"}</span>
                  <span>🪪 {viewingProfileUser.empCode || "HBJ00007"}</span>
                </div>

                {/* Joining / Department / Reporting Manager Strip */}
                <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "48px", fontSize: "0.82rem" }}>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>JOINING DATE</span>
                    <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>24 Jan 2025</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>DEPARTMENT</span>
                    <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{(viewingProfileUser.department || "IT & SYSTEMS SUPPORT").toUpperCase()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>REPORTING MANAGER</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" alt="Manager" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                      <span style={{ fontWeight: "600", color: "#2563eb" }}>Shikhar Jain</span>
                    </div>
                  </div>
                </div>

                {/* Profile Navigation Tabs Row */}
                <div style={{ display: "flex", gap: "24px", padding: "0 20px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
                  {["ABOUT", "PROFILE", "JOB", "TIME", "DOCUMENTS", "ASSETS", "FINANCES", "EXPENSES", "PERFORMANCE"].map(tab => {
                    const isActive = profileModalTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setProfileModalTab(tab)}
                        style={{
                          padding: "12px 0",
                          background: "none",
                          border: "none",
                          borderBottom: isActive ? "2px solid #4c478a" : "2px solid transparent",
                          color: isActive ? "#4c478a" : "#64748b",
                          fontWeight: isActive ? "700" : "500",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Tabs Row under TIME */}
                {profileModalTab === "TIME" && (
                  <div style={{ display: "flex", gap: "16px", padding: "10px 20px", background: "#ffffff" }}>
                    {["Attendance", "Leave"].map(subTab => {
                      const isActive = timeSubTab === subTab;
                      return (
                        <button
                          key={subTab}
                          type="button"
                          onClick={() => setTimeSubTab(subTab)}
                          style={{
                            padding: "5px 16px",
                            background: isActive ? "#f3e8ff" : "#ffffff",
                            color: isActive ? "#6b21a8" : "#475569",
                            border: isActive ? "1px solid #d8b4fe" : "1px solid #e2e8f0",
                            borderRadius: "4px",
                            fontWeight: isActive ? "600" : "500",
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          {subTab}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>

              {/* Attendance Grid (Matching Keka HR Screenshot) */}
              {profileModalTab === "TIME" && timeSubTab === "Attendance" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1fr", gap: "16px" }}>
                  
                  {/* Card 1: Attendance Stats */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Attendance Stats</h3>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Last Week ▾</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>👤</div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Me</span>
                      </div>
                      <div style={{ display: "flex", gap: "20px", textAlign: "right" }}>
                        <div><span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>AVG HRS / DAY</span><strong style={{ fontSize: "1.05rem" }}>9h 3m</strong></div>
                        <div><span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>ON TIME ARRIVAL</span><strong style={{ fontSize: "1.05rem" }}>83%</strong></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>👥</div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>My Team</span>
                      </div>
                      <div style={{ display: "flex", gap: "20px", textAlign: "right" }}>
                        <div><span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>AVG HRS / DAY</span><strong style={{ fontSize: "1.05rem" }}>8h 49m</strong></div>
                        <div><span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>ON TIME ARRIVAL</span><strong style={{ fontSize: "1.05rem" }}>81%</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Timings */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Timings</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                        <div key={idx} style={{ width: "26px", height: "26px", borderRadius: "50%", background: idx === 1 ? "#38bdf8" : "#f1f5f9", color: idx === 1 ? "#ffffff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: idx === 1 ? "700" : "500" }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600", marginBottom: "10px" }}>Today (10:30 AM - 9:00 PM)</div>
                    <div style={{ background: "#e0f2fe", height: "10px", borderRadius: "5px", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{ background: "#38bdf8", width: "70%", height: "100%" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "#64748b" }}>
                      <span>Duration: 10h 30m</span>
                      <span>☕ 40 min</span>
                    </div>
                  </div>

                  {/* Card 3: Actions */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Actions</h3>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", background: "#f8fafc", textAlign: "center", marginBottom: "14px" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>03:40:20 AM</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Tue, 21 Jul 2026</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-around", fontSize: "0.78rem", color: "#4c478a", fontWeight: "600" }}>
                      <span>💼 On Duty</span>
                      <span>📋 Attendance Policy</span>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
      )}
    </div>
  );
}
