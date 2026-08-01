import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { initialProjects } from "../data/initialData";
import logoImg from "../assets/logo.png";

// Base64 / URL-safe encryption for Project IDs in URL routes
const encryptProjectId = (id) => {
  if (!id) return "";
  try {
    return btoa(String(id)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return String(id);
  }
};

const decryptProjectId = (str) => {
  if (!str) return "";
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  } catch (e) {
    return str;
  }
};

export default function ProjectsView() {
  const params = useParams();
  const navigate = useNavigate();

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
    
    const defaultDetails = {
      companyName: proj.name || proj.client || "Sunehri Virasat",
      businessModel: "Pure Retailer",
      headOffice: "Mumbai, Delhi",
      showroomCount: "5",
      locations: "Mumbai, Jaipur, Delhi",
      headcount: "150",
      revenueBracket: "₹25 Cr - ₹50 Cr",
      productLine: "Fine Diamond Jewellery, High-Carat Gold Ornaments, Polki Solitaires",
      painPoints: ["Inventory", "Sales", "Manufacturing", "Finance", "Reporting"],
      purposeOfApproach: "Custom order tracking delays, designer-craftsman handoffs, vault shrinkage reconciliation.",
      primaryChallenge: "Describe how metal weight variance, inventory reconciliation, or sales tracking issues affect daily workflow...",
      staffMembers: [
        { name: proj.pocName || "Anant Sarraf", designation: "Managing Director", contact: proj.pocContact || "9876543233" },
        { name: "Ramesh Sharma", designation: "Head of Inventory & Vault", contact: "9812345678" }
      ],
      transformationOutcomes: [
        "Minimise Stock Shrinkage & Metal Leakage",
        "Boost Showroom Conversion & Average Bill Value (ABV)",
        "Real-time Showroom & Stock Ledger Reconciliation"
      ]
    };

    const defaultAuditDocs = [
      {
        id: "audit-1",
        title: "Phase 1-3 Preliminary Audit & Gap Analysis Report",
        category: "Site Audit Report",
        fileName: "ACME_Retail_Audit_Report_2026.pdf",
        fileType: "application/pdf",
        fileSize: "2.4 MB",
        uploadedAt: "2026-07-28",
        uploadedBy: "Darla Manikanta",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      },
      {
        id: "audit-2",
        title: "Vault Reconciliation & Metal Variance Sheet",
        category: "Vault Discrepancy Sheet",
        fileName: "Inventory_Vault_Discrepancy_Sheet.xlsx",
        fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSize: "840 KB",
        uploadedAt: "2026-07-29",
        uploadedBy: "Shikhar Jain",
        url: "#"
      }
    ];

    return {
      ...proj,
      clientVisits: proj.clientVisits || [],
      scheduledEvents: proj.scheduledEvents || [],
      checklists: proj.checklists || [],
      engagementPurpose: proj.engagementPurpose || "Client approached us for consulting advisory, audit, and growth strategy.",
      businessDetails: proj.businessDetails || defaultDetails,
      auditReports: proj.auditReports || defaultAuditDocs
    };
  };

  // Modal & View states
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeProjectTab, setActiveProjectTab] = useState("business"); // Defaults to Business Details!
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Business Details Form States
  const [isEditingBusinessDetails, setIsEditingBusinessDetails] = useState(false);
  const [bizStep, setBizStep] = useState(1);
  const [bizForm, setBizForm] = useState({
    companyName: "",
    headOffice: "",
    showroomCount: "",
    locations: "",
    headcount: "",
    revenueBracket: "Select Range...",
    businessModel: "Pure Retailer",
    productLine: "",
    painPoints: [],
    purposeOfApproach: "",
    primaryChallenge: "",
    staffMembers: [{ name: "", designation: "", contact: "" }],
    transformationOutcomes: []
  });

  // Audit Document Upload & Viewer Modal States
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("Site Audit Report");
  const [docFileName, setDocFileName] = useState("");
  const [docFileType, setDocFileType] = useState("");
  const [docFileSize, setDocFileSize] = useState("");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [viewingDoc, setViewingDoc] = useState(null); // Active document object being viewed in full reader!

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

  // Sync route URL parameter with selectedProject state securely
  useEffect(() => {
    if (params.projectId && projects.length > 0) {
      const decodedId = decryptProjectId(params.projectId);
      const matched = projects.find(p => 
        String(p.id) === String(params.projectId) || 
        String(p.id) === String(decodedId) || 
        (p.code && p.code.toLowerCase() === params.projectId.toLowerCase())
      );
      if (matched) {
        setSelectedProject(matched);
      }
    }
  }, [params.projectId, projects]);

  const handleSelectProject = (proj) => {
    const encId = encryptProjectId(proj.id);
    navigate(`/projects/${encId}`);
    setSelectedProject(proj);
  };

  const handleCloseProjectHub = () => {
    navigate('/projects');
    setSelectedProject(null);
  };

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

  // File upload change handler
  const handleFileUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFileName(file.name);
      setDocFileType(file.type || "PDF Document");
      setDocFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      setDocFileUrl(URL.createObjectURL(file));
    }
  };

  // Submit Handler for Audit Report Document Upload Form
  const handleUploadAuditReportSubmit = (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !selectedProject) return;

    const effective = getEffectiveProject(selectedProject);
    const newDoc = {
      id: `audit-${Date.now()}`,
      title: docTitle,
      category: docCategory,
      fileName: docFileName || "ACME_Audit_Report.pdf",
      fileType: docFileType || "application/pdf",
      fileSize: docFileSize || "1.5 MB",
      uploadedAt: new Date().toISOString().split("T")[0],
      uploadedBy: currentUser?.name || "Darla Manikanta",
      url: docFileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    };

    const existingDocs = effective.auditReports || [];
    const updatedDocs = [newDoc, ...existingDocs];

    updateProject(effective.id, {
      auditReports: updatedDocs
    });

    const updated = projects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject({ ...updated, auditReports: updatedDocs });

    setToast({ message: `Audit Report '${docTitle}' uploaded successfully!`, type: "success" });
    setDocTitle("");
    setDocFileName("");
    setShowDocUploadModal(false);
  };

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
      client: newName, // Clean client brand name
      pocName: pocName || "N/A",
      pocContact: pocContact || "9876543233",
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

  // ── SEPARATE PAGE VIEW FOR SELECTED PROJECT HUB (KEKA HR UI STYLE WORKSPACE) ──
  if (selectedProject) {
    const effectiveProject = getEffectiveProject(selectedProject);
    const linkedExps = expenses.filter(e => e.projectId === effectiveProject.id || e.projectName === effectiveProject.name);
    const bizDetails = effectiveProject.businessDetails || {};
    const auditDocs = effectiveProject.auditReports || [];
    const activeDoc = auditDocs[0] || null;

    // Helper initials for avatar (e.g. Sunehri Virasat -> SV)
    const getInitials = (name) => {
      if (!name) return "SV";
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    };

    // Header location calculation
    const locationName = (effectiveProject.location && effectiveProject.location !== "HQ / Client Site")
      ? effectiveProject.location 
      : (bizDetails.headOffice || (effectiveProject.code ? effectiveProject.code.split('-')[1] || "Abhor" : "Abhor"));
    
    // Header Title Format: Sunehri Virasat - Abhor
    const headerTitle = `${effectiveProject.name} - ${locationName}`;

    const handleSaveBusinessDetailsForm = () => {
      updateProject(effectiveProject.id, {
        businessDetails: bizForm
      });
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject({ ...updated, businessDetails: bizForm });
      setIsEditingBusinessDetails(false);
      setToast({ message: "Business details updated successfully!", type: "success" });
    };

    const handleStartEditBusiness = () => {
      setBizForm({
        companyName: bizDetails.companyName || effectiveProject.name || "",
        headOffice: bizDetails.headOffice || "",
        showroomCount: bizDetails.showroomCount || "",
        locations: bizDetails.locations || "",
        headcount: bizDetails.headcount || "",
        revenueBracket: bizDetails.revenueBracket || "Select Range...",
        businessModel: bizDetails.businessModel || "Pure Retailer",
        productLine: bizDetails.productLine || "",
        painPoints: bizDetails.painPoints || [],
        purposeOfApproach: bizDetails.purposeOfApproach || "",
        primaryChallenge: bizDetails.primaryChallenge || "",
        staffMembers: bizDetails.staffMembers && bizDetails.staffMembers.length > 0 
          ? bizDetails.staffMembers 
          : [{ name: effectiveProject.pocName || "Anant Sarraf", designation: "Managing Director", contact: effectiveProject.pocContact || "9876543233" }],
        transformationOutcomes: bizDetails.transformationOutcomes || []
      });
      setBizStep(1);
      setIsEditingBusinessDetails(true);
    };

    return (
      <div className="keka-project-view" style={{ padding: "0", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f5f7", fontFamily: "Inter, -apple-system, sans-serif", color: "#172b4d" }}>
        
        {/* ------------------------------------------------------------- */}
        {/* 1. KEKA HR STYLE UNIFIED TOP HEADER CARD                      */}
        {/* ------------------------------------------------------------- */}
        <div style={{ background: "#ffffff", padding: "20px 28px 0 28px", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          {/* TOP ROW: Initials Avatar Badge + Title + Code + Status + Actions */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Round Avatar Initials Badge */}
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)",
                color: "#ffffff",
                fontSize: "1.3rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(126, 34, 206, 0.25)"
              }}>
                {getInitials(effectiveProject.name)}
              </div>

              <div>
                {/* Clean Title Format: Sunehri Virasat - Abhor */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", color: "#0f172a" }}>
                    {headerTitle}
                  </h2>
                  <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}>
                    {effectiveProject.code || "SV-ABHOR"}
                  </span>
                  <span style={{
                    background: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#dcfce7" : "#fff7ed",
                    color: (effectiveProject.status || "Active").toLowerCase() === "active" ? "#16a34a" : "#d97706",
                    padding: "2px 10px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: "800"
                  }}>
                    ● {effectiveProject.status || "Active"}
                  </span>
                </div>

                {/* Subtitle with Owner & Nearby Contact Details */}
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span>Sourced from Client Intake by ACME on {effectiveProject.startDate || "2026-07-01"}</span>
                  <span>•</span>
                  <span>Owner: <strong style={{ color: "#0f172a" }}>{effectiveProject.owner || "Darla Manikanta"}</strong></span>
                  <button onClick={handleStartEditBusiness} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "700", padding: 0 }} title="Edit Business Details">✏️</button>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2563eb", fontWeight: "700" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {effectiveProject.pocContact || "9876543233"}
                  </span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#475569" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {effectiveProject.clientEmail || "poc@client.com"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons & Right Close ✕ Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Send Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </button>
              <button style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </button>
              
              <button
                onClick={handleCloseProjectHub}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.4rem",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px 8px",
                  marginLeft: "8px"
                }}
                title="Close Project Hub (Back to All Projects)"
              >
                ✕
              </button>
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* RED MARKED DETAILS CARD (MOVED INSIDE UPPER CARD ABOVE TAB BAR) */}
          {/* ------------------------------------------------------------- */}
          <div style={{ margin: "16px 0 14px 0", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "0.85rem", color: "#475569", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                <span style={{ color: "#64748b" }}>Business Model:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.businessModel || "Pure Retailer"}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ color: "#64748b" }}>HQ Location:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.headOffice || "Mumbai, Delhi"}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>
                <span style={{ color: "#64748b" }}>Showrooms:</span>
                <strong style={{ color: "#0f172a" }}>{bizDetails.showroomCount || "5"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>PRODUCT LINE / SKILLS:</span>
              {(bizDetails.productLine ? bizDetails.productLine.split(",") : ["Fine Diamond Jewellery", "High-Carat Gold Ornaments", "Polki Solitaires"]).map((tag, tIdx) => (
                <span key={tIdx} style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* GREEN MARKED AREA: UNDERLINE TAB BAR (AT BOTTOM OF UPPER CARD) */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "flex", gap: "24px", borderTop: "1px solid #f1f5f9", paddingTop: "10px", overflowX: "auto" }}>
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
                  background: "none",
                  border: "none",
                  borderBottom: activeProjectTab === tab.id ? "3px solid #2563eb" : "3px solid transparent",
                  color: activeProjectTab === tab.id ? "#2563eb" : "#64748b",
                  fontWeight: activeProjectTab === tab.id ? "800" : "600",
                  fontSize: "0.88rem",
                  paddingBottom: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. KEKA HR SPLIT GRID WORKSPACE (70% LEFT MAIN + 30% RIGHT PANEL) */}
        {/* ------------------------------------------------------------- */}
        <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          
          {/* LEFT COLUMN: MAIN TAB CONTENT (70%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* TAB 1: BUSINESS DETAILS */}
            {activeProjectTab === "business" && (
              <div>
                {isEditingBusinessDetails ? (
                  /* 5-SECTION STEPPER INTAKE FORM */
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {/* Stepper Progress Bar (1 to 5) */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", padding: "0 10px" }}>
                      <div style={{ position: "absolute", top: "18px", left: "40px", right: "40px", height: "2px", background: "#e2e8f0", zIndex: 0 }} />
                      {[
                        { num: 1, name: "General Info" },
                        { num: 2, name: "Pain Points" },
                        { num: 3, name: "Challenges" },
                        { num: 4, name: "Staff Details" },
                        { num: 5, name: "Outcomes" }
                      ].map(s => (
                        <div key={s.num} style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: bizStep === s.num ? "#2563eb" : (bizStep > s.num ? "#16a34a" : "#ffffff"),
                            color: bizStep >= s.num ? "#ffffff" : "#64748b",
                            border: `2px solid ${bizStep === s.num ? "#2563eb" : (bizStep > s.num ? "#16a34a" : "#cbd5e1")}`,
                            display: "flex",
                            alignItems: "center",
                            justify: "center",
                            fontWeight: "800",
                            fontSize: "0.95rem"
                          }}>
                            {bizStep > s.num ? "✓" : s.num}
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: bizStep === s.num ? "800" : "600", color: bizStep === s.num ? "#2563eb" : "#64748b" }}>
                            {s.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* SECTION 1: GENERAL BUSINESS INFORMATION */}
                    {bizStep === 1 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Section 1: General Business Information</h3>
                        
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>JEWELLERY / BRAND COMPANY NAME</label>
                          <input type="text" value={bizForm.companyName} onChange={e => setBizForm({...bizForm, companyName: e.target.value})} placeholder="e.g. Diamond Atelier" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>HEAD OFFICE LOCATION (CITY)</label>
                            <input type="text" value={bizForm.headOffice} onChange={e => setBizForm({...bizForm, headOffice: e.target.value})} placeholder="e.g. Mumbai, Delhi" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>BOUTIQUE / SHOWROOM COUNT</label>
                            <input type="text" value={bizForm.showroomCount} onChange={e => setBizForm({...bizForm, showroomCount: e.target.value})} placeholder="e.g. 5" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>BOUTIQUE & ATELIER BRANCH LOCATIONS</label>
                          <input type="text" value={bizForm.locations} onChange={e => setBizForm({...bizForm, locations: e.target.value})} placeholder="Type city names (e.g. Mumbai, Jaipur, Delhi NCR)..." style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>HEADCOUNT / EMPLOYEES</label>
                            <input type="text" value={bizForm.headcount} onChange={e => setBizForm({...bizForm, headcount: e.target.value})} placeholder="e.g. 150" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>ANNUAL REVENUE BRACKET (INR)</label>
                            <select value={bizForm.revenueBracket} onChange={e => setBizForm({...bizForm, revenueBracket: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}>
                              <option>Select Range...</option>
                              <option>Under ₹5 Cr</option>
                              <option>₹5 Cr - ₹25 Cr</option>
                              <option>₹25 Cr - ₹50 Cr</option>
                              <option>₹50 Cr - ₹100 Cr</option>
                              <option>Above ₹100 Cr</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>PRIMARY BUSINESS MODEL</label>
                          <select value={bizForm.businessModel} onChange={e => setBizForm({...bizForm, businessModel: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}>
                            <option>Pure Retailer</option>
                            <option>Wholesaler</option>
                            <option>Manufacturer</option>
                            <option>Omnichannel Retail + Wholesale</option>
                            <option>Bespoke Atelier</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>LINE OF BUSINESS / PRODUCT LINE</label>
                          <input type="text" value={bizForm.productLine} onChange={e => setBizForm({...bizForm, productLine: e.target.value})} placeholder="e.g. Fine Diamond Jewellery, Solitaires, Polki & Gold" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: CORE OPERATIONAL PAIN POINTS */}
                    {bizStep === 2 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Section 2: Core Operational Pain Points</h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Select all areas where your brand experiences operational friction or losses:</p>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          {["Inventory", "Sales", "Manufacturing", "CRM", "HR", "Finance", "Marketing", "Procurement", "Reporting"].map(area => (
                            <label key={area} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#0f172a", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={bizForm.painPoints.includes(area)}
                                onChange={e => {
                                  if (e.target.checked) setBizForm({...bizForm, painPoints: [...bizForm.painPoints, area]});
                                  else setBizForm({...bizForm, painPoints: bizForm.painPoints.filter(p => p !== area)});
                                }}
                              />
                              {area}
                            </label>
                          ))}
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>PURPOSE OF APPROACH</label>
                          <textarea rows="3" value={bizForm.purposeOfApproach} onChange={e => setBizForm({...bizForm, purposeOfApproach: e.target.value})} placeholder="e.g. Custom order tracking delays, designer-craftsman handoffs..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                        </div>
                      </div>
                    )}

                    {/* SECTION 3: PRIMARY CHALLENGES */}
                    {bizStep === 3 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Section 3: Primary Challenges</h3>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>DESCRIBE YOUR BIGGEST OPERATIONAL CHALLENGE</label>
                          <textarea rows="5" value={bizForm.primaryChallenge} onChange={e => setBizForm({...bizForm, primaryChallenge: e.target.value})} placeholder="Describe how metal weight variance, inventory reconciliation, or sales tracking issues affect your daily workflow..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                        </div>
                      </div>
                    )}

                    {/* SECTION 4: STAFF & TEAM DETAILS */}
                    {bizStep === 4 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Section 4: Staff & Team Member Details</h3>
                          <button
                            type="button"
                            onClick={() => setBizForm({...bizForm, staffMembers: [...bizForm.staffMembers, { name: "", designation: "", contact: "" }]})}
                            style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "6px 12px", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            + Add Staff Row
                          </button>
                        </div>

                        {bizForm.staffMembers.map((staff, idx) => (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px", gap: "10px", alignItems: "center" }}>
                            <input type="text" placeholder="Name (e.g. Anant Sarraf)" value={staff.name} onChange={e => {
                              const updated = [...bizForm.staffMembers];
                              updated[idx].name = e.target.value;
                              setBizForm({...bizForm, staffMembers: updated});
                            }} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />

                            <input type="text" placeholder="Designation (e.g. Store Manager)" value={staff.designation} onChange={e => {
                              const updated = [...bizForm.staffMembers];
                              updated[idx].designation = e.target.value;
                              setBizForm({...bizForm, staffMembers: updated});
                            }} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />

                            <input type="text" placeholder="Contact Phone" value={staff.contact} onChange={e => {
                              const updated = [...bizForm.staffMembers];
                              updated[idx].contact = e.target.value;
                              setBizForm({...bizForm, staffMembers: updated});
                            }} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />

                            <button
                              type="button"
                              onClick={() => {
                                const updated = bizForm.staffMembers.filter((_, i) => i !== idx);
                                setBizForm({...bizForm, staffMembers: updated});
                              }}
                              style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px", cursor: "pointer", fontWeight: "700" }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SECTION 5: EXPECTED TRANSFORMATION OUTCOMES */}
                    {bizStep === 5 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Section 5: Expected Transformation Outcomes</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          {[
                            "Minimise Stock Shrinkage & Metal Leakage",
                            "Boost Showroom Conversion & Average Bill Value (ABV)",
                            "Real-time Showroom & Stock Ledger Reconciliation",
                            "Atelier Digitization & Job Card Weight-Tracking",
                            "Standardise Showroom & Vault Operations Compliance",
                            "Reduce Metal Melting & Handcrafting Wastage"
                          ].map(outcome => (
                            <label key={outcome} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#0f172a", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={bizForm.transformationOutcomes.includes(outcome)}
                                onChange={e => {
                                  if (e.target.checked) setBizForm({...bizForm, transformationOutcomes: [...bizForm.transformationOutcomes, outcome]});
                                  else setBizForm({...bizForm, transformationOutcomes: bizForm.transformationOutcomes.filter(t => t !== outcome)});
                                }}
                              />
                              {outcome}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Form Navigation Controls */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (bizStep > 1) setBizStep(bizStep - 1);
                          else setIsEditingBusinessDetails(false);
                        }}
                        style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                      >
                        {bizStep === 1 ? "Cancel" : "Back"}
                      </button>

                      {bizStep < 5 ? (
                        <button
                          type="button"
                          onClick={() => setBizStep(bizStep + 1)}
                          style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveBusinessDetailsForm}
                          style={{ background: "#16a34a", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                        >
                          Save Business Details ✓
                        </button>
                      )}
                    </div>

                  </div>
                ) : (
                  /* STRUCTURED PROFILE DISPLAY CARD */
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                        Business Profile & Operational Structure
                      </h3>

                      <button
                        onClick={handleStartEditBusiness}
                        style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "8px 16px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        ✏️ Edit Business Details
                      </button>
                    </div>

                    {/* Business Grid Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>PRIMARY BUSINESS MODEL</span>
                        <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#2563eb" }}>
                          {bizDetails.businessModel || "Pure Retailer"}
                        </p>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>BOUTIQUES & HEAD OFFICE</span>
                        <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                          {bizDetails.showroomCount || "5"} Showrooms ({bizDetails.headOffice || "Mumbai"})
                        </p>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>ANNUAL REVENUE & HEADCOUNT</span>
                        <p style={{ margin: "6px 0 0 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                          {bizDetails.revenueBracket || "₹25 Cr - ₹50 Cr"} ({bizDetails.headcount || "150"} Staff)
                        </p>
                      </div>
                    </div>

                    {/* Staff Roster Table */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", background: "#ffffff" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Key Executive & Staff Details Roster</h4>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                            <th style={{ padding: "8px" }}>Name</th>
                            <th style={{ padding: "8px" }}>Designation</th>
                            <th style={{ padding: "8px" }}>Contact Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(bizDetails.staffMembers || [
                            { name: effectiveProject.pocName || "Anant Sarraf", designation: "Managing Director", contact: effectiveProject.pocContact || "9876543210" }
                          ]).map((s, sIdx) => (
                            <tr key={sIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px", fontWeight: "700", color: "#0f172a" }}>{s.name}</td>
                              <td style={{ padding: "8px", color: "#2563eb", fontWeight: "600" }}>{s.designation}</td>
                              <td style={{ padding: "8px", color: "#475569" }}>📞 {s.contact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Purpose & Challenges Card */}
                    <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", padding: "18px", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: "800", color: "#1e3a8a" }}>
                        Engagement Purpose & Primary Operational Challenges
                      </h4>
                      <p style={{ margin: "0 0 10px 0", fontSize: "0.88rem", color: "#1e40af", lineHeight: "1.5" }}>
                        {bizDetails.purposeOfApproach || effectiveProject.engagementPurpose || "Client approached for consulting advisory, stock reconciliation, and retail growth."}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e3a8a", fontStyle: "italic" }}>
                        "Challenge: {bizDetails.primaryChallenge || "Describe how metal weight variance, inventory reconciliation, or sales tracking issues affect daily workflow..."}"
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AUDIT REPORT (KEKA HR EMBEDDED RESUME VIEWER STYLE) */}
            {activeProjectTab === "audit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* 8-Phase Audit Progress */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                      8-PHASE IMPLEMENTATION AUDIT PROGRESS
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "800" }}>Phase 4 (Process Design)</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                    {[
                      { num: 1, title: "Vision Alignment", status: "Completed", color: "#16a34a", bg: "#f0fdf4" },
                      { num: 2, title: "Business Audit", status: "Completed", color: "#16a34a", bg: "#f0fdf4" },
                      { num: 3, title: "Gap Analysis", status: "Completed", color: "#16a34a", bg: "#f0fdf4" },
                      { num: 4, title: "Process Design", status: "In Progress (65%)", color: "#2563eb", bg: "#eff6ff" }
                    ].map(p => (
                      <div key={p.num} style={{ background: p.bg, border: `1px solid ${p.color}40`, borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: "800", color: p.color }}>PHASE {p.num}</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{p.title}</div>
                        <div style={{ fontSize: "0.7rem", color: p.color, fontWeight: "700" }}>{p.status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KEKA HR STYLE EMBEDDED DOCUMENT READER (RESUME VIEWER) */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
                  
                  {/* Document View Header Strip (Matches Resume Header in Keka Screenshot) */}
                  <div style={{ background: "#f8fafc", padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontWeight: "800", fontSize: "0.75rem" }}>
                        PDF AUDIT REPORT
                      </span>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                        {activeDoc ? activeDoc.title : "Phase 1-3 Preliminary Audit Report"}
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {activeDoc ? activeDoc.fileName : "ACME_Retail_Audit_Report_2026.pdf"}
                      </span>
                      
                      <button
                        onClick={() => setShowDocUploadModal(true)}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}
                      >
                        + Upload New Report
                      </button>
                    </div>
                  </div>

                  {/* EMBEDDED DOCUMENT CANVAS (FULL-WIDTH DOCUMENT PREVIEW) */}
                  <div style={{ padding: "20px", background: "#f1f5f9", minHeight: "500px", display: "flex", justifyContent: "center" }}>
                    <div style={{ width: "100%", maxWidth: "800px", background: "#ffffff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "40px", fontFamily: "Georgia, serif", color: "#1e293b", lineHeight: "1.7" }}>
                      
                      {/* Document Sheet Visual Header */}
                      <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "20px", marginBottom: "24px", textAlign: "center" }}>
                        <h1 style={{ margin: "0 0 6px 0", fontSize: "1.6rem", fontWeight: "900", letterSpacing: "1px", color: "#0f172a" }}>
                          ACME WORKCENTRE ADVISORY
                        </h1>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#2563eb" }}>
                          RETAIL AUDIT & VAULT RECONCILIATION REPORT
                        </h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b", fontFamily: "sans-serif" }}>
                          Client: <strong>{effectiveProject.client || "Heerabhai Jewellers"}</strong> • Code: {effectiveProject.code || "PROJ-TEST-01"} • Date: {new Date().toLocaleDateString()}
                        </p>
                      </div>

                      {/* Document Content Paragraphs */}
                      <div style={{ fontSize: "0.95rem" }}>
                        <h4 style={{ margin: "16px 0 8px 0", color: "#0f172a", fontFamily: "sans-serif", fontWeight: "800" }}>1. Executive Summary & Audit Observations</h4>
                        <p>
                          During our comprehensive site audit across showrooms and handcrafting ateliers, ACME Workcentre advisory team identified key operational friction in inventory reconciliation between POS sales ledgers and vault stock counts.
                        </p>

                        <h4 style={{ margin: "16px 0 8px 0", color: "#0f172a", fontFamily: "sans-serif", fontWeight: "800" }}>2. Core Findings & Variance Breakdown</h4>
                        <ul style={{ paddingLeft: "20px" }}>
                          <li><strong>Metal Weight Variance:</strong> 3.4% unaccounted variance between raw casting and finished job cards.</li>
                          <li><strong>Vault Reconciliation:</strong> Manual physical tag counts take 14 hours per month; digitization advised.</li>
                          <li><strong>Sales Upselling:</strong> Counter staff average bill value (ABV) can increase 18% via standardized script coaching.</li>
                        </ul>

                        <h4 style={{ margin: "16px 0 8px 0", color: "#0f172a", fontFamily: "sans-serif", fontWeight: "800" }}>3. Action Plan & Implementation Roadmap</h4>
                        <p>
                          Deployment of RFID vault scanners, real-time weight tracking job cards, and digital POS reconciliation is recommended for Phase 4 rollout.
                        </p>

                        <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b", fontFamily: "sans-serif" }}>
                          <span>Prepared by: Lead Systems Auditor</span>
                          <span>Verified by: Principal Advisor</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* OTHER TABS (PLAN, TASKS, VISITS, DOCUMENTS, TEAM, DISCUSSIONS, EXPENSES) */}
            {activeProjectTab === "plan" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>Project Implementation Plan Roadmap</h3>
                <div style={{ width: "100%", height: "12px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                  <div style={{ width: "75%", height: "100%", background: "#2563eb" }} />
                </div>
              </div>
            )}

            {activeProjectTab === "tasks" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Scheduled Tasks & Event Planner (14)</h3>
                  <button onClick={() => setShowEventModal(true)} style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>+ Add Task</button>
                </div>
              </div>
            )}

            {activeProjectTab === "visits" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Client Site Visits (5)</h3>
                  <button onClick={() => setShowVisitModal(true)} style={{ background: "#059669", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>+ Record Visit</button>
                </div>
              </div>
            )}

            {activeProjectTab === "documents" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Documents & Deliverables Repository</h3>
              </div>
            )}

            {activeProjectTab === "team" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Assigned Business Consultants & Team</h3>
              </div>
            )}

            {activeProjectTab === "discussions" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Discussions & Team Activity Logs</h3>
              </div>
            )}

            {activeProjectTab === "expenses" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Linked Expenses Billed to Project</h3>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: KEKA-STYLE PROJECT NOTES & QUICK ACTIONS PANEL (30%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Keka HR Style Notes Panel (Matches Right Card in Screenshot) */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", minHeight: "380px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "#f8fafc", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>No notes added for this project</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>All client activity & meeting notes will appear here</p>

              <form onSubmit={handlePostDiscussion} style={{ width: "100%", marginTop: "20px" }}>
                <textarea
                  rows="2"
                  placeholder="Add a quick note or update..."
                  value={discText}
                  onChange={e => setDiscText(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "8px" }}
                />
                <button type="submit" style={{ width: "100%", background: "#2563eb", color: "#ffffff", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer" }}>
                  + Post Project Note
                </button>
              </form>
            </div>

            {/* Quick Actions Shortcuts */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
              <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>⚡ QUICK ACTIONS</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "+ Add Task", action: () => setShowEventModal(true), bg: "#eff6ff", color: "#2563eb" },
                  { label: "+ Schedule Visit", action: () => setShowVisitModal(true), bg: "#ecfdf5", color: "#059669" },
                  { label: "+ Upload Document", action: () => setShowDocUploadModal(true), bg: "#f5f3ff", color: "#7c3aed" },
                  { label: "+ Create Meeting", action: () => setShowEventModal(true), bg: "#fff7ed", color: "#c2410c" },
                  { label: "+ Add Risk", action: () => alert("Add Risk..."), bg: "#fef2f2", color: "#b91c1c" }
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    style={{ padding: "9px 12px", background: btn.bg, color: btn.color, border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer", textAlign: "left" }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. MODALS (UPLOAD DOCUMENT MODAL)                             */}
        {/* ------------------------------------------------------------- */}
        {showDocUploadModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div style={{ background: "#ffffff", width: "100%", maxWidth: "480px", borderRadius: "14px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Upload Audit Document</h3>
                <button onClick={() => setShowDocUploadModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <form onSubmit={handleUploadAuditReportSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>Document Title</label>
                  <input type="text" required value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="e.g. Vault Inventory Reconciliation Sheet" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>Category</label>
                  <select value={docCategory} onChange={e => setDocCategory(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}>
                    <option>Site Audit Report</option>
                    <option>Vault Discrepancy Sheet</option>
                    <option>Process SOP Guidelines</option>
                    <option>Compliance Certificate</option>
                    <option>Financial Ledger</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>Select File (PDF, Image, Excel, Word)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUploadChange}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                  {docFileName && <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: "700", marginTop: "4px" }}>Selected: {docFileName} ({docFileSize})</div>}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setShowDocUploadModal(false)} style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>Upload Document</button>
                </div>
              </form>
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
              onClick={() => { handleSelectProject(proj); setActiveProjectTab("business"); }}
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
                    handleSelectProject(proj);
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
