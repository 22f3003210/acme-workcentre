import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import logoImg from "../assets/logo.png";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { currentUser, logout } = useApp();

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileView, setProfileView] = useState("menu"); // "menu" | "edit" | "password"

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

  return (
    <div className={`app-container ${currentUser.role === "Admin" ? "theme-admin" : ""}`} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="sea-top-navbar">
        <div className="sea-nav-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src={logoImg} alt="Acme Consulting" style={{ height: "64px", objectFit: "contain", display: "block" }} />
          <div className="brand-text-header">
            <h2 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.02em", lineHeight: "1.05" }}>Acme Consulting</h2>
            <p style={{ fontSize: "0.68rem", color: "#2563eb", fontWeight: "900", letterSpacing: "0.1em", textTransform: "uppercase", margin: "4px 0 0 0" }}>Internal Portal</p>
          </div>
        </div>
        <div className="sea-search-wrapper">
          <span className="sea-search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </span>
          <input type="text" className="sea-search-input" placeholder="Search Anything" disabled />
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
        {/* Sidebar for Desktop */}
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <span className="brand-logo">
              <img src={logoImg} alt="Acme Logo" style={{ width: "52px", height: "52px", objectFit: "contain", display: "block" }} />
            </span>
            <div className="brand-text">
              <h2>Acme Consulting</h2>
              <p>INTERNAL PORTAL</p>
            </div>
          </div>

          <div className="user-profile-section">
            <img src={currentUser.avatar} alt={currentUser.name} className="profile-avatar" />
            <div className="profile-info">
              <h4 className="profile-name">{currentUser.name}</h4>
              <span className="profile-role">
                {currentUser.role} {currentUser.department ? `• ${currentUser.department}` : ""}
              </span>
            </div>
          </div>

          <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="nav-items-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {navItems.map((item) => (
                <button key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>

            <button onClick={logout} className="nav-item sign-out-btn" style={{ marginTop: "auto", color: "var(--color-error)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", borderRadius: "0" }}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </span>
              <span className="nav-label">Sign Out</span>
            </button>
          </nav>

          <div className="sidebar-footer" style={{ marginTop: "16px" }}>
            <p>© 2026 Acme Consulting</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-wrapper">
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
    </div>
  );
}
