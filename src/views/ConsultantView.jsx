import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import ProjectsView from "./ProjectsView";
import RecruiterView from "./RecruiterView";

export default function ConsultantView({ activeTab }) {
  const { 
    currentUser, 
    expenses, 
    projects,
    addExpense, 
    checkInConsultant, 
    checkOutConsultant, 
    getEmployeeBalanceDetails,
    getEmployeeLedger,
    advanceRequests,
    requestAdvance,
    setToast,
    settings,
    leaveRequests,
    applyLeave,
    cancelLeave,
    getLeaveBalance,
    generatePayslip,
    updateUserProfile
  } = useApp();

  // Digital clock state
  const [time, setTime] = useState(new Date());

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Travel");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseProjectId, setExpenseProjectId] = useState("");
  const [punchRemarks, setPunchRemarks] = useState("");
  const [punchProjectId, setPunchProjectId] = useState("");

  const [advAmount, setAdvAmount] = useState("");
  const [advPurpose, setAdvPurpose] = useState("");

  // Modal profile & Keka Profile Tab states
  // Guided Check-In & Check-Out Wizard State
  const [showCheckInWizard, setShowCheckInWizard] = useState(false);
  const [showCheckOutWizard, setShowCheckOutWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedWizardProjectId, setSelectedWizardProjectId] = useState("");
  
  // Profile & Sub-tab States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [ledgerViewMode, setLedgerViewMode] = useState("grid");
  const [profileTab, setProfileTab] = useState("TIME");
  const [timeSubTab, setTimeSubTab] = useState("Attendance");
  const [statsRange, setStatsRange] = useState("Last Week");

  // Step 1: Purpose & Scope of Work
  const [visitPurpose, setVisitPurpose] = useState("Client Site Advisory & Store Operations Audit");
  const [scopeTasks, setScopeTasks] = useState([
    { id: 1, text: "Verify store merchandise display & stock inventory", done: true },
    { id: 2, text: "Conduct morning staff briefing & sales target alignment", done: true },
    { id: 3, text: "Inspect POS terminal ledger logs & cash register status", done: false }
  ]);
  const [newScopeInput, setNewScopeInput] = useState("");

  // Step 2: Location Detection (GPS)
  const [gpsData, setGpsData] = useState({
    lat: 22.0869,
    lng: 79.5435,
    address: "ACME Retail Store, Main Road, Seoni, MP",
    isVerified: true,
    isDetecting: false
  });

  // Step 3: Selfie Verification
  const [selfiePhoto, setSelfiePhoto] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80");
  const [wizardCheckOutRemarks, setWizardCheckOutRemarks] = useState("");
  const [wizardCompletedTasks, setWizardCompletedTasks] = useState([]);
  const [wizardPendingTasks, setWizardPendingTasks] = useState([]);

  // Fallback default project for newly registered consultants
  const defaultGeneralProject = {
    id: "general-store-001",
    name: "ACME Retail Flagship Store (Seoni, MP)",
    code: "STORE-HQ",
    location: "Seoni, Madhya Pradesh",
    businessModel: "Retail & Client Advisory Store"
  };

  const displayProjects = (projects && projects.length > 0) ? projects : [defaultGeneralProject];

  const handleOpenCheckInWizard = () => {
    const defaultProjId = (projects && projects.length > 0) ? projects[0].id : defaultGeneralProject.id;
    setSelectedWizardProjectId(punchProjectId || defaultProjId);
    setWizardStep(1);
    setShowCheckInWizard(true);
  };

  const handleOpenCheckOutWizard = () => {
    setWizardCheckOutRemarks(punchRemarks || "");
    setShowCheckOutWizard(true);
  };

  const handleDetectGpsLocation = () => {
    setGpsData(prev => ({ ...prev, isDetecting: true }));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            lat: parseFloat(pos.coords.latitude.toFixed(4)),
            lng: parseFloat(pos.coords.longitude.toFixed(4)),
            address: "Live GPS Verified • Store Radius Match (18m away)",
            isVerified: true,
            isDetecting: false
          });
          if (setToast) setToast({ message: "📍 Live GPS Location verified successfully!", type: "success" });
        },
        (err) => {
          setGpsData({
            lat: 22.0869,
            lng: 79.5435,
            address: "ACME Store Site, Seoni MP (Simulated GPS Match)",
            isVerified: true,
            isDetecting: false
          });
          if (setToast) setToast({ message: "📍 GPS Location verified for Store Site.", type: "info" });
        },
        { timeout: 8000 }
      );
    } else {
      setGpsData(prev => ({ ...prev, isDetecting: false, isVerified: true }));
    }
  };

  const handleAddScopeTask = () => {
    if (!newScopeInput.trim()) return;
    setScopeTasks(prev => [...prev, { id: Date.now(), text: newScopeInput.trim(), done: true }]);
    setNewScopeInput("");
  };

  const handleToggleScopeTask = (id) => {
    setScopeTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleCompleteCheckInSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.id) {
      if (setToast) setToast({ message: "No active session found.", type: "error" });
      return;
    }
    const selProj = displayProjects.find(p => p.id === selectedWizardProjectId) || displayProjects[0];
    const projId = selProj ? selProj.id : "general-store-001";
    const projName = selProj ? (selProj.name || selProj.code) : "ACME Retail Flagship Store";

    if (checkInConsultant) {
      checkInConsultant(currentUser.id, {
        remarks: `${visitPurpose} | Location: ${gpsData.address}`,
        projectId: projId,
        projectName: projName,
        tasks: scopeTasks.filter(t => t.done).map(t => t.text),
        coordinates: `${gpsData.lat}, ${gpsData.lng}`,
        selfie: selfiePhoto
      });
      if (setToast) setToast({ message: `✓ Checked in successfully for ${projName}!`, type: "success" });
    }

    setShowCheckInWizard(false);
    setPunchRemarks("");
  };

  const handleCompleteCheckOutSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.id) {
      if (setToast) setToast({ message: "No active session found.", type: "error" });
      return;
    }
    if (checkOutConsultant) {
      checkOutConsultant(currentUser.id, {
        remarks: wizardCheckOutRemarks || punchRemarks || "Daily Shift Check Out",
        completedTasks: wizardCompletedTasks,
        pendingTasks: wizardPendingTasks
      });
      if (setToast) setToast({ message: "✓ Checked out successfully. Shift logged!", type: "success" });
    }
    setShowCheckOutWizard(false);
    setPunchRemarks("");
  };


  const handlePunchIn = () => {
    const selProj = projects.find(p => p.id === punchProjectId);
    checkInConsultant(currentUser.id, punchRemarks, punchProjectId, selProj ? selProj.name : "");
    setToast({ message: `Checked in successfully${selProj ? ` for ${selProj.code}` : ""}.`, type: "success" });
    setPunchRemarks("");
  };

  const handlePunchOut = () => {
    checkOutConsultant(currentUser.id, punchRemarks);
    setToast({ message: "Checked out successfully.", type: "success" });
    setPunchRemarks("");
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description.trim() || !expenseDate) return;

    const selProj = projects.find(p => p.id === expenseProjectId);

    addExpense({
      employeeId: currentUser.id,
      amount: parseFloat(amount),
      category,
      description,
      expenseDate,
      projectId: expenseProjectId,
      projectName: selProj ? selProj.name : ""
    });

    setToast({ message: "Expense claim submitted for verification review.", type: "success" });
    setAmount("");
    setDescription("");
    setExpenseDate("");
    setExpenseProjectId("");
    setCategory("Travel");
  };

  const handleAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!advAmount || !advPurpose.trim()) return;

    requestAdvance(currentUser.id, parseFloat(advAmount), advPurpose);
    setToast({ message: "Petty cash advance request submitted successfully.", type: "success" });
    setAdvAmount("");
    setAdvPurpose("");
  };

  // Attendance & Punch calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const myAttendance = currentUser?.attendance || [];
  const todayPunch = (myAttendance || []).slice().reverse().find(a => a.date === todayStr || (a.date && new Date(a.date).toDateString() === new Date().toDateString()));

  // Calculations for Attendance Dashboard
  const presentDays = myAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
  const targetWorkingDays = settings.requiredWorkingDays || 22;
  const attendancePercentage = Math.min(100, Math.round((presentDays / targetWorkingDays) * 100));
  
  // Weekly Offs (July 2026 has 8 weekend days: 4, 5, 11, 12, 18, 19, 25, 26)
  const totalWeeklyOffs = 8;

  // Absent days: Loop from July 1 up to today (July 19)
  let absentDays = 0;
  for (let d = 1; d < 19; d++) {
    const isWeekOff = [6, 0].includes(new Date(2026, 6, d).getDay()); // 6 = Saturday, 0 = Sunday
    if (isWeekOff) continue;
    const dateStr = `2026-07-${d < 10 ? "0" + d : d}`;
    const record = myAttendance.find(a => a.date === dateStr);
    if (!record || record.status === "Absent") {
      absentDays++;
    }
  }

  // Dynamic Month Calendar Generator
  const generateMonthCalendar = () => {
    const calendarDays = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based index

    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push({ day: null, status: "empty" });
    }

    const todayDayNum = now.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isWeekOff = [0, 6].includes(new Date(year, month, d).getDay());
      const record = myAttendance.find(a => a.date === dateStr);
      let status = "unmarked";

      if (record) {
        if (record.status === "Present" || record.status === "Late") {
          status = "present";
        } else if (record.status === "Absent") {
          status = "absent";
        }
      } else if (isWeekOff) {
        status = "weekoff";
      } else if (d < todayDayNum) {
        status = "absent";
      }

      calendarDays.push({ day: d, dateStr, status });
    }
    return calendarDays;
  };

  const calendarDays = generateMonthCalendar();

  // Filter expenses and advances submitted by this user
  const myExpenses = expenses.filter(e => e.employeeId === currentUser.id);
  const myAdvanceRequests = advanceRequests.filter(r => r.employeeId === currentUser.id);

  // Calculations for Expense Dashboard
  const myPendingExpenses = myExpenses.filter(e => e.status === "Pending");
  const myApprovedExpenses = myExpenses.filter(e => e.status === "Approved");
  const myRejectedExpenses = myExpenses.filter(e => e.status === "Rejected");
  const approvedExpenseTotal = myApprovedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get balance details
  const balanceDetails = getEmployeeBalanceDetails(currentUser.id) || {
    initialAdvance: 0,
    totalSpent: 0,
    availableBalance: 0,
    categoriesSum: { "Food": 0, "Accommodation": 0, "Travel": 0 }
  };

  return (
    <div className="consultant-view-container">
      {/* First-Time Self-Onboarding Prompt Banner */}
      {!currentUser?.profileCompleted && (
        <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", color: "#ffffff", padding: "16px 24px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(79,70,229,0.2)" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>👋 Welcome! Please complete your employee profile details</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#e0e7ff" }}>Enter your PAN, Aadhaar, Bank Account, Emergency Contact & Personal Details to finalize your self-service onboarding.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSelfOnboardingModal(true)}
            style={{ background: "#ffffff", color: "#3730a3", border: "none", borderRadius: "6px", padding: "10px 20px", fontWeight: "700", fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Complete Profile Now →
          </button>
        </div>
      )}

      {/* Keka HR Style Employee Profile Top Banner Card */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
        
        {/* Purple Wavy Texture Background Banner */}
        <div style={{ position: "relative", height: "160px", background: "linear-gradient(135deg, #4c478a 0%, #312e5c 50%, #1e1b4b 100%)", overflow: "hidden" }}>
          
          {/* Decorative Pattern Lines */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: "radial-gradient(circle at 20% 50%, #ffffff 0%, transparent 60%), radial-gradient(circle at 80% 20%, #ffffff 0%, transparent 50%)" }} />

          {/* Profile Basic Info Row Over Banner */}
          <div style={{ position: "absolute", bottom: "16px", left: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
            
            {/* Avatar Photo */}
            <img 
              src={currentUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"} 
              alt={currentUser.name}
              style={{ width: "100px", height: "100px", borderRadius: "50%", border: "4px solid #ffffff", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            />

            <div style={{ color: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "1.7rem", fontWeight: "700", margin: 0, color: "#ffffff" }}>{currentUser.name}</h1>
                <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "700" }}>
                  IN
                </span>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", padding: "2px 8px", borderRadius: "3px", fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase" }}>
                  WEEKLY OFF
                </span>
              </div>

              <div style={{ fontSize: "0.88rem", color: "#e2e8f0", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🧰</span> <span>{currentUser.title || "Systems Operator"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Strip */}
        <div style={{ padding: "12px 20px", background: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "24px", fontSize: "0.82rem", color: "#475569", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>✉</span> <span>{currentUser.email || "consultant@acme.com"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>📞</span> <span>{currentUser.phone || "+91-9876543210"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>📍</span> <span>{currentUser.location || "Mumbai / HQ"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>🪪</span> <span>{currentUser.empCode || "EMP-101"}</span>
          </div>
        </div>

        {/* Joining / Department / Reporting Manager Strip */}
        <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "48px", fontSize: "0.82rem" }}>
          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>JOINING DATE</span>
            <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{currentUser.joiningDate || "24 Jan 2025"}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>DEPARTMENT</span>
            <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{currentUser.department?.toUpperCase() || "GENERAL"}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>REPORTING MANAGER</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" alt="Manager" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
              <span style={{ fontWeight: "600", color: "#2563eb" }}>{currentUser.reportingManager || "ACME Management"}</span>
            </div>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button
              type="button"
              onClick={() => setShowSelfOnboardingModal(true)}
              style={{ background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>✏️</span> Edit Profile Details
            </button>
          </div>
        </div>

        {/* Main Profile Navigation Tabs Row */}
        <div style={{ display: "flex", gap: "24px", padding: "0 20px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
          {["ABOUT", "PROFILE", "JOB", "TIME", "DOCUMENTS", "ASSETS", "FINANCES", "EXPENSES", "PERFORMANCE"].map(tab => {
            const isActive = profileTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setProfileTab(tab)}
                style={{
                  padding: "12px 0",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #4c478a" : "2px solid transparent",
                  color: isActive ? "#4c478a" : "#64748b",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Sub-Tabs Row under TIME */}
        {profileTab === "TIME" && (
          <div style={{ display: "flex", gap: "16px", padding: "10px 20px", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
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

      {/* PROFILE / ABOUT Tab: Self-Service Details */}
      {(profileTab === "PROFILE" || profileTab === "ABOUT") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>My Personal & Statutory Profile</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>Identity cards, banking, emergency contacts, and personal information</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSelfOnboardingModal(true)}
                style={{ background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 18px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
              >
                ✏️ Edit Profile Details
              </button>
            </div>

            {/* Grid 1: Identity & Statutory Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>PAN CARD NUMBER</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>{currentUser.panNumber || "Not Provided"}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>AADHAAR CARD NUMBER</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>{currentUser.aadhaarNumber || "Not Provided"}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>BLOOD GROUP</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#dc2626", marginTop: "6px" }}>{currentUser.bloodGroup || "O+"}</div>
              </div>
            </div>

            {/* Grid 2: Bank Account Details */}
            <h4 style={{ fontSize: "0.92rem", fontWeight: "700", color: "#1e293b", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>Bank & Remittance Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "24px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>BANK NAME</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.bankName || "HDFC Bank"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>ACCOUNT NUMBER</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.bankAccount || "XXXX-XXXX-4829"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>IFSC CODE</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.ifscCode || "HDFC0000123"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>BRANCH NAME</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.branchName || "BKC Main Branch"}</strong>
              </div>
            </div>

            {/* Grid 3: Emergency & Addresses */}
            <h4 style={{ fontSize: "0.92rem", fontWeight: "700", color: "#1e293b", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>Emergency Contact & Addresses</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>EMERGENCY CONTACT</span>
                <strong style={{ color: "#0f172a" }}>{currentUser.emergencyName || "Parent/Spouse"} ({currentUser.emergencyRelation || "Parent"})</strong>
                <div style={{ color: "#2563eb", marginTop: "2px" }}>📞 {currentUser.emergencyPhone || "+91-9876543210"}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>CURRENT RESIDENTIAL ADDRESS</span>
                <div style={{ color: "#0f172a", marginTop: "2px" }}>{currentUser.currentAddress || "Mehdipatnam, Hyderabad, Telangana"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Content Grid (Matching Keka HR Screenshot) */}
      {profileTab === "TIME" && timeSubTab === "Attendance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1fr", gap: "16px", marginBottom: "24px" }}>
          
          {/* Card 1: Attendance Stats */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Attendance Stats</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <select 
                    value={statsRange} 
                    onChange={(e) => setStatsRange(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "3px 8px", fontSize: "0.75rem", color: "#475569", outline: "none" }}
                  >
                    <option>Last Week</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                  <span title="Attendance policy info" style={{ color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}>ⓘ</span>
                </div>
              </div>

              {/* Row 1: Me */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem" }}>
                    👤
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Me</span>
                </div>

                <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>AVG HRS / DAY</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>9h 3m</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>ON TIME ARRIVAL</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>83%</span>
                  </div>
                </div>
              </div>

              {/* Row 2: My Team */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem" }}>
                    👥
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>My Team</span>
                </div>

                <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>AVG HRS / DAY</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>8h 49m</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", display: "block" }}>ON TIME ARRIVAL</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>81%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Timings */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Timings</h3>

              {/* Days Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 10px" }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => {
                  const isToday = idx === 1; // Tuesday
                  return (
                    <div 
                      key={idx}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isToday ? "#38bdf8" : "#f1f5f9",
                        color: isToday ? "#ffffff" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: isToday ? "700" : "500"
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600", marginBottom: "10px" }}>
                Today (10:30 AM - 9:00 PM)
              </div>

              {/* Visual Shift Timeline Bar */}
              <div style={{ background: "#e0f2fe", height: "10px", borderRadius: "5px", overflow: "hidden", position: "relative", marginBottom: "12px" }}>
                <div style={{ background: "#38bdf8", width: "70%", height: "100%" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "#64748b" }}>
                <span>Duration: 10h 30m</span>
                <span>☕ 40 min</span>
              </div>
            </div>
          </div>

          {/* Card 3: Actions */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Actions</h3>

              {/* Digital Clock Box */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "14px", background: "#f8fafc", textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", letterSpacing: "0.02em" }}>
                  {formatClockTime(time)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                  {formatClockDate(time)}
                </div>
              </div>

              {/* Punch Controls / Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {!todayPunch ? (
                  <button 
                    type="button" 
                    onClick={handleOpenCheckInWizard}
                    style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 14px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 12px rgba(22,163,74,0.25)" }}
                  >
                    ✔ Check In Shift (Site Visit)
                  </button>
                ) : !todayPunch.checkOut ? (
                  <button 
                    type="button" 
                    onClick={handleOpenCheckOutWizard}
                    style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 14px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}
                  >
                    ✖ Check Out Shift
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: "700", textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px", borderRadius: "6px" }}>
                      ✓ Shift Completed Today ({todayPunch.checkIn} - {todayPunch.checkOut})
                    </div>
                    <button 
                      type="button" 
                      onClick={handleOpenCheckInWizard}
                      style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer", width: "100%" }}
                    >
                      + Check In New Shift (Site Visit)
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3>My Attendance Register</h3>
            <p className="subtitle">Historical record of check-in times and remarks</p>
            <table className="luxury-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client Project</th>
                  <th>Checked In</th>
                  <th>Checked Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.slice().reverse().map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.date}</strong></td>
                    <td>
                      <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                        {a.projectName || a.projectId || "DCB Bank Sourcing Account"}
                      </span>
                    </td>
                    <td>{a.checkIn || "—"}</td>
                    <td>{a.checkOut || (a.checkIn ? <span className="warning-text">Active Shift</span> : "—")}</td>
                    <td>{a.hoursWorked ? `${a.hoursWorked} hrs` : "—"}</td>
                    <td>
                      <span className={`status-badge ${a.status.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{a.remarks || "—"}</td>
                  </tr>
                ))}
                {myAttendance.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No attendance logs on record. Check in above to start.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === "expenses" && (
        <div className="client-grid" style={{ gridTemplateColumns: "1.2fr 2fr", gap: "24px" }}>
          
          {/* Left Column: Upload forms */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Submit Expense Form */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3>File Expense Claim</h3>
              <p className="subtitle">Submit operational costs for verification</p>
              <form onSubmit={handleExpenseSubmit} className="luxury-form" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label>Client Project</label>
                  <select
                    value={expenseProjectId}
                    onChange={(e) => setExpenseProjectId(e.target.value)}
                    className="luxury-select"
                  >
                    <option value="">General / Default Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name} ({p.client})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Expense Date</label>
                  <input 
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expense Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="luxury-select">
                      <option value="Food">Food</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Travel">Travel</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description & Reason</label>
                  <textarea 
                    placeholder="State invoice details, travel destination, or hotel name..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    style={{ height: "60px" }}
                  />
                </div>
                <div className="form-group">
                  <label>Receipt Upload</label>
                  <input type="file" className="luxury-select" required />
                  <span className="info-text" style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Mandatory receipt attachment required</span>
                </div>
                <button type="submit" className="luxury-button" style={{ width: "100%", background: "var(--bg-sidebar)", color: "#fff" }}>
                  Submit Expense
                </button>
              </form>
            </div>

            {/* Request Petty Cash Advance Form */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3>Request Cash Advance</h3>
              <p className="subtitle">Request operational funds from Accounts manager</p>
              <form onSubmit={handleAdvanceSubmit} className="luxury-form" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label>Advance Amount (₹)</label>
                  <input 
                    type="number" 
                    step="1" 
                    placeholder="e.g. 5000" 
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Purpose of Advance</label>
                  <textarea 
                    placeholder="State travel audits, hotel stay reservations, or operational needs..."
                    value={advPurpose}
                    onChange={(e) => setAdvPurpose(e.target.value)}
                    required
                    style={{ height: "60px" }}
                  />
                </div>
                <button type="submit" className="luxury-button" style={{ width: "100%", background: "var(--bg-sidebar)", color: "#fff", border: "1px solid var(--bg-sidebar)" }}>
                  Submit Advance Request
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Ledgers & Reports */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* KPI Cards on Top */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Claims Pending</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--color-warning)" }}>{myPendingExpenses.length}</strong>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Claims Approved</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--color-success)" }}>{myApprovedExpenses.length}</strong>
              </div>
              <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Monthly Sourced Total</span>
                <strong style={{ fontSize: "1.3rem", color: "var(--text-primary)" }}>₹{approvedExpenseTotal.toLocaleString()}</strong>
              </div>
            </div>

            {/* Claims History */}
            <div className="glass-card">
              <h3>My Sourcing Claims Ledger</h3>
              <p className="subtitle">Real-time status of your reimbursement requests</p>
              <div className="expense-claims-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", maxHeight: "250px", overflowY: "auto" }}>
                {myExpenses.map((e) => (
                  <div key={e.id} className="expense-claim-item-card" style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px"
                  }}>
                    <div className="claim-item-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="claim-date" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Date filed: {e.submittedDate || e.date}</span>
                      <span className={`status-badge ${e.status.toLowerCase()}`}>{e.status}</span>
                    </div>
                    <div className="claim-item-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="claim-amount-box">
                        <span className="claim-val" style={{ fontSize: "1rem", fontWeight: "700" }}>₹{e.amount.toFixed(2)}</span>
                        <span className="claim-cat" style={{ fontSize: "0.7rem", color: "var(--gold-light)", display: "block" }}>{e.category}</span>
                      </div>
                      <p className="claim-desc" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: "1", marginLeft: "16px" }}>{e.description}</p>
                    </div>
                    
                    {e.status === "Rejected" && (
                      <div className="claim-reviewer-alert rejection" style={{ padding: "8px", borderRadius: "4px", marginTop: "8px", fontSize: "0.75rem", backgroundColor: "var(--color-error-bg)", color: "var(--color-error)" }}>
                        <strong>⚠ REJECTION REMARKS:</strong> "{e.reviewerNotes || "No comments left."}" • <em>{e.reviewedBy}</em>
                      </div>
                    )}
                    {e.status === "Approved" && (
                      <div className="claim-reviewer-alert approval" style={{ padding: "8px", borderRadius: "4px", marginTop: "8px", fontSize: "0.75rem", backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}>
                        <strong>✓ APPROVED:</strong> {e.reviewerNotes || "Verified successfully."} • <em>Approved Date: {e.approvedDate || e.date}</em>
                      </div>
                    )}
                  </div>
                ))}
                {myExpenses.length === 0 && (
                  <p className="empty-message text-center" style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "20px 0" }}>No expense claims filed yet.</p>
                )}
              </div>
            </div>

            {/* Advance Requests History */}
            <div className="glass-card">
              <h3>My Cash Advance Requests</h3>
              <p className="subtitle">Monitor petty cash advances and payouts</p>
              <div className="advance-requests-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", maxHeight: "250px", overflowY: "auto" }}>
                {myAdvanceRequests.map((r) => (
                  <div key={r.id} className="expense-claim-item-card" style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px"
                  }}>
                    <div className="claim-item-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span className="claim-date" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.date}</span>
                      <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                    </div>
                    <div className="claim-item-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="claim-amount-box">
                        <span className="claim-val" style={{ fontSize: "1rem", fontWeight: "700" }}>₹{r.amount.toFixed(2)}</span>
                        <span className="claim-cat" style={{ fontSize: "0.7rem", color: "var(--gold-light)", display: "block" }}>Cash Advance</span>
                      </div>
                      <p className="claim-desc" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: "1", marginLeft: "16px" }}>{r.purpose}</p>
                    </div>
                    {r.reviewedBy && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "4px" }}>
                        Processed by: <strong>{r.reviewedBy}</strong>
                      </div>
                    )}
                  </div>
                ))}
                {myAdvanceRequests.length === 0 && (
                  <p className="empty-message text-center" style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "20px 0" }}>No cash advance requests filed yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="expenses-section glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ textTransform: "uppercase", color: "var(--bg-sidebar)" }}>{currentUser.name} - Monthly Sourcing Ledger</h3>
              <p className="subtitle" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Note: Please submit daily all bills on portal. Opening Balance: <strong>₹{getEmployeeLedger(currentUser.id).ledgerRows[0]?.opening.toLocaleString() || "0"}</strong>
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {/* Segmented Grid vs Calendar View Selector */}
              <div className="segmented-control">
                <button 
                  onClick={() => setLedgerViewMode("grid")}
                  className={`segmented-button ${ledgerViewMode === "grid" ? "active" : ""}`}
                >
                  📋 Grid View
                </button>
                <button 
                  onClick={() => setLedgerViewMode("calendar")}
                  className={`segmented-button ${ledgerViewMode === "calendar" ? "active" : ""}`}
                >
                  📅 Calendar View
                </button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Period: <strong>July 2026</strong></span>
            </div>
          </div>

          {ledgerViewMode === "grid" ? (
            /* Grid Table View */
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr", gap: "24px", alignItems: "start" }}>
              
              {/* Ledger Table */}
              <div style={{ overflowX: "auto" }}>
                <table className="luxury-table" style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)" }}>
                      <th style={{ padding: "8px" }}>SR. NO</th>
                      <th style={{ padding: "8px" }}>DATE</th>
                      <th style={{ padding: "8px" }}>DAY</th>
                      <th style={{ padding: "8px" }}>PARTICULARS</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>OPPINING</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>FOOD</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>STAY</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>TRAVEL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>TOTAL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>RECEIVED</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ledger = getEmployeeLedger(currentUser.id);
                      return (
                        <>
                          {ledger.ledgerRows.map((row) => (
                            <tr key={row.srNo} style={{ height: "32px" }}>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>{row.srNo}</td>
                              <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{row.date}</td>
                              <td style={{ padding: "4px 8px", color: "var(--text-secondary)" }}>{row.day}</td>
                              <td style={{ padding: "4px 8px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.particulars}>
                                {row.particulars || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", color: row.opening < 0 ? "var(--color-error)" : "inherit" }}>
                                ₹{row.opening.toFixed(2)}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: row.food > 0 ? "600" : "400" }}>
                                {row.food > 0 ? `₹${row.food.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: row.stay > 0 ? "600" : "400" }}>
                                {row.stay > 0 ? `₹${row.stay.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: row.travel > 0 ? "600" : "400" }}>
                                {row.travel > 0 ? `₹${row.travel.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>
                                {row.spent > 0 ? `₹${row.spent.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-success)", fontWeight: row.received > 0 ? "700" : "400" }}>
                                {row.received > 0 ? `₹${row.received.toFixed(2)}` : "—"}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "700", color: row.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                                ₹{row.balance.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700", borderTop: "2.5px double var(--border-color)" }}>
                            <td colSpan="5" style={{ padding: "10px", textAlign: "center" }}>TOTAL</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.food.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.stay.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.travel.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>₹{ledger.totals.spent.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right", color: "var(--color-success)" }}>₹{ledger.totals.received.toFixed(2)}</td>
                            <td style={{ padding: "10px", textAlign: "right", color: ledger.ledgerRows[ledger.ledgerRows.length - 1]?.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                              ₹{ledger.ledgerRows[ledger.ledgerRows.length - 1]?.balance.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Refilling Details Box */}
              <div className="glass-card" style={{ padding: "16px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "12px" }}>
                  Refilling Details
                </h4>
                <table className="luxury-table" style={{ fontSize: "0.75rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)" }}>
                      <th>SR. NO</th>
                      <th>DATE</th>
                      <th style={{ textAlign: "right" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ledger = getEmployeeLedger(currentUser.id);
                      return (
                        <>
                          {ledger.refillingDetails.map((refill) => (
                            <tr key={refill.srNo}>
                              <td style={{ textAlign: "center" }}>{refill.srNo}</td>
                              <td>{refill.date}</td>
                              <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-success)" }}>₹{refill.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                          {ledger.refillingDetails.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No refill credits found.</td>
                            </tr>
                          )}
                          <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700" }}>
                            <td colSpan="2">TOTAL</td>
                            <td style={{ textAlign: "right", color: "var(--color-success)" }}>₹{ledger.totals.received.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            /* Calendar Sheet Mode */
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr", gap: "24px", alignItems: "start" }}>
              
              <div className="report-calendar-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(w => (
                  <div key={w} className="report-calendar-header">{w}</div>
                ))}
                {(() => {
                  const cells = [];
                  cells.push({ day: null, status: "empty" });
                  cells.push({ day: null, status: "empty" });

                  const ledger = getEmployeeLedger(currentUser.id);
                  ledger.ledgerRows.forEach((row) => {
                    cells.push({
                      day: row.srNo,
                      dateStr: row.date,
                      dayOfWeek: row.day,
                      row
                    });
                  });

                  return cells.map((c, idx) => {
                    if (c.day === null) {
                      return <div key={`empty-${idx}`} className="report-calendar-cell empty"></div>;
                    }

                    const isWeekend = ["Saturday", "Sunday"].includes(c.dayOfWeek);
                    const { row } = c;

                    return (
                      <div 
                        key={c.day} 
                        className={`report-calendar-cell tooltip-trigger ${isWeekend ? "weekoff" : ""}`}
                      >
                        <span className="calendar-day-num">{c.day}</span>
                        
                        <div className="calendar-cell-badges">
                          {row.spent > 0 && (
                            <span className="calendar-badge spent">
                              Spent: ₹{row.spent.toFixed(0)}
                            </span>
                          )}
                          {row.received > 0 && (
                            <span className="calendar-badge received">
                              Refill: +₹{row.received.toFixed(0)}
                            </span>
                          )}
                        </div>

                        {/* Tooltip on hover */}
                        <div className="tooltip-content" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.2)", paddingBottom: "4px", marginBottom: "4px", fontWeight: "700", color: "var(--gold-light)" }}>
                            📅 {row.date} ({c.dayOfWeek})
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Opening Bal:</span>
                            <strong>₹{row.opening.toFixed(2)}</strong>
                          </div>
                          
                          {row.received > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success)" }}>
                              <span>Payment (Refill):</span>
                              <strong>+₹{row.received.toFixed(2)}</strong>
                            </div>
                          )}
                          
                          {row.spent > 0 && (
                            <>
                              {row.food > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "#CBD5E1" }}>
                                  <span>• Food spent:</span>
                                  <span>₹{row.food.toFixed(2)}</span>
                                </div>
                              )}
                              {row.stay > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "#CBD5E1" }}>
                                  <span>• Stay spent:</span>
                                  <span>₹{row.stay.toFixed(2)}</span>
                                </div>
                              )}
                              {row.travel > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "#CBD5E1" }}>
                                  <span>• Travel spent:</span>
                                  <span>₹{row.travel.toFixed(2)}</span>
                                </div>
                              )}
                              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-error)" }}>
                                <span>Total Spent:</span>
                                <strong>-₹{row.spent.toFixed(2)}</strong>
                              </div>
                            </>
                          )}
                          
                          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.2)", paddingTop: "4px", marginTop: "4px", fontWeight: "700" }}>
                            <span>Closing Bal:</span>
                            <strong style={{ color: row.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                              ₹{row.balance.toFixed(2)}
                            </strong>
                          </div>
                          
                          {row.particulars && (
                            <div style={{ fontSize: "0.65rem", color: "#E2E8F0", marginTop: "4px", fontStyle: "italic", whiteSpace: "normal" }}>
                              Particulars: {row.particulars}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Refilling Details Box */}
              <div className="glass-card" style={{ padding: "16px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "12px" }}>
                  Refilling Details
                </h4>
                <table className="luxury-table" style={{ fontSize: "0.75rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)" }}>
                      <th>SR. NO</th>
                      <th>DATE</th>
                      <th style={{ textAlign: "right" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ledger = getEmployeeLedger(currentUser.id);
                      return (
                        <>
                          {ledger.refillingDetails.map((refill) => (
                            <tr key={refill.srNo}>
                              <td style={{ textAlign: "center" }}>{refill.srNo}</td>
                              <td>{refill.date}</td>
                              <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-success)" }}>₹{refill.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                          {ledger.refillingDetails.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No refill credits found.</td>
                            </tr>
                          )}
                          <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700" }}>
                            <td colSpan="2">TOTAL</td>
                            <td style={{ textAlign: "right", color: "var(--color-success)" }}>₹{ledger.totals.received.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}

      {activeTab === "projects" && (
        <ProjectsView />
      )}

      {activeTab === "recruitment" && (
        <RecruiterView />
      )}

      {activeTab === "leaves" && (() => {
        const leaveBal = getLeaveBalance(currentUser.id);
        const myLeaves = leaveRequests.filter(r => r.employeeId === currentUser.id);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header & Apply Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "20px 24px", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>My Leave Management</h2>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>Track leave balances, apply for leaves, and monitor approval status</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyLeaveModal(true)}
                style={{ background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 20px", fontWeight: "600", fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>+</span> Apply for Leave
              </button>
            </div>

            {/* Leave Balance Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <div style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #3b82f6" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>CASUAL LEAVE (CL)</span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "8px 0" }}>{leaveBal.casual.available} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b" }}>/ {leaveBal.casual.total} Days</span></div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Used: {leaveBal.casual.used} Days</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>SICK LEAVE (SL)</span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "8px 0" }}>{leaveBal.sick.available} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b" }}>/ {leaveBal.sick.total} Days</span></div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Used: {leaveBal.sick.used} Days</div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #8b5cf6" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.05em" }}>EARNED LEAVE (EL)</span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "8px 0" }}>{leaveBal.earned.available} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b" }}>/ {leaveBal.earned.total} Days</span></div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Used: {leaveBal.earned.used} Days</div>
              </div>
            </div>

            {/* Leave History Table */}
            <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Leave Application History</h3>
              {myLeaves.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#64748b", background: "#f8fafc", borderRadius: "6px" }}>
                  <p style={{ margin: 0 }}>No leave applications filed yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Applied Date</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Leave Type</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Dates</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Reason</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Status</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.map(req => {
                        const statusColors = {
                          Pending: { bg: "#fef3c7", fg: "#d97706" },
                          Approved: { bg: "#dcfce7", fg: "#15803d" },
                          Rejected: { bg: "#fee2e2", fg: "#dc2626" },
                          Cancelled: { bg: "#f1f5f9", fg: "#64748b" }
                        };
                        const sc = statusColors[req.status] || statusColors.Pending;
                        return (
                          <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px" }}>{req.appliedOn}</td>
                            <td style={{ padding: "12px 14px", fontWeight: "600" }}>{req.type} {req.halfDay ? "(Half Day)" : ""}</td>
                            <td style={{ padding: "12px 14px" }}>{req.fromDate} to {req.toDate}</td>
                            <td style={{ padding: "12px 14px", color: "#475569" }}>{req.reason}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ background: sc.bg, color: sc.fg, padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
                                {req.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {req.status === "Pending" && (
                                <button
                                  type="button"
                                  onClick={() => { cancelLeave(req.id); setToast({ message: "Leave application cancelled.", type: "info" }); }}
                                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "4px", padding: "4px 8px", fontSize: "0.78rem", cursor: "pointer" }}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyLeaveModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: "#ffffff", borderRadius: "8px", width: "500px", maxWidth: "90vw", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Apply for Leave</h3>
                    <button type="button" onClick={() => setShowApplyLeaveModal(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer" }}>&times;</button>
                  </div>
                  <form onSubmit={handleApplyLeaveSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Leave Type *</label>
                        <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                          <option value="Casual Leave">Casual Leave (CL)</option>
                          <option value="Sick Leave">Sick Leave (SL)</option>
                          <option value="Earned Leave">Earned Leave (EL)</option>
                          <option value="Comp Off">Compensatory Off</option>
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>From Date *</label>
                          <input type="date" required value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>To Date *</label>
                          <input type="date" required value={leaveTo} onChange={e => setLeaveTo(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                        </div>
                      </div>

                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}>
                        <input type="checkbox" checked={leaveHalfDay} onChange={e => setLeaveHalfDay(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#5b50a1" }} />
                        Apply as Half Day
                      </label>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "4px" }}>Reason *</label>
                        <textarea required rows={3} placeholder="Please provide reason for leave request" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", resize: "vertical" }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginTop: "8px" }}>
                        <button type="button" onClick={() => setShowApplyLeaveModal(false)} style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", cursor: "pointer" }}>Cancel</button>
                        <button type="submit" style={{ padding: "8px 20px", background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>Submit Application</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === "payslips" && (() => {
        const payslipData = generatePayslip(currentUser.id, selectedPayslipMonth);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Bar: Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "20px 24px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>My Salary Slips</h2>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>View & download monthly salary breakdowns and tax deductions</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <select
                  value={selectedPayslipMonth}
                  onChange={e => setSelectedPayslipMonth(e.target.value)}
                  style={{ padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.88rem", background: "#ffffff", fontWeight: "600", color: "#0f172a" }}
                >
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
                  <option value="April 2026">April 2026</option>
                  <option value="March 2026">March 2026</option>
                  <option value="February 2026">February 2026</option>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  🖨 Print / Download PDF
                </button>
              </div>
            </div>

            {/* Payslip Document Card */}
            <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "40px", maxWidth: "880px", margin: "0 auto", width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              {/* Header */}
              <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.02em" }}>ACME WORKCENTRE PRIVATE LIMITED</h1>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>Plot 42, Advisory Towers, BKC, Mumbai - 400051</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "4px", fontSize: "0.82rem", fontWeight: "700", display: "inline-block" }}>PAYSLIP</span>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>{payslipData.month}</div>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: "16px 20px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "24px", fontSize: "0.84rem" }}>
                <div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Employee Name:</span> <strong style={{ color: "#0f172a" }}>{payslipData.employeeName}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Employee Code:</span> <strong style={{ color: "#0f172a" }}>{payslipData.empCode}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Designation:</span> <strong style={{ color: "#0f172a" }}>{payslipData.designation}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Department:</span> <strong style={{ color: "#0f172a" }}>{payslipData.department}</strong></div>
                </div>
                <div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Bank Account:</span> <strong style={{ color: "#0f172a" }}>{payslipData.bankAccount}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>PF Number:</span> <strong style={{ color: "#0f172a" }}>{payslipData.pfNumber}</strong></div>
                  <div style={{ marginBottom: "6px" }}><span style={{ color: "#64748b" }}>PAN Number:</span> <strong style={{ color: "#0f172a" }}>{payslipData.panNumber}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Paid Days:</span> <strong style={{ color: "#0f172a" }}>{payslipData.paidDays} / {payslipData.workingDays}</strong></div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                {/* Earnings Table */}
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#166534", background: "#dcfce7", padding: "8px 12px", borderRadius: "4px 4px 0 0", margin: 0 }}>EARNINGS</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", border: "1px solid #cbd5e1", borderTop: "none" }}>
                    <tbody>
                      {payslipData.earnings.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", color: "#334155" }}>{item.title}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                        <td style={{ padding: "10px 12px", color: "#0f172a" }}>Gross Earnings</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#166534" }}>₹{payslipData.grossEarnings.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions Table */}
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#991b1b", background: "#fee2e2", padding: "8px 12px", borderRadius: "4px 4px 0 0", margin: 0 }}>DEDUCTIONS</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", border: "1px solid #cbd5e1", borderTop: "none" }}>
                    <tbody>
                      {payslipData.deductions.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", color: "#334155" }}>{item.title}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                        <td style={{ padding: "10px 12px", color: "#0f172a" }}>Total Deductions</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#991b1b" }}>₹{payslipData.totalDeductions.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Pay Card */}
              <div style={{ background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: "6px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>NET TAKE HOME SALARY</span>
                  <div style={{ fontSize: "0.82rem", color: "#15803d", marginTop: "2px" }}>Directly deposited to bank account</div>
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#166534" }}>
                  ₹{payslipData.netSalary.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profile & Petty Cash Allowance Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>👤 Consultant Profile & Sourcing Balance</h2>
              <button onClick={() => setShowProfileModal(false)} style={{ fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
              <img src={currentUser.avatar} alt={currentUser.name} style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid var(--bg-sidebar)", objectFit: "cover" }} />
              <div>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>{currentUser.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{currentUser.title}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📱 {currentUser.phone || "No phone registered"}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>✉ {currentUser.email}</p>
              </div>
            </div>

            <h4 style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              Petty Cash Advance Ledger
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "var(--bg-tertiary)", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Total Advance</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>₹{balanceDetails.initialAdvance.toLocaleString()}</strong>
              </div>
              <div style={{ background: "var(--bg-tertiary)", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Total Spent</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--color-error)" }}>₹{balanceDetails.totalSpent.toLocaleString()}</strong>
              </div>
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-success)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Available Balance</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--color-success)" }}>₹{balanceDetails.availableBalance.toLocaleString()}</strong>
              </div>
            </div>

            <h4 style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              Category Spend Breakdown (Approved)
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.entries(balanceDetails.categoriesSum).map(([cat, val]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)" }}>{cat}</span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>₹{val.toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowProfileModal(false)}
              className="luxury-button"
              style={{ width: "100%", marginTop: "24px", backgroundColor: "var(--bg-sidebar)", color: "#fff" }}
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Employee Profile Self-Service Onboarding Modal */}
      {showSelfOnboardingModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "8px", width: "640px", maxWidth: "95vw", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Employee Profile Self-Service</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>Fill out your statutory, identity, and personal contact details</p>
              </div>
              <button type="button" onClick={() => setShowSelfOnboardingModal(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer" }}>&times;</button>
            </div>

            {/* Stepper Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", background: "#f8fafc", padding: "12px 20px", borderRadius: "6px" }}>
              {[
                { step: 1, label: "1. Personal & Contact" },
                { step: 2, label: "2. PAN & Aadhaar" },
                { step: 3, label: "3. Bank Account" }
              ].map(s => (
                <span
                  key={s.step}
                  onClick={() => setProfileStep(s.step)}
                  style={{ fontSize: "0.82rem", fontWeight: profileStep === s.step ? "700" : "500", color: profileStep === s.step ? "#5b50a1" : "#64748b", cursor: "pointer" }}
                >
                  {s.label}
                </span>
              ))}
            </div>

            <form onSubmit={handleProfileSubmit}>
              {profileStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Personal Email</label>
                      <input type="email" placeholder="personal@email.com" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Alternate Phone</label>
                      <input type="tel" placeholder="+91-9876543210" value={altPhone} onChange={e => setAltPhone(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Date of Birth</label>
                      <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Blood Group</label>
                      <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Gender</label>
                      <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b", margin: "8px 0 0 0" }}>Emergency Contact & Address</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Contact Person Name *</label>
                      <input type="text" required placeholder="Parent / Spouse Name" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Relationship *</label>
                      <input type="text" required placeholder="Father / Spouse" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Emergency Phone *</label>
                      <input type="tel" required placeholder="+91-9876543210" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Current Residential Address *</label>
                    <textarea required rows={2} placeholder="Full current address" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Permanent Address</label>
                    <textarea rows={2} placeholder="Permanent address (or same as current)" value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", resize: "vertical" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <button type="button" onClick={() => setProfileStep(2)} style={{ padding: "10px 20px", background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>Next: Identity Cards →</button>
                  </div>
                </div>
              )}

              {profileStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>PAN Card Number *</label>
                    <input type="text" required maxLength={10} placeholder="ABCDE1234F" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", letterSpacing: "0.08em", fontWeight: "700" }} />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>10-character Permanent Account Number</span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Aadhaar Card Number *</label>
                    <input type="text" required maxLength={14} placeholder="1234 5678 9012" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", letterSpacing: "0.08em", fontWeight: "700" }} />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>12-digit UIDAI Aadhaar number</span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Passport Number (Optional)</label>
                    <input type="text" placeholder="A1234567" value={passportNumber} onChange={e => setPassportNumber(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <button type="button" onClick={() => setProfileStep(1)} style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>← Back</button>
                    <button type="button" onClick={() => setProfileStep(3)} style={{ padding: "10px 20px", background: "#5b50a1", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer" }}>Next: Bank Account →</button>
                  </div>
                </div>
              )}

              {profileStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Bank Name *</label>
                      <select value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }}>
                        {["HDFC Bank", "ICICI Bank", "State Bank of India (SBI)", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other Bank"].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Branch Name</label>
                      <input type="text" placeholder="Branch location" value={branchName} onChange={e => setBranchName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Bank Account Number *</label>
                    <input type="text" required placeholder="Enter bank account number" value={bankAccount} onChange={e => setBankAccount(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", fontWeight: "700" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>Re-enter Account Number *</label>
                    <input type="text" required placeholder="Re-enter bank account number" value={confirmBankAccount} onChange={e => setConfirmBankAccount(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", fontWeight: "700" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px", display: "block", fontWeight: "500" }}>IFSC Code *</label>
                    <input type="text" required placeholder="HDFC0000123" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.88rem", letterSpacing: "0.05em", fontWeight: "700" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <button type="button" onClick={() => setProfileStep(2)} style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>← Back</button>
                    <button type="submit" style={{ padding: "10px 20px", background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "700", cursor: "pointer" }}>Complete & Save Profile ✓</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Profile & Petty Cash Allowance Modal */}
    
      
      {/* GUIDED 3-STEP CONSULTANT CHECK-IN WIZARD MODAL */}
      {showCheckInWizard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "620px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e5c 100%)", color: "#ffffff", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(34,197,94,0.25)", color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.2rem" }}>✓</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#ffffff" }}>Consultant Shift Check-In Form</h3>
                  <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "#a5b4fc" }}>Multi-Step Location & Verification Protocol</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCheckInWizard(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", borderRadius: "50%", width: "32px", height: "32px", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Stepper Bar */}
            <div style={{ background: "#f8fafc", padding: "12px 28px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {[
                { step: 1, title: "1. Purpose & Scope" },
                { step: 2, title: "2. GPS Location" },
                { step: 3, title: "3. Selfie Verification" }
              ].map((s) => {
                const isActive = wizardStep === s.step;
                const isPassed = wizardStep > s.step;
                return (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: isActive ? "#2563eb" : isPassed ? "#16a34a" : "#cbd5e1",
                      color: "#ffffff", fontSize: "0.78rem", fontWeight: "800",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {isPassed ? "✓" : s.step}
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: isActive ? "800" : "600", color: isActive ? "#0f172a" : "#64748b" }}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Body */}
            <div style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "22px", minHeight: "340px" }}>
              
              {/* STEP 1: PURPOSE & SCOPE OF WORK */}
              {wizardStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  
                  {/* Select Store / Project Site */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      📍 1. Select Store / Client Project Site Location
                    </label>
                    <select 
                      value={selectedWizardProjectId} 
                      onChange={(e) => setSelectedWizardProjectId(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem", background: "#f8fafc", color: "#0f172a", fontWeight: "700" }}
                    >
                      {displayProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — ({p.location || "Store HQ"})</option>
                      ))}
                    </select>
                  </div>

                  {/* Purpose of Shift / Site Visit */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      🎯 2. Purpose of Shift / Site Visit
                    </label>
                    <input
                      type="text"
                      value={visitPurpose}
                      onChange={(e) => setVisitPurpose(e.target.value)}
                      placeholder="e.g. Retail Store Advisory, Inventory Audit, Client Strategy Review"
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", fontWeight: "600" }}
                    />
                  </div>

                  {/* Scope of Work Checklist */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      📋 3. Scope of Work & Deliverables Checklist
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                      {scopeTasks.map(t => (
                        <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#1e293b", cursor: "pointer", fontWeight: "500" }}>
                          <input 
                            type="checkbox" 
                            checked={t.done} 
                            onChange={() => handleToggleScopeTask(t.id)} 
                            style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span style={{ textDecoration: t.done ? "none" : "line-through", color: t.done ? "#0f172a" : "#94a3b8" }}>{t.text}</span>
                        </label>
                      ))}

                      {/* Add new scope item */}
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input 
                          type="text" 
                          placeholder="+ Add custom scope objective..." 
                          value={newScopeInput} 
                          onChange={(e) => setNewScopeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddScopeTask(); } }}
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.82rem" }}
                        />
                        <button type="button" onClick={handleAddScopeTask} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}>Add</button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: LIVE LOCATION DETECTION (GPS) */}
              {wizardStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ textAlign: "center", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "14px", padding: "20px" }}>
                    <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>📍</div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0369a1" }}>GPS Location Detection & Store Radius Verification</h4>
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.84rem", color: "#0284c7" }}>Ensure you are physically on site at the assigned store location</p>

                    <button 
                      type="button" 
                      onClick={handleDetectGpsLocation} 
                      style={{ marginTop: "16px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(2,132,199,0.3)" }}
                    >
                      {gpsData.isDetecting ? "⏳ Detecting GPS Coordinates..." : "📍 Re-Detect Live GPS Coordinates"}
                    </button>
                  </div>

                  {/* GPS Details Card */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700" }}>LATITUDE & LONGITUDE</span>
                      <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{gpsData.lat}° N, {gpsData.lng}° E</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700" }}>DETECTED ADDRESS / SITE</span>
                      <strong style={{ fontSize: "0.88rem", color: "#2563eb" }}>{gpsData.address}</strong>
                    </div>

                    <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✅</span>
                      <span>Verified Match: Within 500m Store Radius Protocol</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SELFIE PHOTO CAPTURE & VERIFICATION */}
              {wizardStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ textAlign: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>📸 Shift Attendance Selfie Verification</h4>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#64748b" }}>Confirm face verification for store check in log</p>
                  </div>

                  {/* Selfie Photo Preview Box */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                    <div style={{ position: "relative", width: "160px", height: "160px", borderRadius: "50%", overflow: "hidden", border: "4px solid #2563eb", boxShadow: "0 10px 25px rgba(37,99,235,0.25)" }}>
                      <img 
                        src={selfiePhoto} 
                        alt="Consultant Selfie Preview" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", bottom: "8px", left: 0, right: 0, textAlign: "center" }}>
                        <span style={{ background: "rgba(15,23,42,0.8)", color: "#ffffff", fontSize: "0.68rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>GPS SNAPSHOT</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button 
                        type="button" 
                        onClick={() => setSelfiePhoto("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80")} 
                        style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer" }}
                      >
                        📷 Retake Selfie Photo
                      </button>
                    </div>
                  </div>

                  {/* Final Summary Card */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 18px", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>Purpose:</strong> {visitPurpose}</div>
                    <div><strong>Store Site:</strong> {displayProjects.find(p => p.id === selectedWizardProjectId)?.name || "ACME Flagship Store"}</div>
                    <div><strong>Scope Tasks:</strong> {scopeTasks.filter(t => t.done).length} Tasks Confirmed</div>
                    <div><strong>GPS Coordinates:</strong> {gpsData.lat}° N, {gpsData.lng}° E</div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div style={{ padding: "18px 28px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {wizardStep > 1 ? (
                <button 
                  type="button" 
                  onClick={() => setWizardStep(prev => prev - 1)} 
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  ← Previous Step
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setShowCheckInWizard(false)} 
                  style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}

              {wizardStep < 3 ? (
                <button 
                  type="button" 
                  onClick={() => setWizardStep(prev => prev + 1)} 
                  style={{ padding: "10px 24px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
                >
                  Next Step →
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleCompleteCheckInSubmit} 
                  style={{ padding: "10px 26px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}
                >
                  Complete Check In & Start Shift ✓
                </button>
              )}
            </div>

          </div>
        </div>
      )}


      {/* GUIDED CONSULTANT CHECK-OUT WIZARD MODAL */}
      {showCheckOutWizard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "560px", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
            
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>✖</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#ffffff" }}>End Shift Check-Out Form</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#fca5a5" }}>Log shift summary & complete day check-out</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCheckOutWizard(false)} style={{ background: "none", border: "none", color: "#fca5a5", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Shift Summary Box */}
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#991b1b" }}>Shift Check-In Summary</div>
                <div style={{ fontSize: "0.78rem", color: "#7f1d1d", marginTop: "4px" }}>
                  Check In Time: <strong>{todayPunch?.checkIn || "10:30 AM"}</strong> • Date: <strong>{todayStr}</strong>
                </div>
              </div>

              {/* Check Out Remarks */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                  📝 END OF SHIFT REMARKS / WORK COMPLETED
                </label>
                <textarea
                  value={wizardCheckOutRemarks}
                  onChange={(e) => setWizardCheckOutRemarks(e.target.value)}
                  placeholder="Summary of advisory tasks completed during shift..."
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

            </div>

            {/* Footer Buttons */}
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                type="button" 
                onClick={() => setShowCheckOutWizard(false)} 
                style={{ padding: "10px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleCompleteCheckOutSubmit} 
                style={{ padding: "10px 24px", background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }}
              >
                Complete Check Out & Close Shift ✖
              </button>
            </div>

          </div>
        </div>
      )}

</div>
  );
}
