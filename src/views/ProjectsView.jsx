import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { initialProjects } from "../data/initialData";
import logoImg from "../assets/logo.png";

export default function ProjectsView() {
  const { 
    projects, 
    addProject, 
    updateProject, 
    addProjectDiscussion, 
    addProjectVisit,
    addProjectScheduledEvent,
    toggleProjectChecklistItem,
    users, 
    expenses, 
    currentUser, 
    setToast 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Active', 'Completed', 'On Hold'
  const [searchQuery, setSearchQuery] = useState("");

  // Helper date formatter: e.g. 2026-07-12 -> 12 July 2026
  const formatDateNice = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to ensure project properties are structured cleanly
  const getEffectiveProject = (proj) => {
    if (!proj) return null;
    return {
      ...proj,
      clientVisits: proj.clientVisits || [],
      scheduledEvents: proj.scheduledEvents || [],
      checklists: proj.checklists || [],
      engagementPurpose: proj.engagementPurpose || "Client approached us for consulting advisory, audit, and growth strategy."
    };
  };

  // Modal states
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeProjectTab, setActiveProjectTab] = useState("scope"); // 'scope', 'planner', 'visits', 'overview', 'team', 'expenses', 'discussions'
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Discussion Form
  const [discText, setDiscText] = useState("");
  const [discCategory, setDiscCategory] = useState("Client Update");

  // Schedule Event Form State
  const [showEventModal, setShowEventModal] = useState(false);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtType, setEvtType] = useState("Call Scheduling");
  const [evtDate, setEvtDate] = useState("");
  const [evtTime, setEvtTime] = useState("11:00 AM");
  const [evtConsultant, setEvtConsultant] = useState("Darla Manikanta");
  const [evtNotes, setEvtNotes] = useState("");

  // Record Client Visit Form State (supports multi-consultant visiting team!)
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [vTitle, setVTitle] = useState("");
  const [vStart, setVStart] = useState("");
  const [vEnd, setVEnd] = useState("");
  const [vConsultants, setVConsultants] = useState(["Darla Manikanta"]);
  const [vUnderstandings, setVUnderstandings] = useState("");
  const [vWorkDone, setVWorkDone] = useState("");
  const [vFollowUp, setVFollowUp] = useState("");

  // New Project Form (matches exact Create project drawer design)
  const [newName, setNewName] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocContact, setPocContact] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStatus, setNewStatus] = useState("In Progress");
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [linkExpensesEnabled, setLinkExpensesEnabled] = useState(true);

  // Automatically hide left sidebar when an individual client project detail view is active
  useEffect(() => {
    if (selectedProject) {
      document.body.classList.add("hide-sidebar");
    } else {
      document.body.classList.remove("hide-sidebar");
    }
    return () => {
      document.body.classList.remove("hide-sidebar");
    };
  }, [selectedProject]);

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesStatus = statusFilter === "All" || p.status === statusFilter || (statusFilter === "Active" && p.status === "In Progress");
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !q || 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) || 
      (p.pocName && p.pocName.toLowerCase().includes(q)) ||
      p.client.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Calculate high-level stats
  const activeCount = projects.filter(p => p.status === "Active" || p.status === "In Progress").length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalDiscussions = projects.reduce((sum, p) => sum + (p.discussions?.length || 0), 0);

  // Handlers
  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      setToast({ message: "Please fill required fields (Project name & Project code).", type: "error" });
      return;
    }

    addProject({
      code: newCode.toUpperCase(),
      name: newName,
      client: pocName || "Client Engagement",
      pocName: pocName || "N/A",
      pocContact: pocContact || "N/A",
      clientContact: pocContact ? `${pocName} (${pocContact})` : (pocName || "N/A"),
      location: "HQ / Client Site",
      budget: parseFloat(newBudget) || 0,
      status: newStatus === "In Progress" ? "Active" : newStatus,
      displayStatus: newStatus,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || "",
      description: description || "",
      linkExpensesEnabled: linkExpensesEnabled
    });

    setToast({ message: `Project '${newName}' created successfully!`, type: "success" });
    setNewName("");
    setPocName("");
    setPocContact("");
    setNewCode("");
    setNewStatus("In Progress");
    setShowDescription(false);
    setDescription("");
    setStartDate("");
    setEndDate("");
    setNewBudget("");
    setLinkExpensesEnabled(true);
    setShowCreateModal(false);
  };

  const handlePostDiscussion = (e) => {
    e.preventDefault();
    if (!discText.trim() || !selectedProject) return;

    addProjectDiscussion(selectedProject.id, {
      text: discText,
      category: discCategory
    });

    // Refresh selected project reference in modal
    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);

    setToast({ message: "Discussion update posted to project feed.", type: "success" });
    setDiscText("");
  };

  const handleCreateEventSubmit = (e) => {
    e.preventDefault();
    if (!evtTitle.trim() || !selectedProject) return;

    addProjectScheduledEvent(selectedProject.id, {
      title: evtTitle,
      type: evtType,
      date: evtDate || new Date().toISOString().split("T")[0],
      time: evtTime || "11:00 AM",
      consultant: evtConsultant,
      notes: evtNotes,
      status: "Scheduled"
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);

    setToast({ message: `Event '${evtTitle}' scheduled successfully!`, type: "success" });
    setEvtTitle("");
    setEvtNotes("");
    setShowEventModal(false);
  };

  const handleRecordVisitSubmit = (e) => {
    e.preventDefault();
    if (!vTitle.trim() || !selectedProject) return;

    // Calculate duration in days
    let days = 1;
    if (vStart && vEnd) {
      const d1 = new Date(vStart);
      const d2 = new Date(vEnd);
      const diffTime = Math.abs(d2 - d1);
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    addProjectVisit(selectedProject.id, {
      visitTitle: vTitle,
      startDate: vStart || new Date().toISOString().split("T")[0],
      endDate: vEnd || vStart || new Date().toISOString().split("T")[0],
      durationDays: days,
      visitingConsultants: vConsultants.length > 0 ? vConsultants : ["Darla Manikanta"],
      understandings: vUnderstandings,
      workDone: vWorkDone,
      followUpAction: vFollowUp
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);

    setToast({ message: `Client visit '${vTitle}' recorded successfully!`, type: "success" });
    setVTitle("");
    setVUnderstandings("");
    setVWorkDone("");
    setVFollowUp("");
    setShowVisitModal(false);
  };

  const consultants = users.filter(u => u.role === "Consultant");

  // ── SEPARATE PAGE VIEW FOR SELECTED PROJECT HUB (MATCHING USER REFERENCE UI DASHBOARD) ──
  if (selectedProject) {
    const effectiveProject = getEffectiveProject(selectedProject);
    const linkedExps = expenses.filter(e => e.projectId === effectiveProject.id || e.projectName === effectiveProject.name);
    
    return (
      <div className="individual-project-view" style={{ padding: "12px 16px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a", background: "#f1f5f9" }}>
        
        {/* ------------------------------------------------------------- */}
        {/* TOP HEADER: BACK ARROW + CLIENT TITLE + EDIT & CLOSE BUTTONS  */}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "10px 18px", borderRadius: "12px", border: "1px solid #cbd5e1", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setSelectedProject(null)}
              style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem", color: "#475569", fontWeight: "700" }}
            >
              ‹
            </button>
            <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
              Customer | <span style={{ color: "#2563eb" }}>{effectiveProject.pocName || effectiveProject.client}</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => alert("Editing Project Details...")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.82rem",
                fontWeight: "700",
                color: "#334155",
                cursor: "pointer"
              }}
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => setSelectedProject(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.82rem",
                fontWeight: "800",
                color: "#0f172a",
                cursor: "pointer"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOP SECTION: PROFILE CARD (LEFT) + VIBRANT KPIS & TABS (RIGHT)*/}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px" }}>
          
          {/* LEFT PROFILE & ACTION BADGES CARD (Matching C-HO004 profile card in screenshot) */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#cbd5e1", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: "800" }}>
                {(effectiveProject.client || "C")[0]}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                  {effectiveProject.code || "C-HO004"}
                </h3>
                <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "700", marginTop: "2px" }}>
                  Budget: Rs 50.00 Lacs
                </div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                  +{effectiveProject.pocContact || "91 7452521524"} | -
                </div>
              </div>
            </div>

            {/* Row of 5 Pill Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ background: "#15803d", color: "#ffffff", padding: "5px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                💚 Beverage
              </span>
              <span style={{ background: "#15803d", color: "#ffffff", padding: "5px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                🎁 Add Birthdate
              </span>
              <span style={{ background: "#15803d", color: "#ffffff", padding: "5px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                💍 Add Anniversary
              </span>
              <span style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700" }}>
                👥 Team (4)
              </span>
              <span style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem" }}>
                📎
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: 3 TOP VIBRANT KPI CARDS + PILL NAVIGATION TABS + 6 RECTANGLE KPIS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Top Row: 3 Vibrant Gradient Cards + Pill Tabs Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
              
              {/* 3 Colorful Gradient Feature Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                
                {/* Card 1: Blue Gift Vouchers */}
                <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", borderRadius: "12px", padding: "14px", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 3px 8px rgba(2,132,199,0.25)" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "2px" }}>🎁</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.9, fontWeight: "600" }}>Tasks Completed</div>
                  <strong style={{ fontSize: "1.5rem", fontWeight: "900", marginTop: "2px" }}>8 / 14</strong>
                </div>

                {/* Card 2: Orange Loyalty Points */}
                <div style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", borderRadius: "12px", padding: "14px", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 3px 8px rgba(234,88,12,0.25)" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "2px" }}>🏅</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.9, fontWeight: "600" }}>Phase Progress</div>
                  <strong style={{ fontSize: "1.3rem", fontWeight: "900", marginTop: "2px" }}>Phase 4 (65%)</strong>
                </div>

                {/* Card 3: Purple Schemes */}
                <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", borderRadius: "12px", padding: "14px", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 3px 8px rgba(124,58,237,0.25)" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "2px" }}>🏺</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.9, fontWeight: "600" }}>Site Visits</div>
                  <strong style={{ fontSize: "1.5rem", fontWeight: "900", marginTop: "2px" }}>5 Done</strong>
                </div>

              </div>

              {/* Pill Navigation Tabs */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "8px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "business", label: "Business Details" },
                  { id: "audit", label: "Audit Report" },
                  { id: "plan", label: "Project Plan" },
                  { id: "tasks", label: "Tasks (14)" },
                  { id: "visits", label: "Visits (5)" },
                  { id: "documents", label: "Documents" },
                  { id: "team", label: "Team" },
                  { id: "discussions", label: "Discussions" },
                  { id: "expenses", label: "Expenses" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProjectTab(tab.id)}
                    style={{
                      background: activeProjectTab === tab.id ? "#2563eb" : "#f1f5f9",
                      color: activeProjectTab === tab.id ? "#ffffff" : "#334155",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Bottom Row: 6 Graphic Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>
              
              {/* Card 1: Orders (Dark Blue) */}
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: "700" }}>Total Tasks</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900" }}>14</div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>📋</span>
              </div>

              {/* Card 2: Bills (Teal Green) */}
              <div style={{ background: "#065f46", borderRadius: "10px", padding: "12px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: "700" }}>Overdue Tasks</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900" }}>2</div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>💵</span>
              </div>

              {/* Card 3: Sales (Navy Blue) */}
              <div style={{ background: "#1e3a8a", borderRadius: "10px", padding: "12px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: "700" }}>Expenses</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "900" }}>₹45k</div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>🏪</span>
              </div>

              {/* Card 4: Memo (Brown) */}
              <div style={{ background: "#9a3412", borderRadius: "10px", padding: "12px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: "700" }}>Meetings</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900" }}>3</div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>📝</span>
              </div>

              {/* Card 5: Quotation (Dark Indigo) */}
              <div style={{ background: "#312e81", borderRadius: "10px", padding: "12px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: "700" }}>Site Audits</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900" }}>5</div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>📊</span>
              </div>

              {/* Card 6: Pending Estimation (Purple) */}
              <div style={{ background: "#581c87", borderRadius: "10px", padding: "12px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: "700" }}>SOP Sign-off</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "900" }}>Pending</div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>🧮</span>
              </div>

            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM WORKSPACE GRID (MATCHING BOTTOM 3-PANEL LAYOUT IN SCREENSHOT) */}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1.2fr 1fr", gap: "16px", minHeight: "420px" }}>
          
          {/* PANEL 1: LEFT SIDE METRIC STACK */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Lifetime Value / Contract Value Card (Dark Green) */}
            <div style={{ background: "#064e3b", borderRadius: "12px", padding: "18px", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#a7f3d0", fontWeight: "700", textTransform: "uppercase" }}>Lifetime Value</div>
                  <strong style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "4px", display: "block" }}>10.45 <span style={{ fontSize: "1.1rem" }}>Lacs</span></strong>
                </div>
                <span style={{ fontSize: "2.2rem" }}>💰</span>
              </div>
            </div>

            {/* Last Visit Card (Blue Card) */}
            <div style={{ background: "#1e3a8a", borderRadius: "12px", padding: "18px", color: "#ffffff", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#93c5fd", fontWeight: "700" }}>Last Site Visit</div>
                  <strong style={{ fontSize: "1.2rem", fontWeight: "900" }}>2 Days Ago</strong>
                </div>
                <span style={{ fontSize: "1.8rem" }}>🗺️</span>
              </div>

              <div style={{ borderTop: "1px solid #3b82f640", paddingTop: "10px" }}>
                <div style={{ fontSize: "0.72rem", color: "#bfdbfe" }}>Last Audit Check-in</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800" }}>Rs 392000</div>
                <div style={{ fontSize: "0.68rem", color: "#93c5fd", marginTop: "2px" }}>2 ITEMS | CREDIT CARD</div>
              </div>
            </div>

          </div>

          {/* PANEL 2: CENTER ENGAGEMENT BLUEPRINT PANEL */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            
            {/* Preferred Items / Shared Catalogue Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button style={{ background: "#1d4ed8", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "800" }}>
                Preferred Items
              </button>
              <button style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "700" }}>
                Shared Catalogue
              </button>
            </div>

            {/* Engagement Graphic & Blueprint Showcase */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "10px", padding: "20px", border: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: "4rem", marginBottom: "8px" }}>💍</div>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>GOLD & JEWELRY RETAIL AUDIT BLUEPRINT</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#64748b", textAlign: "center" }}>
                POS Cash Counter Reconciliation • Gold Vault Stock Audit • Sales Staff Upselling SOP
              </p>
            </div>

            {/* Bottom Spec Bar */}
            <div style={{ background: "#0f172a", color: "#ffffff", borderRadius: "8px", padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", textAlign: "center", marginTop: "14px" }}>
              <div>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>Metal:</span>
                <strong style={{ fontSize: "0.88rem" }}>GOLD</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>Purity:</span>
                <strong style={{ fontSize: "0.88rem" }}>22K</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>Stone:</span>
                <strong style={{ fontSize: "0.88rem" }}>Diamond</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>Design:</span>
                <strong style={{ fontSize: "0.88rem" }}>-</strong>
              </div>
            </div>

          </div>

          {/* PANEL 3: RIGHT INTERACTION CANVAS & SPACE TIMELINE BOARD */}
          <div style={{ background: "#0a0f1d", border: "1px solid #1e293b", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", color: "#ffffff", position: "relative", overflow: "hidden" }}>
            
            {/* Customer Interaction / Company Interaction Tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{ background: "#0f172a", color: "#ffffff", border: "1px solid #334155", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "800" }}>
                  Customer Interaction
                </button>
                <button style={{ background: "transparent", color: "#94a3b8", border: "none", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700" }}>
                  Company Interaction
                </button>
              </div>
              <span style={{ color: "#64748b", cursor: "pointer", fontSize: "0.9rem" }}>⛶</span>
            </div>

            {/* Starry Space Timeline Canvas (Exact Replica of Rocket Callouts in screenshot) */}
            <div style={{ flex: 1, background: "radial-gradient(ellipse at bottom, #1e1b4b 0%, #090d16 100%)", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-around", border: "1px solid #1e1b4b", position: "relative" }}>
              
              {/* Rocket Timeline Callout Bubble 1 */}
              <div style={{ background: "#2563eb", color: "#ffffff", padding: "12px 20px", borderRadius: "24px", fontSize: "0.82rem", fontWeight: "800", textAlign: "center", boxShadow: "0 4px 14px rgba(37,99,235,0.4)", position: "relative" }}>
                🚀 New Star Joined Us!
                <div style={{ fontSize: "0.72rem", opacity: 0.8, fontWeight: "600" }}>Phase 4 Process Design • 30 Jul 2026</div>
              </div>

              {/* Dotted Vertical Connector Line */}
              <div style={{ width: "2px", height: "30px", borderLeft: "2px dashed #60a5fa" }} />

              {/* Rocket Timeline Callout Bubble 2 */}
              <div style={{ background: "#2563eb", color: "#ffffff", padding: "12px 20px", borderRadius: "24px", fontSize: "0.82rem", fontWeight: "800", textAlign: "center", boxShadow: "0 4px 14px rgba(37,99,235,0.4)", position: "relative" }}>
                🚀 New Star Joined Us!
                <div style={{ fontSize: "0.72rem", opacity: 0.8, fontWeight: "600" }}>POS Inventory Audit • 25 Jul 2026</div>
              </div>

              {/* Earth / Space Canvas Footer Decor */}
              <div style={{ position: "absolute", bottom: "-40px", width: "200px", height: "80px", borderRadius: "50%", background: "#3b82f630", filter: "blur(20px)" }} />
            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="projects-view-container" style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>
            Projects & Client Hub
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
            Track client engagements, project discussions, assigned teams, and linked expense claims
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "#4c478a",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "9px 18px",
            fontWeight: "600",
            fontSize: "0.84rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(76, 71, 138, 0.15)"
          }}
        >
          <span>＋</span> Register New Project
        </button>
      </div>

      {/* Summary KPI Grid (3 Columns - Sourcing Allocation Removed) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "4px", border: "1px solid #e2e8f0", borderLeft: "4px solid #4c478a" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            TOTAL PROJECTS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
            {projects.length} <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: "500" }}>({activeCount} Active)</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "4px", border: "1px solid #e2e8f0", borderLeft: "4px solid #7c3aed" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            PROJECT DISCUSSIONS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
            {totalDiscussions} <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "400" }}>notes logged</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "4px", border: "1px solid #e2e8f0", borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            ASSIGNED CONSULTANTS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
            {consultants.length} <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "400" }}>active leads</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "4px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["All", "Active", "Completed", "On Hold"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "5px 14px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: statusFilter === st ? "600" : "500",
                cursor: "pointer",
                border: statusFilter === st ? "1px solid #4c478a" : "1px solid #cbd5e1",
                background: statusFilter === st ? "#f5f3ff" : "#ffffff",
                color: statusFilter === st ? "#4c478a" : "#475569"
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search project, code or client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: "7px 12px 7px 32px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              width: "280px",
              fontSize: "0.82rem",
              outline: "none",
              background: "#ffffff"
            }}
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "9px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      {/* Minimalistic Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {filteredProjects.map(proj => {
          const projExpenses = expenses.filter(e => e.projectId === proj.id || e.projectName === proj.name);

          return (
            <div
              key={proj.id}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "4px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px",
                transition: "all 0.15s ease",
                cursor: "pointer"
              }}
              onClick={() => { setSelectedProject(proj); setActiveProjectTab("overview"); }}
            >
              <div>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        letterSpacing: "0.05em",
                        color: "#4c478a",
                        background: "#f5f3ff",
                        border: "1px solid #ddd6fe",
                        padding: "2px 8px",
                        borderRadius: "3px"
                      }}
                    >
                      {proj.code}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#0f172a", margin: "8px 0 4px 0" }}>
                      {proj.name}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, fontWeight: "500" }}>
                      Client: <strong style={{ color: "#334155" }}>{proj.client}</strong>
                    </p>
                  </div>

                  {/* Clean Status Badge */}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "500",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      background: proj.status === "Active" ? "#f0fdf4" : proj.status === "On Hold" ? "#fff7ed" : "#f0f9ff",
                      border: proj.status === "Active" ? "1px solid #bbf7d0" : proj.status === "On Hold" ? "1px solid #fed7aa" : "1px solid #bae6fd",
                      color: proj.status === "Active" ? "#16a34a" : proj.status === "On Hold" ? "#ea580c" : "#0284c7"
                    }}
                  >
                    ● {proj.status}
                  </span>
                </div>

                {/* Details Pills */}
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <span>📍 {proj.location || "On-site"}</span>
                  <span>💬 {proj.discussions?.length || 0} Discussions</span>
                  <span>💸 {projExpenses.length} Expense Claims</span>
                </div>
              </div>

              {/* Minimalistic Footer Row (Sourcing Budget Removed) */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(proj);
                    setActiveProjectTab("overview");
                  }}
                  style={{
                    background: "#4c478a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "7px 16px",
                    fontWeight: "600",
                    fontSize: "0.78rem",
                    cursor: "pointer"
                  }}
                >
                  Open Project Hub ➔
                </button>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="glass-card" style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", color: "#64748b" }}>
            No projects found matching your query. Click "+ Register New Project" to add one!
          </div>
        )}
      </div>

      {/* ── CREATE NEW PROJECT SLIDE-OVER DRAWER ── */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 9600,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "flex-end"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff",
              width: "520px",
              maxWidth: "100vw",
              height: "100vh",
              overflowY: "auto",
              boxShadow: "-10px 0 35px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={logoImg} alt="Acme Logo" style={{ height: "34px", objectFit: "contain" }} />
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#111827" }}>Create project</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#9ca3af", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProjectSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flexGrow: 1 }}>
              
              {/* Project Name */}
              <div>
                <input
                  type="text"
                  placeholder="Enter project name (e.g. Heerabhai Jewellers Store Expansion)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "0.95rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              {/* POC */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  POC
                </label>
                <input
                  type="text"
                  placeholder="Enter POC name (e.g. Heerabhai Kothari)"
                  value={pocName}
                  onChange={e => setPocName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "0.9rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  required
                />
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px", display: "block" }}>
                  This cannot be changed later.
                </span>
              </div>

              {/* POC Contact Details (Numbers only up to 10 digits) */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  POC Contact Details
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit mobile number"
                  value={pocContact}
                  maxLength={10}
                  onChange={e => setPocContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "0.9rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Two Column: Project code & Project status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    Project code <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>ⓘ</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HBL-BD-01"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                    Project status
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff"
                    }}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Optional Description */}
              <div>
                {!showDescription ? (
                  <button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    + Project description (optional)
                  </button>
                ) : (
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                      Project description
                    </label>
                    <textarea
                      placeholder="Add description regarding scope, deliverables, or objectives..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows="3"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.88rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        outline: "none",
                        resize: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Section: Duration */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>
                  Duration
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                      Project start date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.88rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                      Project end date (optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "0.88rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
                  }}
                >
                  Create
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SCHEDULE EVENT / CALL / TRAINING ── */}
      {showEventModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                Schedule Project Event / Call / Training
              </h3>
              <button onClick={() => setShowEventModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleCreateEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Event / Task Category
                </label>
                <select
                  value={evtType}
                  onChange={e => setEvtType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="Call Scheduling">📞 Call Scheduling (Phone / Video Discussion)</option>
                  <option value="Offline Visit Scheduling">🏢 Offline Visit Scheduling (On-Site Store Visit)</option>
                  <option value="Training Session Scheduling">🎓 Training Session Scheduling (Sales Staff Coaching)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Event Title / Objective *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q3 Store Performance Review Call"
                  value={evtTitle}
                  onChange={e => setEvtTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={evtDate}
                    onChange={e => setEvtDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={evtTime}
                    onChange={e => setEvtTime(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Assigned Consultant / Lead
                </label>
                <select
                  value={evtConsultant}
                  onChange={e => setEvtConsultant(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="Darla Manikanta">Darla Manikanta</option>
                  <option value="Shikhar Jain">Shikhar Jain</option>
                  <option value="Hemanth Kumar Jain">Hemanth Kumar Jain</option>
                  <option value="Sophia Laurent">Sophia Laurent</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Agenda & Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Details of what will be discussed or executed..."
                  value={evtNotes}
                  onChange={e => setEvtNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD OFFLINE CLIENT VISIT (MULTI-CONSULTANT SUPPORT) ── */}
      {showVisitModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                Record Offline Client Visit & Timeline Log
              </h3>
              <button onClick={() => setShowVisitModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleRecordVisitSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Visit Title / Primary Objective *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visit #3: Stock Vault Audit & Staff Coaching"
                  value={vTitle}
                  onChange={e => setVTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={vStart}
                    onChange={e => setVStart(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={vEnd}
                    onChange={e => setVEnd(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              {/* Multi-Consultant Selection (Sometimes 2 people visit at a time!) */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Visiting Team (Select all consultants who visited together) *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {["Darla Manikanta", "Shikhar Jain", "Hemanth Kumar Jain", "Sophia Laurent"].map(name => {
                    const isChecked = vConsultants.includes(name);
                    return (
                      <label key={name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setVConsultants(prev => [...prev, name]);
                            } else {
                              setVConsultants(prev => prev.filter(n => n !== name));
                            }
                          }}
                          style={{ accentColor: "#059669" }}
                        />
                        <span>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Key Understandings & Observations (What was discovered/observed)
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g., Discovered 4.2% discrepancy in gold ornament weight; sales team lacks bridal upselling techniques."
                  value={vUnderstandings}
                  onChange={e => setVUnderstandings(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Work Done / Deliverables Completed in Visit
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g., Audited 1,250 ornament tags, conducted 4-hour sales floor coaching session, implemented daily ledger logbook."
                  value={vWorkDone}
                  onChange={e => setVWorkDone(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", resize: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Follow-Up Action Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule follow-up call on 25th July to review diamond cross-sell ratio."
                  value={vFollowUp}
                  onChange={e => setVFollowUp(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", background: "#059669", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Record Client Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
