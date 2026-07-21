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

  // Top Navigation Bar Tab: 'JOBS' | 'CANDIDATES' | 'REQUISITIONS' | 'TALENT_POOL' | 'REPORTS' | 'SETTINGS'
  const [topTab, setTopTab] = useState("JOBS");

  // Selected Job for Detailed View (null = show Jobs Dashboard)
  const [selectedJob, setSelectedJob] = useState(null);

  // Job Detail Sub-Tab: 'Checklist' | 'Dashboard' | 'Candidates' | 'Job Info' | 'Hiring Setup' | 'Analytics'
  const [jobSubTab, setJobSubTab] = useState("Candidates");

  // Job Info Inner Sub-Tab: 'Job details' | 'Positions' | 'Activity' | 'Linked requisitions'
  const [jobInfoSubTab, setJobInfoSubTab] = useState("Activity");

  // Hiring Setup Inner Sub-Tab: 'Application Form' | 'Hiring Team' | 'Hiring Flow' | 'Scorecard'
  const [hiringSetupSubTab, setHiringSetupSubTab] = useState("Scorecard");

  // Active Chevron Stage in Candidate Pipeline View
  const [activePipelineChevron, setActivePipelineChevron] = useState("Sourced"); // 'Sourced' | 'Screening' | 'Phase 1' | 'Phase 2' | 'Preboarding' | 'Hired' | 'Archived'

  // Modals
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showCreateScorecardModal, setShowCreateScorecardModal] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [candidatesMovedToPool, setCandidatesMovedToPool] = useState(false);

  // Candidate Filters under Pipeline
  const [candSourceFilter, setCandSourceFilter] = useState("All");
  const [candExpFilter, setCandExpFilter] = useState("All");
  const [candSearch, setCandSearch] = useState("");

  // New Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [clientName, setClientName] = useState("Heerabhai Jewellers");
  const [location, setLocation] = useState("Mehdipatnam");
  const [department, setDepartment] = useState("SALES");
  const [experienceReq, setExperienceReq] = useState("2-4 Years");
  const [offeredBudget, setOfferedBudget] = useState("INR 3,00,000.00 - 4,50,000.00");
  const [positionsCount, setPositionsCount] = useState("3");
  const [assignedRecruiter, setAssignedRecruiter] = useState("HBJ HR");
  const [jobDescription, setJobDescription] = useState("");

  // New Candidate Form State
  const [candName, setCandName] = useState("");
  const [candPhone, setCandPhone] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candCity, setCandCity] = useState("Hyderabad");
  const [candRelocation, setCandRelocation] = useState(true);
  const [candSource, setCandSource] = useState("Referral");
  const [candOwner, setCandOwner] = useState("HBJ HR");
  const [candJobId, setCandJobId] = useState("");
  const [candSummary, setCandSummary] = useState("");

  // Scorecard Form State
  const [scorecardSectionName, setScorecardSectionName] = useState("Evaluation Skills");
  const [scorecardSkill, setScorecardSkill] = useState("Oral Communication & Retail Pitching");
  const [scorecardInstruction, setScorecardInstruction] = useState("Analyse the candidate by asking past showroom sales achievements...");
  const [scorecardResponseType, setScorecardResponseType] = useState("Star rating");
  const [scorecardMandatory, setScorecardMandatory] = useState(true);

  // Initial Sample Jobs
  const defaultApprovedRequisition = {
    id: "req-app-1",
    jobTitle: "Customer Relations Executive",
    department: "CUSTOMER RELATIONS",
    openings: 3,
    dueStatus: "230 days overdue",
    budget: "INR 2,64,000.00 - 2,84,000.00",
    requestedBy: "ADMIN MANAGER",
    location: "Mehdipatnam",
    attachments: "Not Available"
  };

  const defaultActiveJobsList = [
    {
      id: "job-1",
      title: "SECURITY GUARD",
      department: "MARKETING",
      location: "Mehdipatnam",
      experience: "1-3 yrs",
      openingsTarget: "1/1",
      targetDate: "21 Mar 2026",
      newCandidates: 0,
      archived: 0,
      hiredCount: 1,
      isConfidential: true,
      isPriority: false,
      status: "Online"
    },
    {
      id: "job-2",
      title: "Marketing Lead",
      department: "MARKETING",
      location: "Mehdipatnam",
      experience: "3-5 yrs",
      openingsTarget: "2/5",
      targetDate: "29 Dec 2033",
      newCandidates: 0,
      archived: 3,
      hiredCount: 2,
      isConfidential: true,
      isPriority: false,
      status: "Online"
    },
    {
      id: "job-3",
      title: "STORE MANAGER",
      department: "ADMINISTRATION",
      location: "Mehdipatnam",
      experience: "4-8 yrs",
      openingsTarget: "1/2",
      targetDate: "22 Sep 2025",
      newCandidates: 2,
      archived: 3,
      hiredCount: 1,
      isConfidential: true,
      isPriority: true,
      status: "Online"
    },
    {
      id: "job-4",
      title: "SALES EXECUTIVE",
      department: "SALES",
      location: "Mehdipatnam - Nampally",
      experience: "2-4 yrs",
      openingsTarget: "3/5",
      targetDate: "15 Oct 2026",
      newCandidates: 4,
      archived: 32,
      hiredCount: 15,
      isConfidential: false,
      isPriority: true,
      status: "Online"
    },
    {
      id: "job-5",
      title: "Pantry & Housekeeping Supervisor",
      department: "OPERATIONS",
      location: "Mehdipatnam",
      experience: "1-2 yrs",
      openingsTarget: "1/1",
      targetDate: "10 Nov 2026",
      newCandidates: 0,
      archived: 1,
      hiredCount: 0,
      isConfidential: true,
      isPriority: false,
      status: "Online"
    },
    {
      id: "job-6",
      title: "Systems Operator",
      department: "ADMINISTRATION",
      location: "Mehdipatnam",
      experience: "2-3 yrs",
      openingsTarget: "1/2",
      targetDate: "05 Dec 2026",
      newCandidates: 1,
      archived: 2,
      hiredCount: 1,
      isConfidential: false,
      isPriority: true,
      status: "Online"
    },
    {
      id: "job-7",
      title: "FIELD SALES MAN",
      department: "SALES",
      location: "Mehdipatnam +1",
      experience: "1-3 yrs",
      openingsTarget: "2/4",
      targetDate: "20 Jan 2027",
      newCandidates: 3,
      archived: 5,
      hiredCount: 2,
      isConfidential: true,
      isPriority: false,
      status: "Online"
    }
  ];

  // Sample Archived candidates matching Screenshot 1
  const archivedCandidatesSample = [
    {
      id: "arch-1",
      name: "ROHIT SINGH THAKUR",
      archivedFrom: "Sourced",
      archivedBy: "HBJ HR",
      archivedOn: "07 Jun 2026",
      reason: "Candidate Not Interested",
      tags: "Not Available",
      phone: "+91 9704138501",
      email: "rohitsingh@gmail.com"
    },
    {
      id: "arch-2",
      name: "ERAPATNAM AVINASH",
      archivedFrom: "Sourced",
      archivedBy: "HBJ HR",
      archivedOn: "26 Apr 2026",
      reason: "Candidate Not Interested",
      tags: "Not Available",
      phone: "+91 9000245745",
      email: "avinashaaby@gmail.com"
    },
    {
      id: "arch-3",
      name: "SHAIK EJAS PASHA",
      archivedFrom: "Sourced",
      archivedBy: "HBJ HR",
      archivedOn: "26 Apr 2026",
      reason: "Candidate Not Interested",
      tags: "Not Available",
      phone: "+91 9912412760",
      email: "ejaspasha786@gmail.com"
    }
  ];

  // Activity log history matching Screenshot 2
  const activityLogsSample = [
    { user: "Shikhar Jain", action: "removed shikhar jain as Interviewer", time: "07 Jul 2025, 12:21 PM" },
    { user: "HBJ HR", action: "added hemanth kumar jain as hiring manager", time: "03 May 2025, 05:51 PM" },
    { user: "HBJ HR", action: "added hemanth kumar jain as recruiter", time: "03 May 2025, 05:51 PM" },
    { user: "HBJ HR", action: "added hemanth kumar jain as interviewer", time: "26 Apr 2025, 04:00 PM" },
    { user: "HBJ HR", action: "added shikhar jain as interviewer", time: "26 Apr 2025, 03:58 PM" },
    { user: "HBJ HR", action: "updated job details", time: "24 Apr 2025, 05:32 PM" }
  ];

  const activeJobs = [
    ...defaultActiveJobsList,
    ...hiringRequisitions.map(req => ({
      id: req.id,
      title: req.jobTitle.toUpperCase(),
      department: req.department || "RETAIL",
      location: req.location || "Hyderabad",
      experience: req.experienceReq || "2-5 yrs",
      openingsTarget: `0/${req.positionsCount || 1}`,
      targetDate: "30 Dec 2026",
      newCandidates: 1,
      archived: 0,
      hiredCount: 0,
      isConfidential: true,
      isPriority: req.status === "Open",
      status: "Online",
      clientName: req.clientName,
      budget: req.offeredBudget
    }))
  ];

  const handleCreateJobSubmit = (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setToast({ message: "Please enter a job title.", type: "error" });
      return;
    }

    addHiringRequisition({
      jobTitle,
      clientName,
      location,
      department,
      experienceReq,
      offeredBudget,
      positionsCount: parseInt(positionsCount, 10) || 1,
      assignedRecruiter,
      description: jobDescription,
      status: "Open"
    });

    setToast({ message: `Job Requisition '${jobTitle}' created successfully!`, type: "success" });
    setShowCreateJobModal(false);
    setJobTitle("");
    setJobDescription("");
  };

  const handleAddCandidateSubmit = (e) => {
    e.preventDefault();
    if (!candName.trim() || !candPhone.trim()) {
      setToast({ message: "Please enter candidate name and phone.", type: "error" });
      return;
    }

    addCandidate({
      name: candName,
      phone: candPhone,
      email: candEmail,
      city: candCity,
      relocationOk: candRelocation,
      appliedReqId: candJobId || (selectedJob ? selectedJob.id : "job-4"),
      jobTitle: selectedJob ? selectedJob.title : "SALES EXECUTIVE",
      clientName: selectedJob ? (selectedJob.clientName || "Heerabhai Jewellers") : "Heerabhai Jewellers",
      channel: candSource,
      assignedTelecaller: candOwner,
      stage: activePipelineChevron === "Sourced" ? "Sourced / Applied" : activePipelineChevron,
      status: "In Process",
      summary: candSummary || "Added directly to position candidate pipeline."
    });

    setToast({ message: `Candidate ${candName} added to ${selectedJob ? selectedJob.title : "Job Pipeline"}!`, type: "success" });
    setShowAddCandidateModal(false);
    setCandName("");
    setCandPhone("");
    setCandEmail("");
    setCandSummary("");
  };

  const handleCreateScorecardSubmit = (e) => {
    e.preventDefault();
    setToast({ message: `Scorecard '${scorecardSectionName}' saved successfully!`, type: "success" });
    setShowCreateScorecardModal(false);
  };

  const currentJobCandidates = candidates;

  const getStageNameFromChevron = (chev) => {
    switch (chev) {
      case "Sourced": return "Sourced / Applied";
      case "Screening": return "Screening / Telephonic Round";
      case "Phase 1": return "Level 1: HQ Virtual Interview";
      case "Phase 2": return "Level 2: Client Site Dispatched";
      case "Preboarding": return "Level 3: Final HR Offer";
      case "Hired": return "Joined / Hired";
      case "Archived": return "Rejected";
      default: return "Sourced / Applied";
    }
  };

  const stageCandidatesList = currentJobCandidates.filter(c => {
    if (activePipelineChevron === "Sourced") {
      return c.stage === "Sourced / Applied" || c.stage === "Sourced" || !c.stage;
    }
    if (activePipelineChevron === "Screening") {
      return c.stage === "Screening / Telephonic Round" || c.stage === "Screening";
    }
    if (activePipelineChevron === "Phase 1") {
      return c.stage === "Level 1: HQ Virtual Interview" || c.stage === "Interview - Phase 1";
    }
    if (activePipelineChevron === "Phase 2") {
      return c.stage === "Level 2: Client Site Dispatched" || c.stage === "Interview - Phase 2";
    }
    if (activePipelineChevron === "Preboarding") {
      return c.stage === "Level 3: Final HR Offer" || c.stage === "Preboarding";
    }
    if (activePipelineChevron === "Hired") {
      return c.status === "Joined / Hired" || c.status === "Selected / Offered";
    }
    if (activePipelineChevron === "Archived") {
      return c.status === "Rejected" || c.status === "Not Interested in Joining" || c.status === "Dispatched No Show";
    }
    return true;
  });

  return (
    <div className="recruiter-module-wrapper" style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── TOP Purple Sub-Navbar ── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "54px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "28px", height: "100%" }}>
            {[
              { id: "HOME", label: "HOME" },
              { id: "JOBS", label: "JOBS" },
              { id: "CANDIDATES", label: "CANDIDATES" },
              { id: "MESSAGES", label: "MESSAGES" },
              { id: "PREBOARDING", label: "PREBOARDING" },
              { id: "REPORTS", label: "REPORTS" },
              { id: "CAREER SITE", label: "CAREER SITE" },
              { id: "APPS", label: "APPS" },
              { id: "SETTINGS", label: "SETTINGS" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setTopTab(tab.id);
                  if (tab.id === "JOBS") setSelectedJob(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  height: "100%",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: topTab === tab.id ? "#5b21b6" : "#64748b",
                  borderBottom: topTab === tab.id ? "3px solid #6d28d9" : "3px solid transparent",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  padding: "0 4px",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateJobModal(true)}
            style={{
              background: "#6d28d9",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "7px 16px",
              fontSize: "0.84rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(109, 40, 217, 0.25)"
            }}
          >
            <span>+</span> New
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ padding: "24px 32px", maxWidth: "1600px", margin: "0 auto" }}>

        {/* VIEW 1: JOBS DASHBOARD */}
        {topTab === "JOBS" && !selectedJob && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ marginBottom: "12px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#5b21b6", margin: 0 }}>
                  Approved requisition (1)
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                  Here you can find all the requisitions of this organisation.
                </p>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.05em" }}>
                      <th style={{ padding: "14px 20px" }}>Job Title</th>
                      <th style={{ padding: "14px 20px" }}>Number of Openings</th>
                      <th style={{ padding: "14px 20px" }}>Hiring Due In</th>
                      <th style={{ padding: "14px 20px" }}>Budget</th>
                      <th style={{ padding: "14px 20px" }}>Requested By</th>
                      <th style={{ padding: "14px 20px" }}>Location</th>
                      <th style={{ padding: "14px 20px" }}>Attachments</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>Take Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#5b21b6", fontSize: "0.88rem" }}>
                          {defaultApprovedRequisition.jobTitle}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", marginTop: "2px", fontWeight: "600" }}>
                          {defaultApprovedRequisition.department}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "#1e293b" }}>
                        {defaultApprovedRequisition.openings}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#ef4444", fontWeight: "600" }}>
                        {defaultApprovedRequisition.dueStatus}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#334155", fontWeight: "600" }}>
                        {defaultApprovedRequisition.budget}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#475569", fontWeight: "600" }}>
                        {defaultApprovedRequisition.requestedBy}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#475569" }}>
                        {defaultApprovedRequisition.location}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#94a3b8" }}>
                        {defaultApprovedRequisition.attachments}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            onClick={() => {
                              setSelectedJob({
                                id: "job-4",
                                title: defaultApprovedRequisition.jobTitle,
                                department: defaultApprovedRequisition.department,
                                location: defaultApprovedRequisition.location,
                                isConfidential: false,
                                isPriority: true
                              });
                            }}
                            style={{
                              background: "#f3e8ff",
                              color: "#6d28d9",
                              border: "1px solid #ddd6fe",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Start hiring ∨
                          </button>
                          <span style={{ cursor: "pointer", color: "#94a3b8", fontSize: "1rem" }}>⋮</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Jobs Section */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#5b21b6", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    Active Jobs ({activeJobs.length}) <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>∨</span>
                  </h2>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                    Here you can find all the jobs of this organisation.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", fontWeight: "600", color: "#475569", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showOnlyPriority}
                      onChange={e => setShowOnlyPriority(e.target.checked)}
                      style={{ accentColor: "#6d28d9", width: "16px", height: "16px" }}
                    />
                    Show only priority
                  </label>

                  <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "6px", padding: "2px" }}>
                    <button style={{ background: "#ffffff", border: "none", borderRadius: "4px", padding: "6px 10px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>▦</button>
                    <button style={{ background: "none", border: "none", padding: "6px 10px", cursor: "pointer", color: "#64748b" }}>☰</button>
                  </div>

                  <button
                    onClick={() => setShowCreateJobModal(true)}
                    style={{
                      background: "#6d28d9",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 18px",
                      fontSize: "0.84rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 2px 6px rgba(109, 40, 217, 0.25)"
                    }}
                  >
                    + Create Job <span>∨</span>
                  </button>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 16px", display: "grid", gridTemplateColumns: "repeat(6, 1fr) 2fr", gap: "12px", alignItems: "center" }}>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                  <option value="All">Business Unit ∨</option>
                  <option value="Jewellery Retail">Jewellery Retail</option>
                </select>

                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                  <option value="All">Department ∨</option>
                  <option value="MARKETING">MARKETING</option>
                  <option value="ADMINISTRATION">ADMINISTRATION</option>
                  <option value="SALES">SALES</option>
                  <option value="OPERATIONS">OPERATIONS</option>
                </select>

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                  <option value="All">Status ∨</option>
                  <option value="Online">Online</option>
                </select>

                <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                  <option>Hiring Manager ∨</option>
                  <option>Anant Kumar Sarraf</option>
                </select>

                <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                  <option>Recruiter ∨</option>
                  <option>HBJ HR</option>
                </select>

                <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                  <option value="All">Location ∨</option>
                  <option value="Mehdipatnam">Mehdipatnam</option>
                </select>

                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search for jobs by title, department, job id"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {activeJobs.filter(job => {
                if (showOnlyPriority && !job.isPriority) return false;
                if (deptFilter !== "All" && job.department !== deptFilter) return false;
                if (locationFilter !== "All" && !job.location.includes(locationFilter)) return false;
                if (searchQuery.trim() && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
              }).map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "20px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                    position: "relative"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#8b5cf6";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(109, 40, 217, 0.12)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
                  }}
                >
                  {job.isConfidential && (
                    <span style={{ position: "absolute", right: "20px", top: "20px", color: "#94a3b8", fontSize: "1.1rem" }}>
                      🔒
                    </span>
                  )}

                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#1e293b", margin: 0, textTransform: "uppercase" }}>
                    {job.title}
                  </h3>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>
                    {job.department} <span style={{ color: "#cbd5e1", margin: "0 4px" }}>|</span> {job.location}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "20px", fontSize: "0.8rem", color: "#475569" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>👥</span> <strong>{job.newCandidates}</strong>
                    </div>
                    <div style={{ color: "#cbd5e1" }}>•</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "#16a34a" }}>🎯</span> <strong>{job.openingsTarget}</strong>
                    </div>
                    <div style={{ color: "#cbd5e1" }}>•</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ef4444" }}>
                      <span>📅</span> {job.targetDate}
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "20px", paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.74rem", color: "#64748b", fontWeight: "700" }}>
                    <span>{job.newCandidates} NEW CANDIDATES • {job.archived} ARCHIVED</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6d28d9" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6d28d9" }}></span>
                      CONFIDENTIAL
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: SINGLE JOB DETAILED VIEW */}
        {(selectedJob || topTab === "CANDIDATES") && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: "none", border: "none", color: "#6d28d9", fontWeight: "700", cursor: "pointer", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                ← Back to Jobs Dashboard
              </button>
            </div>

            {/* Header Info */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                      {selectedJob ? selectedJob.title : "SALES EXECUTIVE"}
                    </h1>
                    <span style={{ background: "#16a34a", color: "#ffffff", fontSize: "0.68rem", fontWeight: "800", padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                      ONLINE ∨
                    </span>
                    <span style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.68rem", fontWeight: "800", padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                      PRIORITY
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px", fontWeight: "500" }}>
                    {selectedJob ? `${selectedJob.department} - Full Time - ( ${selectedJob.location} ) - ${selectedJob.experience}` : "SALES - Full Time - ( Mehdipatnam - Nampally ) - 2-4 yrs"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}>👁</button>
                  <button style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}>🔗</button>
                  <button
                    onClick={() => setShowAddCandidateModal(true)}
                    style={{
                      background: "#6d28d9",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "0.84rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    + Add Candidate <span>∨</span>
                  </button>
                  <button style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}>⋮</button>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Bar */}
            <div style={{ borderBottom: "1px solid #cbd5e1", marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "32px" }}>
                {[
                  "Checklist",
                  "Dashboard",
                  "Candidates",
                  "Job Info",
                  "Hiring Setup",
                  "Profile Score",
                  "Workflow Automation",
                  "Publish Options",
                  "Survey Response",
                  "Analytics"
                ].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setJobSubTab(sub)}
                    style={{
                      background: "none",
                      border: "none",
                      paddingBottom: "12px",
                      fontSize: "0.84rem",
                      fontWeight: "700",
                      color: jobSubTab === sub ? "#5b21b6" : "#64748b",
                      borderBottom: jobSubTab === sub ? "3px solid #6d28d9" : "3px solid transparent",
                      cursor: "pointer"
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SUB TAB 1: CHECKLIST ── */}
            {jobSubTab === "Checklist" && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}>Job Onboarding Checklist</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>Create job</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>You can now add and manage candidates</div>
                      </div>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 8px", borderRadius: "50%", fontWeight: "700" }}>✓</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>Publish to career site or Internal job board</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Get better reach by publishing in different job boards</div>
                      </div>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 8px", borderRadius: "50%", fontWeight: "700" }}>✓</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>Add hiring team</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>You can add hiring team for this job</div>
                      </div>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 8px", borderRadius: "50%", fontWeight: "700" }}>✓</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>Add Scorecards</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Get better feedbacks with scorecards</div>
                      </div>
                      <button onClick={() => { setJobSubTab("Hiring Setup"); setHiringSetupSubTab("Scorecard"); }} style={{ border: "1px solid #6d28d9", color: "#6d28d9", background: "#fff", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}>Continue</button>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#64748b", marginBottom: "16px" }}>Impact score</div>
                  <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 16px auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "conic-gradient(#eab308 0% 60%, #e2e8f0 60% 100%)" }}>
                    <div style={{ width: "95px", height: "95px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: "800", color: "#1e293b" }}>60<span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>/100</span></span>
                    </div>
                  </div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>Good</h4>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "8px", lineHeight: "1.5" }}>
                    The Impact Score shows how well your Job listing is optimized to attract and evaluate candidates.
                  </p>
                </div>
              </div>
            )}

            {/* ── SUB TAB 2: CANDIDATES PIPELINE & ARCHIVED TABLE (Matching Screenshot 1) ── */}
            {jobSubTab === "Candidates" && (
              <div>
                
                {/* Chevrons Stage Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", flexGrow: 1, maxWidth: "80%" }}>
                    {[
                      { id: "Sourced", label: "Sourced", count: 4 },
                      { id: "Screening", label: "Screening", count: 0 },
                      { id: "Phase 1", label: "Interview - Phase 1", count: 0 },
                      { id: "Phase 2", label: "Interview - Phase 2", count: 0 },
                      { id: "Preboarding", label: "Preboarding", count: 0 }
                    ].map((chev, index) => {
                      const isActive = activePipelineChevron === chev.id;
                      return (
                        <div
                          key={chev.id}
                          onClick={() => setActivePipelineChevron(chev.id)}
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            background: isActive ? "#f3e8ff" : "#ffffff",
                            color: isActive ? "#5b21b6" : "#475569",
                            border: isActive ? "1px solid #c084fc" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            textAlign: "center",
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            clipPath: index === 0 
                              ? "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)" 
                              : "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)"
                          }}
                        >
                          <div>{chev.label}</div>
                          <div style={{ fontSize: "0.95rem", marginTop: "2px" }}>{chev.count}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => setActivePipelineChevron("Hired")}
                      style={{
                        background: activePipelineChevron === "Hired" ? "#dcfce7" : "#ffffff",
                        color: "#16a34a",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      ✔ Hired (15)
                    </button>
                    <button
                      onClick={() => setActivePipelineChevron("Archived")}
                      style={{
                        background: activePipelineChevron === "Archived" ? "#fee2e2" : "#ffffff",
                        color: "#ef4444",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      ⊗ Archived (32)
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                    {activePipelineChevron}
                  </h3>

                  {activePipelineChevron === "Archived" && (
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", fontWeight: "600", color: "#475569", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={candidatesMovedToPool}
                        onChange={e => setCandidatesMovedToPool(e.target.checked)}
                        style={{ accentColor: "#6d28d9", width: "16px", height: "16px" }}
                      />
                      Candidates moved to pool
                    </label>
                  )}
                </div>

                {/* ARCHIVED PIPELINE STAGE VIEW (Matching Screenshot 1) */}
                {activePipelineChevron === "Archived" ? (
                  <div>
                    {/* Filters Bar */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px", display: "grid", gridTemplateColumns: "repeat(6, 1fr) 2fr", gap: "12px", alignItems: "center" }}>
                      <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}>
                        <option>Source ∨</option>
                        <option>HBJ HR Referral</option>
                      </select>
                      <input type="date" style={{ padding: "7px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                      <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}>
                        <option>Archived From ∨</option>
                        <option>Sourced</option>
                      </select>
                      <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}>
                        <option>Archive Reason ∨</option>
                        <option>Candidate Not Interested</option>
                      </select>
                      <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}>
                        <option>Experience ∨</option>
                      </select>
                      <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}>
                        <option>Expected Salary ∨</option>
                      </select>

                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
                        <input type="text" placeholder="Search" style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      <button style={{ background: "#a5b4fc", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 18px", fontSize: "0.82rem", fontWeight: "700", cursor: "not-allowed" }}>Rollback</button>
                      <button style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "6px", padding: "8px 18px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer" }}>Send Email</button>
                    </div>

                    {/* Archived Table */}
                    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700" }}>
                            <th style={{ padding: "12px 16px", width: "40px" }}><input type="checkbox" /></th>
                            <th style={{ padding: "12px 16px" }}>CANDIDATE NAME</th>
                            <th style={{ padding: "12px 16px" }}>ARCHIVED FROM</th>
                            <th style={{ padding: "12px 16px" }}>ARCHIVED BY</th>
                            <th style={{ padding: "12px 16px" }}>ARCHIVED ON</th>
                            <th style={{ padding: "12px 16px" }}>ARCHIVED REASON</th>
                            <th style={{ padding: "12px 16px" }}>TAGS</th>
                            <th style={{ padding: "12px 16px" }}>CONTACT</th>
                            <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivedCandidatesSample.map((cand) => (
                            <tr key={cand.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "14px 16px" }}><input type="checkbox" /></td>
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.76rem" }}>
                                    {cand.name.substring(0, 2)}
                                  </div>
                                  <div style={{ fontWeight: "700", color: "#5b21b6" }}>{cand.name}</div>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px", color: "#475569" }}>{cand.archivedFrom}</td>
                              <td style={{ padding: "14px 16px", fontWeight: "600", color: "#475569" }}>{cand.archivedBy}</td>
                              <td style={{ padding: "14px 16px", color: "#475569" }}>{cand.archivedOn}</td>
                              <td style={{ padding: "14px 16px", color: "#334155", fontWeight: "600" }}>{cand.reason}</td>
                              <td style={{ padding: "14px 16px", color: "#94a3b8" }}>{cand.tags}</td>
                              <td style={{ padding: "14px 16px", fontSize: "0.76rem" }}>
                                <div style={{ fontWeight: "700" }}>{cand.phone}</div>
                                <div style={{ color: "#64748b" }}>{cand.email}</div>
                              </td>
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                                  <button style={{ background: "#f1f5f9", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>👤+</button>
                                  <button style={{ background: "#f1f5f9", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>💬</button>
                                  <span style={{ cursor: "pointer", color: "#94a3b8" }}>⋮</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Standard Active Pipeline Table */
                  <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700" }}>
                          <th style={{ padding: "12px 16px", width: "40px" }}><input type="checkbox" /></th>
                          <th style={{ padding: "12px 16px" }}>Candidate</th>
                          <th style={{ padding: "12px 16px" }}>Source</th>
                          <th style={{ padding: "12px 16px" }}>Applied / Added On</th>
                          <th style={{ padding: "12px 16px" }}>Owner</th>
                          <th style={{ padding: "12px 16px" }}>Days in Stage</th>
                          <th style={{ padding: "12px 16px" }}>Resume</th>
                          <th style={{ padding: "12px 16px" }}>Contact</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stageCandidatesList.map((cand, idx) => (
                          <tr key={cand.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "14px 16px" }}><input type="checkbox" /></td>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#a855f7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.78rem" }}>
                                  {cand.name ? cand.name.substring(0, 2).toUpperCase() : "ST"}
                                </div>
                                <div>
                                  <div style={{ fontWeight: "700", color: "#6d28d9", fontSize: "0.88rem" }}>{cand.name}</div>
                                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{cand.city}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: "600", color: "#334155" }}>
                              {cand.channel || "NIKHIL GOUD (Referral)"}
                            </td>
                            <td style={{ padding: "14px 16px", color: "#475569" }}>
                              {cand.updatedDate || "26 Apr 2026"}
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: "600", color: "#475569" }}>
                              {cand.assignedTelecaller || "HBJ HR"}
                            </td>
                            <td style={{ padding: "14px 16px", color: "#ef4444", fontWeight: "700" }}>
                              86
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <button style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}>View</button>
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: "0.76rem" }}>
                              <div><strong>{cand.phone}</strong></div>
                              <div style={{ color: "#64748b" }}>{cand.email}</div>
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                                <button style={{ background: "#f1f5f9", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>➔</button>
                                <button style={{ background: "#f1f5f9", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>💬</button>
                                <span style={{ cursor: "pointer", color: "#94a3b8" }}>⋮</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── SUB TAB 3: JOB INFO (Matching Screenshot 2 & 3) ── */}
            {jobSubTab === "Job Info" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
                  <div style={{ display: "flex", gap: "24px" }}>
                    {["Job details", "Positions", "Activity", "Linked requisitions"].map(sub => (
                      <button
                        key={sub}
                        onClick={() => setJobInfoSubTab(sub)}
                        style={{
                          background: "none",
                          border: "none",
                          paddingBottom: "10px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          color: jobInfoSubTab === sub ? "#5b21b6" : "#64748b",
                          borderBottom: jobInfoSubTab === sub ? "3px solid #6d28d9" : "3px solid transparent",
                          cursor: "pointer"
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Log Timeline (Matching Screenshot 2) */}
                {jobInfoSubTab === "Activity" && (
                  <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "28px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {activityLogsSample.map((log, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                          <span style={{ color: "#94a3b8", fontSize: "1rem", marginTop: "2px" }}>✎</span>
                          <div>
                            <div style={{ fontSize: "0.86rem", color: "#334155" }}>
                              <strong style={{ color: "#1e293b" }}>{log.user}</strong> {log.action}
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: "2px" }}>
                              {log.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Requisitions Ghost Illustration (Matching Screenshot 3) */}
                {jobInfoSubTab === "Linked requisitions" && (
                  <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "60px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: "3.5rem", color: "#cbd5e1", marginBottom: "12px" }}>👻</div>
                    <p style={{ fontSize: "0.84rem", color: "#64748b", maxWidth: "420px", margin: "0 auto 20px auto", lineHeight: "1.5" }}>
                      Add requisition to ensure that job is aligned with defined requirements, facilitating efficient hiring process
                    </p>
                    <button style={{ background: "#6d28d9", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "0.84rem", fontWeight: "700", cursor: "pointer" }}>
                      + Add Requisition
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── SUB TAB 4: HIRING SETUP (Matching Screenshot 4) ── */}
            {jobSubTab === "Hiring Setup" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
                  <div style={{ display: "flex", gap: "24px" }}>
                    {["Application Form", "Hiring Team", "Hiring Flow", "Scorecard"].map(sub => (
                      <button
                        key={sub}
                        onClick={() => setHiringSetupSubTab(sub)}
                        style={{
                          background: "none",
                          border: "none",
                          paddingBottom: "10px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          color: hiringSetupSubTab === sub ? "#5b21b6" : "#64748b",
                          borderBottom: hiringSetupSubTab === sub ? "3px solid #6d28d9" : "3px solid transparent",
                          cursor: "pointer"
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scorecard Setup Panel (Matching Screenshot 4) */}
                {hiringSetupSubTab === "Scorecard" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "24px" }}>
                    {/* Left Hiring Flow Sidebar */}
                    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px" }}>
                      <h4 style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "12px" }}>Hiring flow</h4>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ background: "#f3e8ff", border: "1px solid #c084fc", borderRadius: "8px", padding: "12px" }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#5b21b6" }}>Sourced</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>◯ No scorecard</div>
                        </div>

                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#334155" }}>Screening</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>◯ No scorecard</div>
                        </div>

                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#334155" }}>Interview - Phase 1</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>◯ No scorecard</div>
                        </div>

                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#334155" }}>Interview - Phase 2</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>◯ No scorecard</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel Cards */}
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}>Scorecard - Sourced</h3>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div
                          onClick={() => setShowCreateScorecardModal(true)}
                          style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            padding: "40px 24px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#6d28d9"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                        >
                          <div style={{ fontSize: "2rem", color: "#6d28d9", marginBottom: "10px" }}>+</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#5b21b6" }}>Create new scorecard</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "6px", lineHeight: "1.5" }}>
                            Craft scorecard from scratch or import from our selection of pre-designed templates, the choice is yours!
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            padding: "40px 24px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#6d28d9"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                        >
                          <div style={{ fontSize: "1.8rem", color: "#6d28d9", marginBottom: "10px" }}>📥</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#5b21b6" }}>Import from another job</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "6px", lineHeight: "1.5" }}>
                            Import the scorecard as it is from another job, allowing for customisable sections
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ── CREATE JOB MODAL ── */}
      {showCreateJobModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "520px", maxWidth: "90vw" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1e293b", marginTop: 0 }}>+ Create New Job Opening</h2>
            <form onSubmit={handleCreateJobSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>Job Title</label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required placeholder="Ex: Store Operations Manager" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowCreateJobModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#6d28d9", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Create Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE SCORECARD MODAL (Matching Screenshot 5) ── */}
      {showCreateScorecardModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "720px", maxWidth: "95vw", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1e293b", margin: 0 }}>Create Scorecard</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={{ border: "1px solid #6d28d9", color: "#6d28d9", background: "#fff", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}>+ Import from Library</button>
                <button style={{ border: "1px solid #6d28d9", color: "#6d28d9", background: "#fff", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}>Save to library</button>
              </div>
            </div>

            <form onSubmit={handleCreateScorecardSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>Sections</label>
                <input
                  type="text"
                  value={scorecardSectionName}
                  onChange={e => setScorecardSectionName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", marginTop: "4px" }}
                />
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "700" }}>
                    <th style={{ padding: "8px 12px" }}>SKILL / QUESTION</th>
                    <th style={{ padding: "8px 12px" }}>INSTRUCTIONS TO INTERVIEWER</th>
                    <th style={{ padding: "8px 12px" }}>RESPONSE TYPE</th>
                    <th style={{ padding: "8px 12px" }}>MANDATORY</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        value={scorecardSkill}
                        onChange={e => setScorecardSkill(e.target.value)}
                        style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}
                      />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        value={scorecardInstruction}
                        onChange={e => setScorecardInstruction(e.target.value)}
                        style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}
                      />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <select
                        value={scorecardResponseType}
                        onChange={e => setScorecardResponseType(e.target.value)}
                        style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #6d28d9", color: "#5b21b6", fontWeight: "700" }}
                      >
                        <option value="Star rating">⭐ Star rating</option>
                        <option value="Radio (2-option)">🔘 Radio (2-option)</option>
                        <option value="Single select">∨ Single select</option>
                        <option value="Multi select">☑ Multi select</option>
                        <option value="Text">💬 Text</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="checkbox"
                        checked={scorecardMandatory}
                        onChange={e => setScorecardMandatory(e.target.checked)}
                        style={{ accentColor: "#6d28d9", width: "18px", height: "18px" }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowCreateScorecardModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="button" style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #6d28d9", color: "#6d28d9", background: "#fff", fontWeight: "700", cursor: "pointer" }}>preview</button>
                <button type="submit" style={{ padding: "8px 24px", borderRadius: "6px", border: "none", background: "#6d28d9", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
