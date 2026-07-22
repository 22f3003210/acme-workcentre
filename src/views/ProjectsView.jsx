import React, { useState } from "react";
import { useApp } from "../context/AppContext";
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

  // ── SEPARATE PAGE VIEW FOR SELECTED PROJECT HUB ──
  if (selectedProject) {
    const linkedExps = expenses.filter(e => e.projectId === selectedProject.id || e.projectName === selectedProject.name);
    return (
      <div className="projects-view-container" style={{ padding: "8px 0", minHeight: "100vh" }}>
        
        {/* Top Navigation Bar: Back Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <button
            onClick={() => setSelectedProject(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "0.88rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
            }}
          >
            ← Back to All Projects
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <span className={`status-badge ${(selectedProject.status || "active").toLowerCase()}`} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
              ● {selectedProject.status || "Active"}
            </span>
          </div>
        </div>

        {/* Project Header Banner Card */}
        <div className="glass-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", color: "#fff", padding: "28px", borderRadius: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "0.78rem", background: "rgba(255,255,255,0.18)", color: "#93c5fd", padding: "3px 10px", borderRadius: "6px", fontWeight: "700", textTransform: "uppercase" }}>
                {selectedProject.code}
              </span>
              <h1 style={{ margin: "10px 0 6px 0", fontSize: "1.8rem", fontWeight: "800", color: "#ffffff" }}>
                {selectedProject.name}
              </h1>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                POC: <strong>{selectedProject.pocName || selectedProject.client}</strong> • Phone: {selectedProject.pocContact || selectedProject.clientContact || "N/A"}
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", padding: "12px 18px", borderRadius: "10px", textAlign: "right" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", display: "block" }}>Linked Expenses</span>
                <strong style={{ fontSize: "1.2rem", color: "#60a5fa" }}>₹{linkedExps.reduce((s, e) => s + e.amount, 0).toLocaleString()}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", padding: "12px 18px", borderRadius: "10px", textAlign: "right" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", display: "block" }}>Discussions</span>
                <strong style={{ fontSize: "1.2rem", color: "#34d399" }}>{selectedProject.discussions?.length || 0} notes</strong>
              </div>
            </div>
          </div>

          {/* Hub Sub-Tabs Bar */}
          <div style={{ display: "flex", gap: "16px", marginTop: "24px", borderBottom: "1px solid rgba(255,255,255,0.15)", overflowX: "auto" }}>
            {[
              { id: "scope", label: "📋 Purpose & Scope Checklists" },
              { id: "planner", label: `📅 Task & Event Planner (${selectedProject.scheduledEvents?.length || 0})` },
              { id: "visits", label: `🚗 Client Visits Timeline (${selectedProject.clientVisits?.length || 0})` },
              { id: "overview", label: "Overview & Details" },
              { id: "team", label: "Assigned Team" },
              { id: "expenses", label: `Linked Expenses (${linkedExps.length})` },
              { id: "discussions", label: `Discussions & Logs (${selectedProject.discussions?.length || 0})` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveProjectTab(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeProjectTab === t.id ? "3px solid #60a5fa" : "3px solid transparent",
                  color: activeProjectTab === t.id ? "#ffffff" : "rgba(255,255,255,0.7)",
                  fontWeight: activeProjectTab === t.id ? "700" : "500",
                  padding: "10px 10px",
                  cursor: "pointer",
                  fontSize: "0.86rem",
                  whiteSpace: "nowrap"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Section */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px", borderRadius: "12px", minHeight: "450px" }}>

          {/* ── TAB: PURPOSE & SCOPE CHECKLISTS ── */}
          {activeProjectTab === "scope" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Engagement Purpose Banner */}
              <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", padding: "20px 24px", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.3rem" }}>💡</span>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e3a8a" }}>
                    Why / Purpose Client Approached Us
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: "0.94rem", color: "#1e40af", lineHeight: "1.6", fontWeight: "500" }}>
                  {selectedProject.engagementPurpose || selectedProject.description || "Client requested consulting advisory for inventory audit, staff upselling, and retail growth."}
                </p>
              </div>

              {/* Checklists Grid (4 Domains) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: "700" }}>
                    Operational & Strategic Planning Checklists
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Click items to toggle completion state
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {(selectedProject.checklists || [
                    {
                      category: "📦 Inventory Audit Checklist",
                      items: [
                        { text: "Physical vault stock count & weight reconciliation", completed: true },
                        { text: "Hallmarking purity verification & BIS tag audit", completed: true },
                        { text: "Vault vs POS software ledger discrepancy analysis", completed: false },
                        { text: "High-value diamond & precious stone barcode tagging", completed: false }
                      ]
                    },
                    {
                      category: "📣 Marketing Suggestions Checklist",
                      items: [
                        { text: "Local billboard & newspaper ad reach evaluation", completed: true },
                        { text: "Social media & Meta Ads bridal campaign audit", completed: false },
                        { text: "VIP customer bridal preview invite strategy", completed: true }
                      ]
                    },
                    {
                      category: "📈 Revenue & Sales Growth Checklist",
                      items: [
                        { text: "Average transaction ticket size optimization (Gold to Diamond)", completed: true },
                        { text: "Old gold exchange scheme marketing & margin analysis", completed: false },
                        { text: "Solitaire & bridal set cross-selling desk strategy", completed: true }
                      ]
                    },
                    {
                      category: "👥 Customer Experience & Showroom Checklist",
                      items: [
                        { text: "Showroom floor greeter & VIP lounge service standards", completed: true },
                        { text: "Post-purchase thank-you & feedback call workflow", completed: true }
                      ]
                    }
                  ]).map((cat, cIdx) => {
                    const completedCount = cat.items.filter(i => i.completed).length;
                    const percent = Math.round((completedCount / cat.items.length) * 100) || 0;
                    return (
                      <div key={cIdx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#1e293b" }}>
                            {cat.category}
                          </h4>
                          <span style={{ fontSize: "0.76rem", fontWeight: "700", background: percent === 100 ? "#dcfce7" : "#e0f2fe", color: percent === 100 ? "#15803d" : "#0369a1", padding: "3px 8px", borderRadius: "12px" }}>
                            {completedCount}/{cat.items.length} ({percent}%)
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "14px" }}>
                          <div style={{ height: "100%", width: `${percent}%`, background: percent === 100 ? "#16a34a" : "#2563eb", transition: "width 0.3s ease" }} />
                        </div>

                        {/* Items list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {cat.items.map((item, iIdx) => (
                            <label
                              key={iIdx}
                              onClick={() => toggleProjectChecklistItem(selectedProject.id, cIdx, iIdx)}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                color: item.completed ? "#64748b" : "#1e293b",
                                textDecoration: item.completed ? "line-through" : "none",
                                background: item.completed ? "#f1f5f9" : "#ffffff",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1"
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                readOnly
                                style={{ marginTop: "2px", accentColor: "#2563eb" }}
                              />
                              <span>{item.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: TASK & EVENT PLANNER ── */}
          {activeProjectTab === "planner" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: "700" }}>
                    Project Task & Event Scheduler
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    Schedule client call updates, on-site store visits, and staff training workshops.
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
                    fontWeight: "600",
                    fontSize: "0.86rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)"
                  }}
                >
                  + Schedule Event / Call / Training
                </button>
              </div>

              {/* Events Table / Cards List */}
              {(!selectedProject.scheduledEvents || selectedProject.scheduledEvents.length === 0) ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>No upcoming events scheduled yet.</p>
                  <button
                    onClick={() => setShowEventModal(true)}
                    style={{ marginTop: "12px", background: "none", border: "none", color: "#2563eb", fontWeight: "700", cursor: "pointer" }}
                  >
                    + Schedule your first event
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedProject.scheduledEvents.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justify: "space-between",
                        padding: "16px 20px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", textAlign: "center", minWidth: "90px" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", display: "block" }}>
                            {evt.type === "Call Scheduling" ? "📞 CALL" : evt.type === "Offline Visit Scheduling" ? "🏢 VISIT" : "🎓 TRAINING"}
                          </span>
                          <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{evt.date}</strong>
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "0.98rem", color: "#0f172a" }}>{evt.title}</strong>
                            <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                              {evt.time}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#64748b" }}>
                            Consultant: <strong>{evt.consultant}</strong> {evt.notes ? `• ${evt.notes}` : ""}
                          </p>
                        </div>
                      </div>

                      <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "0.78rem", fontWeight: "700", padding: "4px 12px", borderRadius: "6px" }}>
                        ● {evt.status || "Scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: OFFLINE CLIENT VISITS TIMELINE ── */}
          {activeProjectTab === "visits" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header Stats Banner */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Client Visits</span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" }}>
                    {selectedProject.clientVisits?.length || 0} Visits Completed
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Field Days Spent</span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "1.4rem", fontWeight: "800", color: "#2563eb" }}>
                    {(selectedProject.clientVisits || []).reduce((sum, v) => sum + (v.durationDays || 1), 0)} Days On-Site
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Visiting Team Support</span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.95rem", fontWeight: "700", color: "#16a34a" }}>
                    Multi-Consultant Visits Allowed
                  </p>
                </div>
              </div>

              {/* Action Button Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: "700" }}>
                  Timeline
                </h3>

                <button
                  onClick={() => setShowVisitModal(true)}
                  style={{
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.86rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)"
                  }}
                >
                  + Record Offline Client Visit
                </button>
              </div>

              {/* Timeline List (Keka HR Style) */}
              {(!selectedProject.clientVisits || selectedProject.clientVisits.length === 0) ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>No offline client visits recorded yet.</p>
                  <button
                    onClick={() => setShowVisitModal(true)}
                    style={{ marginTop: "12px", background: "none", border: "none", color: "#059669", fontWeight: "700", cursor: "pointer" }}
                  >
                    + Record first client visit
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative", paddingLeft: "36px" }}>
                  {/* Vertical continuous gray timeline bar */}
                  <div style={{ position: "absolute", left: "15px", top: "0", bottom: "0", width: "2px", background: "#e2e8f0" }} />

                  {/* Year Header Pill: 2026 */}
                  <div style={{ position: "relative", marginBottom: "24px", zIndex: 2 }}>
                    <span style={{
                      background: "#94a3b8",
                      color: "#ffffff",
                      fontSize: "0.74rem",
                      fontWeight: "700",
                      padding: "3px 10px",
                      borderRadius: "4px",
                      marginLeft: "-36px",
                      display: "inline-block"
                    }}>
                      2026
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {selectedProject.clientVisits.map((v, idx) => {
                      const visitNum = selectedProject.clientVisits.length - idx;
                      const dateRangeFormatted = v.endDate && v.endDate !== v.startDate
                        ? `${formatDateNice(v.startDate)} - ${formatDateNice(v.endDate)}`
                        : formatDateNice(v.startDate);

                      const consultantNames = Array.isArray(v.visitingConsultants) ? v.visitingConsultants : [v.visitingConsultants];

                      return (
                        <div key={v.id || idx} style={{ position: "relative" }}>
                          {/* Circular Icon Node on Vertical Line */}
                          <div
                            style={{
                              position: "absolute",
                              left: "-36px",
                              top: "2px",
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: idx % 2 === 0 ? "#3b82f6" : "#f59e0b",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.9rem",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                              border: "2px solid #ffffff"
                            }}
                          >
                            {idx % 2 === 0 ? "🏢" : "🚗"}
                          </div>

                          {/* Visit Title & Subtitle */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>
                                  Visit {visitNum}{v.visitTitle ? `: ${v.visitTitle.replace(/^Visit #\d+:\s*/i, '')}` : ""}
                                </h4>
                                <span style={{ cursor: "pointer", color: "#94a3b8", fontSize: "0.88rem" }}>🔗</span>
                                <span style={{ cursor: "pointer", color: "#94a3b8", fontSize: "1rem" }}>⋮</span>
                              </div>
                              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>
                                {dateRangeFormatted} <span style={{ color: "#cbd5e1", margin: "0 4px" }}>•</span> <strong style={{ color: "#2563eb" }}>{v.durationDays || 1} Day{(v.durationDays || 1) > 1 ? "s" : ""} On-Site</strong>
                              </p>
                            </div>
                          </div>

                          {/* Visiting Consultants Pill (Keka HR Pill Style) */}
                          <div style={{ marginTop: "12px" }}>
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "12px",
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              padding: "10px 16px",
                              borderRadius: "10px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                            }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginRight: "4px" }}>
                                👥 Visiting Team:
                              </span>

                              {consultantNames.map(cName => {
                                const matchedUser = users.find(u => u.name === cName || u.name.includes(cName));
                                const avatarUrl = matchedUser?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120";
                                const userTitle = matchedUser?.title || matchedUser?.role || "Consultant";

                                return (
                                  <div key={cName} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cbd5e1" }}>
                                    <img src={avatarUrl} alt={cName} style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
                                    <span style={{ fontSize: "0.84rem", fontWeight: "700", color: "#1e293b" }}>{cName}</span>
                                    <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "500" }}>({userTitle})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Detailed Findings & Work Done Box */}
                          {(v.understandings || v.workDone) && (
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", marginTop: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                              {v.understandings && (
                                <div style={{ marginBottom: v.workDone ? "12px" : "0" }}>
                                  <strong style={{ fontSize: "0.78rem", color: "#92400e", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                                    🧠 Key Understandings & Observations:
                                  </strong>
                                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#451a03", lineHeight: "1.5" }}>
                                    {v.understandings}
                                  </p>
                                </div>
                              )}

                              {v.workDone && (
                                <div>
                                  <strong style={{ fontSize: "0.78rem", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                                    ✅ Work Done / Accomplishments:
                                  </strong>
                                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", lineHeight: "1.5" }}>
                                    {v.workDone}
                                  </p>
                                </div>
                              )}

                              {v.followUpAction && (
                                <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#2563eb", fontWeight: "600" }}>
                                  📌 Follow-Up Action: {v.followUpAction}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* TAB 2: TEAM */}
          {activeProjectTab === "team" && (
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Assigned Field Consultants</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {consultants.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "var(--bg-tertiary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img src={c.avatar} alt="" style={{ width: "42px", height: "42px", borderRadius: "50%" }} />
                      <div>
                        <strong style={{ fontSize: "0.92rem", display: "block", color: "var(--text-primary)" }}>{c.name}</strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{c.title} • {c.department}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: "700", background: "rgba(16, 185, 129, 0.1)", padding: "4px 10px", borderRadius: "6px" }}>
                      ● Active Lead
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                        <td style={{ textAlign: "right", fontWeight: "700" }}>₹{e.amount.toFixed(2)}</td>
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
