import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import LedgerReports from "../components/LedgerReports";
import ProjectsView from "./ProjectsView";
import RegisterView from "./RegisterView";
import logoImg from "../assets/logo.png";

export default function AdminView({ activeTab, setActiveTab }) {
  const {
    users,
    expenses,
    advanceRequests,
    settings,
    currentUser,
    addUser,
    onboardConsultantInvite,
    deleteUser,
    getEmployeeBalanceDetails,
    updateSettings,
    verifyExpense,
    verifyAdvanceRequest,
    requestAdvance,
    setToast
  } = useApp();

  const getUniqueNumber = (id) => {
    if (!id) return "";
    return id
      .replace("exp-consultant-", "EXP-C")
      .replace("adv-consultant-", "ADV-C")
      .toUpperCase();
  };

  // Employee creation form state
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState(""); // 10 digits
  const [empRole, setEmpRole] = useState("Consultant");
  const [empTitle, setEmpTitle] = useState("Retail Jewellery BD Consultant"); // Designation
  const [empDept, setEmpDept] = useState("Advisory");

  // Workforce Sub-Navigation Header State (Matching Reference Screenshot)
  const [subModuleTab, setSubModuleTab] = useState("DASHBOARD");
  const [dashboardSubTab, setDashboardSubTab] = useState("Attendance Summary");

  // Shifts & Weekly Offs Sub-Navigation State (Holidays & Shift Allowance removed as requested)
  const [shiftsSubTab, setShiftsSubTab] = useState("Shift & Weekly Offs"); // "Shift & Weekly Offs" | "Assignments"
  const [shiftsInnerTab, setShiftsInnerTab] = useState("Shifts"); // "Shifts" | "Weekly Offs" | "Shift & Weekly Off Rules"
  const [assignmentsInnerTab, setAssignmentsInnerTab] = useState("Shift & Weekly Off Assignments");

  // Dynamic Shifts and Weekly Offs Lists State
  const [shiftsList, setShiftsList] = useState([
    { name: "Back -End Shift", code: "BE", count: "3 employees", timings: "10:30 AM - 9:00 PM", break: "40 mins" },
    { name: "DRIVERS", code: "DRV", count: "0 employees", timings: "08:00 AM - 05:00 PM", break: "30 mins" },
    { name: "HELPERS - UTC", code: "HUT", count: "3 employees", timings: "10:00 AM - 07:00 PM", break: "40 mins" },
    { name: "Ladies", code: "LAD", count: "3 employees", timings: "10:00 AM - 06:30 PM", break: "30 mins" },
    { name: "Ladies HELPERS", code: "LDH", count: "1 employee", timings: "10:00 AM - 06:30 PM", break: "30 mins" }
  ]);

  const [weeklyOffsList, setWeeklyOffsList] = useState([
    { name: "Friday", count: "2 employees" },
    { name: "Monday", count: "4 employees" },
    { name: "Saturday", count: "0 employees" },
    { name: "Sunday", count: "11 employees" },
    { name: "Teja", count: "1 employee" },
    { name: "Thursday", count: "3 employees", isDefault: true },
    { name: "Tuesday", count: "1 employee" }
  ]);

  // Modal Views for Add Shift & Add Weekly Off
  const [showAddShiftPage, setShowAddShiftPage] = useState(false);
  const [showAddWeeklyOffDrawer, setShowAddWeeklyOffDrawer] = useState(false);

  // Form State for Add Shift Form (Matching Reference Screenshot 1)
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftCode, setNewShiftCode] = useState("");
  const [newShiftType, setNewShiftType] = useState("fixed"); // "fixed" | "flexible"
  const [newShiftDays, setNewShiftDays] = useState(["M", "T", "W", "T", "F", "S", "S"]);
  const [newShiftStartTime, setNewShiftStartTime] = useState("09:00");
  const [newShiftStartAmpm, setNewShiftStartAmpm] = useState("AM");
  const [newShiftEndTime, setNewShiftEndTime] = useState("06:00");
  const [newShiftEndAmpm, setNewShiftEndAmpm] = useState("PM");
  const [newShiftBreakMins, setNewShiftBreakMins] = useState("0");

  // Form State for Add Weekly Off Form (Matching Reference Screenshot 2)
  const [newWeeklyOffName, setNewWeeklyOffName] = useState("");
  const [newWeeklyOffDays, setNewWeeklyOffDays] = useState(["M", "T", "W", "T", "F"]);

  const handleCreateNewShift = () => {
    if (!newShiftName.trim()) {
      alert("Please enter a Shift Name");
      return;
    }
    const name = newShiftName.trim();
    const code = newShiftCode.trim() || name.slice(0, 3).toUpperCase();
    const timings = `${newShiftStartTime} ${newShiftStartAmpm} - ${newShiftEndTime} ${newShiftEndAmpm}`;
    const breakStr = `${newShiftBreakMins} mins`;

    const newShiftObj = { name, code, count: "0 employees", timings, break: breakStr };
    setShiftsList([...shiftsList, newShiftObj]);
    setSelectedShift(name);
    setShowAddShiftPage(false);

    // Reset Form
    setNewShiftName("");
    setNewShiftCode("");
    if (setToast) setToast({ message: `Shift "${name}" created successfully!`, type: "success" });
  };

  const handleCreateNewWeeklyOff = () => {
    if (!newWeeklyOffName.trim()) {
      alert("Please enter a Weekly Off Name");
      return;
    }
    const name = newWeeklyOffName.trim();
    const newWeeklyOffObj = { name, count: "0 employees" };
    setWeeklyOffsList([...weeklyOffsList, newWeeklyOffObj]);
    setSelectedWeeklyOff(name);
    setShowAddWeeklyOffDrawer(false);

    // Reset Form
    setNewWeeklyOffName("");
    if (setToast) setToast({ message: `Weekly Off "${name}" created successfully!`, type: "success" });
  };

  // Selection states inside Shifts & Weekly Offs
  const [selectedShift, setSelectedShift] = useState("Back -End Shift");
  const [selectedWeeklyOff, setSelectedWeeklyOff] = useState("Friday");
  const [shiftSearchQuery, setShiftSearchQuery] = useState("");
  const [weeklyOffSearchQuery, setWeeklyOffSearchQuery] = useState("");
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("");

  // Employee Assignment Overrides & Modals State
  const [employeeAssignments, setEmployeeAssignments] = useState({});
  const [selectedUserIdsForAssignment, setSelectedUserIdsForAssignment] = useState([]);
  const [showUpdateShiftModal, setShowUpdateShiftModal] = useState(false);
  const [showUpdateWeeklyOffModal, setShowUpdateWeeklyOffModal] = useState(false);
  const [modalSelectedShift, setModalSelectedShift] = useState("Back -End Shift");
  const [modalSelectedWeeklyOff, setModalSelectedWeeklyOff] = useState("Sunday");

  // Dynamic Team Calendar Month & Year State
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 1)); // Default Sept 2026

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSaveShiftAssignment = () => {
    const updated = { ...employeeAssignments };
    const targetIds = selectedUserIdsForAssignment.length > 0 
      ? selectedUserIdsForAssignment 
      : users.map(u => u.id);
    
    targetIds.forEach(id => {
      updated[id] = {
        ...updated[id],
        shift: modalSelectedShift
      };
    });
    setEmployeeAssignments(updated);
    setShowUpdateShiftModal(false);
    if (setToast) setToast({ message: `Shift updated to "${modalSelectedShift}" for ${targetIds.length} employee(s)!`, type: "success" });
  };

  const handleSaveWeeklyOffAssignment = () => {
    const updated = { ...employeeAssignments };
    const targetIds = selectedUserIdsForAssignment.length > 0 
      ? selectedUserIdsForAssignment 
      : users.map(u => u.id);
    
    targetIds.forEach(id => {
      updated[id] = {
        ...updated[id],
        weeklyOff: modalSelectedWeeklyOff
      };
    });
    setEmployeeAssignments(updated);
    setShowUpdateWeeklyOffModal(false);
    if (setToast) setToast({ message: `Weekly Off updated to "${modalSelectedWeeklyOff}" for ${targetIds.length} employee(s)!`, type: "success" });
  };

  const [empAdvance, setEmpAdvance] = useState("2000"); // default ₹2000
  const [empLocation, setEmpLocation] = useState("Mumbai / Showroom Site");

  // Onboarding invite result & candidate portal state
  const [generatedInviteResult, setGeneratedInviteResult] = useState(null);
  const [showRegisterPortal, setShowRegisterPortal] = useState(false);
  const [registerToken, setRegisterToken] = useState("");

  // Settings form state
  const [lateLimit, setLateLimit] = useState(settings.lateCheckInLimit);
  const [standardHrs, setStandardHrs] = useState(settings.standardHoursPerDay);
  const [mealsAllow, setMealsAllow] = useState(settings.dailyMealsAllowance);
  const [reqWorkingDays, setReqWorkingDays] = useState(settings.requiredWorkingDays || 22);

  // Inspector modal state
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [showInspector, setShowInspector] = useState(false);

  // SEA Style Dashboard views & task states
  const [adminViewMode, setAdminViewMode] = useState("dashboard"); // 'dashboard', 'tasks'
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [activeExpenseTab, setActiveExpenseTab] = useState("manage_expenses"); // 'manage_expenses', 'manage_petty_cash'
  const [activePettyCashTab, setActivePettyCashTab] = useState("past_advances"); // 'past_advances', 'pending_payments'
  const [showDirectAdvanceModal, setShowDirectAdvanceModal] = useState(false);
  const [directAdvanceEmployee, setDirectAdvanceEmployee] = useState("");
  const [directAdvanceAmount, setDirectAdvanceAmount] = useState("");
  const [directAdvancePurpose, setDirectAdvancePurpose] = useState("");
  const [tasksBoardTab, setTasksBoardTab] = useState("Received"); // 'Received', 'Entrusted', 'Query Raised'
  const [taskFormTab, setTaskFormTab] = useState("task"); // 'task', 'query'
  const [taskDurationTab, setTaskDurationTab] = useState("One Time");
  
  // Create task form inputs
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newAllowFlexible, setNewAllowFlexible] = useState(false);
  const [newAllocatedRole, setNewAllocatedRole] = useState("");
  const [newAllocatedEmployee, setNewAllocatedEmployee] = useState("");
  const [newAcceptanceRequired, setNewAcceptanceRequired] = useState(false);

  // Tasks list state
  const [tasksList, setTasksList] = useState([
    {
      id: "task-demo-1",
      subject: "Review Karam's July Expense Report",
      description: "Audit and verify food & travel expense claims matching July 2026 logs.",
      duration: "One Time",
      dueDate: new Date().toISOString().split("T")[0], // Due Today!
      status: "Due Today",
      assignedRole: "Accounts Manager",
      assignedEmployee: "Robert Chen"
    },
    {
      id: "task-demo-2",
      subject: "Setup Quarterly Sourcing Budgets",
      description: "Establish petty cash refill thresholds for advisory consultants.",
      duration: "Quarterly",
      dueDate: "2026-08-15", // Due Later!
      status: "Due Later",
      assignedRole: "HR Admin",
      assignedEmployee: "Sophia Laurent"
    }
  ]);

  // Project management states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCode, setNewProjectCode] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [projectsList, setProjectsList] = useState([
    { id: "proj-1", name: "DCB Bank Sourcing Account", code: "DCB-SR-01", client: "DCB Bank Ltd" },
    { id: "proj-2", name: "Operations Advisory Project", code: "OPS-AD-04", client: "Acme Corporate" }
  ]);

  React.useEffect(() => {
    setAdminViewMode("dashboard");
  }, [activeTab]);

  const todayStr = new Date().toISOString().split("T")[0];
  const consultantsList = users.filter(u => u.role === "Consultant");

  // Calculate attendance summaries for compliance checks
  const getAttendanceSummary = (c) => {
    const attendance = c.attendance || [];
    const present = attendance.filter(a => a.status === "Present" || a.status === "Late").length;
    
    // July 2026: Count weekend days up to July 19
    let offs = 0;
    let abs = 0;
    for (let d = 1; d < 19; d++) {
      const isWeekOff = [6, 0].includes(new Date(2026, 6, d).getDay());
      if (isWeekOff) {
        offs++;
      } else {
        const record = attendance.find(a => a.date === `2026-07-${d < 10 ? "0" + d : d}`);
        if (!record || record.status === "Absent") {
          abs++;
        }
      }
    }

    const pct = Math.min(100, Math.round((present / (settings.requiredWorkingDays || 22)) * 100));
    return {
      present,
      offs,
      absent: abs,
      pct
    };
  };

  // Dashboard Stats
  const activeStaffCount = consultantsList.length;
  
  const checkedInToday = consultantsList.filter(c => 
    (c.attendance || []).some(a => a.date === todayStr)
  );

  const activeShiftsCount = consultantsList.filter(c => 
    (c.attendance || []).some(a => a.date === todayStr && !a.checkOut)
  ).length;

  const absentTodayCount = activeStaffCount - checkedInToday.length;

  const consultantsBelowCompliance = consultantsList.filter(c => {
    const summary = getAttendanceSummary(c);
    return summary.present < (settings.requiredWorkingDays || 22);
  });

  // Handlers
  const handleOnboardEmployee = (e) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) {
      setToast({ message: "Please fill candidate name and email address.", type: "error" });
      return;
    }

    if (empPhone && empPhone.length !== 10) {
      setToast({ message: "Mobile number must be exactly 10 digits.", type: "error" });
      return;
    }

    const inviteResult = onboardConsultantInvite({
      name: empName,
      email: empEmail,
      phone: empPhone,
      title: empTitle || "Retail Jewellery BD Consultant",
      department: empDept,
      location: empLocation,
      advanceAmount: empAdvance
    });

    // Generate mailto and Gmail compose links for real email dispatch
    const rawSubject = "Welcome to ACME Consulting! Start Your Onboarding";
    const rawBody = `Dear ${empName},\n\nWe are excited to invite you to join ACME Consulting as a ${empTitle || "Retail Jewellery BD Consultant"}.\n\nPlease click the link below to set your account password and start your onboarding:\n${inviteResult.inviteLink}\n\nBest regards,\nHR Admin Team\nACME Consulting`;
    
    const subject = encodeURIComponent(rawSubject);
    const body = encodeURIComponent(rawBody);
    const mailtoUrl = `mailto:${empEmail}?subject=${subject}&body=${body}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(empEmail)}&su=${subject}&body=${body}`;

    // Auto-trigger Gmail compose window or system mail app directly
    try {
      if (empEmail.toLowerCase().includes("gmail")) {
        window.open(gmailUrl, "_blank");
      } else {
        window.location.href = mailtoUrl;
      }
    } catch (err) {
      console.log("Email dispatch auto-trigger note:", err);
    }

    setGeneratedInviteResult({
      ...inviteResult,
      mailtoUrl,
      gmailUrl,
      emailSentTo: empEmail
    });

    setToast({ message: `Opening email dispatch for ${empEmail}!`, type: "success" });
    setEmpName("");
    setEmpEmail("");
    setEmpPhone("");
    setEmpTitle("Retail Jewellery BD Consultant");
    setEmpDept("Advisory");
    setEmpAdvance("2000");
  };

  const handleDirectAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!directAdvanceEmployee || !directAdvanceAmount || !directAdvancePurpose.trim()) {
      setToast({ message: "Please fill all fields.", type: "error" });
      return;
    }
    requestAdvance(directAdvanceEmployee, directAdvanceAmount, directAdvancePurpose);
    setToast({ message: "Advance allocated! Please confirm approval in the Requests list below.", type: "success" });
    setDirectAdvanceEmployee("");
    setDirectAdvanceAmount("");
    setDirectAdvancePurpose("");
    setShowDirectAdvanceModal(false);
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    updateSettings({
      lateCheckInLimit: lateLimit,
      standardHoursPerDay: parseFloat(standardHrs),
      dailyMealsAllowance: parseFloat(mealsAllow),
      requiredWorkingDays: parseInt(reqWorkingDays)
    });
    setToast({ message: "HR operational parameters updated successfully.", type: "success" });
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    const newTask = {
      id: "task-" + Date.now(),
      subject: newSubject,
      description: newDescription,
      duration: taskDurationTab,
      dueDate: newDueDate || new Date().toISOString().split("T")[0],
      endDate: newEndDate,
      allowFlexible: newAllowFlexible,
      assignedRole: newAllocatedRole,
      assignedEmployee: newAllocatedEmployee,
      acceptanceRequired: newAcceptanceRequired
    };

    setTasksList(prev => [newTask, ...prev]);
    setToast({ message: "New task successfully created & allocated!", type: "success" });

    // Reset form
    setNewSubject("");
    setNewDescription("");
    setTaskDurationTab("One Time");
    setNewDueDate("");
    setNewEndDate("");
    setNewAllowFlexible(false);
    setNewAllocatedRole("");
    setNewAllocatedEmployee("");
    setNewAcceptanceRequired(false);

    setShowCreateTaskModal(false);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectCode.trim()) return;

    const newProj = {
      id: "proj-" + Date.now(),
      name: newProjectName,
      code: newProjectCode.toUpperCase(),
      client: newProjectClient || "Acme Consulting Client"
    };

    setProjectsList(prev => [...prev, newProj]);
    setToast({ message: `Project '${newProjectName}' registered successfully!`, type: "success" });

    setNewProjectName("");
    setNewProjectCode("");
    setNewProjectClient("");
    setShowCreateProjectModal(false);
  };

  const renderSofaIllustration = () => (
    <svg width="64" height="48" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6, marginBottom: "8px" }}>
      {/* Background Wall Line */}
      <line x1="10" y1="75" x2="110" y2="75" stroke="#cbd5e1" strokeWidth="1.5" />
      {/* Goals Board on the wall */}
      <rect x="42" y="10" width="36" height="32" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="48" y1="16" x2="72" y2="16" stroke="#475569" strokeWidth="1.5" />
      <circle cx="50" cy="24" r="1.5" fill="#10b981" />
      <line x1="56" y1="24" x2="70" y2="24" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="50" cy="30" r="1.5" fill="#10b981" />
      <line x1="56" y1="30" x2="70" y2="30" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="50" cy="36" r="1.5" fill="#10b981" />
      <line x1="56" y1="36" x2="70" y2="36" stroke="#94a3b8" strokeWidth="1" />
      {/* Plant next to sofa */}
      <line x1="95" y1="75" x2="95" y2="55" stroke="#64748b" strokeWidth="1.5" />
      <path d="M92 58C89 54 92 50 95 50C98 50 101 54 98 58C95 62 92 58 92 58Z" fill="#10b981" opacity="0.7" />
      <path d="M95 64C92 60 95 56 98 56C101 56 104 60 101 64C98 68 95 64 95 64Z" fill="#10b981" opacity="0.8" />
      {/* Sofa Frame */}
      <rect x="20" y="60" width="80" height="15" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
      {/* Sofa Backrest */}
      <rect x="24" y="48" width="72" height="13" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
      {/* Left Armrest */}
      <rect x="16" y="54" width="8" height="21" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
      {/* Right Armrest */}
      <rect x="96" y="54" width="8" height="21" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
      {/* Sofa Pillows */}
      <rect x="28" y="55" width="16" height="10" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="76" y="55" width="16" height="10" rx="1" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      {/* Sofa Legs */}
      <line x1="26" y1="75" x2="24" y2="82" stroke="#64748b" strokeWidth="2" />
      <line x1="94" y1="75" x2="96" y2="82" stroke="#64748b" strokeWidth="2" />
    </svg>
  );

  return (
    <div className="admin-view-container">

      {adminViewMode === "dashboard" && activeTab === "dashboard" && (
        <div className="sea-dashboard-container">
          <div className="sea-welcome-row">
            <h2>Welcome! ADMIN</h2>
          </div>

          {/* Columns */}
          <div className="sea-content-layout">
            {/* Left Column: Quick Access Grid */}
            <div className="sea-column-left">
              <div className="sea-section-header" style={{ marginBottom: "16px" }}>
                <span>⚡ Quick Access</span>
                <span style={{ color: "#3b82f6", cursor: "pointer", fontSize: "0.8rem" }}>ⓘ</span>
              </div>

              <div className="sea-quick-access-grid">
                {[
                  { 
                    label: "Add New Consultant", 
                    themeClass: "theme-purple",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="16" y1="11" x2="22" y2="11" />
                      </svg>
                    ),
                    onClick: () => { setActiveTab("directory"); setShowOnboardModal(true); } 
                  },
                  { 
                    label: "Add New Project", 
                    themeClass: "theme-blue",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    ),
                    onClick: () => setActiveTab("projects") 
                  },
                  { 
                    label: "Verify Expense Claims", 
                    themeClass: "theme-green",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    ),
                    onClick: () => setActiveTab("reports") 
                  },
                  { 
                    label: "Manage Petty Cash", 
                    themeClass: "theme-teal",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    ),
                    onClick: () => setActiveTab("reports") 
                  },
                  { 
                    label: "Attendance Matrices", 
                    themeClass: "theme-orange",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    ),
                    onClick: () => setActiveTab("attendance") 
                  }
                ].map((qa, index) => (
                  <div key={index} className={`sea-qa-card ${qa.themeClass}`} onClick={qa.onClick}>
                    <div className="sea-qa-icon">
                      {qa.icon}
                    </div>
                    <span className="sea-qa-label">{qa.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Work To Do / Done */}
            <div className="sea-column-right">
              {/* Work To Do widget */}
              <div className="sea-sidebar-card">
                <div className="sea-card-title">
                  <span>📋</span> Work To Do
                </div>

                <div className="sea-work-todo-row">
                  <div className="sea-todo-block task" onClick={() => setAdminViewMode("tasks")}>
                    <span className="sea-todo-label">Task</span>
                    <span className="sea-todo-val">{tasksList.length < 10 ? `0${tasksList.length}` : tasksList.length}</span>
                  </div>

                  <div className="sea-todo-block verification" onClick={() => setToast({ message: "Verification claims dashboard loaded.", type: "info" })}>
                    <span className="sea-todo-label">Verification</span>
                    <span className="sea-todo-val">00</span>
                  </div>

                  <div className="sea-todo-block acceptance" onClick={() => setToast({ message: "Task acceptances are up to date.", type: "info" })}>
                    <span className="sea-todo-label">Acceptance</span>
                    <span className="sea-todo-val">2</span>
                  </div>
                </div>
              </div>

              {/* Chats Card */}
              <div className="sea-sidebar-card">
                <div className="sea-card-title">
                  <span>💬</span> Chats
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                  No active conversations today.
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="sea-sidebar-card">
                <div className="sea-card-title">
                  <span>⚡</span> Recent Activity
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <span>System database synced</span>
                    <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>Just now</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <span>Compliance logs compiled</span>
                    <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>2 hours ago</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>System session initiated</span>
                    <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>4 hours ago</span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {adminViewMode === "tasks" && activeTab === "dashboard" && (
        <div className="sea-dashboard-container">
          <div className="tasks-board-container">
            {/* Top tabs */}
            <div className="tasks-tabs-row">
              {["Received", "Entrusted", "Query Raised"].map(tab => (
                <button
                  key={tab}
                  className={`tasks-tab-btn ${tasksBoardTab === tab ? "active" : ""}`}
                  onClick={() => setTasksBoardTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Header row */}
            <div className="tasks-header-row">
              <h2>Received Tasks</h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="luxury-button"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #3b82f6",
                    color: "#3b82f6",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}
                >
                  <span>➕</span> New Task
                </button>
                <button
                  onClick={() => setAdminViewMode("dashboard")}
                  className="luxury-button"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}
                >
                  <span>❌</span> Close
                </button>
              </div>
            </div>

            {/* Columns Grid */}
            <div className="tasks-board-grid">
              {["Overdue", "Due Today", "Due Tomorrow", "Due Later"].map(col => {
                // Filter tasks for this column
                const today = new Date().toISOString().split("T")[0];
                const tomorrowDate = new Date();
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                const tomorrow = tomorrowDate.toISOString().split("T")[0];

                let colTasks = [];
                if (tasksBoardTab === "Received") {
                  colTasks = tasksList.filter(t => {
                    if (col === "Overdue") return t.dueDate < today;
                    if (col === "Due Today") return t.dueDate === today;
                    if (col === "Due Tomorrow") return t.dueDate === tomorrow;
                    if (col === "Due Later") return t.dueDate > tomorrow;
                    return false;
                  });
                }

                return (
                  <div key={col} className="tasks-board-column">
                    <div className="tasks-col-header">{col}</div>
                    
                    {colTasks.length > 0 ? (
                      colTasks.map(t => (
                        <div key={t.id} className="task-board-item-card" onClick={() => setToast({ message: `Viewing details for task: ${t.subject}`, type: "info" })}>
                          <div className="task-card-subject">{t.subject}</div>
                          <div className="task-card-desc">{t.description}</div>
                          <div className="task-card-meta">
                            <span>⏱️ {t.duration}</span>
                            <span style={{ fontWeight: "700", color: "#475569" }}>{t.assignedEmployee || "Admin"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="tasks-empty-state">
                        {renderSofaIllustration()}
                        <span style={{ fontSize: "0.68rem", fontStyle: "italic", opacity: 0.8 }}>No Task Due</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal Overlay */}
      {showCreateTaskModal && (
        <div className="task-modal-overlay">
          <div className="task-modal-card">
            <div className="task-modal-header">
              <h3 style={{ margin: 0 }}>Create New Task</h3>
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="luxury-form">
              {/* Type Switcher tabs */}
              <div className="form-group">
                <label>Task Type</label>
                <div className="task-form-tabs">
                  <button
                    type="button"
                    className={`task-form-tab-btn ${taskFormTab === "task" ? "active" : ""}`}
                    onClick={() => setTaskFormTab("task")}
                  >
                    Task
                  </button>
                  <button
                    type="button"
                    className={`task-form-tab-btn ${taskFormTab === "query" ? "active" : ""}`}
                    onClick={() => setTaskFormTab("query")}
                  >
                    Query
                  </button>
                </div>
              </div>

              {/* Subject Input */}
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Subject of the task..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
              </div>

              {/* Task Description */}
              <div className="form-group">
                <label>Task Description</label>
                <textarea
                  placeholder="Describe task details..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ resize: "none", height: "100px" }}
                />
              </div>

              {/* Duration selector */}
              <div className="form-group">
                <label>Select Duration Of The Task</label>
                <div className="task-duration-bar">
                  {["One Time", "Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Half Yearly", "Yearly"].map(dur => (
                    <button
                      type="button"
                      key={dur}
                      className={`task-duration-btn ${taskDurationTab === dur ? "active" : ""}`}
                      onClick={() => {
                        setTaskDurationTab(dur);
                        setNewDuration(dur);
                      }}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date & End Date Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Roles or Employee allocation */}
              <div className="form-group">
                <label>Add Role or Employee for allocation</label>
                <div className="form-row">
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="form-group search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Roles..."
                      value={newAllocatedRole}
                      onChange={(e) => setNewAllocatedRole(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                  </div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="form-group search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Employees..."
                      value={newAllocatedEmployee}
                      onChange={(e) => setNewAllocatedEmployee(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                  </div>
                </div>
              </div>

              {/* Selected display box */}
              <div className="form-group">
                <label>Selected Target</label>
                <input
                  type="text"
                  placeholder="Selected Role / Employee"
                  value={newAllocatedRole || newAllocatedEmployee ? `${newAllocatedRole} ${newAllocatedEmployee && newAllocatedRole ? " / " : ""}${newAllocatedEmployee}` : ""}
                  readOnly
                  style={{ backgroundColor: "#f8fafc" }}
                />
              </div>

              {/* Checkbox settings and Save actions */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "12px" }}>
                <div className="checkbox-group" style={{ marginBottom: "16px" }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newAllowFlexible}
                      onChange={(e) => setNewAllowFlexible(e.target.checked)}
                    />
                    <span>Allow flexible work completion after due date</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newAcceptanceRequired}
                      onChange={(e) => setNewAcceptanceRequired(e.target.checked)}
                    />
                    <span>Acceptance Required</span>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskModal(false)}
                    className="luxury-button"
                    style={{ backgroundColor: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="luxury-button"
                    style={{ backgroundColor: "#1e3a8a", color: "#ffffff", padding: "8px 24px" }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Creation Modal Overlay */}
      {showCreateProjectModal && (
        <div className="task-modal-overlay">
          <div className="task-modal-card" style={{ maxWidth: "500px" }}>
            <div className="task-modal-header">
              <h3 style={{ margin: 0 }}>Register New Project</h3>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="luxury-form">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. DCB Bank Advisory Phase 2"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Project Code</label>
                <input
                  type="text"
                  placeholder="e.g. DCB-AD-02"
                  value={newProjectCode}
                  onChange={(e) => setNewProjectCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. DCB Bank Ltd"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="luxury-button"
                  style={{ backgroundColor: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="luxury-button"
                  style={{ backgroundColor: "#22c55e", color: "#ffffff", padding: "8px 24px", border: "none", borderRadius: "6px", fontWeight: "700" }}
                >
                  Register Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "directory" && (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: 0 }}>Employee Directory</h3>
              <p className="subtitle" style={{ margin: "4px 0 0 0" }}>Manage system accounts and monitor activity</p>
            </div>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="luxury-button"
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.15s",
                fontSize: "0.82rem"
              }}
            >
              + Onboard Staff
            </button>
          </div>
          
          <div className="directory-cards-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
            maxHeight: "720px",
            overflowY: "auto",
            paddingRight: "6px"
          }}>
            {users.map((u) => {
              const mockLocation = u.location || (u.id.charCodeAt(u.id.length - 1) % 2 === 0 ? "Mehdipatnam" : "Nampally");
              return (
                <div key={u.id} className="directory-card" style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0", /* Sharp corners */
                  padding: "16px",
                  display: "flex",
                  gap: "14px",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease"
                }}>
                  {/* Left Column: Avatar */}
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src={u.avatar} 
                      alt={u.name} 
                      style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }} 
                    />
                  </div>

                  {/* Right Column: Details */}
                  <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 16px 2px 0", wordBreak: "break-word" }}>
                        {u.name}
                      </h4>
                      
                      {/* Action menu trigger (Deletes user) */}
                      <button
                        onClick={() => {
                          if (confirm(`Confirm account deletion for ${u.name}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        title="Delete Employee"
                        style={{
                          background: "#f1f5f9",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          lineHeight: "1.2",
                          position: "absolute",
                          top: "14px",
                          right: "14px",
                          transition: "all 0.15s"
                        }}
                      >
                        •••
                      </button>
                    </div>

                    {/* Designation Title */}
                    <p style={{ fontSize: "0.76rem", color: "#475569", fontWeight: "600", margin: "0 0 10px 0" }}>
                      {u.title || `${u.role} Lead`}
                    </p>

                    {/* Attributes */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.72rem", color: "#475569" }}>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Department : </span>
                        <span style={{ fontWeight: "600", textTransform: "uppercase" }}>{u.department}</span>
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Location : </span>
                        <span style={{ fontWeight: "500" }}>{mockLocation}</span>
                      </div>
                      <div style={{ wordBreak: "break-all" }}>
                        <span style={{ color: "#94a3b8" }}>Email : </span>
                        <span style={{ fontWeight: "500", textTransform: "none" }}>{u.email}</span>
                      </div>
                    </div>

                    {/* View Profile small action button */}
                    {u.role === "Consultant" && (
                      <div style={{ marginTop: "12px" }}>
                        <button
                          onClick={() => {
                            setSelectedConsultant(u);
                            setShowInspector(true);
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            border: "1px solid #3b82f6",
                            color: "#3b82f6",
                            backgroundColor: "#eff6ff",
                            borderRadius: "4px",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboard Staff Modal Overlay */}
      {showOnboardModal && (
        <div className="task-modal-overlay">
          <div className="task-modal-card" style={{ maxWidth: "540px" }}>
            <div className="task-modal-header">
              <h3 style={{ margin: 0 }}>Onboard New Consultant</h3>
              <button
                type="button"
                onClick={() => { setShowOnboardModal(false); setGeneratedInviteResult(null); }}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {generatedInviteResult ? (
              <div style={{ padding: "12px 0 0 0", display: "flex", flexDirection: "column", gap: "14px" }}>
                
                {/* Simulated Sent Email Header Banner */}
                <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#475569", marginBottom: "6px" }}>
                    <span>📧 <strong>From:</strong> HR Admin &lt;onboarding@acmeworkcentre.com&gt;</span>
                    <span style={{ color: "#15803d", fontWeight: "700", background: "#dcfce7", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>
                      ✓ Email Sent Successfully
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#0f172a", marginBottom: "4px" }}>
                    <strong>To:</strong> {generatedInviteResult.user.name} &lt;{generatedInviteResult.user.email}&gt;
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#1e293b", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "6px" }}>
                    Subject: Welcome to ACME Consulting! Start Your Onboarding
                  </div>
                </div>

                {/* Email Body Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <img src={logoImg} alt="ACME Logo" style={{ height: "26px", objectFit: "contain" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "4px" }}>
                      OFFICIAL INVITATION
                    </span>
                  </div>

                  <p style={{ fontSize: "0.9rem", color: "#1e293b", margin: "0 0 10px 0" }}>
                    Dear <strong>{generatedInviteResult.user.name}</strong>,
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: "1.5", margin: "0 0 18px 0" }}>
                    We are excited to invite you to join ACME Consulting as a <strong>{generatedInviteResult.user.title}</strong>. Please click the button below to set your account password and start your onboarding.
                  </p>

                  {/* START ONBOARDING CTA BUTTON */}
                  <div style={{ textAlign: "center", margin: "16px 0" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterToken(generatedInviteResult.inviteToken);
                        setShowRegisterPortal(true);
                        setShowOnboardModal(false);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 28px",
                        fontSize: "0.95rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <span>Start Onboarding</span> ➔
                    </button>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#64748b", wordBreak: "break-all", marginTop: "14px" }}>
                    <strong>Direct Link:</strong> {generatedInviteResult.inviteLink}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (generatedInviteResult.gmailUrl) {
                          window.open(generatedInviteResult.gmailUrl, "_blank");
                        }
                      }}
                      style={{
                        background: "#ea4335",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>✉ Send via Gmail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (generatedInviteResult.mailtoUrl) {
                          window.location.href = generatedInviteResult.mailtoUrl;
                        }
                      }}
                      style={{
                        background: "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      📫 Send via Mail App
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInviteResult.inviteLink);
                        setToast({ message: "Registration link copied to clipboard!", type: "success" });
                      }}
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      📋 Copy Link
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowOnboardModal(false); setGeneratedInviteResult(null); }}
                    style={{ padding: "8px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: "600" }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardEmployee} className="luxury-form">
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0" }}>
                  Enter the candidate's primary details. An onboarding invite link will be generated for them to complete self-registration.
                </p>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. David Vance" 
                    value={empName} 
                    onChange={(e) => setEmpName(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="name@jewelconsulting.com" 
                      value={empEmail} 
                      onChange={(e) => setEmpEmail(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number (10 Digits) *</label>
                    <input 
                      type="text" 
                      placeholder="Enter 10-digit mobile" 
                      value={empPhone} 
                      maxLength={10}
                      onChange={(e) => setEmpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Designation (Title)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Retail Jewellery BD Consultant" 
                      value={empTitle} 
                      onChange={(e) => setEmpTitle(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Cash Advance (₹)</label>
                    <input 
                      type="number" 
                      placeholder="2000" 
                      value={empAdvance} 
                      onChange={(e) => setEmpAdvance(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <select value={empDept} onChange={(e) => setEmpDept(e.target.value)} className="luxury-select">
                      <option value="Advisory">Advisory</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Primary Site Location</label>
                    <select value={empLocation} onChange={(e) => setEmpLocation(e.target.value)} className="luxury-select">
                      <option value="Mumbai / Showroom Site">Mumbai / Showroom Site</option>
                      <option value="Hyderabad / HQ">Hyderabad / HQ</option>
                      <option value="Bengaluru / South Region">Bengaluru / South Region</option>
                      <option value="Surat / Diamond Desk">Surat / Diamond Desk</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowOnboardModal(false)}
                    className="luxury-button"
                    style={{ backgroundColor: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="luxury-button"
                    style={{ backgroundColor: "#2563eb", color: "#fff" }}
                  >
                    Send Onboarding Invite Link ➔
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <ProjectsView />
      )}

      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Double-Tier Sub-Navigation Header Bar (Matching Reference Screenshot) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", margin: "-12px 0 4px 0", padding: "0 20px" }}>
            
            {/* Row 1: Module Main Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
              {[
                { id: "DASHBOARD", label: "DASHBOARD" },
                { id: "APPROVALS", label: "APPROVALS", badge: 31 },
                { id: "SHIFTS", label: "SHIFTS/WEEKLY OFFS & HOLIDAYS" },
                { id: "LEAVE", label: "LEAVE" },
                { id: "REPORTS", label: "REPORTS" },
                { id: "SETTINGS", label: "SETTINGS" }
              ].map(tab => {
                const isActive = subModuleTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSubModuleTab(tab.id)}
                    style={{
                      padding: "12px 0",
                      background: "none",
                      border: "none",
                      borderBottom: isActive ? "3px solid #5b50a1" : "3px solid transparent",
                      color: isActive ? "#334155" : "#64748b",
                      fontWeight: isActive ? "600" : "400",
                      fontSize: "0.76rem",
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.68rem", fontWeight: "600", padding: "1px 6px", borderRadius: "10px", lineHeight: 1 }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Sub-Tabs under DASHBOARD */}
            {subModuleTab === "DASHBOARD" && (
              <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "10px 0 0 0", overflowX: "auto" }}>
                {[
                  "Attendance Summary",
                  "Attendance Analytics",
                  "Leave Summary",
                  "Leave Analytics"
                ].map(subTab => {
                  const isActive = dashboardSubTab === subTab;
                  return (
                    <button
                      key={subTab}
                      type="button"
                      onClick={() => setDashboardSubTab(subTab)}
                      style={{
                        padding: "4px 0 8px 0",
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? "2px solid #5b50a1" : "2px solid transparent",
                        color: isActive ? "#1e293b" : "#64748b",
                        fontWeight: isActive ? "500" : "400",
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {subTab}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Row 2: Sub-Tabs under SHIFTS/WEEKLY OFFS (Holidays & Shift Allowance Removed) */}
            {subModuleTab === "SHIFTS" && (
              <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "10px 0 0 0", overflowX: "auto" }}>
                {[
                  "Shift & Weekly Offs",
                  "Assignments"
                ].map(subTab => {
                  const isActive = shiftsSubTab === subTab;
                  return (
                    <button
                      key={subTab}
                      type="button"
                      onClick={() => setShiftsSubTab(subTab)}
                      style={{
                        padding: "4px 0 8px 0",
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? "2px solid #5b50a1" : "2px solid transparent",
                        color: isActive ? "#1e293b" : "#64748b",
                        fontWeight: isActive ? "500" : "400",
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {subTab}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DASHBOARD Content View */}
          {subModuleTab === "DASHBOARD" && (
            <>
              {/* Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: "500", color: "#0f172a", margin: 0 }}>Attendance Dashboard</h2>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>Workforce presence & team leave calendar</p>
                </div>
              </div>

          {/* Top Row: Who is off today & Not in yet today */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
            {/* Card 1: Who is off today */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "500", color: "#334155", margin: "0 0 14px 0" }}>Who is off today</h4>
              
              {/* Amber Notice Banner */}
              <div style={{ background: "#fef9c3", border: "1px solid #fef08a", borderRadius: "0px", padding: "12px 16px", color: "#854d0e", fontSize: "0.85rem", fontWeight: "400" }}>
                No employee is off today.
              </div>
            </div>

            {/* Card 2: Not in yet today */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "500", color: "#334155", margin: "0 0 14px 0" }}>Not in yet today</h4>
              
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {users.filter(u => u.role === "Consultant").slice(0, 4).map(c => (
                  <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <img src={c.avatar} alt={c.name} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "400", maxWidth: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name.split(" ")[0]}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Row: 4 Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {/* Stat 1: On Time */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#06b6d4" }} />
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Employees On Time today</span>
              <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>0</span>
            </div>

            {/* Stat 2: Late Arrivals */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#c026d3" }} />
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Late Arrivals today</span>
              <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>0</span>
            </div>

            {/* Stat 3: Employees on Leave today */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#84cc16" }} />
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Employees on Leave today</span>
              <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>0</span>
            </div>

            {/* Stat 4: Remote Clock-ins */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#f97316" }} />
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Remote Clock-ins today</span>
              <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>0</span>
            </div>
          </div>

          {/* Section: Team calendar (Whole Month Wise Matrix Table) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "500", color: "#334155", margin: "0 0 12px 0" }}>Team calendar</h3>

            {(() => {
              const calendarYear = selectedDate.getFullYear();
              const calendarMonth = selectedDate.getMonth();
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
              const formattedMonthLabel = `${monthNames[calendarMonth]} ${calendarYear}`;
              const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

              const daysHeader = Array.from({ length: totalDaysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const d = new Date(calendarYear, calendarMonth, dayNum);
                const dayName = d.toLocaleString('en-US', { weekday: 'short' });
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return { day: dayNum, name: dayName, isWeekend };
              });

              return (
                <>
                  {/* Month Selector (Functional Previous & Next Month Navigation) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <button 
                      type="button" 
                      onClick={handlePrevMonth}
                      title="Previous Month"
                      style={{ background: "#4c478a", color: "#fff", border: "none", borderRadius: "0px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                    >
                      ‹
                    </button>

                    <div style={{ position: "relative", display: "inline-block" }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: "500", color: "#334155", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {formattedMonthLabel}
                      </span>
                      <input
                        type="month"
                        value={`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [y, m] = e.target.value.split("-");
                            setSelectedDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer"
                        }}
                        title="Click to select month and year"
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={handleNextMonth}
                      title="Next Month"
                      style={{ background: "#4c478a", color: "#fff", border: "none", borderRadius: "0px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                    >
                      ›
                    </button>
                  </div>

                  {/* Enterprise Attendance Grid Table (P, A, HD, L, OFF with Summary Counts) */}
                  <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", marginBottom: "20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", minWidth: "1100px" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#334155" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", width: "220px", position: "sticky", left: 0, background: "#f1f5f9", zIndex: 2, borderRight: "1px solid #cbd5e1", fontWeight: "500" }}>Employee</th>
                          {daysHeader.map(d => (
                            <th key={d.day} style={{ padding: "6px 2px", textAlign: "center", minWidth: "28px", fontWeight: "400", borderRight: "1px solid #e2e8f0", background: d.isWeekend ? "#f8fafc" : "#f1f5f9" }}>
                              <div style={{ color: d.isWeekend ? "#dc2626" : "#1e293b", fontWeight: "500" }}>{d.day}</div>
                              <div style={{ fontSize: "0.65rem", color: d.isWeekend ? "#ef4444" : "#64748b", fontWeight: "400" }}>{d.name}</div>
                            </th>
                          ))}
                          {/* Summary Columns Header */}
                          <th style={{ padding: "6px 6px", textAlign: "center", width: "30px", background: "#e2e8f0", borderLeft: "1px solid #cbd5e1", color: "#0f172a", fontWeight: "600" }}>P</th>
                          <th style={{ padding: "6px 6px", textAlign: "center", width: "30px", background: "#e2e8f0", color: "#0284c7", fontWeight: "600" }}>L</th>
                          <th style={{ padding: "6px 6px", textAlign: "center", width: "30px", background: "#e2e8f0", color: "#d97706", fontWeight: "600" }}>HD</th>
                          <th style={{ padding: "6px 6px", textAlign: "center", width: "30px", background: "#e2e8f0", color: "#e11d48", fontWeight: "600" }}>A</th>
                          <th style={{ padding: "6px 6px", textAlign: "center", width: "30px", background: "#e2e8f0", color: "#64748b", fontWeight: "600" }}>OFF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((emp, uIdx) => {
                          const getDayStatus = (dayNum, isWeekend) => {
                            if (isWeekend) return { code: "OFF", bg: "transparent", color: "#64748b" };
                            
                            if (uIdx === 0) {
                              if (dayNum === 8 || dayNum === 10 || dayNum === 14) return { code: "A", bg: "#e0f2fe", color: "#0369a1" };
                              if (dayNum === 12) return { code: "L", bg: "#e0f2fe", color: "#0369a1" };
                              return { code: "P", bg: "transparent", color: "#334155" };
                            } else if (uIdx === 1) {
                              if (dayNum <= 12) return { code: "A", bg: "#e0f2fe", color: "#0369a1" };
                              return { code: "P", bg: "transparent", color: "#334155" };
                            } else if (uIdx === 2) {
                              if (dayNum === 1 || dayNum === 4 || dayNum === 7 || dayNum === 11 || dayNum === 13) return { code: "HD", bg: "#bae6fd", color: "#0284c7" };
                              if (dayNum === 3 || dayNum === 9 || dayNum === 16) return { code: "A", bg: "#e0f2fe", color: "#0369a1" };
                              return { code: "P", bg: "transparent", color: "#334155" };
                            } else {
                              if (dayNum % 4 === 0) return { code: "A", bg: "#e0f2fe", color: "#0369a1" };
                              if (dayNum % 7 === 0) return { code: "HD", bg: "#bae6fd", color: "#0284c7" };
                              return { code: "P", bg: "transparent", color: "#334155" };
                            }
                          };

                          let pCount = 0, aCount = 0, hdCount = 0, lCount = 0, offCount = 0;
                          const dayStatuses = daysHeader.map(dh => {
                            const st = getDayStatus(dh.day, dh.isWeekend);
                            if (st.code === "P") pCount++;
                            else if (st.code === "A") aCount++;
                            else if (st.code === "HD") hdCount++;
                            else if (st.code === "L") lCount++;
                            else if (st.code === "OFF") offCount++;
                            return st;
                          });

                          return (
                            <tr key={emp.id} style={{ borderBottom: "1px solid #e2e8f0", background: uIdx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                              {/* Sticky Employee Details Column */}
                              <td style={{ padding: "8px 12px", position: "sticky", left: 0, background: uIdx % 2 === 0 ? "#ffffff" : "#f8fafc", zIndex: 2, borderRight: "1px solid #cbd5e1" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <img src={emp.avatar} alt={emp.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                                  <div>
                                    <div style={{ fontWeight: "500", color: "#0f172a", fontSize: "0.82rem" }}>
                                      {emp.name} <span style={{ color: "#64748b", fontSize: "0.72rem" }}>[{emp.role === "Admin" ? "A0001" : `C00${uIdx + 1}`}]</span>
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "400" }}>
                                      {emp.title || emp.role}, Hyderabad
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Days 1 to Total Days Code Cells */}
                              {dayStatuses.map((st, dIdx) => (
                                <td key={dIdx} style={{ padding: "6px 2px", textAlign: "center", background: st.bg, color: st.color, fontWeight: "500", fontSize: "0.75rem", borderRight: "1px solid #f1f5f9" }}>
                                  {st.code}
                                </td>
                              ))}

                              {/* Summary Columns */}
                              <td style={{ padding: "6px 6px", textAlign: "center", fontWeight: "500", color: "#0f172a", borderLeft: "1px solid #cbd5e1", background: "#f8fafc" }}>{pCount}</td>
                              <td style={{ padding: "6px 6px", textAlign: "center", fontWeight: "500", color: "#0284c7", background: "#f8fafc" }}>{lCount}</td>
                              <td style={{ padding: "6px 6px", textAlign: "center", fontWeight: "500", color: "#d97706", background: "#f8fafc" }}>{hdCount}</td>
                              <td style={{ padding: "6px 6px", textAlign: "center", fontWeight: "500", color: "#e11d48", background: "#f8fafc" }}>{aCount}</td>
                              <td style={{ padding: "6px 6px", textAlign: "center", fontWeight: "500", color: "#64748b", background: "#f8fafc" }}>{offCount}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            {/* Clean Legend Bar matching screenshot */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "28px", fontSize: "0.82rem", color: "#334155", fontWeight: "500" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>P</span> Present
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "700", color: "#0369a1", background: "#e0f2fe", padding: "1px 6px" }}>A</span> Absent
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "700", color: "#0284c7", background: "#bae6fd", padding: "1px 6px" }}>HD</span> Halfday
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "700", color: "#0369a1", background: "#e0f2fe", padding: "1px 6px" }}>L</span> Leave
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "700", color: "#64748b" }}>OFF</span> Weekly Off
              </div>
            </div>
          </div>

          {/* Section: Peers Grid */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#1e293b", margin: "0 0 16px 0" }}>Peers ({users.length})</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {users.map(u => (
                <div key={u.id} style={{ border: "1px solid #e2e8f0", borderRadius: "0px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={u.avatar} alt={u.name} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a" }}>{u.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>{u.title || u.role}</div>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#0284c7", background: "#e0f2fe", border: "1px solid #bae6fd", padding: "3px 8px", borderRadius: "0px" }}>
                    NOT IN YET
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workforce Daily Attendance Auditor Table */}
          <div className="expenses-section glass-card">
            <h3>Workforce Daily Attendance Auditor</h3>
            <p className="subtitle">Historical punch-card logs submitted by employees</p>
            
            <table className="luxury-table" style={{ marginTop: "12px" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee Name</th>
                  <th>Client Project</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Presence Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === "Consultant").flatMap(c => 
                  (c.attendance || []).map((a, idx) => (
                    <tr key={`${c.id}-${idx}`}>
                      <td>{a.date}</td>
                      <td className="user-cell">
                        <img src={c.avatar} alt={c.name} className="avatar-small" />
                        <div className="user-cell-text">
                          <strong>{c.name}</strong>
                          <span>{c.title}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                          {a.projectName || a.projectId || "DCB Bank Sourcing Account"}
                        </span>
                      </td>
                      <td>{a.checkIn || "—"}</td>
                      <td>{a.checkOut || <span className="warning-text">Active Working Shift</span>}</td>
                      <td>{a.hoursWorked ? `${a.hoursWorked} hrs` : "—"}</td>
                      <td>
                        <span className={`status-badge ${a.status.toLowerCase()}`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{a.remarks || "—"}</td>
                    </tr>
                  ))
                )}
                {users.filter(u => u.role === "Consultant").every(c => !c.attendance || c.attendance.length === 0) && (
                  <tr>
                    <td colSpan="8" className="text-center">No attendance punches recorded in system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SHIFTS / WEEKLY OFFS & ASSIGNMENTS View (Holidays and Shift Allowance Removed as requested) */}
      {subModuleTab === "SHIFTS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Sub-Tab 1: Shift & Weekly Offs */}
          {shiftsSubTab === "Shift & Weekly Offs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Row 3 Pills: Shifts | Weekly Offs | Shift & Weekly Off Rules */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "10px 16px", display: "flex", gap: "10px", alignItems: "center" }}>
                {["Shifts", "Weekly Offs", "Shift & Weekly Off Rules"].map(tab => {
                  const isActive = shiftsInnerTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setShiftsInnerTab(tab)}
                      style={{
                        padding: "6px 14px",
                        background: isActive ? "#f3e8ff" : "#ffffff",
                        color: isActive ? "#6b21a8" : "#475569",
                        border: isActive ? "1px solid #d8b4fe" : "1px solid #e2e8f0",
                        borderRadius: "0px",
                        fontWeight: isActive ? "600" : "400",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* View 1.1: Shifts (Matching Screenshot 1) */}
              {shiftsInnerTab === "Shifts" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Title Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Shifts</h2>
                      <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                        You can specify shift timings here. These can be assigned to individual employees. The default shift gets applied to all employees when not explicitly set.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span title="Info" style={{ color: "#64748b", cursor: "pointer" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowAddShiftPage(true)}
                        style={{ background: "#4c478a", color: "#ffffff", border: "none", borderRadius: "0px", padding: "10px 18px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        +Add shifts ▾
                      </button>
                    </div>
                  </div>

                  {/* 2 Column Layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px" }}>
                    
                    {/* Left Sidebar List */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Search"
                          value={shiftSearchQuery}
                          onChange={(e) => setShiftSearchQuery(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #cbd5e1", borderRadius: "0px", fontSize: "0.82rem", outline: "none" }}
                        />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "10px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {shiftsList.filter(s => s.name.toLowerCase().includes(shiftSearchQuery.toLowerCase())).map(item => {
                          const isSelected = selectedShift === item.name;
                          return (
                            <div
                              key={item.name}
                              onClick={() => setSelectedShift(item.name)}
                              style={{
                                padding: "12px 14px",
                                background: isSelected ? "#f1f5f9" : "#ffffff",
                                borderLeft: isSelected ? "3px solid #4c478a" : "3px solid transparent",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <div style={{ fontWeight: isSelected ? "600" : "500", fontSize: "0.85rem", color: "#1e293b" }}>{item.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>{item.count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Details Panel */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#0f172a", margin: "0 0 16px 0" }}>{selectedShift}</h3>
                      
                      {(() => {
                        const activeShiftObj = shiftsList.find(s => s.name === selectedShift) || shiftsList[0];
                        return (
                          <>
                            <div style={{ marginBottom: "20px" }}>
                              <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", display: "block" }}>SHIFT CODE</span>
                              <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: "500" }}>{activeShiftObj.code || (activeShiftObj.name === "Back -End Shift" ? "BE" : activeShiftObj.name.slice(0, 3).toUpperCase())}</span>
                            </div>

                            {/* Details Sub-Tabs */}
                            <div style={{ borderBottom: "1px solid #e2e8f0", display: "flex", gap: "24px", marginBottom: "20px" }}>
                              <span style={{ padding: "8px 0", borderBottom: "2px solid #4c478a", color: "#1e293b", fontWeight: "600", fontSize: "0.85rem" }}>Summary</span>
                              <span style={{ padding: "8px 0", color: "#64748b", fontSize: "0.85rem" }}>Employees</span>
                              <span style={{ padding: "8px 0", color: "#64748b", fontSize: "0.85rem" }}>Track Shift Versions</span>
                            </div>

                            {/* Summary Table & Right Card */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "20px" }}>
                              <div style={{ border: "1px solid #e2e8f0" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                                  <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600" }}>DAYS</th>
                                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600" }}>SHIFT TIMINGS</th>
                                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600" }}>BREAK DURATION</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: "14px", color: "#334155" }}>Sunday to Saturday</td>
                                      <td style={{ padding: "14px", color: "#334155" }}>
                                        <div>{activeShiftObj.timings || "10:30 AM - 9:00 PM"}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Work hours</div>
                                      </td>
                                      <td style={{ padding: "14px", color: "#334155" }}>
                                        <div>{activeShiftObj.break || "40 mins"}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Break duration</div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Rule based assignment card */}
                              <div style={{ border: "1px solid #e2e8f0", padding: "18px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#0f172a" }}>Rule based assignment</h5>
                                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
                                  Employees following this rule will be added to this shift policy automatically.
                                </p>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                    </div>

                  </div>
                </div>
              )}

              {/* View 1.2: Weekly Offs (Matching Screenshot 2) */}
              {shiftsInnerTab === "Weekly Offs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Title Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Weekly offs</h2>
                      <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                        You can specify weekly offs here. These can be assigned to individual employees. The default weekly off gets applied to all employees when not explicitly set.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span title="Info" style={{ color: "#64748b", cursor: "pointer" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowAddWeeklyOffDrawer(true)}
                        style={{ background: "#4c478a", color: "#ffffff", border: "none", borderRadius: "0px", padding: "10px 18px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        + Add Weekly Off
                      </button>
                    </div>
                  </div>

                  {/* 2 Column Layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px" }}>
                    
                    {/* Left Sidebar List */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Search"
                          value={weeklyOffSearchQuery}
                          onChange={(e) => setWeeklyOffSearchQuery(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #cbd5e1", borderRadius: "0px", fontSize: "0.82rem", outline: "none" }}
                        />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "10px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {weeklyOffsList.filter(w => w.name.toLowerCase().includes(weeklyOffSearchQuery.toLowerCase())).map(item => {
                          const isSelected = selectedWeeklyOff === item.name;
                          return (
                            <div
                              key={item.name}
                              onClick={() => setSelectedWeeklyOff(item.name)}
                              style={{
                                padding: "12px 14px",
                                background: isSelected ? "#f1f5f9" : "#ffffff",
                                borderLeft: isSelected ? "3px solid #4c478a" : "3px solid transparent",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: isSelected ? "600" : "500", fontSize: "0.85rem", color: "#1e293b" }}>{item.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>{item.count}</div>
                              </div>
                              {item.isDefault && (
                                <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>DEFAULT</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Details Panel */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#0f172a", margin: "0 0 16px 0" }}>{selectedWeeklyOff}</h3>

                      {/* Details Sub-Tabs */}
                      <div style={{ borderBottom: "1px solid #e2e8f0", display: "flex", gap: "24px", marginBottom: "20px" }}>
                        <span style={{ padding: "8px 0", borderBottom: "2px solid #4c478a", color: "#1e293b", fontWeight: "600", fontSize: "0.85rem" }}>Summary</span>
                        <span style={{ padding: "8px 0", color: "#64748b", fontSize: "0.85rem" }}>Employees</span>
                        <span style={{ padding: "8px 0", color: "#64748b", fontSize: "0.85rem" }}>Track Weekly Off Versions</span>
                      </div>

                      {/* Light Blue Banner */}
                      <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "12px 16px", color: "#0369a1", fontSize: "0.82rem", marginBottom: "20px" }}>
                        You are viewing the current Weekly-Off version that has been assigned to the employees. If you wish to view all Weekly Off versions, go to Track Weekly Off Versions.
                      </div>

                      {/* Summary Table & Right Card */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "20px" }}>
                        <div style={{ border: "1px solid #e2e8f0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                            <thead>
                              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600" }}>WEEKLY OFFS</th>
                                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600" }}>DAY OFF</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: "14px", color: "#334155" }}>All {selectedWeeklyOff}</td>
                                <td style={{ padding: "14px", color: "#334155" }}>Full Day Off</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Rule based assignment card */}
                        <div style={{ border: "1px solid #e2e8f0", padding: "18px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#0f172a" }}>Rule based assignment</h5>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
                            Employees following this rule will be added to this weekly off policy automatically.
                          </p>
                          <button type="button" style={{ marginTop: "auto", background: "#ffffff", border: "1px solid #4c478a", color: "#4c478a", padding: "6px 14px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}>
                            Add rule
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* View 1.3: Shift & Weekly Off Rules */}
              {shiftsInnerTab === "Shift & Weekly Off Rules" && (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#0f172a", margin: "0 0 12px 0" }}>Shift & Weekly Off Rules</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b" }}>No active rules set. Create automatic assignment rules for new joiners.</p>
                </div>
              )}

            </div>
          )}

          {/* Sub-Tab 2: Assignments (Updated per user feedback) */}
          {shiftsSubTab === "Assignments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Main Content Area */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                
                <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Shift & weekly offs assignment</h3>

                {(() => {
                  const filteredAssignmentUsers = users.filter(u => {
                    if (!assignmentSearchQuery.trim()) return true;
                    const q = assignmentSearchQuery.toLowerCase().trim();
                    const empNum = u.role === "Admin" ? "2" : `hbj0000${users.indexOf(u) + 1}`;
                    return (
                      u.name.toLowerCase().includes(q) ||
                      (u.title && u.title.toLowerCase().includes(q)) ||
                      (u.role && u.role.toLowerCase().includes(q)) ||
                      empNum.includes(q)
                    );
                  });

                  const isAllSelected = filteredAssignmentUsers.length > 0 && filteredAssignmentUsers.every(u => selectedUserIdsForAssignment.includes(u.id));

                  const toggleSelectAll = () => {
                    if (isAllSelected) {
                      setSelectedUserIdsForAssignment([]);
                    } else {
                      setSelectedUserIdsForAssignment(filteredAssignmentUsers.map(u => u.id));
                    }
                  };

                  const toggleUserSelection = (userId) => {
                    if (selectedUserIdsForAssignment.includes(userId)) {
                      setSelectedUserIdsForAssignment(selectedUserIdsForAssignment.filter(id => id !== userId));
                    } else {
                      setSelectedUserIdsForAssignment([...selectedUserIdsForAssignment, userId]);
                    }
                  };

                  return (
                    <>
                      {/* Action Controls & Search Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button 
                            type="button" 
                            onClick={() => setShowUpdateShiftModal(true)}
                            style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 16px", fontSize: "0.82rem", color: "#475569", fontWeight: "500", cursor: "pointer" }}
                          >
                            Update Shift {selectedUserIdsForAssignment.length > 0 && `(${selectedUserIdsForAssignment.length})`}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowUpdateWeeklyOffModal(true)}
                            style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 16px", fontSize: "0.82rem", color: "#475569", fontWeight: "500", cursor: "pointer" }}
                          >
                            Update Weekly Off {selectedUserIdsForAssignment.length > 0 && `(${selectedUserIdsForAssignment.length})`}
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ position: "relative" }}>
                            <input 
                              type="text" 
                              placeholder="Search employee..." 
                              value={assignmentSearchQuery}
                              onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                              style={{ padding: "8px 12px 8px 30px", border: "1px solid #cbd5e1", borderRadius: "0px", fontSize: "0.82rem", width: "220px", outline: "none" }} 
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "10px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          </div>
                          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500" }}>Total: {filteredAssignmentUsers.length}</span>
                          <button type="button" style={{ background: "#ffffff", border: "1px solid #4c478a", color: "#4c478a", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "600" }}>
                            Import Shifts & Weekly Offs
                          </button>
                        </div>
                      </div>

                      {/* Assignments Table (Location & Business Unit columns removed) */}
                      <div style={{ overflowX: "auto", border: "1px solid #e2e8f0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                              <th style={{ padding: "10px 14px", width: "30px" }}>
                                <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                              </th>
                              <th style={{ padding: "10px 14px", fontWeight: "600" }}>EMPLOYEE</th>
                              <th style={{ padding: "10px 14px", fontWeight: "600" }}>EMPLOYEE NUMBER</th>
                              <th style={{ padding: "10px 14px", fontWeight: "600" }}>DEPARTMENT</th>
                              <th style={{ padding: "10px 14px", fontWeight: "600" }}>REPORTING MANAGER</th>
                              <th style={{ padding: "10px 14px", fontWeight: "600" }}>SHIFT TYPE</th>
                              <th style={{ padding: "10px 14px", fontWeight: "600" }}>WEEKLY OFF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAssignmentUsers.length > 0 ? (
                              filteredAssignmentUsers.map((u, idx) => {
                                const isChecked = selectedUserIdsForAssignment.includes(u.id);
                                const assignedShift = employeeAssignments[u.id]?.shift || (idx === 0 ? "Not Available" : idx % 3 === 0 ? "Back -End Shift" : "UTC");
                                const assignedWeeklyOff = employeeAssignments[u.id]?.weeklyOff || (idx === 0 ? "Not Available" : idx % 4 === 0 ? "Friday" : idx % 5 === 0 ? "Monday" : "Sunday");
                                return (
                                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: isChecked ? "#f0f9ff" : "transparent" }}>
                                    <td style={{ padding: "10px 14px" }}>
                                      <input type="checkbox" checked={isChecked} onChange={() => toggleUserSelection(u.id)} />
                                    </td>
                                    <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>
                                      <div>{u.name}</div>
                                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{u.title || u.role}</div>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>{u.role === "Admin" ? "2" : `HBJ0000${idx + 1}`}</td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>{idx === 0 ? "Not Available" : idx % 2 === 0 ? "PURCHASE" : "ADMINISTRATION"}</td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>Hemanth Kumar Jain</td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                                      <span style={{ fontWeight: employeeAssignments[u.id]?.shift ? "600" : "400", color: employeeAssignments[u.id]?.shift ? "#2563eb" : "#475569" }}>
                                        {assignedShift}
                                      </span>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                                      <span style={{ fontWeight: employeeAssignments[u.id]?.weeklyOff ? "600" : "400", color: employeeAssignments[u.id]?.weeklyOff ? "#2563eb" : "#475569" }}>
                                        {assignedWeeklyOff}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b", fontSize: "0.85rem" }}>
                                  No employee found matching "{assignmentSearchQuery}"
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}

              </div>

            </div>
          )}

        </div>
      )}

        </div>
      )}

      {activeTab === "settings" && (
        <div className="admin-grid" style={{ gridTemplateColumns: "1.2fr 2fr", gap: "24px" }}>
          {/* Settings updates */}
          <div className="glass-card">
            <h3>HR Operations Configurations</h3>
            <p className="subtitle">Define shifts grace limits and compliance rules</p>
            <form onSubmit={handleUpdateSettings} className="luxury-form" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Late Arrival Mark Grace Limit (HH:MM AM/PM)</label>
                <input 
                  type="text" 
                  value={lateLimit}
                  onChange={(e) => setLateLimit(e.target.value)}
                  placeholder="e.g. 09:15 AM"
                  required
                />
              </div>
              <div className="form-group">
                <label>Monthly Required Working Days Target</label>
                <input 
                  type="number"
                  value={reqWorkingDays}
                  onChange={(e) => setReqWorkingDays(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Standard Daily Work Shift (Hours)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={standardHrs}
                  onChange={(e) => setStandardHrs(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Daily Meals Reimbursement Allowance Limit (₹)</label>
                <input 
                  type="number" 
                  step="1" 
                  value={mealsAllow}
                  onChange={(e) => setMealsAllow(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="luxury-button" style={{ width: "100%", background: "var(--bg-sidebar)", color: "#fff" }}>
                Apply Operations Config
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Consultant Profile & Petty Cash Inspector Modal */}
      {showInspector && selectedConsultant && (
        <div className="modal-backdrop" onClick={() => { setShowInspector(false); setSelectedConsultant(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>👤 Consultant Profile Inspector</h2>
              <button onClick={() => { setShowInspector(false); setSelectedConsultant(null); }} style={{ fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
              <img src={selectedConsultant.avatar} alt={selectedConsultant.name} style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid var(--bg-sidebar)", objectFit: "cover" }} />
              <div>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>{selectedConsultant.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{selectedConsultant.title} (Designation)</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📱 {selectedConsultant.phone || "No phone registered"}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>✉ {selectedConsultant.email}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              {/* Attendance quick view */}
              <div style={{ border: "1px solid var(--border-color)", padding: "14px", borderRadius: "8px", backgroundColor: "var(--bg-primary)" }}>
                <h4 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", marginBottom: "10px" }}>Attendance Ratio</h4>
                {(() => {
                  const summary = getAttendanceSummary(selectedConsultant);
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem" }}>
                      <div>Required days: <strong>{settings.requiredWorkingDays || 22}</strong></div>
                      <div style={{ color: "var(--color-success)" }}>Days Present: <strong>{summary.present}</strong></div>
                      <div>Weekly Offs: <strong>{summary.offs}</strong></div>
                      <div style={{ color: "var(--color-error)" }}>Absent (LOP): <strong>{summary.absent}</strong></div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Financial Balance Summary */}
              <div style={{ border: "1px solid var(--border-color)", padding: "14px", borderRadius: "8px", backgroundColor: "var(--bg-primary)" }}>
                <h4 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", marginBottom: "10px" }}>Sourcing Cash Summary</h4>
                {(() => {
                  const details = getEmployeeBalanceDetails(selectedConsultant.id) || { initialAdvance: 0, totalSpent: 0, availableBalance: 0 };
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem" }}>
                      <div>Petty Cash Advance: <strong>₹{details.initialAdvance.toLocaleString()}</strong></div>
                      <div>Total Sourced Spent: <strong style={{ color: "var(--color-error)" }}>₹{details.totalSpent.toLocaleString()}</strong></div>
                      <div>Available Balance: <strong style={{ color: "var(--color-success)" }}>₹{details.availableBalance.toLocaleString()}</strong></div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Spent breakdowns */}
            <h4 style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--bg-sidebar)", fontSize: "0.82rem", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              Approved Expense Categories Breakdown (₹)
            </h4>
            {(() => {
              const details = getEmployeeBalanceDetails(selectedConsultant.id) || { categoriesSum: { "Food": 0, "Accommodation": 0, "Travel": 0 } };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Object.entries(details.categoriesSum).map(([cat, val]) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: "500", color: "var(--text-secondary)" }}>{cat}</span>
                      <strong>₹{val.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              );
            })()}

            <button 
              onClick={() => { setShowInspector(false); setSelectedConsultant(null); }}
              className="luxury-button"
              style={{ width: "100%", marginTop: "24px", backgroundColor: "var(--bg-sidebar)", color: "#fff" }}
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="glass-card" style={{ padding: "24px", borderRadius: "0", display: "flex", flexDirection: "column", width: "100%", border: "1px solid #e2e8f0" }}>
          {/* Subtab Segmented Navigation Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setActiveExpenseTab("manage_expenses")}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  borderRadius: "0",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeExpenseTab === "manage_expenses" ? "#eff6ff" : "transparent",
                  color: activeExpenseTab === "manage_expenses" ? "#2563eb" : "#64748b",
                  transition: "all 0.15s"
                }}
              >
                Manage Expenses
              </button>
              <button
                onClick={() => setActiveExpenseTab("manage_petty_cash")}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  borderRadius: "0",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeExpenseTab === "manage_petty_cash" ? "#eff6ff" : "transparent",
                  color: activeExpenseTab === "manage_petty_cash" ? "#2563eb" : "#64748b",
                  transition: "all 0.15s"
                }}
              >
                Manage Petty Cash Advance
              </button>
            </div>

            {activeExpenseTab === "manage_petty_cash" && (
              <button
                onClick={() => setShowDirectAdvanceModal(true)}
                className="luxury-button"
                style={{
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "0",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "0.82rem"
                }}
              >
                + Allocate Cash Advance
              </button>
            )}
          </div>

          {/* Subtab view render */}
          {activeExpenseTab === "manage_expenses" ? (
            <div style={{ width: "100%" }}>
              <LedgerReports />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%" }}>

              {/* Petty Cash Sub-tabs */}
              <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #e2e8f0", marginBottom: "24px" }}>
                <button
                  onClick={() => setActivePettyCashTab("past_advances")}
                  style={{
                    padding: "10px 24px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    border: "none",
                    borderBottom: activePettyCashTab === "past_advances" ? "2px solid #2563eb" : "2px solid transparent",
                    marginBottom: "-2px",
                    background: "transparent",
                    color: activePettyCashTab === "past_advances" ? "#2563eb" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  📋 Past Advances
                </button>
                <button
                  onClick={() => setActivePettyCashTab("pending_payments")}
                  style={{
                    padding: "10px 24px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    border: "none",
                    borderBottom: activePettyCashTab === "pending_payments" ? "2px solid #f59e0b" : "2px solid transparent",
                    marginBottom: "-2px",
                    background: "transparent",
                    color: activePettyCashTab === "pending_payments" ? "#d97706" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  ⏳ Pending Payments
                  {(() => {
                    const count = advanceRequests.filter(r => r.status === "Pending").length;
                    return count > 0 ? (
                      <span style={{ marginLeft: "6px", background: "#f59e0b", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "0.7rem" }}>
                        {count}
                      </span>
                    ) : null;
                  })()}
                </button>
              </div>

              {/* ── Past Advances ─────────────────────────────────────────── */}
              {activePettyCashTab === "past_advances" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                  {/* Existing Petty Cash Holders */}
                  <div style={{ border: "1px solid #e2e8f0", padding: "20px", borderRadius: "0", backgroundColor: "#ffffff" }}>
                    <h3 style={{ margin: "0 0 4px 0" }}>Existing Petty Cash Holders</h3>
                    <p className="subtitle" style={{ margin: "0 0 16px 0" }}>Operational cash reserves allocated, spent, and remaining in hand across personnel.</p>
                    <div style={{ overflowX: "auto" }}>
                      <table className="luxury-table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Designation &amp; Dept</th>
                            <th>Initial Allocated Advance</th>
                            <th>Total Sourced Spent</th>
                            <th>Remaining Cash In Hand</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.filter(u => u.role === "Consultant").map((u) => {
                            const details = getEmployeeBalanceDetails(u.id) || { initialAdvance: 0, totalSpent: 0, availableBalance: 0 };
                            return (
                              <tr key={u.id}>
                                <td className="user-cell">
                                  <img src={u.avatar} alt={u.name} className="avatar-small" />
                                  <div className="user-cell-text">
                                    <strong>{u.name}</strong>
                                    <span style={{ textTransform: "none", fontSize: "0.7rem", color: "#94a3b8" }}>{u.email}</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <strong style={{ fontSize: "0.82rem", color: "#475569" }}>{u.title || "Consultant"}</strong>
                                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#94a3b8" }}>{u.department}</span>
                                  </div>
                                </td>
                                <td style={{ fontWeight: "600", color: "#0f172a" }}>₹{details.initialAdvance.toLocaleString()}</td>
                                <td style={{ fontWeight: "600", color: "#ef4444" }}>₹{details.totalSpent.toLocaleString()}</td>
                                <td style={{ fontWeight: "700", color: details.availableBalance < 500 ? "#f97316" : "#22c55e" }}>
                                  ₹{details.availableBalance.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Full Advance History (Approved + Rejected) */}
                  <div style={{ border: "1px solid #e2e8f0", padding: "20px", borderRadius: "0", backgroundColor: "#ffffff" }}>
                    <h3 style={{ margin: "0 0 4px 0" }}>Cash Advance Requests &amp; Refill Logs</h3>
                    <p className="subtitle" style={{ margin: "0 0 16px 0" }}>Full ledger history of requested petty cash refills and administrative approvals.</p>
                    <div style={{ overflowX: "auto" }}>
                      <table className="luxury-table">
                        <thead>
                          <tr>
                            <th>Ref No.</th>
                            <th>Employee</th>
                            <th>Requested Amount</th>
                            <th>Purpose / Remarks</th>
                            <th>Request Date</th>
                            <th>Status</th>
                            <th>Reviewed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advanceRequests.filter(r => r.status !== "Pending").length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>No advance history found.</td></tr>
                          ) : (
                            advanceRequests.filter(r => r.status !== "Pending").map((r) => {
                              const emp = users.find(u => u.id === r.employeeId) || { name: "Employee", avatar: "" };
                              return (
                                <tr key={r.id}>
                                  <td style={{ fontWeight: "700", color: "#475569", fontSize: "0.78rem" }}>{getUniqueNumber(r.id)}</td>
                                  <td className="user-cell">
                                    <img src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} alt={emp.name} className="avatar-small" />
                                    <div className="user-cell-text">
                                      <strong>{emp.name}</strong>
                                      <span style={{ textTransform: "none", fontSize: "0.7rem", color: "#94a3b8" }}>{r.employeeId}</span>
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: "700", color: "#0f172a" }}>₹{r.amount.toLocaleString()}</td>
                                  <td style={{ fontSize: "0.8rem", color: "#475569", maxWidth: "260px", wordBreak: "break-word" }}>{r.purpose}</td>
                                  <td>{r.date}</td>
                                  <td><span className={`role-badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                                  <td style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.reviewedBy || "System"}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Pending Payments ──────────────────────────────────────── */}
              {activePettyCashTab === "pending_payments" && (
                <div style={{ border: "1px solid #fef3c7", padding: "20px", borderRadius: "0", backgroundColor: "#fffbeb" }}>
                  <h3 style={{ margin: "0 0 4px 0", color: "#92400e" }}>Pending Payment Approvals</h3>
                  <p className="subtitle" style={{ margin: "0 0 16px 0" }}>Cash advance requests awaiting admin review and disbursement.</p>
                  <div style={{ overflowX: "auto" }}>
                    <table className="luxury-table">
                      <thead>
                        <tr>
                          <th>Ref No.</th>
                          <th>Employee</th>
                          <th>Requested Amount</th>
                          <th>Purpose / Remarks</th>
                          <th>Request Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advanceRequests.filter(r => r.status === "Pending").length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                              ✅ No pending payment requests — all clear!
                            </td>
                          </tr>
                        ) : (
                          advanceRequests.filter(r => r.status === "Pending").map((r) => {
                            const emp = users.find(u => u.id === r.employeeId) || { name: "Employee", avatar: "" };
                            return (
                              <tr key={r.id} style={{ backgroundColor: "#fffbeb" }}>
                                <td style={{ fontWeight: "700", color: "#92400e", fontSize: "0.78rem" }}>{getUniqueNumber(r.id)}</td>
                                <td className="user-cell">
                                  <img src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} alt={emp.name} className="avatar-small" />
                                  <div className="user-cell-text">
                                    <strong>{emp.name}</strong>
                                    <span style={{ textTransform: "none", fontSize: "0.7rem", color: "#94a3b8" }}>{r.employeeId}</span>
                                  </div>
                                </td>
                                <td style={{ fontWeight: "700", color: "#b45309", fontSize: "1rem" }}>₹{r.amount.toLocaleString()}</td>
                                <td style={{ fontSize: "0.8rem", color: "#475569", maxWidth: "260px", wordBreak: "break-word" }}>{r.purpose}</td>
                                <td>{r.date}</td>
                                <td>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Approve cash refill of ₹${r.amount} for ${emp.name}?`)) {
                                          verifyAdvanceRequest(r.id, "Approved", currentUser.name);
                                          setToast({ message: "Petty cash advance request approved!", type: "success" });
                                        }
                                      }}
                                      className="luxury-button small"
                                      style={{ backgroundColor: "#22c55e", color: "#ffffff", padding: "5px 12px", border: "none", borderRadius: "4px", fontWeight: "700" }}
                                    >
                                      ✓ Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Reject cash refill request of ₹${r.amount} for ${emp.name}?`)) {
                                          verifyAdvanceRequest(r.id, "Rejected", currentUser.name);
                                          setToast({ message: "Refill request rejected.", type: "info" });
                                        }
                                      }}
                                      className="delete-btn"
                                      style={{ padding: "5px 12px", borderRadius: "4px" }}
                                    >
                                      ✕ Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Direct Petty Cash Allocation Modal */}
      {showDirectAdvanceModal && (
        <div className="task-modal-overlay">
          <div className="task-modal-card" style={{ maxWidth: "450px" }}>
            <div className="task-modal-header">
              <h3 style={{ margin: 0 }}>Allocate Cash Advance</h3>
              <button
                type="button"
                onClick={() => setShowDirectAdvanceModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectAdvanceSubmit} className="luxury-form">
              <div className="form-group">
                <label>Select Staff Member</label>
                <select 
                  value={directAdvanceEmployee} 
                  onChange={(e) => setDirectAdvanceEmployee(e.target.value)} 
                  className="luxury-select"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {users.filter(u => u.role === "Consultant").map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.title || c.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Allocated Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={directAdvanceAmount} 
                  onChange={(e) => setDirectAdvanceAmount(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Purpose / Remarks</label>
                <textarea 
                  placeholder="e.g. Travel and stay advance allocation" 
                  value={directAdvancePurpose} 
                  onChange={(e) => setDirectAdvancePurpose(e.target.value)} 
                  required
                  rows="3"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowDirectAdvanceModal(false)}
                  className="luxury-button"
                  style={{ backgroundColor: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="luxury-button"
                  style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "8px 24px", border: "none", borderRadius: "6px", fontWeight: "700" }}
                >
                  Allocate Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Shift Modal */}
      {showUpdateShiftModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", padding: "24px", width: "420px", border: "1px solid #cbd5e1", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#0f172a" }}>Update Shift Type</h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>Select a new shift to assign to selected employee(s).</p>
            
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "500", color: "#334155", display: "block", marginBottom: "6px" }}>Shift Type</label>
              <select
                value={modalSelectedShift}
                onChange={(e) => setModalSelectedShift(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "0px", fontSize: "0.85rem", background: "#ffffff" }}
              >
                <option value="Back -End Shift">Back -End Shift (10:30 AM - 9:00 PM)</option>
                <option value="UTC">UTC (09:30 AM - 06:30 PM)</option>
                <option value="DRIVERS">DRIVERS (08:00 AM - 05:00 PM)</option>
                <option value="HELPERS - UTC">HELPERS - UTC (10:00 AM - 07:00 PM)</option>
                <option value="Ladies">Ladies (10:00 AM - 06:30 PM)</option>
                <option value="Ladies HELPERS">Ladies HELPERS (10:00 AM - 06:30 PM)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button type="button" onClick={() => setShowUpdateShiftModal(false)} style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 16px", fontSize: "0.82rem", color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleSaveShiftAssignment} style={{ background: "#4c478a", color: "#ffffff", border: "none", padding: "8px 18px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}>Save Shift Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Weekly Off Modal */}
      {showUpdateWeeklyOffModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", padding: "24px", width: "420px", border: "1px solid #cbd5e1", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#0f172a" }}>Update Weekly Off</h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>Select a new weekly off day to assign to selected employee(s).</p>
            
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "500", color: "#334155", display: "block", marginBottom: "6px" }}>Weekly Off Day</label>
              <select
                value={modalSelectedWeeklyOff}
                onChange={(e) => setModalSelectedWeeklyOff(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "0px", fontSize: "0.85rem", background: "#ffffff" }}
              >
                <option value="Friday">Friday</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Thursday">Thursday (DEFAULT)</option>
                <option value="Saturday">Saturday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Teja">Teja</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button type="button" onClick={() => setShowUpdateWeeklyOffModal(false)} style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 16px", fontSize: "0.82rem", color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleSaveWeeklyOffAssignment} style={{ background: "#4c478a", color: "#ffffff", border: "none", padding: "8px 18px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}>Save Weekly Off</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shift Full-Page Modal (Matching Reference Screenshot 1) */}
      {showAddShiftPage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#f8fafc", zIndex: 1100, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          {/* Header Bar */}
          <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Add Shift</h2>
              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>You can create a new shift here</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button 
                type="button" 
                onClick={handleCreateNewShift}
                style={{ background: "#4c478a", color: "#ffffff", border: "none", borderRadius: "4px", padding: "8px 24px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Save
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddShiftPage(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", flex: 1, background: "#ffffff" }}>
            
            {/* Left Form Column */}
            <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Shift Name & Shift Code */}
              <div style={{ display: "grid", gridTemplateColumns: "280px 140px", gap: "20px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "500", color: "#334155", display: "block", marginBottom: "6px" }}>Shift Name</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Customer Success Shift" 
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "500", color: "#334155", display: "block", marginBottom: "6px" }}>Shift Code</label>
                  <input 
                    type="text" 
                    placeholder="Ex: CS" 
                    value={newShiftCode}
                    onChange={(e) => setNewShiftCode(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <button type="button" style={{ background: "none", border: "none", color: "#4c478a", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", padding: 0 }}>
                  + Add description
                </button>
              </div>

              {/* Radio options */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}>
                  <input type="radio" name="shiftType" checked={newShiftType === "fixed"} onChange={() => setNewShiftType("fixed")} />
                  Fixed shift timings
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}>
                  <input type="radio" name="shiftType" checked={newShiftType === "flexible"} onChange={() => setNewShiftType("flexible")} />
                  Flexible work hours
                </label>
              </div>

              {/* Shift timings section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "#0f172a" }}>Shift timings</h4>

                <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", padding: "20px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
                  
                  {/* Days Toggles */}
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px" }}>Days</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                        const dayKey = day + idx;
                        const isSelected = newShiftDays.includes(dayKey);
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (newShiftDays.includes(dayKey)) {
                                setNewShiftDays(newShiftDays.filter(d => d !== dayKey));
                              } else {
                                setNewShiftDays([...newShiftDays, dayKey]);
                              }
                            }}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: isSelected ? "#3b82f6" : "#cbd5e1",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shift Timings */}
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px" }}>Shift timings</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="text" value={newShiftStartTime} onChange={(e) => setNewShiftStartTime(e.target.value)} style={{ width: "55px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem", textAlign: "center" }} />
                      <select value={newShiftStartAmpm} onChange={(e) => setNewShiftStartAmpm(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem" }}>
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                      <span style={{ color: "#64748b" }}>-</span>
                      <input type="text" value={newShiftEndTime} onChange={(e) => setNewShiftEndTime(e.target.value)} style={{ width: "55px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem", textAlign: "center" }} />
                      <select value={newShiftEndAmpm} onChange={(e) => setNewShiftEndAmpm(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem" }}>
                        <option>PM</option>
                        <option>AM</option>
                      </select>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "4px" }}>(9 hrs 0 mins)</span>
                    </div>
                  </div>

                  {/* Break duration */}
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px" }}>Break duration</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="text" value={newShiftBreakMins} onChange={(e) => setNewShiftBreakMins(e.target.value)} style={{ width: "45px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.82rem", textAlign: "center" }} />
                      <span style={{ fontSize: "0.82rem", color: "#475569" }}>mins</span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({newShiftBreakMins} mins)</span>
                    </div>
                  </div>

                  {/* Plus Icon */}
                  <div style={{ cursor: "pointer", color: "#64748b", marginTop: "16px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Guidance Sidebar */}
            <div style={{ borderLeft: "1px solid #e2e8f0", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "24px", background: "#ffffff" }}>
              
              <div>
                <h5 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>What is fixed work hours ?</h5>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                  In a fixed shift, employees are required to work during specific shift hours. For instance, if an employee has a shift from 9:30 AM - 6:30 PM, they are expected to work during those specified hours.
                </p>
              </div>

              <div>
                <h5 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>What is flexible work hours?</h5>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                  Flexible work hours have no fixed schedule; employees have the freedom to come and go as needed, provided they fulfill their designated gross hours. For instance, if an employee has 8 hours defined as their gross hours, they can choose their own work hours while ensuring they complete the full 8 hours.
                </p>
              </div>

              <div>
                <h5 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>When should you use different timings for different days of a week ?</h5>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                  If Saturday is a half-day working day, you can assign a shift for that day accordingly.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Add Weekly Off Drawer (Matching Reference Screenshot 2) */}
      {showAddWeeklyOffDrawer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 1100, display: "flex", justifyContent: "flex-end" }}>
          
          <div style={{ background: "#ffffff", width: "460px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-5px 0 25px rgba(0,0,0,0.15)" }}>
            
            {/* Drawer Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "600", color: "#0f172a" }}>Add Weekly Off</h3>
              <button 
                type="button" 
                onClick={() => setShowAddWeeklyOffDrawer(false)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Form Body */}
            <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "500", color: "#334155", display: "block", marginBottom: "6px" }}>Weekly Off Name</label>
                <input 
                  type="text" 
                  placeholder="Ex: Saturdays and Sundays" 
                  value={newWeeklyOffName}
                  onChange={(e) => setNewWeeklyOffName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div>
                <button type="button" style={{ background: "none", border: "none", color: "#4c478a", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", padding: 0 }}>
                  + Add description
                </button>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#0f172a", display: "block", marginBottom: "12px" }}>Days off</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                    const dayKey = day + idx;
                    const isSelected = newWeeklyOffDays.includes(dayKey);
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (newWeeklyOffDays.includes(dayKey)) {
                            setNewWeeklyOffDays(newWeeklyOffDays.filter(d => d !== dayKey));
                          } else {
                            setNewWeeklyOffDays([...newWeeklyOffDays, dayKey]);
                          }
                        }}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: isSelected ? "#3b82f6" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          border: isSelected ? "1px solid #3b82f6" : "1px solid #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <button type="button" style={{ background: "none", border: "none", color: "#4c478a", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", padding: 0 }}>
                  Customize
                </button>
              </div>

            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={handleCreateNewWeeklyOff}
                style={{ background: "#4c478a", color: "#ffffff", border: "none", borderRadius: "4px", padding: "10px 24px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Save
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
