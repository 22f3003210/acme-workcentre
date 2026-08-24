import React, { useState, useRef, useEffect } from "react";

export default function AuditChecklistAndVisitPlanner({
  project,
  users = [],
  currentUser,
  onUpdateProject,
  setToast
}) {
  const fileInputRef = useRef(null);

  // Existing uploaded checklist files
  const checklistFiles = project.auditChecklistFiles || project.audit_checklist_files || [];
  
  // Existing audit planning data
  const planning = project.auditPlanning || project.audit_planning || {};
  const bizDetails = project.businessDetails || {};
  const registeredLocs = project.locationsList || project.locations_registry || bizDetails.registeredLocations || [];

  // Form states for Visit Planning
  const [startDate, setStartDate] = useState(planning.startDate || project.startDate || "2026-08-01");
  const [endDate, setEndDate] = useState(planning.endDate || project.endDate || "2026-08-05");
  const [leadAuditor, setLeadAuditor] = useState(
    planning.leadAuditor || project.assignedConsultantName || "Darla Manikanta"
  );
  const [assignedAuditors, setAssignedAuditors] = useState(
    project.assignedAuditors || (project.assignedConsultants?.length ? project.assignedConsultants : [planning.leadAuditor || "Darla Manikanta"])
  );
  const [siteLocation, setSiteLocation] = useState(
    planning.siteLocation || bizDetails.headOffice || project.location || "Main Store HQ"
  );
  const [scopeFocus, setScopeFocus] = useState(
    planning.scopeFocus || "Physical gross vs net weight verification, Solitaire IGI certificates, Daily POS ledger reconciliation, and Vault security protocols."
  );
  const [logisticsNotes, setLogisticsNotes] = useState(
    planning.logisticsNotes || "Flight and hotel stay arrangements confirmed. Local store coordinator: Boutique Manager."
  );

  // Sync state when project changes
  useEffect(() => {
    const p = project.auditPlanning || project.audit_planning || {};
    if (p.startDate) setStartDate(p.startDate);
    if (p.endDate) setEndDate(p.endDate);
    if (p.leadAuditor) setLeadAuditor(p.leadAuditor);
    if (p.siteLocation) setSiteLocation(p.siteLocation);
    if (p.scopeFocus) setScopeFocus(p.scopeFocus);
    if (p.logisticsNotes) setLogisticsNotes(p.logisticsNotes);
    if (project.assignedAuditors) setAssignedAuditors(project.assignedAuditors);
  }, [project.id]);

  // Handle Checklist File Upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let processedCount = 0;
    const newDocItems = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const fileDataUrl = evt.target.result;
        const ext = file.name.split(".").pop().toLowerCase();
        
        let typeLabel = "DOCUMENT";
        if (["xlsx", "xls", "csv"].includes(ext)) typeLabel = "EXCEL";
        else if (["pdf"].includes(ext)) typeLabel = "PDF";
        else if (["doc", "docx"].includes(ext)) typeLabel = "WORD";
        else if (["png", "jpg", "jpeg"].includes(ext)) typeLabel = "IMAGE";

        newDocItems.push({
          id: `chk-file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileType: typeLabel,
          uploadedAt: new Date().toISOString().split("T")[0],
          uploadedBy: currentUser?.name || "Lead Auditor",
          dataUrl: fileDataUrl
        });

        processedCount++;
        if (processedCount === files.length) {
          const updatedList = [...checklistFiles, ...newDocItems];
          onUpdateProject(project.id, {
            auditChecklistFiles: updatedList
          });
          if (typeof setToast === "function") {
            setToast({
              message: `Uploaded ${newDocItems.length} checklist document(s) successfully!`,
              type: "success"
            });
          }
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Remove Checklist File
  const handleRemoveFile = (fileId, e) => {
    if (e) e.stopPropagation();
    const updatedList = checklistFiles.filter((f) => f.id !== fileId);
    onUpdateProject(project.id, {
      auditChecklistFiles: updatedList
    });
    if (typeof setToast === "function") {
      setToast({ message: "Checklist file removed.", type: "info" });
    }
  };

  // Toggle Auditor from Team List
  const handleToggleAuditor = (auditorName) => {
    if (assignedAuditors.includes(auditorName)) {
      if (assignedAuditors.length === 1) {
        if (typeof setToast === "function") setToast({ message: "At least one auditor must remain assigned.", type: "warning" });
        return;
      }
      setAssignedAuditors(assignedAuditors.filter((a) => a !== auditorName));
    } else {
      setAssignedAuditors([...assignedAuditors, auditorName]);
    }
  };

  // Save On-Site Visit Planning & Logistics
  const handleSaveVisitPlan = (e) => {
    if (e) e.preventDefault();

    const updatedPlanning = {
      startDate,
      endDate,
      leadAuditor,
      siteLocation,
      scopeFocus,
      logisticsNotes,
      updatedAt: new Date().toISOString()
    };

    onUpdateProject(project.id, {
      auditPlanning: updatedPlanning,
      assignedAuditors,
      assignedConsultantName: leadAuditor
    });

    if (typeof setToast === "function") {
      setToast({
        message: "✓ On-Site Visit Plan & Auditor Assignment saved successfully!",
        type: "success"
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. INTERNAL AUDIT CHECKLIST & PREPARATION DOCUMENTS UPLOAD    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  <path d="m9 14 2 2 4-4"/>
                </svg>
              </div>
              <span>Internal Audit Checklist & Field Preparation Documents</span>
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Upload operational checklist spreadsheets, inventory verification sheets, audit templates, and site guidelines.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg,.csv"
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                padding: "9px 18px",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                transition: "all 0.15s ease"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>+ Upload Checklist / File</span>
            </button>
          </div>
        </div>

        {/* Uploaded Checklist Files List */}
        {checklistFiles.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {checklistFiles.map((file) => {
              const isExcel = file.fileType === "EXCEL" || file.name.match(/\.(xlsx|xls|csv)$/i);
              const isPdf = file.fileType === "PDF" || file.name.match(/\.pdf$/i);
              const isWord = file.fileType === "WORD" || file.name.match(/\.(docx|doc)$/i);
              
              const badgeBg = isExcel ? "#dcfce7" : isPdf ? "#fee2e2" : isWord ? "#e0e7ff" : "#f1f5f9";
              const badgeColor = isExcel ? "#15803d" : isPdf ? "#dc2626" : isWord ? "#4338ca" : "#475569";
              const iconLabel = isExcel ? "XLSX" : isPdf ? "PDF" : isWord ? "DOCX" : "FILE";

              return (
                <div
                  key={file.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "10px",
                    transition: "transform 0.1s ease, box-shadow 0.1s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        background: badgeBg,
                        color: badgeColor,
                        fontWeight: "800",
                        fontSize: "0.7rem",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {iconLabel}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: "700",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        {file.fileSize || "120 KB"} • Uploaded {file.uploadedAt || "Today"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "600" }}>
                      By {file.uploadedBy || "Auditor"}
                    </span>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {file.dataUrl && (
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            color: "#2563eb",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleRemoveFile(file.id, e)}
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          color: "#dc2626",
                          cursor: "pointer"
                        }}
                        title="Delete File"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              background: "#f8fafc",
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "36px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s ease"
            }}
          >
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: "800", color: "#0f172a" }}>
              No custom checklist files uploaded yet
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", maxWidth: "450px" }}>
              Click here to upload your customized boutique audit checklist, excel count sheet, or operational evaluation guidelines (.xlsx, .pdf, .docx).
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DYNAMIC ON-SITE VISIT PLANNING & AUDITOR ASSIGNMENT FORM   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSaveVisitPlan}
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: "800", color: "#0f172a" }}>
                On-Site Visit Planning & Auditor Assignment
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                Assign lead auditors, schedule on-site visit dates, designate the target store/facility location, and set field objectives.
              </p>
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "#ffffff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 3px 10px rgba(22, 163, 74, 0.25)",
              transition: "all 0.15s ease"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>Save & Update Visit Plan</span>
          </button>
        </div>

        {/* Row 1: Planned Dates & Location */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              PLANNED AUDIT START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                boxSizing: "border-box",
                fontWeight: "600",
                background: "#ffffff"
              }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              PLANNED AUDIT END DATE
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                boxSizing: "border-box",
                fontWeight: "600",
                background: "#ffffff"
              }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              TARGET SITE LOCATION / STORE
            </label>
            {registeredLocs.length > 0 ? (
              <select
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                  fontWeight: "600",
                  background: "#ffffff"
                }}
              >
                {registeredLocs.map((loc, idx) => (
                  <option key={idx} value={loc.name || loc.city || loc.address || `Location ${idx + 1}`}>
                    {loc.name || loc.city || loc.address || `Location ${idx + 1}`} ({loc.locationType || "Showroom"})
                  </option>
                ))}
                <option value={bizDetails.headOffice || project.location || "Main Store HQ"}>
                  {bizDetails.headOffice || project.location || "Main Store HQ"}
                </option>
              </select>
            ) : (
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                placeholder="e.g. Hyderabad Flagship Showroom"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                  fontWeight: "600",
                  background: "#ffffff"
                }}
              />
            )}
          </div>
        </div>

        {/* Row 2: Auditor Assignment & Team Multi-Select */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px" }}>
          {/* Primary Lead Auditor */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              LEAD AUDITOR (PRIMARY IN-CHARGE)
            </label>
            <select
              value={leadAuditor}
              onChange={(e) => {
                setLeadAuditor(e.target.value);
                if (!assignedAuditors.includes(e.target.value)) {
                  setAssignedAuditors([...assignedAuditors, e.target.value]);
                }
              }}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                boxSizing: "border-box",
                fontWeight: "600",
                background: "#ffffff"
              }}
            >
              {(users || []).map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role || "Consultant"})
                </option>
              ))}
              {(!users || users.length === 0) && (
                <option value="Darla Manikanta">Darla Manikanta (Lead Auditor)</option>
              )}
            </select>
          </div>

          {/* Assigned Audit Team / Accompanying Auditors */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ASSIGNED AUDITOR(S) & CONSULTANT TEAM
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", minHeight: "42px", alignItems: "center" }}>
              {(users || []).map((u) => {
                const isSelected = assignedAuditors.includes(u.name);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleAuditor(u.name)}
                    style={{
                      background: isSelected ? "#4f46e5" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#475569",
                      border: isSelected ? "1px solid #4f46e5" : "1px solid #cbd5e1",
                      borderRadius: "16px",
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: isSelected ? "700" : "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.1s ease"
                    }}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Audit Scope Focus & Logistics Notes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ON-SITE AUDIT SCOPE & OPERATIONAL FOCUS
            </label>
            <textarea
              rows={3}
              value={scopeFocus}
              onChange={(e) => setScopeFocus(e.target.value)}
              placeholder="e.g. Physical inventory count, BIS hallmarking purity check, POS sales audit..."
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                lineHeight: "1.5",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
                background: "#ffffff"
              }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              TRAVEL, ACCOMMODATION & LOGISTICS ARRANGEMENTS
            </label>
            <textarea
              rows={3}
              value={logisticsNotes}
              onChange={(e) => setLogisticsNotes(e.target.value)}
              placeholder="e.g. Flight booking ref, Hotel stay at Vivanta, Local coordinator contact details..."
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                lineHeight: "1.5",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
                background: "#ffffff"
              }}
            />
          </div>
        </div>

      </form>
    </div>
  );
}
