import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function RecruiterView() {
  const {
    hiringRequisitions = [],
    candidates = [],
    users = [],
    addHiringRequisition,
    addCandidate,
    updateCandidateStage,
    updateCandidateStatus,
    setToast
  } = useApp();

  // Active Main Sub-Tab in Recruiter Hub
  const [activeSubTab, setActiveSubTab] = useState("requirements"); // 'requirements' | 'pipeline' | 'geomatch' | 'analytics'

  // Modals & Filters
  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [showAddCandModal, setShowAddCandModal] = useState(false);
  const [selectedReqForGeo, setSelectedReqForGeo] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCityFilter, setSelectedCityFilter] = useState("All");

  // New Requisition Form State
  const [reqClientName, setReqClientName] = useState("");
  const [reqJobTitle, setReqJobTitle] = useState("");
  const [reqLocation, setReqLocation] = useState("Delhi");
  const [reqDept, setReqDept] = useState("Retail Showroom");
  const [reqExp, setReqExp] = useState("3 - 6 Years");
  const [reqBudget, setReqBudget] = useState("₹6,00,000 - ₹8,50,000 / yr");
  const [reqPositions, setReqPositions] = useState("2");
  const [reqRecruiter, setReqRecruiter] = useState("Darla Manikanta");
  const [reqDesc, setReqDesc] = useState("");

  // New Candidate Form State
  const [candName, setCandName] = useState("");
  const [candPhone, setCandPhone] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candCity, setCandCity] = useState("Delhi");
  const [candRelocation, setCandRelocation] = useState(true);
  const [candReqId, setCandReqId] = useState("");
  const [candChannel, setCandChannel] = useState("LinkedIn");
  const [candTelecaller, setCandTelecaller] = useState("Darla Manikanta");
  const [candSummary, setCandSummary] = useState("");

  // Recruiters list (Consultants & Admins)
  const recruitersList = users.filter(u => u.role === "Consultant" || u.role === "Admin");

  // Stages pipeline array
  const PIPELINE_STAGES = [
    "Sourced / Applied",
    "Screening / Telephonic Round",
    "Level 1: HQ Virtual Interview",
    "Level 2: Client Site Dispatched",
    "Level 3: Final HR Offer"
  ];

  // Submit New Requisition
  const handleReqSubmit = (e) => {
    e.preventDefault();
    if (!reqClientName.trim() || !reqJobTitle.trim()) {
      setToast({ message: "Please enter client name and job title.", type: "error" });
      return;
    }

    addHiringRequisition({
      clientName: reqClientName,
      jobTitle: reqJobTitle,
      location: reqLocation,
      department: reqDept,
      experienceReq: reqExp,
      offeredBudget: reqBudget,
      positionsCount: parseInt(reqPositions, 10) || 1,
      assignedRecruiter: reqRecruiter,
      description: reqDesc,
      channels: ["LinkedIn", "Naukri", "Meta Ads", "Internal Talent Bank"]
    });

    setToast({ message: `Hiring requisition created for ${reqClientName}!`, type: "success" });
    setShowAddReqModal(false);
    setReqClientName("");
    setReqJobTitle("");
    setReqDesc("");
  };

  // Submit New Candidate Lead
  const handleCandSubmit = (e) => {
    e.preventDefault();
    if (!candName.trim() || !candPhone.trim()) {
      setToast({ message: "Please enter candidate name and phone.", type: "error" });
      return;
    }

    const selReq = hiringRequisitions.find(r => r.id === candReqId);

    addCandidate({
      name: candName,
      phone: candPhone,
      email: candEmail || `${candName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      city: candCity,
      relocationOk: candRelocation,
      appliedReqId: candReqId || (hiringRequisitions[0] ? hiringRequisitions[0].id : ""),
      clientName: selReq ? selReq.clientName : "General Talent Pool",
      jobTitle: selReq ? `${selReq.jobTitle} (${selReq.location})` : "General Talent Pool",
      channel: candChannel,
      assignedTelecaller: candTelecaller,
      summary: candSummary || "Newly sourced candidate profile.",
      l1Notes: "Lead registered in recruiter database."
    });

    setToast({ message: `Candidate ${candName} added to talent bank!`, type: "success" });
    setShowAddCandModal(false);
    setCandName("");
    setCandPhone("");
    setCandEmail("");
    setCandSummary("");
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.clientName.toLowerCase().includes(q) ||
      c.jobTitle.toLowerCase().includes(q) ||
      c.assignedTelecaller.toLowerCase().includes(q);

    const matchesChannel = channelFilter === "All" || c.channel === channelFilter;
    const matchesStage = stageFilter === "All" || c.stage === stageFilter;
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesCity = selectedCityFilter === "All" || c.city.toLowerCase() === selectedCityFilter.toLowerCase();

    return matchesSearch && matchesChannel && matchesStage && matchesStatus && matchesCity;
  });

  // Calculate Geo-Matches when a requisition is selected
  const activeGeoReq = selectedReqForGeo || hiringRequisitions[0];
  const geoMatchedCandidates = candidates
    .filter(c => c.status !== "Joined / Hired") // Only unhired candidates
    .map(c => {
      const isExactCity = activeGeoReq && c.city.toLowerCase() === activeGeoReq.location.toLowerCase();
      const isRelocationOk = c.relocationOk;
      let score = 0;
      if (isExactCity) score += 50;
      if (isRelocationOk) score += 30;
      if (activeGeoReq && c.jobTitle.toLowerCase().includes(activeGeoReq.jobTitle.toLowerCase().split(" ")[0])) score += 20;

      return {
        ...c,
        isExactCity,
        matchScore: score
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  // Stats calculations
  const totalReqs = hiringRequisitions.length;
  const openPositions = hiringRequisitions.reduce((sum, r) => sum + (r.positionsCount || 1), 0);
  const inPipelineCount = candidates.filter(c => c.status === "In Process").length;
  const clientDispatchedCount = candidates.filter(c => c.stage.includes("Level 2")).length;
  const hiredCount = candidates.filter(c => c.status === "Joined / Hired").length;

  return (
    <div className="recruiter-view-container" style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ── TOP HEADER & FREE CLIENT HIRING SERVICE BANNER ── */}
      <div style={{ background: "linear-gradient(135deg, #4c478a 0%, #312e5c 60%, #1e1b4b 100%)", borderRadius: "6px", padding: "20px 24px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 14px rgba(76, 71, 138, 0.2)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase" }}>
              100% FREE CLIENT SERVICE
            </span>
            <span style={{ background: "rgba(255,255,255,0.18)", color: "#e2e8f0", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "600" }}>
              HYDERABAD HQ SOURCING ENGINE
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "700", margin: "6px 0 2px 0", color: "#ffffff" }}>
            Recruitment & Talent Sourcing Hub
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#cbd5e1", margin: 0 }}>
            Client requirement gathering, multi-channel sourcing (LinkedIn, Naukri, Meta Ads), Hyderabad HQ L1 virtual interviews & client site candidate dispatch.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => setShowAddReqModal(true)}
            style={{
              background: "#ffffff",
              color: "#4c478a",
              border: "none",
              borderRadius: "4px",
              padding: "9px 16px",
              fontWeight: "700",
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
            }}
          >
            <span>＋</span> New Client Requisition
          </button>
          <button
            type="button"
            onClick={() => setShowAddCandModal(true)}
            style={{
              background: "#38bdf8",
              color: "#0f172a",
              border: "none",
              borderRadius: "4px",
              padding: "9px 16px",
              fontWeight: "700",
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>👤</span> Add Candidate Lead
          </button>
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "4px solid #4c478a", padding: "14px 16px", borderRadius: "4px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>CLIENT REQUISITIONS</span>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {totalReqs} <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>Clients</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "4px solid #0284c7", padding: "14px 16px", borderRadius: "4px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>OPEN POSITIONS</span>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {openPositions} <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: "600" }}>Openings</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "4px solid #7c3aed", padding: "14px 16px", borderRadius: "4px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>IN ACTIVE PIPELINE</span>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {inPipelineCount} <span style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: "600" }}>Candidates</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "4px solid #d97706", padding: "14px 16px", borderRadius: "4px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>CLIENT SITE DISPATCHED</span>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {clientDispatchedCount} <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: "600" }}>On-Site</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "4px solid #16a34a", padding: "14px 16px", borderRadius: "4px" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>TOTAL HIRED / JOINED</span>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {hiredCount} <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: "600" }}>Success</span>
          </div>
        </div>
      </div>

      {/* ── MAIN MODULE SUB-TABS ROW ── */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "0 16px", display: "flex", gap: "24px" }}>
        {[
          { id: "requirements", label: "📋 Client Requirements & Requisitions" },
          { id: "pipeline", label: "🔄 Candidate Multi-Stage Pipeline" },
          { id: "geomatch", label: "📍 Smart Geo-Match Radar (City Talent Bank)" },
          { id: "analytics", label: "📊 Channel & Recruiter Analytics" }
        ].map(tab => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: "14px 0",
                background: "none",
                border: "none",
                borderBottom: isActive ? "3px solid #4c478a" : "3px solid transparent",
                color: isActive ? "#4c478a" : "#64748b",
                fontWeight: isActive ? "700" : "500",
                fontSize: "0.88rem",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: CLIENT REQUIREMENTS & REQUISITIONS */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "requirements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {hiringRequisitions.map(req => {
              const reqCandidates = candidates.filter(c => c.appliedReqId === req.id);
              const hiredForReq = reqCandidates.filter(c => c.status === "Joined / Hired").length;
              const dispatchedForReq = reqCandidates.filter(c => c.stage.includes("Level 2")).length;

              return (
                <div
                  key={req.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px"
                  }}
                >
                  <div>
                    {/* Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#4c478a", background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "2px 8px", borderRadius: "3px" }}>
                          {req.id.toUpperCase()} • {req.clientName}
                        </span>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "8px 0 4px 0" }}>
                          {req.jobTitle}
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                          📍 Target City: <strong style={{ color: "#0f172a" }}>{req.location}</strong> • Dept: {req.department}
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          background: req.status === "Open" ? "#f0fdf4" : req.status === "Interviewing" ? "#f0f9ff" : "#fff7ed",
                          border: req.status === "Open" ? "1px solid #bbf7d0" : req.status === "Interviewing" ? "1px solid #bae6fd" : "1px solid #fed7aa",
                          color: req.status === "Open" ? "#16a34a" : req.status === "Interviewing" ? "#0284c7" : "#ea580c"
                        }}
                      >
                        ● {req.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: "0.82rem", color: "#475569", marginTop: "12px", lineHeight: "1.4", background: "#f8fafc", padding: "10px 12px", borderRadius: "4px", border: "1px solid #f1f5f9" }}>
                      {req.description}
                    </p>

                    {/* Key Attributes */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "12px", fontSize: "0.78rem" }}>
                      <div>
                        <span style={{ color: "#94a3b8", display: "block", fontSize: "0.68rem" }}>BUDGET OFFERED</span>
                        <strong style={{ color: "#0f172a" }}>{req.offeredBudget}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8", display: "block", fontSize: "0.68rem" }}>EXPERIENCE REQ</span>
                        <strong style={{ color: "#0f172a" }}>{req.experienceReq}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8", display: "block", fontSize: "0.68rem" }}>OPENINGS</span>
                        <strong style={{ color: "#0284c7" }}>{req.positionsCount} Vacancies</strong>
                      </div>
                    </div>

                    {/* Sourcing Channels Badges */}
                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>Active Channels:</span>
                      {req.channels.map(ch => (
                        <span key={ch} style={{ fontSize: "0.7rem", background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "12px", color: "#334155" }}>
                          ⚡ {ch}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <div style={{ color: "#64748b" }}>
                      Recruiter: <strong style={{ color: "#0f172a" }}>{req.assignedRecruiter}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReqForGeo(req);
                          setActiveSubTab("geomatch");
                        }}
                        style={{
                          background: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          color: "#0284c7",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "0.76rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        📍 Geo-Match {req.location} Candidates
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: CANDIDATES MULTI-STAGE PIPELINE */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "pipeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Controls Filter Bar */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search candidate name, city or client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem", width: "240px" }}
              />

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.8rem", color: "#334155" }}
              >
                <option value="All">All Stages</option>
                {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.8rem", color: "#334155" }}
              >
                <option value="All">All Statuses</option>
                <option value="In Process">In Process</option>
                <option value="Selected / Offered">Selected / Offered</option>
                <option value="Joined / Hired">Joined / Hired</option>
                <option value="Not Interested in Joining">Not Interested in Joining</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Channel Filter */}
              <select
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.8rem", color: "#334155" }}
              >
                <option value="All">All Sourcing Channels</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Internal Database">Internal Database</option>
              </select>
            </div>

            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
              Showing {filteredCandidates.length} Candidate Profiles
            </div>
          </div>

          {/* Pipeline Candidates Table */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Candidate Info</th>
                  <th style={{ padding: "12px 16px" }}>Target Client & Position</th>
                  <th style={{ padding: "12px 16px" }}>Channel & Telecaller</th>
                  <th style={{ padding: "12px 16px" }}>Current Stage (HQ → Site)</th>
                  <th style={{ padding: "12px 16px" }}>Outcome Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Stage Advance</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((cand, idx) => {
                  const currentStageIdx = PIPELINE_STAGES.indexOf(cand.stage);

                  return (
                    <tr key={cand.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fcfcfd" }}>
                      
                      {/* Candidate Name & Contact */}
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block" }}>{cand.name}</strong>
                        <span style={{ fontSize: "0.76rem", color: "#64748b", display: "block" }}>📱 {cand.phone} • ✉ {cand.email}</span>
                        <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: "600" }}>
                          📍 {cand.city} {cand.relocationOk ? "(Relocation OK)" : "(Local Only)"}
                        </span>
                      </td>

                      {/* Client Position */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#4c478a", background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "2px 8px", borderRadius: "3px" }}>
                          {cand.clientName}
                        </span>
                        <div style={{ fontWeight: "600", color: "#334155", marginTop: "4px" }}>
                          {cand.jobTitle}
                        </div>
                      </td>

                      {/* Channel & Telecaller */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "0.74rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "10px", color: "#475569", border: "1px solid #cbd5e1" }}>
                          ⚡ {cand.channel}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                          👤 {cand.assignedTelecaller}
                        </div>
                      </td>

                      {/* Current Stage */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: "700", color: cand.stage.includes("Level 2") ? "#d97706" : cand.stage.includes("Level 1") ? "#0284c7" : "#4c478a" }}>
                          {cand.stage}
                        </div>
                        {cand.stage.includes("Level 1") && (
                          <span style={{ fontSize: "0.7rem", color: "#0284c7", background: "#e0f2fe", padding: "1px 6px", borderRadius: "3px", marginTop: "4px", display: "inline-block" }}>
                            💻 Virtual Round Conducted by Hyderabad HQ
                          </span>
                        )}
                        {cand.stage.includes("Level 2") && (
                          <span style={{ fontSize: "0.7rem", color: "#d97706", background: "#fef3c7", padding: "1px 6px", borderRadius: "3px", marginTop: "4px", display: "inline-block" }}>
                            🚗 Candidate Dispatched to Client Store
                          </span>
                        )}
                      </td>

                      {/* Outcome Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <select
                          value={cand.status}
                          onChange={(e) => {
                            updateCandidateStatus(cand.id, e.target.value);
                            setToast({ message: `Updated status for ${cand.name} to ${e.target.value}`, type: "info" });
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            border: cand.status === "Joined / Hired" ? "1px solid #86efac" : cand.status === "Not Interested in Joining" ? "1px solid #fde68a" : "1px solid #cbd5e1",
                            background: cand.status === "Joined / Hired" ? "#f0fdf4" : cand.status === "Not Interested in Joining" ? "#fffbeb" : "#ffffff",
                            color: cand.status === "Joined / Hired" ? "#16a34a" : cand.status === "Not Interested in Joining" ? "#d97706" : "#334155"
                          }}
                        >
                          <option value="In Process">In Process</option>
                          <option value="Selected / Offered">Selected / Offered</option>
                          <option value="Joined / Hired">Joined / Hired</option>
                          <option value="Not Interested in Joining">Not Interested in Joining</option>
                          <option value="Dispatched No Show">Dispatched No Show</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Advance Stage Control */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        {currentStageIdx < PIPELINE_STAGES.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextStage = PIPELINE_STAGES[currentStageIdx + 1];
                              updateCandidateStage(cand.id, nextStage);
                              setToast({ message: `Advanced ${cand.name} to ${nextStage}`, type: "success" });
                            }}
                            style={{
                              background: "#4c478a",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "5px 10px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            Advance ➔
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "700" }}>✓ Final Stage</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 3: SMART GEO-MATCHING RADAR & TALENT BANK */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "geomatch" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Active Requisition Selection Bar */}
          <div style={{ background: "linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", padding: "16px 20px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                GEO-LOCATION MATCHING RADAR
              </span>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "1.1rem", color: "#0f172a", fontWeight: "700" }}>
                Matching Unhired Talent for: {activeGeoReq.clientName} ({activeGeoReq.jobTitle})
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#475569", margin: "2px 0 0 0" }}>
                Target City: <strong style={{ color: "#0284c7" }}>📍 {activeGeoReq.location}</strong> • System prioritizes unhired candidates based in {activeGeoReq.location} first.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>Select Requisition:</label>
              <select
                value={activeGeoReq.id}
                onChange={e => {
                  const req = hiringRequisitions.find(r => r.id === e.target.value);
                  setSelectedReqForGeo(req);
                }}
                style={{ padding: "6px 12px", border: "1px solid #0284c7", borderRadius: "4px", fontSize: "0.82rem", background: "#ffffff", fontWeight: "600" }}
              >
                {hiringRequisitions.map(r => (
                  <option key={r.id} value={r.id}>{r.clientName} — {r.jobTitle} ({r.location})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Geo-Matched Candidate Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {geoMatchedCandidates.map(cand => (
              <div
                key={cand.id}
                style={{
                  background: "#ffffff",
                  border: cand.isExactCity ? "2px solid #16a34a" : "1px solid #e2e8f0",
                  borderRadius: "4px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justify: "space-between",
                  gap: "12px",
                  boxShadow: cand.isExactCity ? "0 4px 12px rgba(22, 163, 74, 0.08)" : "none"
                }}
              >
                <div>
                  {/* Badge Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        background: cand.isExactCity ? "#dcfce7" : cand.relocationOk ? "#fef3c7" : "#f1f5f9",
                        color: cand.isExactCity ? "#15803d" : cand.relocationOk ? "#d97706" : "#475569"
                      }}
                    >
                      {cand.isExactCity ? `🟢 EXACT CITY MATCH (${cand.city.toUpperCase()})` : cand.relocationOk ? `🟡 RELOCATION OK (${cand.city})` : `⚪ ${cand.city}`}
                    </span>

                    <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b" }}>
                      Score: {cand.matchScore}%
                    </span>
                  </div>

                  {/* Name & Contact */}
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "10px 0 2px 0" }}>
                    {cand.name}
                  </h4>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                    📱 {cand.phone} • ✉ {cand.email}
                  </p>

                  <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "10px", background: "#f8fafc", padding: "8px 10px", borderRadius: "4px" }}>
                    <strong>Summary:</strong> {cand.summary}
                  </div>
                </div>

                {/* Action Row */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Recruiter: {cand.assignedTelecaller}</span>
                  <button
                    type="button"
                    onClick={() => {
                      updateCandidateStage(cand.id, "Level 1: HQ Virtual Interview");
                      setToast({ message: `Assigned ${cand.name} to ${activeGeoReq.clientName} requirement!`, type: "success" });
                    }}
                    style={{
                      background: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Assign to {activeGeoReq.location} Position ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 4: CHANNEL & RECRUITER ANALYTICS */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* Sourcing Channel Performance */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>
              Sourcing Channel Contribution Breakdown
            </h3>
            
            {["LinkedIn", "Naukri", "Meta Ads", "Internal Database"].map(ch => {
              const count = candidates.filter(c => c.channel === ch).length;
              const pct = candidates.length ? Math.round((count / candidates.length) * 100) : 0;

              return (
                <div key={ch} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600", color: "#334155" }}>⚡ {ch}</span>
                    <strong style={{ color: "#0f172a" }}>{count} Candidates ({pct}%)</strong>
                  </div>
                  <div style={{ background: "#f1f5f9", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ background: ch === "LinkedIn" ? "#0284c7" : ch === "Naukri" ? "#7c3aed" : ch === "Meta Ads" ? "#ec4899" : "#16a34a", width: `${pct}%`, height: "100%" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recruiter / Telecaller Leaderboard */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>
              Recruiter & Telecaller Performance Leaderboard
            </h3>

            {recruitersList.map(u => {
              const assignedCount = candidates.filter(c => c.assignedTelecaller === u.name).length;
              const hiresCount = candidates.filter(c => c.assignedTelecaller === u.name && c.status === "Joined / Hired").length;

              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={u.avatar} alt={u.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>{u.name}</strong>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{u.title || "Recruiter"}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                    <span style={{ color: "#4c478a", fontWeight: "700", display: "block" }}>{assignedCount} Leads Managed</span>
                    <span style={{ fontSize: "0.72rem", color: "#16a34a" }}>{hiresCount} Placed / Joined</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: POST NEW CLIENT REQUISITION */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showAddReqModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "6px", width: "560px", maxWidth: "95vw", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                Post New Client Hiring Requisition
              </h3>
              <span onClick={() => setShowAddReqModal(false)} style={{ cursor: "pointer", fontSize: "1.1rem", color: "#64748b" }}>✕</span>
            </div>

            <form onSubmit={handleReqSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Client Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Joyalukkas Retail / Heerabhai Jewellers"
                  value={reqClientName}
                  onChange={e => setReqClientName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Job Position Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Store Operations Manager"
                    value={reqJobTitle}
                    onChange={e => setReqJobTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Target City / Location *</label>
                  <select
                    value={reqLocation}
                    onChange={e => setReqLocation(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Open Positions</label>
                  <input
                    type="number"
                    value={reqPositions}
                    onChange={e => setReqPositions(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Experience Req</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 - 5 Years"
                    value={reqExp}
                    onChange={e => setReqExp(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Assigned Recruiter</label>
                  <select
                    value={reqRecruiter}
                    onChange={e => setReqRecruiter(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  >
                    {recruitersList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Offered Budget / CTC</label>
                <input
                  type="text"
                  placeholder="e.g. ₹6,50,000 - ₹8,50,000 / yr"
                  value={reqBudget}
                  onChange={e => setReqBudget(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Job Description & Criteria</label>
                <textarea
                  rows="3"
                  placeholder="Details regarding duties, showroom location, responsibilities..."
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddReqModal(false)} style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", background: "#4c478a", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>Create Requisition</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: ADD CANDIDATE LEAD */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showAddCandModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "6px", width: "560px", maxWidth: "95vw", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                Add Candidate Lead to Sourcing Pipeline
              </h3>
              <span onClick={() => setShowAddCandModal(false)} style={{ cursor: "pointer", fontSize: "1.1rem", color: "#64748b" }}>✕</span>
            </div>

            <form onSubmit={handleCandSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Candidate Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Sharma"
                  value={candName}
                  onChange={e => setCandName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Phone Number *</label>
                  <input
                    type="text"
                    placeholder="+91 98112 34567"
                    value={candPhone}
                    onChange={e => setCandPhone(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Candidate Email</label>
                  <input
                    type="email"
                    placeholder="vikram@gmail.com"
                    value={candEmail}
                    onChange={e => setCandEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Current City Location</label>
                  <select
                    value={candCity}
                    onChange={e => setCandCity(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Sourcing Channel</label>
                  <select
                    value={candChannel}
                    onChange={e => setCandChannel(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Naukri">Naukri</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Internal Database">Internal Database</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Target Client Requisition</label>
                  <select
                    value={candReqId}
                    onChange={e => setCandReqId(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  >
                    <option value="">General Talent Database</option>
                    {hiringRequisitions.map(r => (
                      <option key={r.id} value={r.id}>{r.clientName} — {r.jobTitle} ({r.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Assigned Telecaller / Recruiter</label>
                  <select
                    value={candTelecaller}
                    onChange={e => setCandTelecaller(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                  >
                    {recruitersList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Candidate Summary & Experience Notes</label>
                <textarea
                  rows="3"
                  placeholder="5 yrs retail experience in South Extension Delhi showroom..."
                  value={candSummary}
                  onChange={e => setCandSummary(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddCandModal(false)} style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>Add Candidate</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
