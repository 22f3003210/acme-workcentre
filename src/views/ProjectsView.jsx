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

  // ── SEPARATE PAGE VIEW FOR SELECTED PROJECT HUB (STRUCTURED WORKSPACE) ──
  if (selectedProject) {
    const effectiveProject = getEffectiveProject(selectedProject);
    const linkedExps = expenses.filter(e => e.projectId === effectiveProject.id || e.projectName === effectiveProject.name);
    
    return (
      <div className="individual-project-view" style={{ padding: "16px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "20px", fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a", background: "#f8fafc" }}>
        
        {/* ------------------------------------------------------------- */}
        {/* 1. TOP NAVIGATION HEADER                                      */}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "14px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSelectedProject(null)}
              style={{ background: "#f1f5f9", border: "none", width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem", color: "#334155", fontWeight: "700" }}
              title="Back to All Projects"
            >
              ‹
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", color: "#0f172a" }}>
                  {effectiveProject.client || "Client Engagement"}
                </h2>
                <span style={{ color: "#cbd5e1" }}>|</span>
                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#2563eb" }}>
                  {effectiveProject.name}
                </span>
                <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "2px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "800" }}>
                  {effectiveProject.code || "PROJ-TEST-01"}
                </span>
                <span style={{
                  background: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#dcfce7" : "#fff7ed",
                  color: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#16a34a" : "#d97706",
                  border: `1px solid ${(effectiveProject.status || "Active").toLowerCase() === "active" ? "#bbf7d0" : "#fed7aa"}`,
                  padding: "2px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "800"
                }}>
                  ● {effectiveProject.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => alert("Editing Project Details...")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "#334155",
                cursor: "pointer"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>

            <button
              onClick={() => setSelectedProject(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: "800",
                color: "#0f172a",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. STRUCTURED EXECUTIVE METRIC CARDS STRIP                    */}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          
          {/* Card 1: Client Overview */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>POC & CONTACT</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>{effectiveProject.pocName || effectiveProject.client}</div>
              <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {effectiveProject.pocContact || "+91-9849012345"}
              </div>
            </div>
          </div>

          {/* Card 2: Tasks Summary */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#f0fdf4", color: "#16a34a", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>TASKS & PLANNER</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>14 Tasks <span style={{ fontSize: "0.75rem", color: "#16a34a" }}>(8 Done)</span></div>
              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                2 Urgent Overdue
              </div>
            </div>
          </div>

          {/* Card 3: Audit Phase */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#fff7ed", color: "#ea580c", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>AUDIT STAGE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#ea580c" }}>Phase 4: Process Design</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Progress: 65% Completed</div>
            </div>
          </div>

          {/* Card 4: Expenses & Budget */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#f3e8ff", color: "#9333ea", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>LINKED EXPENSES</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>₹{linkedExps.reduce((s, e) => s + e.amount, 0).toLocaleString() || "45,000"}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Budget: ₹50.00 Lacs</div>
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. STRUCTURED TAB NAVIGATION STRIP                             */}
        {/* ------------------------------------------------------------- */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px", display: "flex", gap: "6px", overflowX: "auto", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          {[
            { id: "business", label: "Business Details" },
            { id: "audit", label: "Audit Report" },
            { id: "plan", label: "Project Plan" },
            { id: "tasks", label: `Tasks & Planner (${effectiveProject.scheduledEvents?.length || 14})` },
            { id: "visits", label: `Visit & Review History (${effectiveProject.clientVisits?.length || 5})` },
            { id: "documents", label: "Documents & Deliverables" },
            { id: "team", label: "Assigned Team" },
            { id: "discussions", label: "Discussions & Logs" },
            { id: "expenses", label: `Linked Expenses (${linkedExps.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveProjectTab(tab.id)}
              style={{
                background: activeProjectTab === tab.id ? "#2563eb" : "transparent",
                color: activeProjectTab === tab.id ? "#ffffff" : "#475569",
                border: "none",
                borderRadius: "8px",
                padding: "9px 16px",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. MAIN WORKSPACE AREA (LEFT DETAILED CONTENT + RIGHT ACTIONS) */}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
          
          {/* LEFT COLUMN: ACTIVE TAB CONTENT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* TAB 1: BUSINESS DETAILS */}
            {activeProjectTab === "business" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                  Business Profile & Engagement Scope
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>CLIENT POC</span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                      {effectiveProject.pocName || effectiveProject.client}
                    </p>
                    <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {effectiveProject.pocContact || "+91-9849012345"}
                    </span>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>START DATE</span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                      {effectiveProject.startDate || "27 Jul 2026"}
                    </p>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>PROJECT CODE</span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#2563eb" }}>
                      {effectiveProject.code || "PROJ-TEST-01"}
                    </p>
                  </div>
                </div>

                <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", padding: "20px", borderRadius: "12px" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem", fontWeight: "800", color: "#1e3a8a" }}>
                    Engagement Purpose & Business Objectives
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#1e40af", lineHeight: "1.6" }}>
                    {effectiveProject.engagementPurpose || effectiveProject.description || "Client requested consulting advisory for inventory audit, staff upselling, POS ledger reconciliation, and retail growth."}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT REPORT */}
            {activeProjectTab === "audit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 8-Phase Stepper */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                      8-PHASE IMPLEMENTATION AUDIT PROGRESS
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "800" }}>Current: Phase 4 (Process Design)</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    {[
                      { num: 1, title: "Vision Alignment", status: "Completed", color: "#16a34a", bg: "#f0fdf4" },
                      { num: 2, title: "Business Audit", status: "Completed", color: "#16a34a", bg: "#f0fdf4" },
                      { num: 3, title: "Gap Analysis", status: "Completed", color: "#16a34a", bg: "#f0fdf4" },
                      { num: 4, title: "Process Design", status: "In Progress (65%)", color: "#2563eb", bg: "#eff6ff" },
                      { num: 5, title: "Implementation", status: "Upcoming", color: "#d97706", bg: "#fff7ed" },
                      { num: 6, title: "KPI Monitoring", status: "Pending", color: "#64748b", bg: "#f8fafc" },
                      { num: 7, title: "Governance", status: "Pending", color: "#64748b", bg: "#f8fafc" },
                      { num: 8, title: "Advisory Review", status: "Pending", color: "#64748b", bg: "#f8fafc" }
                    ].map(p => (
                      <div key={p.num} style={{ background: p.bg, border: `1px solid ${p.color}40`, borderRadius: "10px", padding: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: "800", color: p.color }}>PHASE {p.num}</span>
                          {p.status.includes("Completed") && <span style={{ color: "#16a34a", fontWeight: "800" }}>✓</span>}
                        </div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a", margin: "6px 0 2px 0" }}>{p.title}</div>
                        <div style={{ fontSize: "0.72rem", color: p.color, fontWeight: "700" }}>{p.status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Planning Checklists */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>Operational & Strategic Planning Checklists</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {[
                      { domain: "Business Strategy & Retail Advisory", color: "#2563eb", bg: "#eff6ff" },
                      { domain: "HR Operations & Consultant Sourcing", color: "#059669", bg: "#ecfdf5" },
                      { domain: "IT Systems & POS Inventory Control", color: "#7c3aed", bg: "#f3e8ff" },
                      { domain: "Legal Compliance & Internal Audits", color: "#d97706", bg: "#fffbeb" }
                    ].map((d, dIdx) => (
                      <div key={dIdx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ background: d.bg, color: d.color, padding: "6px 12px", borderRadius: "8px", fontWeight: "700", fontSize: "0.82rem", marginBottom: "12px", display: "inline-block" }}>
                          {d.domain}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(effectiveProject.checklists || [
                            { task: "Initial Site Audit & Layout Review", done: true },
                            { task: "POS & Billing Integration Verification", done: false },
                            { task: "Staff Sales Coaching Workshop", done: false }
                          ]).map((chk, iIdx) => (
                            <label key={iIdx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={chk.done} onChange={() => toggleProjectChecklistItem(effectiveProject.id, dIdx, iIdx)} style={{ cursor: "pointer" }} />
                              <span style={{ textDecoration: chk.done ? "line-through" : "none", opacity: chk.done ? 0.6 : 1 }}>{chk.task}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PROJECT PLAN */}
            {activeProjectTab === "plan" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>Project Health & Implementation Roadmap</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                      <span>Task Completion Velocity</span>
                      <span style={{ color: "#16a34a", fontWeight: "800" }}>87%</span>
                    </div>
                    <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ width: "87%", height: "100%", background: "#16a34a" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                      <span>Consultant Utilization</span>
                      <span style={{ color: "#2563eb", fontWeight: "800" }}>84%</span>
                    </div>
                    <div style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ width: "84%", height: "100%", background: "#2563eb" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TASKS & EVENT PLANNER */}
            {activeProjectTab === "tasks" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>
                    Scheduled Tasks & Event Planner
                  </h3>
                  <button onClick={() => setShowEventModal(true)} style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                    + Add New Task
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  14 total tasks scheduled for this engagement. 8 completed, 2 urgent overdue.
                </p>
              </div>
            )}

            {/* TAB 5: VISIT & REVIEW HISTORY */}
            {activeProjectTab === "visits" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Client Site Visits & Field Review History
                  </h3>
                  <button onClick={() => setShowVisitModal(true)} style={{ background: "#059669", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                    + Record Field Visit
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  5 field visits completed by Darla Manikanta and Shikhar Jain.
                </p>
              </div>
            )}

            {/* TAB 6: DOCUMENTS & DELIVERABLES */}
            {activeProjectTab === "documents" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                  Documents & Deliverables Repository
                </h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  SOP PDFs, Audit Checklists, and Client Contract files.
                </p>
              </div>
            )}

            {/* TAB 7: ASSIGNED TEAM */}
            {activeProjectTab === "team" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Assigned Business Consultants & Recruiting Team
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {[
                    { name: "Darla Manikanta", role: "Lead Systems & Field Auditor" },
                    { name: "Shikhar Jain", role: "Retail Sourcing Specialist" },
                    { name: "Jyoshna Manuka", role: "POS Inventory Consultant" },
                    { name: "Hemanth Kumar Jain", role: "Principal Advisor" }
                  ].map((m, i) => (
                    <div key={i} style={{ padding: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <strong style={{ display: "block", color: "#0f172a" }}>{m.name}</strong>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: DISCUSSIONS & ACTIVITY LOGS */}
            {activeProjectTab === "discussions" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Discussions & Team Activity Logs
                </h3>
                <form onSubmit={handlePostDiscussion} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <textarea
                    rows="3"
                    placeholder="Post a client meeting update or discussion note..."
                    value={discText}
                    onChange={e => setDiscText(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                  <button type="submit" style={{ alignSelf: "flex-end", background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 20px", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
                    Post Note
                  </button>
                </form>
              </div>
            )}

            {/* TAB 9: LINKED EXPENSES */}
            {activeProjectTab === "expenses" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Linked Expenses Billed to Project
                </h3>
                {linkedExps.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>No expenses billed under this project yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "10px" }}>Date</th>
                        <th style={{ padding: "10px" }}>Category</th>
                        <th style={{ padding: "10px" }}>Description</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                        <th style={{ padding: "10px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedExps.map(exp => (
                        <tr key={exp.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px", fontWeight: "700" }}>{exp.date}</td>
                          <td style={{ padding: "10px" }}>{exp.category}</td>
                          <td style={{ padding: "10px" }}>{exp.description}</td>
                          <td style={{ padding: "10px", textAlign: "right", fontWeight: "800" }}>₹{exp.amount.toLocaleString()}</td>
                          <td style={{ padding: "10px" }}>
                            <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "0.75rem" }}>
                              ● {exp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: QUICK ACTIONS SHORTCUTS & RISKS PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Quick Actions Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>QUICK ACTIONS</h3>
                </div>
                <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "12px", fontWeight: "800" }}>Shortcuts</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { 
                    label: "+ Add Task", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>, 
                    action: () => setShowEventModal(true), bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" 
                  },
                  { 
                    label: "+ Schedule Visit", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>, 
                    action: () => setShowVisitModal(true), bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" 
                  },
                  { 
                    label: "+ Upload Document", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, 
                    action: () => setActiveProjectTab("documents"), bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" 
                  },
                  { 
                    label: "+ Create Meeting", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>, 
                    action: () => setShowEventModal(true), bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" 
                  },
                  { 
                    label: "+ Add Risk", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, 
                    action: () => alert("Opening Add Risk dialog..."), bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" 
                  },
                  { 
                    label: "+ Generate Report", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, 
                    action: () => alert("Generating Project Report..."), bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" 
                  },
                  { 
                    label: "+ Raise Approval", 
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>, 
                    action: () => alert("Raising Approval Request..."), bg: "#faf5ff", color: "#9333ea", border: "#e9d5ff" 
                  }
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justify: "space-between",
                      padding: "11px 14px",
                      background: btn.bg,
                      border: `1px solid ${btn.border}`,
                      borderRadius: "10px",
                      color: btn.color,
                      fontWeight: "800",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {btn.icon}
                      {btn.label}
                    </span>
                    <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Risks Widget */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>RISKS & APPROVALS</h4>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ padding: "10px 12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#b91c1c" }}>Inventory Verification Delay</div>
                  <div style={{ fontSize: "0.72rem", color: "#7f1d1d" }}>Owner: Darla • High Risk</div>
                </div>
              </div>
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
