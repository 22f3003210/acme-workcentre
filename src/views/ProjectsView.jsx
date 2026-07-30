import React, { useState } from "react";
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

  // ── SEPARATE PAGE VIEW FOR SELECTED PROJECT HUB (MATCHING USER ASCII WIREFRAME) ──
  if (selectedProject) {
    const effectiveProject = getEffectiveProject(selectedProject);
    const linkedExps = expenses.filter(e => e.projectId === effectiveProject.id || e.projectName === effectiveProject.name);
    
    return (
      <div className="individual-project-view" style={{ padding: "8px 0", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "20px", fontFamily: "Inter, sans-serif", color: "#0f172a" }}>
        
        {/* ------------------------------------------------------------- */}
        {/* TOP BAR: BACK BUTTON & STATUS BADGE                           */}
        {/* ------------------------------------------------------------- */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => setSelectedProject(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "0.88rem",
              fontWeight: "700",
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
            }}
          >
            ← Back to All Projects
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700" }}>Project Code:</span>
            <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 12px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "800" }}>
              {effectiveProject.code || "PRJ-101"}
            </span>
            <span style={{
              background: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#dcfce7" : "#fff7ed",
              color: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#16a34a" : "#d97706",
              border: `1px solid ${(effectiveProject.status || "Active").toLowerCase() === "active" ? "#bbf7d0" : "#fed7aa"}`,
              padding: "4px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "800"
            }}>
              ● {effectiveProject.status || "Active"}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. CLIENT HEADER + PROGRESS + HEALTH + KPIS CARD              */}
        {/* ------------------------------------------------------------- */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Header Top Info Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.4px" }}>
                  {effectiveProject.client || "Client Engagement"}
                </h1>
                <span style={{ color: "#94a3b8", fontSize: "1.4rem" }}>•</span>
                <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "700", color: "#2563eb" }}>
                  {effectiveProject.name}
                </h2>
              </div>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.88rem", color: "#64748b" }}>
                POC: <strong style={{ color: "#334155" }}>{effectiveProject.pocName || effectiveProject.client}</strong> • Phone: <strong style={{ color: "#334155" }}>{effectiveProject.pocContact || effectiveProject.clientContact || "+91-9849012345"}</strong> • Start: <strong style={{ color: "#334155" }}>{effectiveProject.startDate || "27 Jul 2026"}</strong>
              </p>
            </div>

            {/* Health Score Badge & Overall Progress */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 18px", borderRadius: "12px", textAlign: "center" }}>
                <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: "800", textTransform: "uppercase", display: "block" }}>HEALTH SCORE</span>
                <strong style={{ fontSize: "1.3rem", color: "#15803d", fontWeight: "900" }}>85% Healthy 🟢</strong>
              </div>

              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 18px", borderRadius: "12px", minWidth: "160px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#2563eb", fontWeight: "800", marginBottom: "4px" }}>
                  <span>OVERALL PROGRESS</span>
                  <span>{effectiveProject.progress || 72}%</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#dbeafe", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${effectiveProject.progress || 72}%`, height: "100%", background: "#2563eb", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          </div>

          {/* 4 Primary KPI Metric Cards Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#eff6ff", color: "#2563eb", width: "38px", height: "38px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1rem" }}>📋</div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>Total Tasks</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>14 Tasks <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>(8 Done)</span></div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#fef2f2", color: "#dc2626", width: "38px", height: "38px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1rem" }}>⚠️</div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>Overdue Tasks</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#dc2626" }}>2 Urgent <span style={{ fontSize: "0.7rem", color: "#ea580c" }}>(Action Req.)</span></div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#fff7ed", color: "#ea580c", width: "38px", height: "38px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1rem" }}>₹</div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>Linked Expenses</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>₹{linkedExps.reduce((s, e) => s + e.amount, 0).toLocaleString() || "45,000"}</div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#f3e8ff", color: "#9333ea", width: "38px", height: "38px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1rem" }}>🚗</div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>Client Site Visits</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>{effectiveProject.clientVisits?.length || 5} Completed</div>
              </div>
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. PRIMARY MAIN NAVIGATION TAB BAR                            */}
        {/* Overview | Tasks | Timeline | Audits | Deliverables | Meetings | Reports */}
        {/* ------------------------------------------------------------- */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 12px", display: "flex", gap: "8px", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Overview" },
            { id: "tasks", label: `Tasks (${effectiveProject.scheduledEvents?.length || 14})` },
            { id: "timeline", label: `Timeline (${effectiveProject.clientVisits?.length || 5})` },
            { id: "audits", label: "Audits & Checklists" },
            { id: "deliverables", label: "Deliverables" },
            { id: "meetings", label: "Meetings & Calls" },
            { id: "reports", label: "Reports" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveProjectTab(tab.id)}
              style={{
                background: activeProjectTab === tab.id ? "#2563eb" : "transparent",
                color: activeProjectTab === tab.id ? "#ffffff" : "#475569",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
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
        {/* 3. MAIN WORKSPACE GRID (OVERVIEW TAB WITH 2-COLUMN LAYOUT)     */}
        {/* ------------------------------------------------------------- */}
        {(activeProjectTab === "overview" || activeProjectTab === "audits" || activeProjectTab === "deliverables") && (
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "20px" }}>
            
            {/* ── LEFT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Panel 1: 8-Phase Progress */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    8-PHASE IMPLEMENTATION PROGRESS
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: "700" }}>
                    Current: Phase 4 (Process Design)
                  </span>
                </div>

                {/* 8-Phase Stepper / Progress Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
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
                    <div
                      key={p.num}
                      style={{
                        background: p.bg,
                        border: `1px solid ${p.color}40`,
                        borderRadius: "10px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "800", color: p.color }}>PHASE {p.num}</span>
                        {p.status.includes("Completed") && <span style={{ color: "#16a34a", fontSize: "0.85rem" }}>✓</span>}
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", lineHeight: "1.2" }}>{p.title}</div>
                      <div style={{ fontSize: "0.68rem", color: p.color, fontWeight: "700", marginTop: "4px" }}>{p.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: Upcoming Tasks */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    UPCOMING TASKS
                  </h3>
                  <button
                    onClick={() => setShowEventModal(true)}
                    style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                  >
                    + Add Task
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "8px 4px", fontWeight: "800" }}>Task Title</th>
                      <th style={{ padding: "8px 4px", fontWeight: "800" }}>Priority</th>
                      <th style={{ padding: "8px 4px", fontWeight: "800" }}>Assignee</th>
                      <th style={{ padding: "8px 4px", fontWeight: "800" }}>Due Date</th>
                      <th style={{ padding: "8px 4px", fontWeight: "800" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: "Store Inventory Verification Audit", priority: "High", assignee: "Darla Manikanta", date: "02 Aug", status: "In Progress" },
                      { title: "SOP Manual Sign-off with Management", priority: "High", assignee: "Shikhar Jain", date: "03 Aug", status: "Pending" },
                      { title: "Billing & Cash Counter Staff Workshop", priority: "Medium", assignee: "Jyoshna Manuka", date: "05 Aug", status: "Pending" },
                      { title: "Q3 Sales Sourcing Target Review", priority: "Low", assignee: "Hemanth Kumar", date: "07 Aug", status: "Pending" }
                    ].map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 4px", fontWeight: "800", color: "#0f172a" }}>{t.title}</td>
                        <td style={{ padding: "10px 4px" }}>
                          <span style={{
                            background: t.priority === "High" ? "#fef2f2" : t.priority === "Medium" ? "#fff7ed" : "#f0fdf4",
                            color: t.priority === "High" ? "#dc2626" : t.priority === "Medium" ? "#ea580c" : "#16a34a",
                            padding: "2px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "800"
                          }}>
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: "10px 4px", color: "#334155", fontWeight: "600" }}>{t.assignee}</td>
                        <td style={{ padding: "10px 4px", color: "#64748b", fontWeight: "700" }}>{t.date}</td>
                        <td style={{ padding: "10px 4px" }}>
                          <span style={{
                            background: t.status === "In Progress" ? "#eff6ff" : "#fff7ed",
                            color: t.status === "In Progress" ? "#2563eb" : "#d97706",
                            padding: "2px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "800"
                          }}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Panel 3: Recent Activities */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: "0 0 14px 0" }}>
                  RECENT ACTIVITIES
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { text: "Darla Manikanta completed site check-in at main showroom store", time: "1 hour ago", icon: "📍", color: "#2563eb" },
                    { text: "Shikhar Jain uploaded Q2 Inventory Audit PDF Document", time: "3 hours ago", icon: "📄", color: "#16a34a" },
                    { text: "Jyoshna Manuka updated Phase 4 Process Design checklist progress to 65%", time: "Yesterday", icon: "📊", color: "#9333ea" },
                    { text: "Travel Expense claim of ₹1,850 approved by Accounts Team", time: "2 days ago", icon: "₹", color: "#ea580c" }
                  ].map((act, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                      <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${act.color}15`, color: act.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                        {act.icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#0f172a" }}>{act.text}</div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Panel 0: Quick Actions */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    ⚡ QUICK ACTIONS
                  </h3>
                  <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "6px", fontWeight: "800" }}>
                    Fast Shortcuts
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {[
                    { label: "+ Add Task", icon: "📋", action: () => setShowEventModal(true), bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
                    { label: "+ Schedule Visit", icon: "🚗", action: () => setShowVisitModal(true), bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
                    { label: "+ Upload Document", icon: "📄", action: () => setActiveProjectTab("documents"), bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
                    { label: "+ Create Meeting", icon: "📅", action: () => setShowEventModal(true), bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" },
                    { label: "+ Add Risk", icon: "⚠️", action: () => alert("Opening Add Risk dialog..."), bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
                    { label: "+ Generate Report", icon: "📊", action: () => setActiveProjectTab("reports"), bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
                    { label: "+ Raise Approval", icon: "✍️", action: () => alert("Raising Approval Request..."), bg: "#faf5ff", color: "#9333ea", border: "#e9d5ff" }
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.action}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justify: "space-between",
                        padding: "10px 14px",
                        background: btn.bg,
                        border: `1px solid ${btn.border}`,
                        borderRadius: "10px",
                        color: btn.color,
                        fontWeight: "800",
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1rem" }}>{btn.icon}</span>
                        {btn.label}
                      </span>
                      <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel 1: Project Health / KPIs */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: "0 0 14px 0" }}>
                  PROJECT HEALTH / KPIS
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      <span>Task Completion Velocity</span>
                      <span style={{ color: "#16a34a", fontWeight: "800" }}>87%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "87%", height: "100%", background: "#16a34a" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      <span>Consultant Utilization</span>
                      <span style={{ color: "#2563eb", fontWeight: "800" }}>84%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "84%", height: "100%", background: "#2563eb" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      <span>Milestone Delivery</span>
                      <span style={{ color: "#9333ea", fontWeight: "800" }}>92%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "92%", height: "100%", background: "#9333ea" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: Upcoming Visits */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    UPCOMING VISITS
                  </h3>
                  <button
                    onClick={() => setShowVisitModal(true)}
                    style={{ background: "#059669", color: "#ffffff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                  >
                    + Record Visit
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { date: "02 Aug", title: "Showroom Audit Visit", location: "Main Store", consultant: "Darla Manikanta" },
                    { date: "05 Aug", title: "Inventory Verification", location: "Warehouse", consultant: "Shikhar Jain" }
                  ].map((v, i) => (
                    <div key={i} style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "#ecfdf5", color: "#059669", padding: "8px 10px", borderRadius: "8px", textAlign: "center", minWidth: "60px" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: "800", display: "block" }}>AUG</span>
                        <strong style={{ fontSize: "1rem" }}>{v.date.split(" ")[0]}</strong>
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>{v.title}</strong>
                        <span style={{ fontSize: "0.74rem", color: "#64748b" }}>{v.location} • <strong style={{ color: "#334155" }}>{v.consultant}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3: Risks & Approvals */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: "0 0 14px 0" }}>
                  RISKS & APPROVALS
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ padding: "10px 12px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#dc2626" }}>⚠️ Inventory Verification Delay</div>
                      <div style={{ fontSize: "0.72rem", color: "#991b1b" }}>Owner: Darla • Severity: High</div>
                    </div>
                    <span style={{ background: "#dc2626", color: "#ffffff", fontSize: "0.68rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px" }}>Open</span>
                  </div>

                  <div style={{ padding: "10px 12px", background: "#fff7ed", borderRadius: "8px", border: "1px solid #fed7aa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#d97706" }}>📝 SOP Sign-off Pending</div>
                      <div style={{ fontSize: "0.72rem", color: "#9a3412" }}>Owner: Shikhar • Severity: Medium</div>
                    </div>
                    <span style={{ background: "#d97706", color: "#ffffff", fontSize: "0.68rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px" }}>In Review</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MEETINGS & CALLS TAB VIEW                                     */}
        {/* Date | Meeting Type | Participants | Minutes | Follow-up | Status */}
        {/* ------------------------------------------------------------- */}
        {activeProjectTab === "meetings" && (() => {
          const sampleMeetings = [
            {
              id: "m-1",
              date: "30 Jul 2026, 02:00 PM",
              type: "SOP Implementation & Sign-off Sync",
              participants: ["Sayed (Client POC)", "Shikhar Jain", "Darla Manikanta"],
              minutes: "Reviewed Phase 4 inventory verification audit findings. Client approved draft SOP for POS cash handling and gold vault reconciliation.",
              followUp: "Shikhar to send final signed SOP PDF by 02 Aug. Darla to initiate staff training.",
              status: "Completed",
              statusBg: "#dcfce7",
              statusColor: "#16a34a"
            },
            {
              id: "m-2",
              date: "03 Aug 2026, 11:00 AM",
              type: "Q3 Sales Target & Sourcing Review",
              participants: ["Sayed (Client POC)", "Hemanth Kumar", "Jyoshna Manuka"],
              minutes: "Agenda: Review retail staff sales commission structure, old gold exchange margins, and inventory barcode scanning implementation.",
              followUp: "Jyoshna to present POS barcode scanning workflow demo.",
              status: "Scheduled",
              statusBg: "#eff6ff",
              statusColor: "#2563eb"
            },
            {
              id: "m-3",
              date: "25 Jul 2026, 04:30 PM",
              type: "Initial Scope & Store Audit Alignment",
              participants: ["Sayed (Client POC)", "Darla Manikanta"],
              minutes: "Discussed main showroom layout changes, security camera coverage audit, and staff attendance log tracking.",
              followUp: "Darla completed initial site audit report and cataloged vault stock.",
              status: "Completed",
              statusBg: "#dcfce7",
              statusColor: "#16a34a"
            }
          ];

          return (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                    📞 Project Meetings & Minutes of Meeting (MoM)
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                    Track client review calls, meeting minutes, attendee lists, and follow-up action items.
                  </p>
                </div>

                <button
                  onClick={() => setShowEventModal(true)}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  + Schedule / Record Meeting
                </button>
              </div>

              {/* Meetings Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1", textAlign: "left", color: "#475569" }}>
                      <th style={{ padding: "12px", fontWeight: "800", minWidth: "140px" }}>📅 Date & Time</th>
                      <th style={{ padding: "12px", fontWeight: "800", minWidth: "180px" }}>🤝 Meeting Type</th>
                      <th style={{ padding: "12px", fontWeight: "800", minWidth: "200px" }}>👥 Participants</th>
                      <th style={{ padding: "12px", fontWeight: "800", minWidth: "260px" }}>📝 Minutes (MoM)</th>
                      <th style={{ padding: "12px", fontWeight: "800", minWidth: "220px" }}>📌 Follow-Up Actions</th>
                      <th style={{ padding: "12px", fontWeight: "800", minWidth: "110px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleMeetings.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>
                        <td style={{ padding: "14px 12px", fontWeight: "800", color: "#0f172a" }}>
                          {m.date}
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "6px", fontWeight: "800", display: "inline-block" }}>
                            {m.type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {m.participants.map((p, i) => (
                              <span key={i} style={{ background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "14px 12px", color: "#334155", lineHeight: "1.5" }}>
                          {m.minutes}
                        </td>
                        <td style={{ padding: "14px 12px", color: "#2563eb", fontWeight: "600", lineHeight: "1.5" }}>
                          {m.followUp}
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <span style={{ background: m.statusBg, color: m.statusColor, padding: "4px 10px", borderRadius: "6px", fontWeight: "800", fontSize: "0.75rem" }}>
                            ● {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

          {/* TAB 1: OVERVIEW */}
          {activeProjectTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div style={{ background: "var(--bg-tertiary)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Point of Contact (POC)</span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {selectedProject.pocName || selectedProject.client}
                  </p>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>📱 {selectedProject.pocContact || selectedProject.clientContact || "N/A"}</span>
                </div>

                <div style={{ background: "var(--bg-tertiary)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Start Date & Status</span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {selectedProject.startDate || "Active"} • <span style={{ color: "var(--color-success)" }}>{selectedProject.status || "Active"}</span>
                  </p>
                </div>

                <div style={{ background: "var(--bg-tertiary)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Project Code</span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "700", color: "#2563eb" }}>
                    {selectedProject.code}
                  </p>
                </div>
              </div>

              {selectedProject.description && (
                <div style={{ background: "var(--bg-tertiary)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Project Description & Scope</span>
                  <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                    {selectedProject.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEAM (Consultant Team & Hiring Team) */}
          {activeProjectTab === "team" && (() => {
            const consultantList = [
              {
                id: "c-1",
                name: "Darla Manikanta",
                title: "Systems Operator & Lead Auditor",
                department: "IT & SYSTEMS SUPPORT",
                phone: "+91-7569099549",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
                badge: "Lead Field Auditor"
              },
              {
                id: "c-2",
                name: "Shikhar Jain",
                title: "Retail Sourcing Specialist & Sales Trainer",
                department: "RETAIL CONSULTING",
                phone: "+91-9849012345",
                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120",
                badge: "Sales Floor Trainer"
              },
              {
                id: "c-3",
                name: "Jyoshna Manuka",
                title: "Systems & Inventory POS Consultant",
                department: "IT & SYSTEMS SUPPORT",
                phone: "+91-9876543210",
                avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120",
                badge: "POS Inventory Specialist"
              },
              {
                id: "c-4",
                name: "Hemanth Kumar Jain",
                title: "Managing Director & Principal Consultant",
                department: "EXECUTIVE ADVISORY",
                phone: "+91-9849012345",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
                badge: "Principal Advisor"
              }
            ];

            const hiringTeamList = [
              {
                id: "h-1",
                name: "Syed Shafi",
                title: "Head Recruiter & Sourcing Specialist",
                specialty: "Candidate Sourcing, Screening & Interview Calls",
                email: "shafi@acmeworkcentre.com",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
                badge: "Lead Recruiter"
              },
              {
                id: "h-2",
                name: "Sophia Laurent",
                title: "HR Director & Candidate Placement Lead",
                specialty: "Client Interview Coordination & Onboarding",
                email: "sophia@workcentre.com",
                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
                badge: "Placement Director"
              },
              {
                id: "h-3",
                name: "Praveen",
                title: "Telecalling & Social Sourcing Specialist",
                specialty: "Meta Ads & Naukri Resume Screening",
                email: "praveen@acmeworkcentre.com",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
                badge: "Telecaller Lead"
              },
              {
                id: "h-4",
                name: "Robert Chen",
                title: "Recruitment Operations Coordinator",
                specialty: "Outstation Candidate Client Visit Coordination",
                email: "robert@workcentre.com",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
                badge: "Recruitment Operations"
              }
            ];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                
                {/* SECTION 1: BUSINESS & FIELD CONSULTANTS */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: "700" }}>
                        💼 Assigned Business & Field Consultants
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        On-site store auditors, inventory strategists, and sales coaching advisors assigned to this client engagement.
                      </p>
                    </div>
                    <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: "0.75rem", fontWeight: "700", padding: "4px 12px", borderRadius: "20px", border: "1px solid #bfdbfe" }}>
                      4 Consultants Assigned
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {consultantList.map(c => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <img src={c.avatar} alt={c.name} style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <strong style={{ fontSize: "0.95rem", display: "block", color: "#0f172a" }}>{c.name}</strong>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{c.title}</span>
                            <div style={{ fontSize: "0.76rem", color: "#2563eb", marginTop: "2px" }}>📱 {c.phone}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "700", background: "#ecfdf5", padding: "4px 10px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                          ● {c.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: DEDICATED RECRUITING & HIRING TEAM */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: "700" }}>
                        🎯 Dedicated Recruiting & Hiring Team (Free Client Hiring Desk)
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        Sourcing, telecalling, candidate screening, and interview scheduling team assigned to fulfill client staffing requirements.
                      </p>
                    </div>
                    <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: "0.75rem", fontWeight: "700", padding: "4px 12px", borderRadius: "20px", border: "1px solid #bbf7d0" }}>
                      Free Client Hiring Service Included
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {hiringTeamList.map(h => (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <img src={h.avatar} alt={h.name} style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <strong style={{ fontSize: "0.95rem", display: "block", color: "#0f172a" }}>{h.name}</strong>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{h.title}</span>
                            <div style={{ fontSize: "0.76rem", color: "#059669", marginTop: "2px" }}>✉ {h.email}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: "700", background: "#f3e8ff", padding: "4px 10px", borderRadius: "6px", border: "1px solid #ddd6fe" }}>
                          ● {h.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB 3: EXPENSES */}
          {activeProjectTab === "expenses" && (
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Expense Claims Billed to Project</h3>
              {linkedExps.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>No expenses billed under this project yet.</p>
              ) : (
                <table className="luxury-table" style={{ fontSize: "0.82rem" }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedExps.map(e => (
                      <tr key={e.id}>
                        <td>{e.date}</td>
                        <td>{e.category}</td>
                        <td>{e.description}</td>
                        <td style={{ textAlign: "right", fontWeight: "700" }}>₹{(e.amount || 0).toFixed(2)}</td>
                        <td><span className={`status-badge ${e.status.toLowerCase()}`}>{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4: DISCUSSIONS */}
          {activeProjectTab === "discussions" && (
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Project Log & Team Discussion Feed</h3>
              
              <form onSubmit={handlePostDiscussion} style={{ marginBottom: "24px", background: "var(--bg-tertiary)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <select
                    value={discCategory}
                    onChange={e => setDiscCategory(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.82rem", fontWeight: "600", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  >
                    <option value="Client Update">📢 Client Update</option>
                    <option value="Milestone Achieved">🎯 Milestone Achieved</option>
                    <option value="Expense Query">💸 Expense Query</option>
                    <option value="Internal Note">📝 Internal Note</option>
                  </select>
                </div>
                <textarea
                  placeholder="Write project update or discussion note..."
                  value={discText}
                  onChange={e => setDiscText(e.target.value)}
                  rows="3"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.9rem", outline: "none", resize: "none", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
                <button
                  type="submit"
                  className="luxury-button"
                  style={{ marginTop: "10px", backgroundColor: "#2563eb", color: "#fff", border: "none" }}
                >
                  Post Note
                </button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(selectedProject.discussions || []).map((d, i) => (
                  <div key={d.id || i} style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      <strong>{d.authorName} ({d.authorRole})</strong>
                      <span>{d.date}</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "4px" }}>
                      {d.category}
                    </span>
                    <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem", color: "var(--text-primary)" }}>{d.text}</p>
                  </div>
                ))}

                {(!selectedProject.discussions || selectedProject.discussions.length === 0) && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontStyle: "italic" }}>No discussions posted yet.</p>
                )}
              </div>
            </div>
          )}
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
