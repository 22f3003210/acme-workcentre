import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, getTodayDateString } from "../context/AppContext";
import { getRoutePath } from "../App";
import logoImg from "../assets/logo.png";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { currentUser, users, logout } = useApp();
  const navigate = useNavigate();

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

  // 9-Dots Button Side Navigation Toggle State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Mobile Bottom App Drawer State
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

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
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    city: currentUser?.city || "",
    pinCode: currentUser?.pinCode || "",
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

    switch (currentUser?.role) {
      case "Admin":
        return [
          { id: "dashboard", label: "Home", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
          { id: "calendar",  label: "Calendar", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>) },
          { id: "projects",  label: "Projects", icon: projectIcon },
          { id: "reports",   label: "Expenses", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>) },
          { id: "directory", label: "Directory", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
          { id: "attendance", label: "Attendance", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) },
          { id: "recruitment", label: "Recruiter Hub", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>) },
          { id: "settings",  label: "Settings", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>) },
        ];
      case "Accountant":
      case "Accounts Manager":
      case "Finance":
        return [
          { id: "dashboard", label: "Finance Dashboard", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
          { id: "expenses",  label: "Expense Verification", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>) },
          { id: "advances",  label: "Cash Advances", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>) },
          { id: "attendance", label: "Attendance & Payroll", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) },
          { id: "reports",   label: "Ledger Reports", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>) },
          { id: "projects",  label: "Projects Overview", icon: projectIcon }
        ];
      case "Consultant":
        return [
          { id: "dashboard",  label: "Home", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
          { id: "attendance", label: "Consultant Attendance", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) },
          { id: "expenses",   label: "My Expenses", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>) },
          { id: "projects",   label: "My Projects", icon: projectIcon },
          { id: "calendar",   label: "Calendar", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>) },
          { id: "leaves",     label: "My Leaves", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>) }
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

  return (
    <div className={`app-container ${currentUser?.role === "Admin" ? "theme-admin" : ""}`} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="sea-top-navbar" style={{ position: "sticky", top: 0, zIndex: 900 }}>
        <div className="sea-nav-left" style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          
          {/* 9-Dots Button (Linked to Side Navigation Bar Toggle) */}
          <button
            type="button"
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: isSidebarExpanded ? "#dbeafe" : "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#2563eb",
              transition: "all 0.15s ease",
              boxShadow: isSidebarExpanded ? "0 0 0 3px rgba(37,99,235,0.2)" : "0 2px 5px rgba(37,99,235,0.08)",
              flexShrink: 0
            }}
            title={isSidebarExpanded ? "Collapse Sidebar Menu" : "Expand Sidebar Menu"}
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

          {/* Acme Consulting Oval Logo */}
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
                            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{emp.title || "Employee"} |</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#2563eb" }}>#{emp.empCode || "-"}</span>
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
                      onClick={() => { if (setActiveTab) setActiveTab("directory"); navigate(getRoutePath("directory")); setIsSearchOpen(false); }}
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
                      onClick={() => { if (setActiveTab) setActiveTab("reports"); navigate(getRoutePath("reports")); setIsSearchOpen(false); }}
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
            src={currentUser?.avatar}
            className="sea-user-avatar"
            alt={`${currentUser?.name} avatar`}
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
                      src={currentUser?.avatar}
                      alt={currentUser?.name}
                      style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }}
                    />
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", letterSpacing: "0.04em" }}>
                        {currentUser?.role?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: "2px" }}>{currentUser?.name}</div>
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
                    <img src={currentUser?.avatar} alt="" style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e5e7eb" }} />
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
                      <input style={{ ...fieldStyle, background: "#f9fafb", color: "#9ca3af" }} value={currentUser?.role || ""} readOnly />
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
        
        {/* YouTube-Style Collapsible Side Navigation Bar for All Authenticated Users */}
        {currentUser && (
          <aside className={`youtube-sidebar ${isSidebarExpanded ? "expanded" : ""}`}>
            <div className="youtube-sidebar-nav">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`youtube-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (setActiveTab) setActiveTab(item.id);
                      navigate(getRoutePath(item.id, currentUser?.role));
                    }}
                    title={item.label}
                  >
                    <span className="youtube-nav-icon">{item.icon}</span>
                    <span className="youtube-nav-label">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="youtube-sidebar-divider" />

            <div className="youtube-sidebar-footer">
              <div className="youtube-user-card" onClick={openModal} title={`${currentUser?.name} Profile & Settings`}>
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"}
                  alt={currentUser?.name}
                  className="youtube-user-avatar"
                />
                <div className="youtube-user-info">
                  <span className="youtube-user-name">{currentUser?.name || "User"}</span>
                  <span className="youtube-user-role">{currentUser?.role || "Consultant"}</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <div className="main-wrapper" style={{ flex: 1, width: "100%", maxWidth: "100%", minWidth: 0 }}>
          <header className="mobile-header">
            <div className="mobile-brand">
              <img src={logoImg} alt="Acme Logo" style={{ height: "28px", objectFit: "contain" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", lineHeight: "1.1" }}>Acme</span>
                <span style={{ fontSize: "0.6rem", color: "#2563eb", fontWeight: "800", textTransform: "uppercase" }}>Internal Portal</span>
              </div>
            </div>

            <div className="mobile-user-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowMobileDrawer(true)}
                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                title="Open Navigation Menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <img src={currentUser?.avatar} alt={currentUser?.name} className="mobile-avatar" onClick={openModal} style={{ cursor: "pointer" }} />
            </div>
          </header>

          <main className={`main-content ${activeTab === "recruitment" ? "recruiting-full-width" : ""}`}>
            {children}
          </main>

          {/* Native Mobile App Bottom Navigation Bar (Max 4 Primary Tabs + "More") */}
          <nav className="mobile-bottom-nav">
            {navItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  navigate(getRoutePath(item.id, currentUser?.role));
                }}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            ))}

            <button
              type="button"
              className={`mobile-nav-item ${showMobileDrawer ? "active" : ""}`}
              onClick={() => setShowMobileDrawer(!showMobileDrawer)}
            >
              <span className="mobile-nav-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </span>
              <span className="mobile-nav-label">More</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile App Slide-Up Navigation Drawer */}
      {showMobileDrawer && (
        <div
          onClick={() => setShowMobileDrawer(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px 20px 0 0",
              padding: "20px",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.2)",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
          >
            {/* Drag Pill */}
            <div style={{ width: "40px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 16px auto" }} />

            {/* User Profile Header in Drawer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={currentUser?.avatar} alt={currentUser?.name} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2563eb" }} />
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>{currentUser?.name}</h3>
                  <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>{currentUser?.role}</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowMobileDrawer(false)} style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", fontWeight: "800", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {/* All Modules Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setShowMobileDrawer(false);
                    if (setActiveTab) setActiveTab(item.id);
                    navigate(getRoutePath(item.id, currentUser?.role));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px",
                    background: activeTab === item.id ? "#eff6ff" : "#f8fafc",
                    border: activeTab === item.id ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    borderRadius: "10px",
                    color: activeTab === item.id ? "#2563eb" : "#334155",
                    fontWeight: activeTab === item.id ? "700" : "600",
                    fontSize: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ color: activeTab === item.id ? "#2563eb" : "#64748b" }}>{item.icon}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Account & Logout */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                onClick={() => { setShowMobileDrawer(false); openModal(); }}
                style={{ width: "100%", padding: "12px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "0.88rem", color: "#334155", cursor: "pointer" }}
              >
                👤 Profile & Account Settings
              </button>
              <button
                type="button"
                onClick={() => { setShowMobileDrawer(false); logout(); navigate("/auth/login"); }}
                style={{ width: "100%", padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "700", fontSize: "0.88rem", color: "#ef4444", cursor: "pointer" }}
              >
                🚪 Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Standalone Full-Page View for Employee Profile (Matching User Request) ── */}
      {viewingProfileUser && (() => {
        const activeProfileUser = (users || []).find(u => u.id === viewingProfileUser?.id) || viewingProfileUser;
        const empAttList = activeProfileUser.attendance || [];
        const todayStr = getTodayDateString();
        const todayAtt = empAttList.find(a => a.date === todayStr);

        const totalPunches = empAttList.length;
        const totalHours = empAttList.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0);
        const avgHours = totalPunches > 0 ? (totalHours / totalPunches).toFixed(1) : "0.0";
        const onTimePunches = empAttList.filter(a => a.status === "Present" || a.status === "On Time").length;
        const onTimePct = totalPunches > 0 ? Math.round((onTimePunches / totalPunches) * 100) : 100;

        return (
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
                EMPLOYEE PROFILE — {activeProfileUser.empCode || `EMP-${activeProfileUser.id?.substring(0,4)}`}
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
                        src={activeProfileUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"} 
                        alt={activeProfileUser.name}
                        style={{ width: "96px", height: "96px", borderRadius: "50%", border: "4px solid #ffffff", objectFit: "cover" }}
                      />
                      <div style={{ color: "#ffffff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <h1 style={{ fontSize: "1.6rem", fontWeight: "700", margin: 0, color: "#ffffff" }}>{activeProfileUser.name}</h1>
                          <span style={{ background: todayAtt ? "#dcfce7" : "#fee2e2", color: todayAtt ? "#15803d" : "#b91c1c", border: `1px solid ${todayAtt ? "#86efac" : "#fca5a5"}`, padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "700" }}>
                            {todayAtt ? (todayAtt.checkOut ? "CHECKED OUT" : "CLOCKED IN") : "NOT CLOCKED IN TODAY"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#e2e8f0", marginTop: "4px" }}>
                          🧰 {activeProfileUser.title || `${activeProfileUser.role} Lead`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Strip */}
                  <div style={{ padding: "12px 20px", background: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "24px", fontSize: "0.82rem", color: "#475569", flexWrap: "wrap" }}>
                    <span>✉ {activeProfileUser.email}</span>
                    <span>📞 {activeProfileUser.phone || "+91 98201 12345"}</span>
                    <span>📍 {activeProfileUser.location || "Hyderabad"}</span>
                    <span>🪪 {activeProfileUser.empCode || `EMP-${activeProfileUser.id?.substring(0,4)}`}</span>
                  </div>

                  {/* Joining / Department / Reporting Manager Strip */}
                  <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "48px", fontSize: "0.82rem" }}>
                    <div>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>JOINING DATE</span>
                      <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>24 Jan 2025</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>DEPARTMENT</span>
                      <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{(activeProfileUser.department || "Advisory").toUpperCase()}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>REPORTING MANAGER</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" alt="Manager" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                        <span style={{ fontWeight: "600", color: "#2563eb" }}>ACME Admin</span>
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

                {/* Attendance Grid */}
                {profileModalTab === "TIME" && timeSubTab === "Attendance" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Top Row: Attendance Summary Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1fr", gap: "16px" }}>
                      
                      {/* Card 1: Attendance Stats */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Attendance Overview</h3>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Live Sync</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>👤</div>
                            <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>{activeProfileUser.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: "20px", textAlign: "right" }}>
                            <div><span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>AVG HRS / SHIFT</span><strong style={{ fontSize: "1.05rem" }}>{avgHours}h</strong></div>
                            <div><span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>ON TIME RATE</span><strong style={{ fontSize: "1.05rem" }}>{onTimePct}%</strong></div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Total Shift Logs</span>
                          <strong style={{ fontSize: "1.1rem", color: "#4c478a" }}>{totalPunches} Days Logged</strong>
                        </div>
                      </div>

                      {/* Card 2: Today's Shift Status */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 14px 0" }}>Today's Shift Status</h3>
                        {todayAtt ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
                            <div><strong>Check In:</strong> <span style={{ color: "#16a34a", fontWeight: "600" }}>{todayAtt.checkIn}</span></div>
                            <div><strong>Check Out:</strong> <span style={{ color: "#dc2626", fontWeight: "600" }}>{todayAtt.checkOut || "Active Shift (In Progress)"}</span></div>
                            <div><strong>Location / Project:</strong> {todayAtt.projectName || todayAtt.locationName || "Site Visit"}</div>
                            {todayAtt.tasks && todayAtt.tasks.length > 0 && (
                              <div style={{ fontSize: "0.78rem", color: "#64748b", background: "#f8fafc", padding: "6px 10px", borderRadius: "4px" }}>
                                📋 <strong>Tasks Today:</strong> {todayAtt.tasks.join(", ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.82rem", color: "#94a3b8", padding: "12px 0" }}>
                            No attendance logged yet for today ({todayStr}).
                          </div>
                        )}
                      </div>

                      {/* Card 3: Employee Details Quick Summary */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Compliance & Status</h3>
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", background: "#f8fafc", textAlign: "center", marginBottom: "14px" }}>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>{activeProfileUser.status || "Active Employee"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>GPS & Selfie Geotagging Enabled</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-around", fontSize: "0.78rem", color: "#4c478a", fontWeight: "600" }}>
                          <span>💼 Field Consultant</span>
                          <span>📋 Verified</span>
                        </div>
                      </div>

                    </div>

                    {/* Employee Attendance Logs Table */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>
                        Detailed Attendance Logs ({empAttList.length})
                      </h3>

                      {empAttList.length === 0 ? (
                        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                          No attendance records found for this employee yet.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                            <thead>
                              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Selfie / Verification</th>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Date</th>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Check In</th>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Check Out</th>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Hours Worked</th>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Project / Location</th>
                                <th style={{ padding: "10px 14px", fontWeight: "600" }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {empAttList.map((att, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "10px 14px" }}>
                                    {att.selfie ? (
                                      <img src={att.selfie} alt="Selfie" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                                    ) : (
                                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No Selfie</span>
                                    )}
                                  </td>
                                  <td style={{ padding: "10px 14px", fontWeight: "600", color: "#0f172a" }}>{att.date}</td>
                                  <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: "600" }}>{att.checkIn || "-"}</td>
                                  <td style={{ padding: "10px 14px", color: "#dc2626", fontWeight: "600" }}>{att.checkOut || "In Progress"}</td>
                                  <td style={{ padding: "10px 14px", fontWeight: "600" }}>{att.hoursWorked ? `${att.hoursWorked} hrs` : "-"}</td>
                                  <td style={{ padding: "10px 14px", color: "#334155" }}>{att.projectName || att.locationName || "Site Visit"}</td>
                                  <td style={{ padding: "10px 14px" }}>
                                    <span style={{
                                      padding: "3px 8px",
                                      borderRadius: "4px",
                                      fontSize: "0.72rem",
                                      fontWeight: "700",
                                      background: att.status === "Late" ? "#fef3c7" : "#dcfce7",
                                      color: att.status === "Late" ? "#d97706" : "#15803d"
                                    }}>
                                      {att.status || "Present"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            </div>
        );
      })()}
    </div>
  );
}
