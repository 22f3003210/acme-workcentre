
// -------------------------------------------------------------
// LEAFLET MAP VIEW COMPONENT (SELFIE CARD ANCHORED TO LOCATION PIN)
// -------------------------------------------------------------
const LeafletMapView = ({ lat, lng, name, avatar, fullAddress, date, time }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // Clean ward/mandal administrative jargon from address
  const cleanDisplayAddress = (addr) => {
    if (!addr) return "Recorded Location";
    return addr.replace(/Ward\s*\d*\s*/gi, "").replace(/,\s*,/g, ",").trim();
  };

  const finalAddr = cleanDisplayAddress(fullAddress);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const numLat = parseFloat(lat) || 17.3933;
    const numLng = parseFloat(lng) || 78.4758;

    const initMap = () => {
      if (!window.L || !containerRef.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = window.L.map(containerRef.current, {
        center: [numLat, numLng],
        zoom: 16,
        zoomControl: true
      });
      mapRef.current = map;

      // Add OpenStreetMap Tile Layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Location Pin Icon
      const pinIcon = window.L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Click location pin to view Verification Selfie">
          <div style="background: #2563eb; color: #ffffff; border: 3px solid #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 6px 16px rgba(37,99,235,0.45);">📍</div>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -42]
      });

      const marker = window.L.marker([numLat, numLng], { icon: pinIcon }).addTo(map);

      // Selfie Popup Card content bound to location pin
      const popupHtml = `
        <div style="width: 230px; font-family: Inter, sans-serif; text-align: center; padding: 4px;">
          <div style="font-weight: 800; font-size: 0.85rem; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 4px;">📸 Verification Selfie</div>
          ${avatar ? `<img src="${avatar}" alt="${name}" style="width: 100%; height: 155px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />` : `<div style="height: 110px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 0.78rem;">No Selfie Captured</div>`}
          <div style="font-size: 0.78rem; font-weight: 800; color: #2563eb; line-height: 1.35;">${finalAddr}</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px; font-weight: 600;">Check-In Time: ${time || "05:22 pm"}</div>
        </div>
      `;

      // Bind popup: Clicking pin opens selfie card; clicking ✕ returns to location pin icon!
      marker.bindPopup(popupHtml, {
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
        minWidth: 240
      }).openPopup();
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, name, avatar, fullAddress, date, time]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />;
};

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, getTodayDateString } from "../context/AppContext";
import LedgerReports from "../components/LedgerReports";
import ProjectsView from "./ProjectsView";
import RecruiterView from "./RecruiterView";
import RegisterView from "./RegisterView";
import logoImg from "../assets/logo.png";

export default function AdminView({ activeTab, setActiveTab }) {
  const {
    users,
    setUsers,
    expenses,
    projects,
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
    jobTitles,
    setJobTitles,
    addJobTitle,
    deleteJobTitle,
    numberSeries,
    setNumberSeries,
    addNumberSeries,
    deleteNumberSeries,
    departments,
    addDepartment,
    deleteDepartment,
    shifts,
    addShift,
    deleteShift,
    weeklyOffs,
    addWeeklyOff,
    deleteWeeklyOff,
    setToast,
    leaveRequests,
    approveLeave,
    rejectLeave
  } = useApp();

  const shiftsList = shifts;
  const weeklyOffsList = weeklyOffs;

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

  // HR Module Double-Tier Navigation State (Matching Reference Screenshots 1 & 2)
  const [hrMainTab, setHrMainTab] = useState("EMPLOYEES");
  const [hrEmployeesSubTab, setHrEmployeesSubTab] = useState("Employee Directory");
  const [hrDashboardSubTab, setHrDashboardSubTab] = useState("Summary");

  // Sync route activeTab prop to HR sub-tabs
  React.useEffect(() => {
    switch (activeTab) {
      case "departments":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Departments");
        break;
      case "job-titles":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Job Titles");
        break;
      case "number-series":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Employee Code");
        break;
      case "directory":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Employee Directory");
        break;
      case "org-tree":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Organization Tree");
        break;
      case "logins":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Logins");
        break;
      case "profile-changes":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Profile Changes");
        break;
      case "probation":
        setHrMainTab("EMPLOYEES");
        setHrEmployeesSubTab("Probation");
        break;
      default:
        break;
    }
  }, [activeTab]);

  const [dirSearchQuery, setDirSearchQuery] = useState("");
  const [dirBusinessUnit, setDirBusinessUnit] = useState("Unassigned");
  const [dirDeptFilter, setDirDeptFilter] = useState("All");
  const [dirLocationFilter, setDirLocationFilter] = useState("All");

  // Job Titles, Number Series, Departments are managed via AppContext (persisted in localStorage + Supabase)
  // Use jobTitles, numberSeries, departments from useApp() directly — do NOT use local state for these
  const [jobTitleSearchQuery, setJobTitleSearchQuery] = useState("");
  const [showAddJobTitleModal, setShowAddJobTitleModal] = useState(false);
  const [newJobTitleInput, setNewJobTitleInput] = useState("");

  // Employee Number Series Management State
  const [numSeriesSearchQuery, setNumSeriesSearchQuery] = useState("");
  const [showAddNumSeriesModal, setShowAddNumSeriesModal] = useState(false);
  const [newSeriesForm, setNewSeriesForm] = useState({
    seriesName: "",
    description: "",
    prefix: "",
    digits: "3",
    suffix: "",
    nextNumber: "101",
    department: "All Departments",
    status: true
  });

  // Departments Management Modal State
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptNameInput, setNewDeptNameInput] = useState("");

  // Shifts & Weekly Offs Sub-Navigation State (Holidays & Shift Allowance removed as requested)
  const [shiftsSubTab, setShiftsSubTab] = useState("Shift & Weekly Offs"); // "Shift & Weekly Offs" | "Assignments"
  const [shiftsInnerTab, setShiftsInnerTab] = useState("Shifts"); // "Shifts" | "Weekly Offs" | "Shift & Weekly Off Rules"
  const [assignmentsInnerTab, setAssignmentsInnerTab] = useState("Shift & Weekly Off Assignments");

  // Dynamic Shifts and Weekly Offs Lists managed via AppContext / Supabase

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

  // Flexible Shift Rules State (Matching Reference Screenshot)
  const [expectGrossHours, setExpectGrossHours] = useState(false);
  const [maxShiftDurationHours, setMaxShiftDurationHours] = useState("16");
  const [isAdvanceOptionOpen, setIsAdvanceOptionOpen] = useState(true);

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
    const timings = newShiftType === "fixed"
      ? `${newShiftStartTime} ${newShiftStartAmpm} - ${newShiftEndTime} ${newShiftEndAmpm}`
      : `Flexible (${maxShiftDurationHours || "16"} hrs max)`;
    const breakStr = `${newShiftBreakMins} mins`;

    const newShiftObj = { name, code, count: "0 employees", timings, break: breakStr, type: newShiftType };
    addShift(newShiftObj);
    setSelectedShift(name);
    setModalSelectedShift(name);
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
    const newWeeklyOffObj = { name, count: "0 employees", days: newWeeklyOffDays };
    addWeeklyOff(newWeeklyOffObj);
    setSelectedWeeklyOff(name);
    setModalSelectedWeeklyOff(name);
    setShowAddWeeklyOffDrawer(false);

    // Reset Form
    setNewWeeklyOffName("");
    if (setToast) setToast({ message: `Weekly Off "${name}" created successfully!`, type: "success" });
  };

  // Selection states inside Shifts & Weekly Offs
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedWeeklyOff, setSelectedWeeklyOff] = useState("");
  const [shiftSearchQuery, setShiftSearchQuery] = useState("");
  const [weeklyOffSearchQuery, setWeeklyOffSearchQuery] = useState("");
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("");
  const [shiftDetailTab, setShiftDetailTab] = useState("Summary"); // "Summary" | "Employees"
  const [weeklyOffDetailTab, setWeeklyOffDetailTab] = useState("Summary"); // "Summary" | "Employees"

  // Employee Assignment Overrides & Modals State
  const [employeeAssignments, setEmployeeAssignments] = useState({});
  const [selectedUserIdsForAssignment, setSelectedUserIdsForAssignment] = useState([]);
  const [showUpdateShiftModal, setShowUpdateShiftModal] = useState(false);
  const [showUpdateWeeklyOffModal, setShowUpdateWeeklyOffModal] = useState(false);
  const [modalSelectedShift, setModalSelectedShift] = useState("");
  const [modalSelectedWeeklyOff, setModalSelectedWeeklyOff] = useState("");

  // Daily Report / Employee Swipes State
  const initialSwipes = [];

  const [swipeRecords, setSwipeRecords] = useState(initialSwipes);
  const [selectedSwipeRecordId, setSelectedSwipeRecordId] = useState(null);
  const [selectedSwipeMode, setSelectedSwipeMode] = useState("IN");
  const [swipeSearchQuery, setSwipeSearchQuery] = useState("");
  const [selectedSwipeCheckboxes, setSelectedSwipeCheckboxes] = useState([]);
  const [swipeDateFilter, setSwipeDateFilter] = useState(getTodayDateString());
  const [swipePayrollMonth, setSwipePayrollMonth] = useState("Jul'26");
  const [swipeDateType, setSwipeDateType] = useState("Swipe Date");
  const [swipeStatusFilter, setSwipeStatusFilter] = useState("All");
  const [showSwipeFilterPopover, setShowSwipeFilterPopover] = useState(false);

  // Map Modal & Location Pin Tooltip State (Matching Reference Screenshots 1 & 2)
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalSwipe, setMapModalSwipe] = useState(null);
  const [hoveredLocationPinId, setHoveredLocationPinId] = useState(null);

  // Dynamic Team Calendar Month & Year State
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 1)); // Default Sept 2026

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSaveShiftAssignment = async () => {
    const targetIds = selectedUserIdsForAssignment.length > 0 
      ? selectedUserIdsForAssignment 
      : users.map(u => u.id);

    if (targetIds.length === 0) {
      if (setToast) setToast({ message: "Please select at least one employee to update shift.", type: "error" });
      return;
    }

    const shiftToSave = modalSelectedShift || (shiftsList[0]?.name || "");
    
    setUsers(prev => prev.map(u => targetIds.includes(u.id) ? { ...u, shift: shiftToSave } : u));
    
    setEmployeeAssignments(prev => {
      const updated = { ...prev };
      targetIds.forEach(id => {
        updated[id] = { ...updated[id], shift: shiftToSave };
      });
      return updated;
    });

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("users").update({ shift: shiftToSave }).in("id", targetIds);
      if (error) console.error("Supabase update shift error:", error);
    }

    setSelectedUserIdsForAssignment([]);
    setShowUpdateShiftModal(false);
    if (setToast) setToast({ message: `Shift updated to "${shiftToSave}" for ${targetIds.length} employee(s)!`, type: "success" });
  };

  const handleSaveWeeklyOffAssignment = async () => {
    const targetIds = selectedUserIdsForAssignment.length > 0 
      ? selectedUserIdsForAssignment 
      : users.map(u => u.id);

    if (targetIds.length === 0) {
      if (setToast) setToast({ message: "Please select at least one employee to update weekly off.", type: "error" });
      return;
    }

    const weeklyOffToSave = modalSelectedWeeklyOff || (weeklyOffsList[0]?.name || "");
    
    setUsers(prev => prev.map(u => targetIds.includes(u.id) ? { ...u, weekly_off: weeklyOffToSave, weeklyOff: weeklyOffToSave } : u));

    setEmployeeAssignments(prev => {
      const updated = { ...prev };
      targetIds.forEach(id => {
        updated[id] = { ...updated[id], weeklyOff: weeklyOffToSave };
      });
      return updated;
    });

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("users").update({ weekly_off: weeklyOffToSave }).in("id", targetIds);
      if (error) console.error("Supabase update weekly_off error:", error);
    }

    setSelectedUserIdsForAssignment([]);
    setShowUpdateWeeklyOffModal(false);
    if (setToast) setToast({ message: `Weekly Off updated to "${weeklyOffToSave}" for ${targetIds.length} employee(s)!`, type: "success" });
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
  const [activeExpenseTab, setActiveExpenseTab] = useState("manage_expenses"); // 'manage_expenses', 'manage_petty_cash'
  const [activePettyCashTab, setActivePettyCashTab] = useState("past_advances"); // 'past_advances', 'pending_payments'
  const [showDirectAdvanceModal, setShowDirectAdvanceModal] = useState(false);
  const [directAdvanceEmployee, setDirectAdvanceEmployee] = useState("");
  const [directAdvanceAmount, setDirectAdvanceAmount] = useState("");
  const [directAdvancePurpose, setDirectAdvancePurpose] = useState("");
  const [directAdvanceDate, setDirectAdvanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tasksBoardTab, setTasksBoardTab] = useState("Received"); // 'Received', 'Entrusted', 'Query Raised'
  const [taskFormTab, setTaskFormTab] = useState("task"); // 'task', 'query'
  const [taskDurationTab, setTaskDurationTab] = useState("One Time");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newAllowFlexible, setNewAllowFlexible] = useState(false);
  const [newAllocatedRole, setNewAllocatedRole] = useState("");
  const [newAllocatedEmployee, setNewAllocatedEmployee] = useState("");
  const [newAcceptanceRequired, setNewAcceptanceRequired] = useState(false);

  // Tasks list state (persisted)
  const [tasksList, setTasksList] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_admin_tasks");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "task-demo-1",
        subject: "Review Karam's July Expense Report",
        description: "Audit and verify food & travel expense claims matching July 2026 logs.",
        duration: "One Time",
        dueDate: new Date().toISOString().split("T")[0],
        status: "Due Today",
        assignedRole: "Accounts Manager",
        assignedEmployee: "Amin Gagani"
      },
      {
        id: "task-demo-2",
        subject: "Setup Quarterly Sourcing Budgets",
        description: "Establish petty cash refill thresholds for advisory consultants.",
        duration: "Quarterly",
        dueDate: "2026-08-15",
        status: "Due Later",
        assignedRole: "HR Admin",
        assignedEmployee: "Sayyada"
      }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem("workcentre_admin_tasks", JSON.stringify(tasksList));
  }, [tasksList]);

  // Project management states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCode, setNewProjectCode] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");

  React.useEffect(() => {
    setAdminViewMode("dashboard");
  }, [activeTab]);

  const todayStr = getTodayDateString();
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
  const handleOnboardEmployee = async (e) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) {
      if (setToast) setToast({ message: "Please fill candidate name and email address.", type: "error" });
      return;
    }

    if (empPhone && empPhone.length !== 10) {
      if (setToast) setToast({ message: "Mobile number must be exactly 10 digits.", type: "error" });
      return;
    }

    const newEmpData = {
      empCode: `EMP-${Date.now().toString().slice(-4)}`,
      name: empName.trim(),
      email: empEmail.trim().toLowerCase(),
      phone: empPhone,
      role: "Consultant",
      title: empTitle || "Retail Jewellery BD Consultant",
      department: empDept || (departments[0] ? (typeof departments[0] === "string" ? departments[0] : departments[0].name) : "Consulting"),
      location: empLocation || "Mumbai / Showroom Site",
      status: "Active",
      advanceAmount: parseFloat(empAdvance) || 0
    };

    if (addUser) {
      await addUser(newEmpData);
    }

    setShowOnboardModal(false);
    setEmpName("");
    setEmpEmail("");
    setEmpPhone("");
    setEmpTitle("Retail Jewellery BD Consultant");
    setEmpDept("Consulting");
    setEmpAdvance("2000");

    if (setToast) {
      setToast({ type: "success", message: `Employee record for ${newEmpData.name} saved to database successfully!` });
    }
  };

  const handleDirectAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!directAdvanceEmployee || !directAdvanceAmount || !directAdvancePurpose.trim()) {
      setToast({ message: "Please fill all fields.", type: "error" });
      return;
    }
    requestAdvance(directAdvanceEmployee, directAdvanceAmount, directAdvancePurpose, "Approved", directAdvanceDate, currentUser?.name || "ACME Admin");
    setToast({ message: `₹${directAdvanceAmount} petty cash allocated for ${directAdvanceDate}!`, type: "success" });
    setDirectAdvanceEmployee("");
    setDirectAdvanceAmount("");
    setDirectAdvancePurpose("");
    setDirectAdvanceDate(new Date().toISOString().split("T")[0]);
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
      {adminViewMode === "dashboard" && activeTab === "dashboard" && (() => {
        const uniqueClients = Array.from(new Set((projects || []).map(p => p.client || p.name).filter(Boolean)));
        const consultantUsers = users.filter(u => u.role === "Consultant");
        const todayDateStr = getTodayDateString();
        const tasksDueToday = tasksList.filter(t => t.dueDate === todayDateStr);
        const tasksOverdue = tasksList.filter(t => t.dueDate && t.dueDate < todayDateStr && t.status !== "Completed");
        const upcomingTasks = tasksList.filter(t => t.dueDate && t.dueDate > todayDateStr).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
        
        const activeProjectsCount = (projects || []).length;
        const avgProgress = activeProjectsCount > 0 
          ? Math.round((projects || []).reduce((acc, p) => acc + (Number(p.progress) || 0), 0) / activeProjectsCount) 
          : 0;

        const pendingExpensesCount = (expenses || []).filter(e => e.status === "Pending").length;
        const pendingAdvancesCount = (advanceRequests || []).filter(a => a.status === "Pending").length;
        const pendingLeavesCount = (leaveRequests || []).filter(l => l.status === "pending").length;
        const totalNotifCount = pendingExpensesCount + pendingAdvancesCount + pendingLeavesCount;

        const topProjects = (projects || []).slice(0, 5);

        // Phase distribution
        const phasesCount = {
          "Vision Alignment": (projects || []).filter(p => p.phase === "Vision Alignment" || p.currentPhase === "Vision Alignment").length,
          "Business Audit": (projects || []).filter(p => p.phase === "Business Audit" || p.currentPhase === "Business Audit").length,
          "Process Design": (projects || []).filter(p => p.phase === "Process Design" || p.currentPhase === "Process Design").length,
          "Implementation": (projects || []).filter(p => p.phase === "Implementation" || p.currentPhase === "Implementation").length,
          "KPI Monitoring": (projects || []).filter(p => p.phase === "KPI Monitoring" || p.currentPhase === "KPI Monitoring").length
        };

        const topRisks = (projects || [])
          .map(p => ({
            client: p.client || p.name,
            risk: p.progress < 30 ? "Delayed Setup" : p.progress > 80 && p.phase !== "KPI Monitoring" ? "Testing Overdue" : "Data Pending",
            severity: p.progress < 30 ? "High" : "Medium",
            status: "Open"
          }))
          .slice(0, 4);

        if (topRisks.length === 0) {
          topRisks.push({ client: "None", risk: "All systems go", severity: "Low", status: "Closed" });
        }

        return (
        <div className="project-management-dashboard" style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "Inter, sans-serif", color: "#0f172a" }}>
          
          {/* ------------------------------------------------------------- */}
          {/* 1. TOP HEADER & FILTER CONTROLS BAR                           */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "16px 24px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", margin: 0, color: "#0f172a", letterSpacing: "-0.3px" }}>
                Project Management Dashboard
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0 0" }}>
                Welcome back, {currentUser?.name || "Abraham"}! 👋
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", fontSize: "0.82rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                <option>All Clients</option>
                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", fontSize: "0.82rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                <option>All Phases</option>
                {Object.keys(phasesCount).map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", fontSize: "0.82rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                <option>All Consultants</option>
                {consultantUsers.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
              </select>

              {/* Notification Bell Badge */}
              <div style={{ position: "relative", cursor: "pointer", background: "#f8fafc", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setActiveTab("expenses")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {totalNotifCount > 0 && (
                  <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "#ffffff", fontSize: "0.65rem", fontWeight: "800", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{totalNotifCount}</span>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 2. TOP METRIC STRIP                                            */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
            
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "#2563eb", color: "#ffffff", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(37,99,235,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "700" }}>Active Projects</div>
                <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.1, marginTop: "2px" }}>{activeProjectsCount}</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "#16a34a", color: "#ffffff", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(22,163,74,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "700" }}>Active Clients</div>
                <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.1, marginTop: "2px" }}>{uniqueClients.length}</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "#ea580c", color: "#ffffff", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(234,88,12,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "700" }}>Tasks Today</div>
                <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.1, marginTop: "2px" }}>{tasksDueToday.length}</div>
                <div style={{ fontSize: "0.72rem", color: "#ea580c", fontWeight: "700", marginTop: "4px" }}>▲ {tasksDueToday.filter(t => t.status !== "Completed").length} pending</div>
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "#dc2626", color: "#ffffff", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(220,38,38,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "700" }}>Overdue Tasks</div>
                <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.1, marginTop: "2px" }}>{tasksOverdue.length}</div>
                {tasksOverdue.length === 0 && <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "700", marginTop: "4px" }}>🟢 All on track</div>}
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ background: "#9333ea", color: "#ffffff", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(147,51,234,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "700" }}>Avg. Progress</div>
                <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.1, marginTop: "2px" }}>{avgProgress}%</div>
              </div>
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3. SECONDARY STATUS CARDS & QUICK LINKS BAR                    */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#f0fdf4", color: "#16a34a", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Meetings Today</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>{tasksDueToday.length > 0 ? 1 : 0}</div>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", color: "#ea580c", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Deliverables Due</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>{upcomingTasks.length}</div>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#faf5ff", color: "#9333ea", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Pending Requests</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>{totalNotifCount}</div>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#eff6ff", color: "#2563eb", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Active Team</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>{consultantUsers.length}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e293b", letterSpacing: "0.5px", marginBottom: "10px" }}>
                QUICK LINKS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[
                  { label: "Projects", icon: "📁", tab: "projects" },
                  { label: "Tasks", icon: "📋", tab: "projects" },
                  { label: "Calendar", icon: "📅", tab: "calendar" },
                  { label: "Documents", icon: "📄", tab: "directory" },
                  { label: "Reports", icon: "📊", tab: "reports" },
                  { label: "Timesheet", icon: "⏱️", tab: "attendance" },
                  { label: "Risks", icon: "⚠️", tab: "projects" },
                  { label: "Billing", icon: "₹", tab: "expenses" }
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "7px 10px", fontSize: "0.76rem", fontWeight: "700", color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* 4. MIDDLE OPERATIONS GRID                                      */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            
            {/* TODAY'S TASKS */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>TODAY'S TASKS</h4>
                <button type="button" onClick={() => setActiveTab("projects")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.78rem", cursor: "pointer" }}>View All</button>
              </div>

              {tasksDueToday.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Task</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Assigned</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksDueToday.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 4px", fontWeight: "800", color: "#0f172a" }}>{row.subject}</td>
                      <td style={{ padding: "10px 4px", color: "#475569" }}>{row.assignedEmployee}</td>
                      <td style={{ padding: "10px 4px" }}>
                        <span style={{ background: row.status === "In Progress" ? "#eff6ff" : row.status === "Completed" ? "#f0fdf4" : "#fff7ed", color: row.status === "In Progress" ? "#2563eb" : row.status === "Completed" ? "#16a34a" : "#d97706", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "800" }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b", margin: "auto" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto", color: "#94a3b8" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#334155" }}>No tasks due today</div>
                </div>
              )}
            </div>

            {/* UPCOMING TASKS */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>UPCOMING TASKS</h4>
                <button type="button" onClick={() => setActiveTab("projects")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.78rem", cursor: "pointer" }}>View All</button>
              </div>

              {upcomingTasks.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Date</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Task</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Consultant</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingTasks.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 4px", color: "#64748b", fontWeight: "700" }}>{new Date(row.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ padding: "8px 4px", fontWeight: "800", color: "#0f172a" }}>{row.subject}</td>
                      <td style={{ padding: "8px 4px", color: "#475569", fontWeight: "600" }}>{row.assignedEmployee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b", margin: "auto" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto", color: "#94a3b8" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#334155" }}>No upcoming tasks scheduled</div>
                </div>
              )}
            </div>

            {/* HIGH PRIORITY CLIENTS */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>ACTIVE PROJECTS</h4>
                <button type="button" onClick={() => setActiveTab("projects")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.78rem", cursor: "pointer" }}>View All</button>
              </div>

              {topProjects.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Client</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Phase</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {topProjects.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 4px", fontWeight: "800", color: "#0f172a" }}>{row.client || row.name}</td>
                      <td style={{ padding: "10px 4px", color: "#475569" }}>{row.phase || row.currentPhase || "Implementation"}</td>
                      <td style={{ padding: "10px 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: "700", color: "#334155" }}>{row.progress || 0}%</span>
                          <div style={{ width: "45px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${row.progress || 0}%`, height: "100%", background: "#2563eb" }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b", margin: "auto" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto", color: "#94a3b8" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#334155" }}>No active projects</div>
                </div>
              )}
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* 5. BOTTOM OPERATIONS & ANALYTICS GRID                          */}
          {/* ------------------------------------------------------------- */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            
            {/* TEAM PRODUCTIVITY */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>TEAM PRODUCTIVITY</h4>
                <button type="button" onClick={() => setActiveTab("directory")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.78rem", cursor: "pointer" }}>View Report</button>
              </div>

              {consultantUsers.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Consultant</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Tasks</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Done</th>
                    <th style={{ padding: "6px 4px", fontWeight: "800" }}>Productivity</th>
                  </tr>
                </thead>
                <tbody>
                  {consultantUsers.map((c, i) => {
                    const cTasks = tasksList.filter(t => t.assignedEmployee === c.name);
                    const doneTasks = cTasks.filter(t => t.status === "Completed").length;
                    const prod = cTasks.length > 0 ? Math.round((doneTasks / cTasks.length) * 100) : 100;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 4px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#4f46e5", color: "#ffffff", fontSize: "0.7rem", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {c.name.charAt(0)}
                          </div>
                          {c.name}
                        </td>
                        <td style={{ padding: "8px 4px", fontWeight: "700" }}>{cTasks.length}</td>
                        <td style={{ padding: "8px 4px", color: "#16a34a", fontWeight: "700" }}>{doneTasks}</td>
                        <td style={{ padding: "8px 4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${prod}%`, height: "100%", background: "#16a34a" }} />
                            </div>
                            <span style={{ fontWeight: "800", color: "#16a34a" }}>{prod}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              ) : (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b", margin: "auto" }}>No consultants registered.</div>
              )}
            </div>

            {/* PHASE DISTRIBUTION */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>PHASE DISTRIBUTION</h4>
                <button type="button" onClick={() => setActiveTab("projects")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.78rem", cursor: "pointer" }}>View All</button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="16" strokeDasharray="60 180" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#7c3aed" strokeWidth="16" strokeDasharray="50 190" strokeDashoffset="-60" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="40 200" strokeDashoffset="-110" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="40 200" strokeDashoffset="-150" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>{activeProjectsCount}</span>
                    <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700" }}>Projects</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.72rem", color: "#334155" }}>
                  {[
                    { name: "Phase 1 - Vision Alignment", count: phasesCount["Vision Alignment"], color: "#2563eb" },
                    { name: "Phase 2 - Business Audit", count: phasesCount["Business Audit"], color: "#7c3aed" },
                    { name: "Phase 4 - Process Design", count: phasesCount["Process Design"], color: "#f59e0b" },
                    { name: "Phase 5 - Implementation", count: phasesCount["Implementation"], color: "#10b981" }
                  ].map((p, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: "600" }}>{p.name}: <strong>{p.count}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PRODUCTIVITY & RISKS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>PRODUCTIVITY OVERVIEW</h4>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>30 Days ∨</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700" }}>Task Completion</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>87%</div>
                    <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: "4px" }}><path d="M0 15 Q25 5, 50 12 T100 4" stroke="#16a34a" strokeWidth="2" fill="none" /></svg>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700" }}>Consultant Util.</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>84%</div>
                    <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: "4px" }}><path d="M0 12 Q25 18, 50 8 T100 5" stroke="#9333ea" strokeWidth="2" fill="none" /></svg>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700" }}>Project Progress</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{avgProgress}%</div>
                    <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: "4px" }}><path d="M0 16 Q25 8, 50 14 T100 6" stroke="#2563eb" strokeWidth="2" fill="none" /></svg>
                  </div>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>RECENT RISKS</h4>
                  <button type="button" onClick={() => setActiveTab("projects")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "0.75rem", cursor: "pointer" }}>View All</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "4px", fontWeight: "800" }}>Risk</th>
                      <th style={{ padding: "4px", fontWeight: "800" }}>Client</th>
                      <th style={{ padding: "4px", fontWeight: "800" }}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRisks.map((rk, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "6px 4px", fontWeight: "800", color: "#0f172a" }}>{rk.risk}</td>
                        <td style={{ padding: "6px 4px", color: "#475569" }}>{rk.client}</td>
                        <td style={{ padding: "6px 4px" }}>
                          <span style={{ background: rk.severity === "High" ? "#fef2f2" : rk.severity === "Medium" ? "#fff7ed" : "#f0fdf4", color: rk.severity === "High" ? "#dc2626" : rk.severity === "Medium" ? "#ea580c" : "#16a34a", padding: "1px 6px", borderRadius: "8px", fontWeight: "800", fontSize: "0.68rem" }}>
                            {rk.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
        );
      })()}
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

      {(["directory", "departments", "job-titles", "number-series", "org-tree", "logins", "profile-changes", "probation"].includes(activeTab)) && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "16px" }}>
          
          {/* Double-Tier Sub-Navigation Header Bar (Matching Reference Screenshots 1 & 2) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", margin: "-28px 0 4px 0", padding: "0 20px" }}>
            
            {/* Row 1: Module Main Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
              {[
                "DASHBOARD",
                "EMPLOYEES",
                "ORG STRUCTURE",
                "ONBOARDING",
                "EXITS",
                "EXPENSES & TRAVEL",
                "DOCUMENTS",
                "ENGAGE",
                "SETTINGS"
              ].map(tab => {
                const isActive = hrMainTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHrMainTab(tab)}
                    style={{
                      padding: "12px 0",
                      background: "none",
                      border: "none",
                      borderBottom: isActive ? "3px solid #5b50a1" : "3px solid transparent",
                      color: isActive ? "#5b50a1" : "#64748b",
                      fontWeight: isActive ? "700" : "500",
                      fontSize: "0.76rem",
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Sub-Tabs when DASHBOARD is selected */}
            {hrMainTab === "DASHBOARD" && (
              <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "10px 0 6px 0", overflowX: "auto" }}>
                {["Summary", "Analytics", "Employee Reports", "Audit Logs"].map(subTab => {
                  const isActive = hrDashboardSubTab === subTab;
                  return (
                    <button
                      key={subTab}
                      type="button"
                      onClick={() => setHrDashboardSubTab(subTab)}
                      style={{
                        padding: "4px 0 8px 0",
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? "2px solid #5b50a1" : "2px solid transparent",
                        color: isActive ? "#1e293b" : "#64748b",
                        fontWeight: isActive ? "600" : "400",
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

            {/* Row 2: Sub-Tabs when EMPLOYEES is selected */}
            {hrMainTab === "EMPLOYEES" && (
              <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "10px 0 6px 0", overflowX: "auto" }}>
                {[
                  "Employee Directory",
                  "Organization Tree",
                  "Logins",
                  "Profile Changes",
                  "Probation",
                  "Job Titles",
                  "Employee Code",
                  "Departments"
                ].map(subTab => {
                  const isActive = hrEmployeesSubTab === subTab;
                  return (
                    <button
                      key={subTab}
                      type="button"
                      onClick={() => {
                        setHrEmployeesSubTab(subTab);
                        if (setActiveTab) {
                          const tabIdMap = {
                            "Employee Directory": "directory",
                            "Job Titles": "job-titles",
                            "Employee Code": "number-series",
                            "Departments": "departments",
                            "Organization Tree": "org-tree",
                            "Logins": "logins",
                            "Profile Changes": "profile-changes",
                            "Probation": "probation"
                          };
                          setActiveTab(tabIdMap[subTab] || "directory");
                        }
                      }}
                      style={{
                        padding: "4px 0 8px 0",
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? "2px solid #5b50a1" : "2px solid transparent",
                        color: isActive ? "#1e293b" : "#64748b",
                        fontWeight: isActive ? "600" : "400",
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

          {/* VIEW 1: EMPLOYEES -> Employee Directory (Matching Reference Screenshot 1) */}
          {hrMainTab === "EMPLOYEES" && hrEmployeesSubTab === "Employee Directory" && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Employee Directory</h3>
                <button
                  onClick={() => setActiveTab && setActiveTab("add-employee")}
                  className="luxury-button"
                  style={{
                    backgroundColor: "#4c478a",
                    color: "#ffffff",
                    padding: "8px 18px",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.82rem"
                  }}
                >
                  + Onboard Staff
                </button>
              </div>

              {/* Filter Bar (Matching Reference Screenshot 1) */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flexGrow: 1 }}>
                  {/* BUSINESS UNIT */}
                  <div style={{ minWidth: "140px" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94a3b8", marginBottom: "3px", letterSpacing: "0.04em" }}>BUSINESS UNIT</div>
                    <select value={dirBusinessUnit} onChange={e => setDirBusinessUnit(e.target.value)} style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#334155", background: "#ffffff", outline: "none" }}>
                      <option value="Unassigned">Unassigned</option>
                      <option value="ACME Advisory">ACME Advisory</option>
                      <option value="ACME Retail">ACME Retail</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div style={{ minWidth: "150px" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94a3b8", marginBottom: "3px", letterSpacing: "0.04em" }}>DEPARTMENT</div>
                    <select value={dirDeptFilter} onChange={e => setDirDeptFilter(e.target.value)} style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#334155", background: "#ffffff", outline: "none" }}>
                      <option value="All">All Departments</option>
                      {departments.map((d, i) => {
                        const name = typeof d === "string" ? d : d.name;
                        return <option key={i} value={name}>{name}</option>;
                      })}
                    </select>
                  </div>

                  {/* Location */}
                  <div style={{ minWidth: "140px" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94a3b8", marginBottom: "3px", letterSpacing: "0.04em" }}>LOCATION</div>
                    <select value={dirLocationFilter} onChange={e => setDirLocationFilter(e.target.value)} style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#334155", background: "#ffffff", outline: "none" }}>
                      <option value="All">All Locations</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Mehdipatnam">Mehdipatnam</option>
                      <option value="Nampally">Nampally</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div style={{ flexGrow: 1, minWidth: "220px", position: "relative" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94a3b8", marginBottom: "3px", letterSpacing: "0.04em" }}>SEARCH</div>
                    <input
                      type="text"
                      placeholder="Search Employee..."
                      value={dirSearchQuery}
                      onChange={e => setDirSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: "6px 10px 6px 30px", border: "1px solid #cbd5e1", fontSize: "0.8rem", color: "#334155", outline: "none" }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "24px", color: "#94a3b8", fontSize: "0.8rem" }}>🔍</span>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500", alignSelf: "flex-end", marginBottom: "4px" }}>
                  Showing {users.filter(u => {
                    const matchesSearch = !dirSearchQuery || u.name.toLowerCase().includes(dirSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(dirSearchQuery.toLowerCase()) || (u.title && u.title.toLowerCase().includes(dirSearchQuery.toLowerCase()));
                    const matchesDept = dirDeptFilter === "All" || (u.department && u.department.toUpperCase() === dirDeptFilter.toUpperCase());
                    const matchesLoc = dirLocationFilter === "All" || (u.location && u.location.toLowerCase() === dirLocationFilter.toLowerCase());
                    return matchesSearch && matchesDept && matchesLoc;
                  }).length} of {users.length}
                </div>
              </div>

              {/* Directory Cards Grid (Matching Reference Screenshot 1) */}
              <div className="directory-cards-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
                maxHeight: "720px",
                overflowY: "auto",
                paddingRight: "4px"
              }}>
                {users.filter(u => {
                  const matchesSearch = !dirSearchQuery || u.name.toLowerCase().includes(dirSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(dirSearchQuery.toLowerCase()) || (u.title && u.title.toLowerCase().includes(dirSearchQuery.toLowerCase()));
                  const matchesDept = dirDeptFilter === "All" || (u.department && u.department.toUpperCase() === dirDeptFilter.toUpperCase());
                  const matchesLoc = dirLocationFilter === "All" || (u.location && u.location.toLowerCase() === dirLocationFilter.toLowerCase());
                  return matchesSearch && matchesDept && matchesLoc;
                }).map((u) => {
                  const displayLocation = u.location || "Hyderabad";
                  return (
                    <div key={u.id} className="directory-card" style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0",
                      padding: "18px",
                      display: "flex",
                      gap: "16px",
                      position: "relative",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      transition: "all 0.2s ease"
                    }}>
                      <div style={{ flexShrink: 0 }}>
                        <img 
                          src={u.avatar} 
                          alt={u.name} 
                          style={{ width: "68px", height: "68px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }} 
                        />
                      </div>

                      <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4 style={{ fontSize: "0.98rem", fontWeight: "700", color: "#0f172a", margin: "0 20px 2px 0", wordBreak: "break-word" }}>
                            {u.name}
                          </h4>
                          
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
                              padding: "2px 6px",
                              borderRadius: "3px",
                              position: "absolute",
                              top: "14px",
                              right: "14px"
                            }}
                          >
                            •••
                          </button>
                        </div>

                        <p style={{ fontSize: "0.78rem", color: "#475569", fontWeight: "600", margin: "0 0 10px 0" }}>
                          {u.title || `${u.role} Lead`}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.73rem", color: "#475569" }}>
                          <div>
                            <span style={{ color: "#94a3b8" }}>Department : </span>
                            <span style={{ fontWeight: "600", textTransform: "uppercase" }}>{u.department || "Advisory"}</span>
                          </div>
                          <div>
                            <span style={{ color: "#94a3b8" }}>Location : </span>
                            <span style={{ fontWeight: "500" }}>{displayLocation}</span>
                          </div>
                          <div style={{ wordBreak: "break-all" }}>
                            <span style={{ color: "#94a3b8" }}>Email : </span>
                            <span style={{ fontWeight: "500", textTransform: "none" }}>{u.email}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: "12px" }}>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent("open-employee-profile", { detail: { user: u } }));
                            }}
                            style={{
                              padding: "4px 12px",
                              fontSize: "0.74rem",
                              fontWeight: "600",
                              border: "1px solid #4c478a",
                              color: "#4c478a",
                              backgroundColor: "#f5f3ff",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: EMPLOYEES -> Job Titles (Matching Reference Screenshot) */}
          {hrMainTab === "EMPLOYEES" && hrEmployeesSubTab === "Job Titles" && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "16px" }}>
              {/* Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Job Titles</h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                    You can specify employee job titles here.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddJobTitleModal(true)}
                  style={{
                    backgroundColor: "#5b50a1",
                    color: "#ffffff",
                    padding: "8px 20px",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    transition: "all 0.15s ease"
                  }}
                >
                  + Add Job Title
                </button>
              </div>

              {/* Search & Info Bar */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    placeholder="Search"
                    value={jobTitleSearchQuery}
                    onChange={e => setJobTitleSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      border: "none",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "0.85rem",
                      color: "#334155",
                      outline: "none"
                    }}
                  />
                  <span style={{ position: "absolute", left: "8px", top: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>🔍</span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                  <span>Total: {jobTitles.filter(t => {
                    const name = typeof t === "string" ? t : (t.titleName || t.name || "");
                    return !jobTitleSearchQuery || name.toLowerCase().includes(jobTitleSearchQuery.toLowerCase());
                  }).length}</span>
                  <span style={{ cursor: "pointer", color: "#64748b", fontWeight: "700" }}>⋮</span>
                </div>
              </div>

              {/* Job Titles Table */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                      <th style={{ padding: "12px 20px", textAlign: "left", width: "45%", fontWeight: "600" }}>NAME</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", width: "35%", fontWeight: "600" }}>APPLIES TO</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", width: "20%", fontWeight: "600" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobTitles.filter(t => {
                      const name = typeof t === "string" ? t : (t.titleName || t.name || "");
                      return !jobTitleSearchQuery || name.toLowerCase().includes(jobTitleSearchQuery.toLowerCase());
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                          No Job Titles found. Click <strong>+ Add Job Title</strong> to add one.
                        </td>
                      </tr>
                    ) : (
                      jobTitles.filter(t => {
                        const name = typeof t === "string" ? t : (t.titleName || t.name || "");
                        return !jobTitleSearchQuery || name.toLowerCase().includes(jobTitleSearchQuery.toLowerCase());
                      }).map((jtItem, idx) => {
                        const titleName = typeof jtItem === "string" ? jtItem : (jtItem.titleName || jtItem.name || "");
                        const titleId = typeof jtItem === "string" ? jtItem : (jtItem.id || jtItem.titleName || jtItem.name);
                        const count = users.filter(u => (u.title || "").toLowerCase() === titleName.toLowerCase() || (u.role || "").toLowerCase() === titleName.toLowerCase()).length;
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "16px 20px", fontWeight: "600", color: "#1e293b" }}>
                              {titleName}
                            </td>
                            <td style={{ padding: "16px 20px", color: "#475569" }}>
                              <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "0.9rem" }}>{count}</div>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{count === 1 ? "employee" : "employees"}</div>
                            </td>
                            <td style={{ padding: "16px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#64748b" }}>
                                <button
                                  type="button"
                                  title="Edit Job Title"
                                  onClick={() => {
                                    const edited = prompt("Edit Job Title:", titleName);
                                    if (edited && edited.trim() !== "") {
                                      setJobTitles(prev => prev.map(t => {
                                        const curName = typeof t === "string" ? t : (t.titleName || t.name || "");
                                        if (curName === titleName) {
                                          return typeof t === "string" ? edited.trim() : { ...t, titleName: edited.trim() };
                                        }
                                        return t;
                                      }));
                                    }
                                  }}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "0.9rem" }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  title="Delete Job Title"
                                  onClick={() => {
                                    if (confirm(`Remove "${titleName}" from Job Titles list?`)) {
                                      deleteJobTitle(titleId || titleName);
                                    }
                                  }}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.9rem" }}
                                >
                                  🗑️
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

              {/* Add Job Title Modal Overlay */}
              {showAddJobTitleModal && (
                <div className="task-modal-overlay">
                  <div className="task-modal" style={{ maxWidth: "440px" }}>
                    <div className="task-modal-header" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Add New Job Title</h3>
                      <button type="button" onClick={() => setShowAddJobTitleModal(false)} className="close-btn">&times;</button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (newJobTitleInput.trim()) {
                        addJobTitle(newJobTitleInput.trim());
                        setNewJobTitleInput("");
                        setShowAddJobTitleModal(false);
                      }
                    }}>
                      <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Job Title Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Floor Manager"
                          value={newJobTitleInput}
                          onChange={e => setNewJobTitleInput(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem" }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => setShowAddJobTitleModal(false)}
                          style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: "8px 20px", background: "#5b50a1", border: "none", borderRadius: "4px", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}
                        >
                          Save Job Title
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: EMPLOYEES -> Employee Code / Employee Number Series (Matching Reference Screenshots 1 & 2) */}
          {hrMainTab === "EMPLOYEES" && hrEmployeesSubTab === "Employee Code" && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "16px" }}>
              {/* Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Employee Number Series</h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                    You can specify employee number series here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNumSeriesModal(true)}
                  style={{
                    backgroundColor: "#5b50a1",
                    color: "#ffffff",
                    padding: "8px 20px",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    transition: "all 0.15s ease"
                  }}
                >
                  +Add New Series
                </button>
              </div>

              {/* Alert Recommendation Banner */}
              <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1", padding: "12px 16px", borderRadius: "6px", fontSize: "0.82rem" }}>
                It is recommended to use only one employee number series unless really required.
              </div>

              {/* Search & Info Toolbar */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    placeholder="Search"
                    value={numSeriesSearchQuery}
                    onChange={e => setNumSeriesSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      border: "none",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "0.85rem",
                      color: "#334155",
                      outline: "none"
                    }}
                  />
                  <span style={{ position: "absolute", left: "8px", top: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>🔍</span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                  <span>Total: {numberSeries.filter(s => !numSeriesSearchQuery || s.seriesName.toLowerCase().includes(numSeriesSearchQuery.toLowerCase()) || s.prefix.toLowerCase().includes(numSeriesSearchQuery.toLowerCase())).length}</span>
                </div>
              </div>

              {/* Employee Number Series Table */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>SERIES NAME</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>DEPARTMENT</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>PREFIX</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>SUFFIX</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>NEXT NUMBER</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>STATUS</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: "600" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numberSeries.filter(s => !numSeriesSearchQuery || s.seriesName.toLowerCase().includes(numSeriesSearchQuery.toLowerCase()) || s.prefix.toLowerCase().includes(numSeriesSearchQuery.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                          No Employee Number Series found. Click <strong>+Add New Series</strong> to add one.
                        </td>
                      </tr>
                    ) : (
                      numberSeries.filter(s => !numSeriesSearchQuery || s.seriesName.toLowerCase().includes(numSeriesSearchQuery.toLowerCase()) || s.prefix.toLowerCase().includes(numSeriesSearchQuery.toLowerCase())).map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.seriesName}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.description}</div>
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "4px", fontSize: "0.76rem", fontWeight: "500" }}>
                              {item.department || "All Departments"}
                            </span>
                          </td>
                          <td style={{ padding: "16px 20px", fontWeight: "600", color: "#0f172a" }}>{item.prefix}</td>
                          <td style={{ padding: "16px 20px", color: "#64748b" }}>{item.suffix || "-"}</td>
                          <td style={{ padding: "16px 20px", fontWeight: "600", color: "#0f172a" }}>{item.nextNumber}</td>
                          <td style={{ padding: "16px 20px" }}>
                            <span style={{ color: item.status === "Active" ? "#16a34a" : "#94a3b8", fontWeight: "600", fontSize: "0.8rem" }}>{item.status}</span>
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#64748b" }}>
                              <button
                                type="button"
                                title="Toggle Active Status"
                                onClick={() => {
                                  setNumberSeries(prev => prev.map(s => s.id === item.id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s));
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: item.status === "Active" ? "#2563eb" : "#94a3b8", fontSize: "0.9rem" }}
                              >
                                ☑️
                              </button>
                              <button
                                type="button"
                                title="Edit Series"
                                onClick={() => {
                                  const edited = prompt("Edit Series Name:", item.seriesName);
                                  if (edited && edited.trim()) {
                                    setNumberSeries(prev => prev.map(s => s.id === item.id ? { ...s, seriesName: edited.trim() } : s));
                                  }
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "0.9rem" }}
                              >
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Table Footer Pagination */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px", padding: "12px 20px", borderTop: "1px solid #f1f5f9", fontSize: "0.78rem", color: "#64748b" }}>
                  <span>1 to {numberSeries.length} of {numberSeries.length}</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>

              {/* Add Employee Number Series Modal — Premium Redesign */}
              {showAddNumSeriesModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.80)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                  <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "560px", boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.08)", overflow: "hidden" }}>

                    {/* Gradient Header */}
                    <div style={{ background: "linear-gradient(135deg, #5b50a1 0%, #7c3aed 100%)", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.01em" }}>New Number Series</div>
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>Define employee code format for a department</div>
                      </div>
                      <button type="button" onClick={() => setShowAddNumSeriesModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem", fontWeight: "700" }}>×</button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (newSeriesForm.seriesName.trim()) {
                        const newEntry = {
                          id: `ns-${Date.now()}`,
                          seriesName: newSeriesForm.seriesName.trim(),
                          description: newSeriesForm.description.trim(),
                          prefix: newSeriesForm.prefix.trim(),
                          digits: parseInt(newSeriesForm.digits) || 3,
                          suffix: newSeriesForm.suffix.trim(),
                          nextNumber: parseInt(newSeriesForm.nextNumber) || 101,
                          department: newSeriesForm.department,
                          status: newSeriesForm.status ? "Active" : "Inactive"
                        };
                        addNumberSeries(newEntry);
                        setNewSeriesForm({ seriesName: "", description: "", prefix: "", digits: "3", suffix: "", nextNumber: "101", department: "All Departments", status: true });
                        setShowAddNumSeriesModal(false);
                      }
                    }} style={{ padding: "24px 28px" }}>

                      {/* Series Name + Department row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                        <div>
                          <label style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>SERIES NAME *</label>
                          <input type="text" required placeholder="e.g. Consultant Series" value={newSeriesForm.seriesName}
                            onChange={e => setNewSeriesForm({ ...newSeriesForm, seriesName: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                            onFocus={e => e.target.style.borderColor = "#5b50a1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>DEPARTMENT</label>
                          <select value={newSeriesForm.department} onChange={e => setNewSeriesForm({ ...newSeriesForm, department: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.88rem", background: "#fff", outline: "none", boxSizing: "border-box" }}>
                            <option value="All Departments">All Departments</option>
                            {departments.map((d, i) => { const name = typeof d === "string" ? d : d.name; return <option key={i} value={name}>{name}</option>; })}
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: "14px" }}>
                        <label style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>DESCRIPTION</label>
                        <textarea placeholder="Brief description of this series..." rows={2} value={newSeriesForm.description}
                          onChange={e => setNewSeriesForm({ ...newSeriesForm, description: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.88rem", resize: "none", outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = "#5b50a1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                      </div>

                      {/* Format Builder */}
                      <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", letterSpacing: "0.06em", marginBottom: "12px" }}>FORMAT BUILDER</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "10px" }}>
                          <div>
                            <label style={{ fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "5px" }}>PREFIX</label>
                            <input type="text" placeholder="C" value={newSeriesForm.prefix}
                              onChange={e => setNewSeriesForm({ ...newSeriesForm, prefix: e.target.value })}
                              style={{ width: "100%", padding: "9px 11px", border: "1.5px solid #e2e8f0", borderRadius: "7px", fontSize: "0.9rem", fontWeight: "700", outline: "none", boxSizing: "border-box", textTransform: "uppercase", letterSpacing: "0.08em" }}
                              onFocus={e => e.target.style.borderColor = "#5b50a1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                          </div>
                          <div>
                            <label style={{ fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "5px" }}>DIGITS</label>
                            <select value={newSeriesForm.digits} onChange={e => setNewSeriesForm({ ...newSeriesForm, digits: e.target.value })}
                              style={{ width: "100%", padding: "9px 11px", border: "1.5px solid #e2e8f0", borderRadius: "7px", fontSize: "0.88rem", background: "#fff", outline: "none", boxSizing: "border-box" }}>
                              <option value="2">2 Digits</option>
                              <option value="3">3 Digits</option>
                              <option value="4">4 Digits</option>
                              <option value="5">5 Digits</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "5px" }}>SUFFIX</label>
                            <input type="text" placeholder="-IN" value={newSeriesForm.suffix}
                              onChange={e => setNewSeriesForm({ ...newSeriesForm, suffix: e.target.value })}
                              style={{ width: "100%", padding: "9px 11px", border: "1.5px solid #e2e8f0", borderRadius: "7px", fontSize: "0.9rem", fontWeight: "700", outline: "none", boxSizing: "border-box" }}
                              onFocus={e => e.target.style.borderColor = "#5b50a1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                          </div>
                        </div>

                        {/* Live Preview Card */}
                        <div style={{ marginTop: "14px", background: "linear-gradient(135deg, #5b50a1, #7c3aed)", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "4px" }}>LIVE PREVIEW</div>
                            <div style={{ fontFamily: "monospace", fontSize: "1.6rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.14em" }}>
                              {(() => {
                                const p = (newSeriesForm.prefix || "").toUpperCase();
                                const s = newSeriesForm.suffix || "";
                                const d = parseInt(newSeriesForm.digits) || 3;
                                const n = parseInt(newSeriesForm.nextNumber) || 1;
                                return `${p}${String(n).padStart(d, "0")}${s}`;
                              })()}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "4px" }}>STARTS FROM</div>
                            <input type="number" min="1" value={newSeriesForm.nextNumber}
                              onChange={e => setNewSeriesForm({ ...newSeriesForm, nextNumber: e.target.value })}
                              style={{ width: "80px", padding: "6px 10px", borderRadius: "6px", border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "1rem", fontWeight: "700", outline: "none", textAlign: "center" }} />
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                        <button type="button" onClick={() => setNewSeriesForm({ ...newSeriesForm, status: !newSeriesForm.status })}
                          style={{ width: "44px", height: "24px", borderRadius: "12px", background: newSeriesForm.status ? "#5b50a1" : "#cbd5e1", border: "none", position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0 }}>
                          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: newSeriesForm.status ? "23px" : "3px", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                        </button>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: newSeriesForm.status ? "#5b50a1" : "#94a3b8" }}>
                          {newSeriesForm.status ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
                        <button type="button" onClick={() => setShowAddNumSeriesModal(false)}
                          style={{ padding: "10px 22px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "8px", color: "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "0.88rem" }}>
                          Cancel
                        </button>
                        <button type="submit"
                          style={{ padding: "10px 28px", background: "linear-gradient(135deg, #5b50a1, #7c3aed)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "0.88rem", boxShadow: "0 4px 14px rgba(91,80,161,0.4)" }}>
                          Save Series
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: EMPLOYEES -> Departments */}
          {hrMainTab === "EMPLOYEES" && hrEmployeesSubTab === "Departments" && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0f172a", margin: 0 }}>Departments & Units</h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>Manage organizational departments and team member counts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(true)}
                  style={{ backgroundColor: "#5b50a1", color: "#ffffff", padding: "8px 20px", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer", fontSize: "0.82rem" }}
                >
                  + Add Department
                </button>
              </div>

              {departments.length === 0 ? (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "40px 20px", textAlign: "center", borderRadius: "6px", color: "#64748b" }}>
                  No Departments found. Click <strong>+ Add Department</strong> to create one.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {departments.map((dept, idx) => {
                    const count = users.filter(u => u.department && u.department.toLowerCase() === (typeof dept === "string" ? dept : dept.name).toLowerCase()).length;
                    const name = typeof dept === "string" ? dept : dept.name;
                    return (
                      <div key={idx} style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" }}>DEPARTMENT</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove "${name}" department?`)) {
                                deleteDepartment(name);
                              }
                            }}
                            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}
                          >
                            🗑️
                          </button>
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "8px 0 16px 0" }}>{name}</h4>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Active Members</span>
                          <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#5b50a1" }}>{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Department Modal Overlay */}
              {showAddDeptModal && (
                <div className="task-modal-overlay">
                  <div className="task-modal" style={{ maxWidth: "440px" }}>
                    <div className="task-modal-header" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>Add New Department</h3>
                      <button type="button" onClick={() => setShowAddDeptModal(false)} className="close-btn" style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }}>&times;</button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (newDeptNameInput.trim()) {
                        addDepartment(newDeptNameInput.trim());
                        setNewDeptNameInput("");
                        setShowAddDeptModal(false);
                      }
                    }}>
                      <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                          Department Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sales, Advisory, IT & Systems"
                          value={newDeptNameInput}
                          onChange={e => setNewDeptNameInput(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => setShowAddDeptModal(false)}
                          style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ padding: "8px 20px", background: "#5b50a1", border: "none", borderRadius: "4px", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}
                        >
                          Save Department
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: DASHBOARD -> Summary (Matching Reference Screenshot 2) */}
          {hrMainTab === "DASHBOARD" && hrDashboardSubTab === "Summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
              {/* Top Row: Employees & Pending Actions Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
                {/* Employees Summary Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#334155", margin: "0 0 16px 0" }}>Employees</h4>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "24px" }}>
                    <div>
                      <span style={{ fontSize: "1.8rem", fontWeight: "700", color: "#0f172a" }}>{users.length}</span>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Total headcount</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "1.4rem", fontWeight: "600", color: "#334155" }}>{users.filter(u => u.status === "Active").length}</span>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Registered</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "1.4rem", fontWeight: "600", color: "#334155" }}>0</span>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Not invited</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "1.4rem", fontWeight: "600", color: "#334155" }}>{users.filter(u => u.status !== "Active").length}</span>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Yet to register</div>
                    </div>
                  </div>
                </div>

                {/* Pending Actions Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#334155", margin: "0 0 16px 0" }}>Pending Actions</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#4c478a" }}>0</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Documents</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#16a34a" }}>{(expenses || []).filter(e => e.status === "Pending").length}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Expenses</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ea580c" }}>0</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Probations</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ca8a04" }}>0</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Onboarding Tasks</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#4c478a" }}>0</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Exit Tasks</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#64748b" }}>0</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Profile changes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Row: Quicklinks & Login Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
                {/* Quicklinks */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#334155", margin: "0 0 16px 0" }}>Quicklinks</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.83rem" }}>
                    <button onClick={() => navigate('/employee/add')} style={{ background: "none", border: "none", color: "#4c478a", textAlign: "left", cursor: "pointer", fontWeight: "600" }}>+ New Employee</button>
                    <span style={{ color: "#64748b", cursor: "pointer" }}>Employee Custom Fields</span>
                    <span style={{ color: "#64748b", cursor: "pointer" }}>Org Directory</span>
                    <span style={{ color: "#64748b", cursor: "pointer" }}>Org Tree</span>
                  </div>

                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#334155", margin: "24px 0 14px 0" }}>Bulk operations</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", color: "#64748b" }}>
                    <span>Add Employees in Bulk</span>
                    <span>Update Employees in Bulk</span>
                    <span>Bulk invite employees</span>
                  </div>
                </div>

                {/* Employee Login Summary Chart */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#334155", margin: 0 }}>Employee Login Summary</h4>
                    <span style={{ fontSize: "0.78rem", border: "1px solid #cbd5e1", padding: "4px 10px", color: "#475569" }}>Last 14 days</span>
                  </div>

                  <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "16px", padding: "20px 10px 0 10px", borderBottom: "1px solid #e2e8f0" }}>
                    {[0, 0, 1, 2, 0, 0, 1, 1, 0, 0, 0].map((count, idx) => (
                      <div key={idx} style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ height: `${Math.max(count * 50, 4)}px`, background: count > 0 ? "#84cc16" : "#e2e8f0", width: "100%", transition: "all 0.3s ease" }} />
                        <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{14 + idx} Jul</span>
                      </div>
                    ))}
                  </div>
                </div>
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

      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Double-Tier Sub-Navigation Header Bar (Matching Reference Screenshot) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", margin: "-12px 0 4px 0", padding: "0 20px" }}>
            
            {/* Row 1: Module Main Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
              {(() => {
                const pendingBadgeCount = (expenses || []).filter(e => e.status === "Pending").length + (advanceRequests || []).filter(r => r.status === "Pending").length;
                return [
                  { id: "DASHBOARD", label: "DASHBOARD" },
                  { id: "APPROVALS", label: "APPROVALS", badge: pendingBadgeCount > 0 ? pendingBadgeCount : null },
                  { id: "SHIFTS", label: "SHIFTS/WEEKLY OFFS & HOLIDAYS" },
                  { id: "LEAVE", label: "LEAVE" },
                  { id: "REPORTS", label: "REPORTS" },
                  { id: "SETTINGS", label: "SETTINGS" }
                ];
              })().map(tab => {
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
                  "Daily Report",
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
          {subModuleTab === "DASHBOARD" && dashboardSubTab === "Attendance Summary" && (
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
                {(() => {
                  const hasPunchedToday = (u) => {
                    const att = u.attendance || [];
                    return att.some(a => {
                      if (!a.checkIn) return false;
                      if (a.date === todayStr) return true;
                      const d = new Date(a.date);
                      const now = new Date();
                      return !isNaN(d.getTime()) && (d.toDateString() === now.toDateString() || Math.abs(now.getTime() - d.getTime()) < 20 * 3600 * 1000);
                    });
                  };
                  const notInYetList = users.filter(u => u.role === "Consultant" && !hasPunchedToday(u));
                  if (users.filter(u => u.role === "Consultant").length === 0) {
                    return <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "400" }}>No consultants onboarded yet.</span>;
                  }
                  if (notInYetList.length === 0) {
                    return <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: "600" }}>🎉 All consultants have checked in today!</span>;
                  }
                  return notInYetList.map(c => (
                    <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <img src={c.avatar} alt={c.name} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
                      <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "400", maxWidth: "75px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name.split(" ")[0]}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Middle Row: 4 Stat Cards */}
          {(() => {
            const onTimeCount = users.filter(u => (u.attendance || []).some(a => a.date === todayStr && (a.status === "Present" || a.status === "On Time"))).length;
            const lateCount = users.filter(u => (u.attendance || []).some(a => a.date === todayStr && a.status === "Late")).length;
            const leaveCount = users.filter(u => (u.attendance || []).some(a => a.date === todayStr && (a.status === "Leave" || a.status === "On Leave"))).length;
            const remoteClockInsCount = users.filter(u => (u.attendance || []).some(a => a.date === todayStr && a.checkIn)).length;

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {/* Stat 1: On Time */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#06b6d4" }} />
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Employees On Time today</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>
                    {onTimeCount}
                  </span>
                </div>

                {/* Stat 2: Late Arrivals */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#c026d3" }} />
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Late Arrivals today</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>
                    {lateCount}
                  </span>
                </div>

                {/* Stat 3: Employees on Leave today */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#84cc16" }} />
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Employees on Leave today</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>
                    {leaveCount}
                  </span>
                </div>

                {/* Stat 4: Remote Clock-ins */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "18px 20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#f97316" }} />
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500", display: "block" }}>Remote Clock-ins today</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: "500", color: "#0f172a", marginTop: "6px", display: "block" }}>
                    {remoteClockInsCount}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Section: Enterprise Attendance Grid */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Table Header Controls */}
            {(() => {
              const calendarYear = selectedDate.getFullYear();
              const calendarMonth = selectedDate.getMonth();
              const formattedMonthLabel = selectedDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", "'");

              const daysInMonthCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
              const daysHeader = Array.from({ length: daysInMonthCount }, (_, i) => {
                const d = new Date(calendarYear, calendarMonth, i + 1);
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return { day: i + 1, name: dayName, isWeekend };
              });

              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "500", color: "#0f172a", margin: 0 }}>
                      Employee Attendance Matrix ({daysInMonthCount} Days)
                    </h3>

                    {/* Month Picker Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button 
                        type="button" 
                        onClick={handlePrevMonth}
                        title="Previous Month"
                        style={{ background: "#4c478a", color: "#fff", border: "none", borderRadius: "0px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                      >
                        ‹
                      </button>
                      
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <span style={{ fontSize: "0.85rem", color: "#4c478a", fontWeight: "700", border: "1px solid #4c478a", padding: "4px 12px", background: "#f5f3ff", cursor: "pointer" }}>
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
                  </div>

                  {/* Enterprise Attendance Grid Table */}
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
                            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                            const todayStr = new Date().toISOString().split("T")[0];

                            const empAttendance = emp.attendance || [];
                            const rec = empAttendance.find(a => a.date === dateStr);

                            if (rec) {
                              if (rec.status === "Present" || rec.status === "Late") {
                                return { code: "P", bg: "transparent", color: "#334155" };
                              }
                              if (rec.status === "Half Day" || (rec.hoursWorked && rec.hoursWorked < 4)) {
                                return { code: "HD", bg: "#bae6fd", color: "#0284c7" };
                              }
                              if (rec.status === "Leave" || rec.status === "On Leave") {
                                return { code: "L", bg: "#e0f2fe", color: "#0369a1" };
                              }
                              if (rec.status === "Absent") {
                                return { code: "A", bg: "#ffe4e6", color: "#e11d48" };
                              }
                            }

                            if (isWeekend) {
                              return { code: "OFF", bg: "transparent", color: "#64748b" };
                            }

                            if (dateStr < todayStr) {
                              return { code: "A", bg: "#ffe4e6", color: "#e11d48" };
                            }

                            return { code: "-", bg: "transparent", color: "#94a3b8" };
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

                              {dayStatuses.map((st, dIdx) => (
                                <td key={dIdx} style={{ padding: "6px 2px", textAlign: "center", background: st.bg, color: st.color, fontWeight: "500", fontSize: "0.75rem", borderRight: "1px solid #f1f5f9" }}>
                                  {st.code}
                                </td>
                              ))}

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

            {/* Clean Legend Bar */}
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
        </>
      )}

      {subModuleTab === "DASHBOARD" && dashboardSubTab === "Leave Summary" && (() => {
        const pendingLeaves = leaveRequests.filter(r => r.status === "Pending");
        const allLeaves = leaveRequests;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
            {/* Top Bar / Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Pending Approval</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#d97706", marginTop: "4px" }}>{pendingLeaves.length}</div>
              </div>
              <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Approved This Month</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>{allLeaves.filter(r => r.status === "Approved").length}</div>
              </div>
              <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Rejected Leaves</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{allLeaves.filter(r => r.status === "Rejected").length}</div>
              </div>
              <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Applications</span>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{allLeaves.length}</div>
              </div>
            </div>

            {/* Pending Requests Table */}
            <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Pending Leave Approvals</h3>
              {pendingLeaves.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px", color: "#64748b", background: "#f8fafc", borderRadius: "6px" }}>
                  <p style={{ margin: 0 }}>No pending leave applications requiring approval.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Employee</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Leave Type</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Dates</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Reason</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Applied On</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map(req => (
                        <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0f172a" }}>
                            {req.employeeName} <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "400" }}>({req.empCode})</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "600" }}>{req.type} {req.halfDay ? "(Half Day)" : ""}</td>
                          <td style={{ padding: "12px 14px" }}>{req.fromDate} to {req.toDate}</td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{req.reason}</td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{req.appliedOn}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => { approveLeave(req.id); setToast({ message: `Approved leave for ${req.employeeName}`, type: "success" }); }}
                                style={{ background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer" }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => { rejectLeave(req.id, "Rejected by Admin"); setToast({ message: `Rejected leave for ${req.employeeName}`, type: "error" }); }}
                                style={{ background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer" }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* All Leave History Log */}
            <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>All Employees Leave Log</h3>
              {allLeaves.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>No leave records present.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Employee</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Type</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>From / To</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Reason</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLeaves.map(req => {
                        const statusColors = {
                          Pending: { bg: "#fef3c7", fg: "#d97706" },
                          Approved: { bg: "#dcfce7", fg: "#15803d" },
                          Rejected: { bg: "#fee2e2", fg: "#dc2626" },
                          Cancelled: { bg: "#f1f5f9", fg: "#64748b" }
                        };
                        const sc = statusColors[req.status] || statusColors.Pending;
                        return (
                          <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px", fontWeight: "600" }}>{req.employeeName}</td>
                            <td style={{ padding: "10px 14px" }}>{req.type}</td>
                            <td style={{ padding: "10px 14px" }}>{req.fromDate} - {req.toDate}</td>
                            <td style={{ padding: "10px 14px", color: "#475569" }}>{req.reason}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ background: sc.bg, color: sc.fg, padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* DAILY REPORT / EMPLOYEE SWIPES View (Matching Reference Screenshots 1 & 2) */}
      {subModuleTab === "DASHBOARD" && dashboardSubTab === "Daily Report" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Second Bar: Filters Row (Select Dates, Date Type, Employee Search, Download Export, Filter Rules) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px 20px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", width: "100%" }}>
              
              {/* Select Dates */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
                  Select Dates<span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "6px 12px", background: "#ffffff", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#1e293b", minWidth: "220px", position: "relative" }}>
                  <input 
                    type="text" 
                    value={swipeDateFilter} 
                    onChange={(e) => setSwipeDateFilter(e.target.value)}
                    placeholder="20 Jul 2026 - 20 Jul 2026"
                    style={{ border: "none", outline: "none", fontSize: "0.82rem", color: "#1e293b", width: "100%" }}
                  />
                  {swipeDateFilter && (
                    <span 
                      onClick={() => setSwipeDateFilter("")}
                      title="Clear date filter"
                      style={{ color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem", fontWeight: "700" }}
                    >
                      ⊗
                    </span>
                  )}
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ cursor: "pointer" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <input 
                      type="date" 
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split("-");
                          const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                          const formatted = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                          setSwipeDateFilter(formatted);
                        }
                      }}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              {/* Date Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
                  Date Type<span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select 
                  value={swipeDateType}
                  onChange={(e) => setSwipeDateType(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "7px 12px", background: "#ffffff", fontSize: "0.82rem", color: "#1e293b", outline: "none", minWidth: "150px", cursor: "pointer" }}
                >
                  <option value="Swipe Date">Swipe Date</option>
                  <option value="Received Date">Received Date</option>
                </select>
              </div>

              {/* Employee Search */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>
                  Employee Search
                </label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    placeholder="Search Employee" 
                    value={swipeSearchQuery}
                    onChange={(e) => setSwipeSearchQuery(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "6px 36px 6px 12px", fontSize: "0.82rem", outline: "none", width: "200px" }}
                  />
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", right: "10px", top: "8px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
              </div>

              {/* Download & Filter Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "18px", marginLeft: "auto", position: "relative" }}>
                
                {/* Download CSV Export Button */}
                <button 
                  type="button" 
                  title="Download CSV Export" 
                  onClick={() => {
                    const filtered = swipeRecords.filter(s => {
                      if (swipeSearchQuery.trim()) {
                        const q = swipeSearchQuery.toLowerCase().trim();
                        if (!s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q) && !s.shift.toLowerCase().includes(q)) return false;
                      }
                      if (swipeStatusFilter !== "All" && s.status.toLowerCase() !== swipeStatusFilter.toLowerCase()) return false;
                      return true;
                    });
                    const headers = ["Employee Name", "Employee Code", "Swipe Time", "Swipe Date", "Shift", "In/Out", "Received Time", "Received Date", "Door/Address", "Status"];
                    const rows = filtered.map(r => [
                      `"${r.name}"`,
                      `"${r.code}"`,
                      `"${r.time}"`,
                      `"${r.date}"`,
                      `"${r.shift}"`,
                      `"${r.inOut}"`,
                      `"${r.receivedTime}"`,
                      `"${r.receivedDate}"`,
                      `"${r.door}"`,
                      `"${r.status}"`
                    ]);
                    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Employee_Swipes_${new Date().toISOString().slice(0,10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>

                {/* Filter Rules Button */}
                <button 
                  type="button" 
                  title="Filter Rules" 
                  onClick={() => setShowSwipeFilterPopover(!showSwipeFilterPopover)}
                  style={{ background: showSwipeFilterPopover ? "#f1f5f9" : "#ffffff", border: "1px solid #cbd5e1", borderRadius: "4px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                </button>

                {/* Filter Rules Popover Dropdown */}
                {showSwipeFilterPopover && (
                  <div style={{ position: "absolute", right: 0, top: "42px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", padding: "14px", width: "220px", zIndex: 100, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>Filter Swipes</div>
                    
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Status</label>
                      <select 
                        value={swipeStatusFilter}
                        onChange={(e) => setSwipeStatusFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "4px", outline: "none" }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setShowSwipeFilterPopover(false)}
                      style={{ background: "#4c478a", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer", marginTop: "4px" }}
                    >
                      Apply Filter
                    </button>
                  </div>
                )}

              </div>

            </div>
          </div>

          {/* Main Content Layout: Table + Right Sidebar Card */}
          {(() => {
            const dynamicSwipes = (users || []).flatMap(u => {
              const attList = u.attendance || [];
              return attList.map((a, idx) => {
                let recAddress = a.check_in_address || a.address || (a.remarks && a.remarks.includes("Location: ") ? a.remarks.split("Location: ")[1] : null) || a.locationName || a.projectName || "Recorded Location";
                let recDoor = recAddress.includes(",") ? recAddress.split(",")[0].trim() : (a.projectName || "Store Site");

                let parsedCoords = { lat: "17.3933", lng: "78.4758" };
                if (typeof a.coordinates === "string" && a.coordinates.includes(",")) {
                  const parts = a.coordinates.split(",");
                  parsedCoords = { lat: parts[0].trim(), lng: parts[1].trim() };
                } else if (a.coordinates && typeof a.coordinates === "object") {
                  parsedCoords = { lat: a.coordinates.lat || "17.3933", lng: a.coordinates.lng || "78.4758" };
                }

                let parsedCheckOutCoords = parsedCoords;
                if (typeof a.checkOutCoordinates === "string" && a.checkOutCoordinates.includes(",")) {
                  const parts = a.checkOutCoordinates.split(",");
                  parsedCheckOutCoords = { lat: parts[0].trim(), lng: parts[1].trim() };
                } else if (a.checkOutCoordinates && typeof a.checkOutCoordinates === "object") {
                  parsedCheckOutCoords = { lat: a.checkOutCoordinates.lat || "17.3933", lng: a.checkOutCoordinates.lng || "78.4758" };
                }

                const checkInSelfie = a.selfie || a.checkInSelfie || u.avatar || u.selfiePhoto;
                const checkOutSelfie = a.checkOutSelfie || a.selfie || u.avatar || u.selfiePhoto;
                const checkOutAddress = a.check_out_address || a.checkOutAddress || a.checkout_address || recAddress;

                return {
                  id: `live-swipe-${u.id}-${a.date}-${idx}`,
                  name: u.name,
                  code: u.empCode || `EMP-${u.id.substring(0,4)}`,
                  avatar: checkInSelfie,
                  selfie: checkInSelfie,
                  checkInSelfie: checkInSelfie,
                  checkOutSelfie: checkOutSelfie,
                  time: a.checkIn,
                  checkIn: a.checkIn || null,
                  checkOut: a.checkOut || null,
                  date: a.date,
                  shift: u.shift || "General Shift",
                  inOut: a.checkOut ? "OUT" : "IN",
                  receivedTime: a.checkIn,
                  receivedDate: a.date,
                  door: recDoor,
                  fullAddress: recAddress,
                  checkInAddress: recAddress,
                  checkOutAddress: checkOutAddress,
                  coordinates: parsedCoords,
                  checkInCoordinates: parsedCoords,
                  checkOutCoordinates: parsedCheckOutCoords,
                  status: a.status || "Present",
                  mobile: u.phone || "+91 98201 12345",
                  tasks: a.tasks || []
                };
              });
            });

            const allSwipesList = [...dynamicSwipes, ...swipeRecords];

            let filteredSwipes = allSwipesList.filter(s => {
              if (swipeSearchQuery.trim()) {
                const q = swipeSearchQuery.toLowerCase().trim();
                const match = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.shift.toLowerCase().includes(q);
                if (!match) return false;
              }
              if (swipeDateFilter && swipeDateFilter.trim()) {
                const dQ = swipeDateFilter.toLowerCase().trim();
                if (dQ !== "20 jul 2026 - 20 jul 2026" && dQ !== "") {
                  const targetDateStr = (swipeDateType === "Received Date" ? s.receivedDate : s.date) || "";
                  
                  const matchesDate = () => {
                    if (targetDateStr.toLowerCase().includes(dQ) || dQ.includes(targetDateStr.toLowerCase())) return true;
                    const filterDate = new Date(swipeDateFilter);
                    const recordDate = new Date(targetDateStr);
                    if (!isNaN(filterDate.getTime()) && !isNaN(recordDate.getTime())) {
                      return filterDate.toISOString().split("T")[0] === recordDate.toISOString().split("T")[0];
                    }
                    return false;
                  };

                  if (!matchesDate()) return false;
                }
              }
              if (swipeStatusFilter !== "All") {
                if (s.status.toLowerCase() !== swipeStatusFilter.toLowerCase()) return false;
              }
              return true;
            });

            if (swipeDateType === "Received Date") {
              filteredSwipes = [...filteredSwipes].sort((a, b) => a.receivedTime.localeCompare(b.receivedTime));
            }

            const activeRecord = filteredSwipes.find(s => s.id === selectedSwipeRecordId) || filteredSwipes[0] || allSwipesList.find(s => s.id === selectedSwipeRecordId) || dynamicSwipes[0] || swipeRecords[0];

            const isAllSwipesChecked = filteredSwipes.length > 0 && filteredSwipes.every(s => selectedSwipeCheckboxes.includes(s.id));
            const toggleAllSwipes = () => {
              if (isAllSwipesChecked) {
                setSelectedSwipeCheckboxes([]);
              } else {
                setSelectedSwipeCheckboxes(filteredSwipes.map(s => s.id));
              }
            };

            const toggleSwipeCheckbox = (id) => {
              if (selectedSwipeCheckboxes.includes(id)) {
                setSelectedSwipeCheckboxes(selectedSwipeCheckboxes.filter(i => i !== id));
              } else {
                setSelectedSwipeCheckboxes([...selectedSwipeCheckboxes, id]);
              }
            };

            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
                
                {/* Left Column: Employee Swipes Table */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                        <th style={{ padding: "12px 14px", width: "30px" }}>
                          <input type="checkbox" checked={isAllSwipesChecked} onChange={toggleAllSwipes} />
                        </th>
                        <th style={{ padding: "12px 14px", fontWeight: "600" }}>Employee Name</th>
                        <th style={{ padding: "12px 14px", fontWeight: "600" }}>Swipe Time & Date</th>
                        <th style={{ padding: "12px 14px", fontWeight: "600" }}>Shift</th>
                        <th style={{ padding: "12px 14px", fontWeight: "700" }}>In & Time</th>
                        <th style={{ padding: "12px 14px", fontWeight: "700" }}>Out & Time</th>
                        <th style={{ padding: "12px 14px", fontWeight: "600" }}>Door/Address</th>
                        <th style={{ padding: "12px 14px", fontWeight: "600" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSwipes.map((s) => {
                        const isSelectedRow = selectedSwipeRecordId === s.id;
                        const isChecked = selectedSwipeCheckboxes.includes(s.id);
                        const isPinHovered = hoveredLocationPinId === s.id;

                        return (
                          <tr 
                            key={s.id}
                            onClick={() => setSelectedSwipeRecordId(s.id)}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: isSelectedRow ? "#f0f9ff" : isChecked ? "#f8fafc" : "transparent",
                              cursor: "pointer"
                            }}
                          >
                            <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={isChecked} onChange={() => toggleSwipeCheckbox(s.id)} />
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: "600", color: "#0f172a" }}>{s.name}</div>
                              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.code}</div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: "600", color: "#1e293b" }}>{s.time}</div>
                              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.date}</div>
                            </td>
                            <td style={{ padding: "12px 14px", color: "#334155", fontSize: "0.8rem" }}>
                              {s.shift}
                            </td>
                            {/* In & Time Cell */}
                            <td style={{ padding: "12px 14px" }}>
                              {(s.checkIn || (s.inOut === "IN" && s.time)) ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSwipeRecordId(s.id);
                                      setSelectedSwipeMode("IN");
                                    }}
                                    style={{
                                      background: isSelectedRow && selectedSwipeMode === "IN" ? "#dcfce7" : "#f0fdf4",
                                      border: isSelectedRow && selectedSwipeMode === "IN" ? "1.5px solid #16a34a" : "1px solid #bbf7d0",
                                      color: "#166534",
                                      borderRadius: "6px",
                                      padding: "4px 8px",
                                      fontSize: "0.8rem",
                                      fontWeight: "800",
                                      cursor: "pointer",
                                      textAlign: "left"
                                    }}
                                    title="Click to view Check-In Selfie & Location"
                                  >
                                    IN {s.checkIn || s.time}
                                  </button>
                                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.date || s.receivedDate}</span>
                                </div>
                              ) : (
                                <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "0.75rem", display: "inline-block" }}>
                                  ⚠️ Swipe miss
                                </span>
                              )}
                            </td>

                            {/* Out & Time Cell */}
                            <td style={{ padding: "12px 14px" }}>
                              {(s.checkOut || (s.inOut === "OUT" && s.time)) ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSwipeRecordId(s.id);
                                      setSelectedSwipeMode("OUT");
                                    }}
                                    style={{
                                      background: isSelectedRow && selectedSwipeMode === "OUT" ? "#fee2e2" : "#fef2f2",
                                      border: isSelectedRow && selectedSwipeMode === "OUT" ? "1.5px solid #dc2626" : "1px solid #fecaca",
                                      color: "#991b1b",
                                      borderRadius: "6px",
                                      padding: "4px 8px",
                                      fontSize: "0.8rem",
                                      fontWeight: "800",
                                      cursor: "pointer",
                                      textAlign: "left"
                                    }}
                                    title="Click to view Check-Out Selfie & Location"
                                  >
                                    OUT {s.checkOut || (s.inOut === "OUT" ? s.time : "")}
                                  </button>
                                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.date || s.receivedDate}</span>
                                </div>
                              ) : (
                                <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "0.75rem", display: "inline-block" }}>
                                  ⚠️ Swipe miss
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#475569", fontSize: "0.78rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.door}
                                </span>
                                
                                {/* Location Pin Icon with speech bubble tooltip matching Screenshots 1 & 2 */}
                                <div 
                                  style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                                  onMouseEnter={() => setHoveredLocationPinId(s.id)}
                                  onMouseLeave={() => setHoveredLocationPinId(null)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMapModalSwipe(s);
                                    setShowMapModal(true);
                                  }}
                                >
                                  {/* Speech bubble tooltip popover matching Screenshot 1 */}
                                  {isPinHovered && (
                                    <div 
                                      style={{
                                        position: "absolute",
                                        bottom: "100%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        marginBottom: "8px",
                                        background: "#475569",
                                        color: "#ffffff",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "0.78rem",
                                        fontWeight: "500",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                                        zIndex: 20
                                      }}
                                    >
                                      Click here to view map
                                      <div 
                                        style={{
                                          position: "absolute",
                                          top: "100%",
                                          left: "50%",
                                          transform: "translateX(-50%)",
                                          width: 0,
                                          height: 0,
                                          borderLeft: "6px solid transparent",
                                          borderRight: "6px solid transparent",
                                          borderTop: "6px solid #475569"
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Purple Location Pin SVG Icon matching Screenshot 1 */}
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b21a8" strokeWidth="2" style={{ cursor: "pointer" }}>
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                  </svg>
                                </div>

                              </div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ border: "1px solid #86efac", background: "#f0fdf4", color: "#16a34a", padding: "2px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "500" }}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Right Column: Swipe Details Sidebar Card (IN / OUT Interactive Mode) */}
                {activeRecord && (() => {
                  const isOutMode = selectedSwipeMode === "OUT";
                  const displaySelfie = isOutMode ? (activeRecord.checkOutSelfie || activeRecord.selfie || activeRecord.avatar) : (activeRecord.checkInSelfie || activeRecord.selfie || activeRecord.avatar);
                  const displayTime = isOutMode ? (activeRecord.checkOut || activeRecord.time) : (activeRecord.checkIn || activeRecord.time);
                  const displayAddress = isOutMode ? (activeRecord.checkOutAddress || activeRecord.fullAddress) : (activeRecord.checkInAddress || activeRecord.fullAddress);
                  const displayCoords = isOutMode ? (activeRecord.checkOutCoordinates || activeRecord.coordinates) : (activeRecord.checkInCoordinates || activeRecord.coordinates);

                  return (
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
                      
                      {/* Top Banner with Mode Selector Toggle Buttons */}
                      <div style={{ background: isOutMode ? "#fef2f2" : "#f0fdf4", borderBottom: isOutMode ? "1px solid #fecaca" : "1px solid #bbf7d0", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isOutMode ? "#991b1b" : "#15803d", fontSize: "0.78rem", fontWeight: "800" }}>
                          <span>{isOutMode ? "🔴 Check-Out Verification" : "🟢 Check-In Verification"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button 
                            type="button" 
                            onClick={() => setSelectedSwipeMode("IN")}
                            style={{
                              padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer",
                              background: !isOutMode ? "#16a34a" : "#ffffff", color: !isOutMode ? "#ffffff" : "#475569",
                              border: !isOutMode ? "none" : "1px solid #cbd5e1"
                            }}
                          >
                            IN
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setSelectedSwipeMode("OUT")}
                            style={{
                              padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer",
                              background: isOutMode ? "#dc2626" : "#ffffff", color: isOutMode ? "#ffffff" : "#475569",
                              border: isOutMode ? "none" : "1px solid #cbd5e1"
                            }}
                          >
                            OUT
                          </button>
                        </div>
                      </div>

                      {/* Selfie Image Container */}
                      <div style={{ background: "#f8fafc", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {displaySelfie && (displaySelfie.startsWith("data:") || displaySelfie.startsWith("http")) ? (
                          <img 
                            src={displaySelfie} 
                            alt={activeRecord.name}
                            style={{ width: "100%", height: "240px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "220px", background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "800", fontSize: "3.5rem" }}>
                            {activeRecord.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                          </div>
                        )}
                        <div style={{ width: "100%", marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>
                              {isOutMode ? "Swipe-out Time" : "Swipe-in Time"}
                            </span>
                            <span style={{ fontSize: "1.15rem", fontWeight: "800", color: isOutMode ? "#991b1b" : "#166534" }}>
                              {displayTime || "-"}
                            </span>
                          </div>
                          <span style={{ padding: "4px 10px", borderRadius: "12px", background: isOutMode ? "#fef2f2" : "#f0fdf4", color: isOutMode ? "#dc2626" : "#16a34a", fontSize: "0.75rem", fontWeight: "800" }}>
                            {isOutMode ? "OUT" : "IN"}
                          </span>
                        </div>
                      </div>

                      {/* Swipe Details Section */}
                      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #f1f5f9" }}>
                        <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "800", color: "#0f172a" }}>Swipe Details</h4>

                        <div>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>Employee Name</span>
                          <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: "700" }}>{activeRecord.name} ({activeRecord.code})</span>
                        </div>

                        <div>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>Mobile Name</span>
                          <span style={{ fontSize: "0.82rem", color: "#1e293b", fontWeight: "500" }}>{activeRecord.mobile}</span>
                        </div>

                        <div>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>{isOutMode ? "Check-Out Location Address" : "Check-In Location Address"}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "800", lineHeight: 1.4 }}>{displayAddress}</span>
                            <svg 
                              onClick={() => {
                                setMapModalSwipe({
                                  ...activeRecord,
                                  fullAddress: displayAddress,
                                  coordinates: displayCoords,
                                  avatar: displaySelfie
                                });
                                setShowMapModal(true);
                              }}
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="#2563eb" 
                              strokeWidth="2.2" 
                              style={{ cursor: "pointer", flexShrink: 0 }}
                              title="Click to view interactive map"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>
            );
          })()}

        </div>
      )}

      {/* MAP VIEW Standalone Full-Screen View Page */}
      {showMapModal && mapModalSwipe && (() => {
        const lat = (typeof mapModalSwipe.coordinates === "string" ? mapModalSwipe.coordinates.split(",")[0]?.trim() : mapModalSwipe.coordinates?.lat) || "17.3933";
        const lng = (typeof mapModalSwipe.coordinates === "string" ? mapModalSwipe.coordinates.split(",")[1]?.trim() : mapModalSwipe.coordinates?.lng) || "78.4758";
        const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

        return (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#ffffff", zIndex: 10000, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Top Header Bar across full browser width */}
            <div style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", height: "48px", flexShrink: 0 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155", letterSpacing: "0.03em" }}>
                MAP VIEW - {mapModalSwipe.date || getTodayDateString()} - {mapModalSwipe.name.toUpperCase()}
              </span>
              <button 
                type="button" 
                onClick={() => setShowMapModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#64748b", cursor: "pointer", fontWeight: "600", padding: "0 8px" }}
                title="Close Map View"
              >
                ✕
              </button>
            </div>

            {/* Full-Height Standalone Page Layout */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", overflow: "hidden", height: "calc(100vh - 48px)" }}>
              
              {/* Left Column: Full-Height Timeline Sidebar */}
              <div style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0", padding: "20px 18px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
                
                {/* Section 1: SITE / LOCATION PUNCH */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>
                    📍 {mapModalSwipe.door || mapModalSwipe.fullAddress || "Site Visit"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {mapModalSwipe.fullAddress}
                  </div>
                </div>

                {/* Section 2: PUNCH DETAILS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155", letterSpacing: "0.02em" }}>ATTENDANCE PUNCH DETAILS</div>
                  <div style={{ fontSize: "0.78rem", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Check In Time:</span> <strong>{mapModalSwipe.time || mapModalSwipe.receivedTime}</strong>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Status:</span> 
                    <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#dcfce7", color: "#15803d", fontWeight: "700", fontSize: "0.7rem" }}>
                      {mapModalSwipe.status || "Present"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    GPS Coordinates: {lat}, {lng}
                  </div>
                </div>

                {/* Section 3: SCHEDULED TASKS */}
                {mapModalSwipe.tasks && mapModalSwipe.tasks.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155", letterSpacing: "0.02em" }}>TASKS RECORDED</div>
                    {mapModalSwipe.tasks.map((t, i) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "#334155", background: "#f8fafc", padding: "6px 10px", borderRadius: "4px" }}>
                        ✓ {t}
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Right Column: Dynamic Google Maps Canvas */}
              <div style={{ position: "relative", width: "100%", height: "100%", background: "#e5e3df", overflow: "hidden" }}>
                
                <iframe 
                  title="Full Screen Google Maps Location View"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, width: "100%", height: "100%" }}
                  loading="lazy"
                  allowFullScreen
                  src={mapEmbedUrl}
                />

                {/* On-Map Photo Overlay Popup Card */}
                <div style={{ position: "absolute", top: "30px", left: "50%", transform: "translateX(-50%)", background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "14px", boxShadow: "0 12px 30px rgba(0,0,0,0.25)", width: "260px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#0f172a" }}>Verification Selfie</span>
                    <span onClick={() => setShowMapModal(false)} style={{ cursor: "pointer", fontSize: "0.95rem", color: "#64748b", fontWeight: "700" }}>✕</span>
                  </div>
                  {mapModalSwipe.avatar ? (
                    <img 
                      src={mapModalSwipe.avatar} 
                      alt={mapModalSwipe.name}
                      style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "120px", background: "#f1f5f9", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
                      No Selfie Captured
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.4, textAlign: "center" }}>
                    {mapModalSwipe.fullAddress || mapModalSwipe.door}
                  </div>
                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {/* SHIFTS / WEEKLY OFFS & ASSIGNMENTS View (Holidays and Shift Allowance Removed as requested) */}
      {subModuleTab === "SHIFTS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Sub-Tab 1: Shift & Weekly Offs */}
          {shiftsSubTab === "Shift & Weekly Offs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Row 3 Pills: Shifts | Weekly Offs | Shift & Weekly Off Rules */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 14px", display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
                {["Shifts", "Weekly Offs", "Shift & Weekly Off Rules"].map(tab => {
                  const isActive = shiftsInnerTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setShiftsInnerTab(tab)}
                      style={{
                        padding: "8px 18px",
                        background: isActive ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)" : "#f8fafc",
                        color: isActive ? "#ffffff" : "#475569",
                        border: isActive ? "1px solid #3730a3" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontWeight: isActive ? "600" : "500",
                        fontSize: "0.83rem",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
                        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)" }}
                      >
                        +Add shifts ▾
                      </button>
                    </div>
                  </div>

                  {/* 2 Column Layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: "20px" }}>
                    
                    {/* Left Sidebar List */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)" }}>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Search shifts..."
                          value={shiftSearchQuery}
                          onChange={(e) => setShiftSearchQuery(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.82rem", outline: "none" }}
                        />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "10px" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {shiftsList.length > 0 ? (
                          shiftsList.filter(s => s.name.toLowerCase().includes(shiftSearchQuery.toLowerCase())).map(item => {
                            const isSelected = selectedShift === item.name;
                            const assignedUsersCount = users.filter(u => employeeAssignments[u.id]?.shift === item.name || u.shift === item.name).length;
                            const countText = `${assignedUsersCount} ${assignedUsersCount === 1 ? "employee" : "employees"}`;

                            return (
                              <div
                                key={item.name}
                                onClick={() => setSelectedShift(item.name)}
                                style={{
                                  padding: "12px 14px",
                                  background: isSelected ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" : "#ffffff",
                                  borderLeft: isSelected ? "4px solid #6366f1" : "4px solid transparent",
                                  border: isSelected ? "1px solid #c7d2fe" : "1px solid #f1f5f9",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  boxShadow: isSelected ? "0 2px 8px rgba(99, 102, 241, 0.15)" : "none"
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: isSelected ? "700" : "500", fontSize: "0.85rem", color: isSelected ? "#4338ca" : "#1e293b" }}>{item.name}</div>
                                  <div style={{ fontSize: "0.75rem", color: isSelected ? "#6366f1" : "#64748b", marginTop: "2px" }}>{countText}</div>
                                </div>
                                <button
                                  type="button"
                                  title="Delete Shift"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete Shift "${item.name}"?`)) {
                                      deleteShift(item.name);
                                    }
                                  }}
                                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem", padding: "2px 6px" }}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: "20px 8px", color: "#64748b", fontSize: "0.82rem", textAlign: "center" }}>
                            No shifts available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Details Panel */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "24px" }}>
                      {(() => {
                        const activeShiftObj = shiftsList.find(s => s.name === selectedShift) || shiftsList[0];
                        if (!activeShiftObj) {
                          return (
                            <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                              <div style={{ fontSize: "1rem", fontWeight: "600", color: "#334155" }}>No Shifts Created</div>
                              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, maxWidth: "340px" }}>
                                All sample shifts have been removed. Click below to add a new shift.
                              </p>
                              <button 
                                type="button" 
                                onClick={() => setShowAddShiftPage(true)}
                                style={{ background: "#4c478a", color: "#ffffff", border: "none", padding: "10px 20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", marginTop: "8px" }}
                              >
                                + Add Shift
                              </button>
                            </div>
                          );
                        }

                        const assignedShiftUsers = users.filter(u => employeeAssignments[u.id]?.shift === activeShiftObj.name);

                        return (
                          <>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#0f172a", margin: "0 0 16px 0" }}>{activeShiftObj.name}</h3>
                            <div style={{ marginBottom: "20px" }}>
                              <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", display: "block" }}>SHIFT CODE</span>
                              <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: "500" }}>{activeShiftObj.code || (activeShiftObj.name === "Back -End Shift" ? "BE" : activeShiftObj.name.slice(0, 3).toUpperCase())}</span>
                            </div>

                            {/* Details Sub-Tabs (Track Shift Versions removed) */}
                            <div style={{ borderBottom: "1px solid #e2e8f0", display: "flex", gap: "24px", marginBottom: "20px" }}>
                              <span 
                                onClick={() => setShiftDetailTab("Summary")}
                                style={{ padding: "8px 0", borderBottom: shiftDetailTab === "Summary" ? "2px solid #4c478a" : "2px solid transparent", color: shiftDetailTab === "Summary" ? "#1e293b" : "#64748b", fontWeight: shiftDetailTab === "Summary" ? "600" : "400", fontSize: "0.85rem", cursor: "pointer" }}
                              >
                                Summary
                              </span>
                              <span 
                                onClick={() => setShiftDetailTab("Employees")}
                                style={{ padding: "8px 0", borderBottom: shiftDetailTab === "Employees" ? "2px solid #4c478a" : "2px solid transparent", color: shiftDetailTab === "Employees" ? "#1e293b" : "#64748b", fontWeight: shiftDetailTab === "Employees" ? "600" : "400", fontSize: "0.85rem", cursor: "pointer" }}
                              >
                                Employees ({assignedShiftUsers.length})
                              </span>
                            </div>

                            {/* Tab 1: Summary Table & Right Card */}
                            {shiftDetailTab === "Summary" && (
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
                            )}

                            {/* Tab 2: Assigned Employees Table */}
                            {shiftDetailTab === "Employees" && (
                              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0" }}>
                                {assignedShiftUsers.length > 0 ? (
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                                    <thead>
                                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>EMPLOYEE</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>EMPLOYEE NUMBER</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>DEPARTMENT</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>REPORTING MANAGER</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assignedShiftUsers.map((u) => {
                                        const userIndex = users.indexOf(u);
                                        return (
                                          <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>
                                              <div>{u.name}</div>
                                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{u.title || u.role}</div>
                                            </td>
                                            <td style={{ padding: "10px 14px", color: "#475569" }}>{u.empCode || u.emp_code || `EMP-${userIndex + 1}`}</td>
                                            <td style={{ padding: "10px 14px", color: "#475569" }}>{u.department || "—"}</td>
                                            <td style={{ padding: "10px 14px", color: "#475569" }}>{u.reportingManager || u.reporting_manager || "—"}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                                    No employees currently assigned to "{activeShiftObj.name}". You can assign employees to this shift in the <strong>Assignments</strong> tab.
                                  </div>
                                )}
                              </div>
                            )}
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
                        {weeklyOffsList.length > 0 ? (
                          weeklyOffsList.filter(w => w.name.toLowerCase().includes(weeklyOffSearchQuery.toLowerCase())).map(item => {
                            const isSelected = selectedWeeklyOff === item.name;
                            const assignedUsersCount = users.filter(u => employeeAssignments[u.id]?.weeklyOff === item.name).length;
                            const countText = `${assignedUsersCount} ${assignedUsersCount === 1 ? "employee" : "employees"}`;

                            return (
                              <div
                                key={item.name}
                                onClick={() => setSelectedWeeklyOff(item.name)}
                                style={{
                                  padding: "12px 14px",
                                  background: isSelected ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" : "#ffffff",
                                  borderLeft: isSelected ? "4px solid #6366f1" : "4px solid transparent",
                                  border: isSelected ? "1px solid #c7d2fe" : "1px solid #f1f5f9",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  boxShadow: isSelected ? "0 2px 8px rgba(99, 102, 241, 0.15)" : "none"
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: isSelected ? "700" : "500", fontSize: "0.85rem", color: isSelected ? "#4338ca" : "#1e293b" }}>{item.name}</div>
                                  <div style={{ fontSize: "0.75rem", color: isSelected ? "#6366f1" : "#64748b", marginTop: "2px" }}>{countText}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  {item.isDefault && (
                                    <span style={{ fontSize: "0.65rem", color: "#4f46e5", background: "#e0e7ff", padding: "2px 6px", borderRadius: "4px", fontWeight: "700", textTransform: "uppercase" }}>DEFAULT</span>
                                  )}
                                  <button
                                    type="button"
                                    title="Delete Weekly Off"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete Weekly Off "${item.name}"?`)) {
                                        deleteWeeklyOff(item.name);
                                      }
                                    }}
                                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem", padding: "2px 6px" }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: "20px 8px", color: "#64748b", fontSize: "0.82rem", textAlign: "center" }}>
                            No weekly offs available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Details Panel */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)" }}>
                      {(() => {
                        const activeWeeklyOffObj = weeklyOffsList.find(w => w.name === selectedWeeklyOff) || weeklyOffsList[0];
                        if (!activeWeeklyOffObj) {
                          return (
                            <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                              <div style={{ fontSize: "1rem", fontWeight: "600", color: "#334155" }}>No Weekly Offs Created</div>
                              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, maxWidth: "340px" }}>
                                All sample weekly offs have been removed. Click below to add a new weekly off.
                              </p>
                              <button 
                                type="button" 
                                onClick={() => setShowAddWeeklyOffDrawer(true)}
                                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", marginTop: "8px", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)" }}
                              >
                                + Add Weekly Off
                              </button>
                            </div>
                          );
                        }

                        const assignedWeeklyOffUsers = users.filter(u => employeeAssignments[u.id]?.weeklyOff === activeWeeklyOffObj.name || u.weeklyOff === activeWeeklyOffObj.name || u.weekly_off === activeWeeklyOffObj.name);

                        return (
                          <>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#0f172a", margin: "0 0 16px 0" }}>{activeWeeklyOffObj.name}</h3>

                            {/* Details Sub-Tabs (Track Weekly Off Versions removed) */}
                            <div style={{ borderBottom: "1px solid #e2e8f0", display: "flex", gap: "24px", marginBottom: "20px" }}>
                              <span 
                                onClick={() => setWeeklyOffDetailTab("Summary")}
                                style={{ padding: "8px 0", borderBottom: weeklyOffDetailTab === "Summary" ? "2px solid #4f46e5" : "2px solid transparent", color: weeklyOffDetailTab === "Summary" ? "#4f46e5" : "#64748b", fontWeight: weeklyOffDetailTab === "Summary" ? "600" : "400", fontSize: "0.85rem", cursor: "pointer" }}
                              >
                                Summary
                              </span>
                              <span 
                                onClick={() => setWeeklyOffDetailTab("Employees")}
                                style={{ padding: "8px 0", borderBottom: weeklyOffDetailTab === "Employees" ? "2px solid #4f46e5" : "2px solid transparent", color: weeklyOffDetailTab === "Employees" ? "#4f46e5" : "#64748b", fontWeight: weeklyOffDetailTab === "Employees" ? "600" : "400", fontSize: "0.85rem", cursor: "pointer" }}
                              >
                                Employees ({assignedWeeklyOffUsers.length})
                              </span>
                            </div>

                            {/* Tab 1: Summary Table & Right Card */}
                            {weeklyOffDetailTab === "Summary" && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "20px" }}>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
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
                                <div style={{ border: "1px solid #bfdbfe", padding: "18px", borderRadius: "8px", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 2px 8px rgba(59, 130, 246, 0.08)" }}>
                                  <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#1e40af", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>⚙️</span> Rule based assignment
                                  </h5>
                                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#3b82f6", lineHeight: 1.4 }}>
                                    Employees following this rule will be added to this weekly off policy automatically.
                                  </p>
                                  <button type="button" style={{ marginTop: "auto", background: "#ffffff", border: "1px solid #3b82f6", borderRadius: "6px", color: "#2563eb", padding: "6px 14px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 3px rgba(37, 99, 235, 0.1)" }}>
                                    Add rule
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Tab 2: Assigned Employees Table */}
                            {weeklyOffDetailTab === "Employees" && (
                              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0" }}>
                                {assignedWeeklyOffUsers.length > 0 ? (
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                                    <thead>
                                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>EMPLOYEE</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>EMPLOYEE NUMBER</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>DEPARTMENT</th>
                                        <th style={{ padding: "10px 14px", fontWeight: "600" }}>REPORTING MANAGER</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assignedWeeklyOffUsers.map((u) => {
                                        const userIndex = users.indexOf(u);
                                        return (
                                          <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>
                                              <div>{u.name}</div>
                                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{u.title || u.role}</div>
                                            </td>
                                            <td style={{ padding: "10px 14px", color: "#475569" }}>{u.empCode || u.emp_code || `EMP-${userIndex + 1}`}</td>
                                            <td style={{ padding: "10px 14px", color: "#475569" }}>{u.department || "—"}</td>
                                            <td style={{ padding: "10px 14px", color: "#475569" }}>{u.reportingManager || u.reporting_manager || "—"}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                                    No employees currently assigned to "{selectedWeeklyOff}". You can assign employees in the <strong>Assignments</strong> tab.
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}

                    </div>

                  </div>
                </div>
              )}

              {/* View 1.3: Shift & Weekly Off Rules */}
              {shiftsInnerTab === "Shift & Weekly Off Rules" && (
                <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "28px", boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "1.2rem", boxShadow: "0 4px 10px rgba(79, 70, 229, 0.25)" }}>⚡</div>
                    <div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Shift & Weekly Off Rules</h3>
                      <p style={{ fontSize: "0.83rem", color: "#64748b", margin: "2px 0 0 0" }}>Create automatic assignment rules for new joiners based on department, designation, or employment type.</p>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)" }}>
                      + Create Assignment Rule
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Sub-Tab 2: Assignments (Updated per user feedback) */}
          {shiftsSubTab === "Assignments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Main Content Area */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)" }}>
                
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
                            onClick={() => {
                              const firstSelected = users.find(u => selectedUserIdsForAssignment.includes(u.id));
                              const currentShift = firstSelected?.shift || employeeAssignments[firstSelected?.id]?.shift;
                              setModalSelectedShift(currentShift || shiftsList[0]?.name || "");
                              setShowUpdateShiftModal(true);
                            }}
                            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "0.82rem", color: "#ffffff", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)" }}
                          >
                            Update Shift {selectedUserIdsForAssignment.length > 0 && `(${selectedUserIdsForAssignment.length})`}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              const firstSelected = users.find(u => selectedUserIdsForAssignment.includes(u.id));
                              const currentWeeklyOff = firstSelected?.weekly_off || firstSelected?.weeklyOff || employeeAssignments[firstSelected?.id]?.weeklyOff;
                              setModalSelectedWeeklyOff(currentWeeklyOff || weeklyOffsList[0]?.name || "");
                              setShowUpdateWeeklyOffModal(true);
                            }}
                            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "0.82rem", color: "#ffffff", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)" }}
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
                                const assignedShift = u.shift || employeeAssignments[u.id]?.shift || "—";
                                const assignedWeeklyOff = u.weekly_off || u.weeklyOff || employeeAssignments[u.id]?.weeklyOff || "—";
                                return (
                                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: isChecked ? "#f0f9ff" : "transparent" }}>
                                    <td style={{ padding: "10px 14px" }}>
                                      <input type="checkbox" checked={isChecked} onChange={() => toggleUserSelection(u.id)} />
                                    </td>
                                    <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>
                                      <div>{u.name}</div>
                                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{u.title || u.role}</div>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>{u.empCode || u.emp_code || `EMP-${idx + 1}`}</td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>{u.department || "—"}</td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>{u.reportingManager || u.reporting_manager || "—"}</td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                                      <span style={{ fontWeight: assignedShift !== "—" ? "600" : "400", color: assignedShift !== "—" ? "#2563eb" : "#94a3b8" }}>
                                        {assignedShift}
                                      </span>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                                      <span style={{ fontWeight: assignedWeeklyOff !== "—" ? "600" : "400", color: assignedWeeklyOff !== "—" ? "#2563eb" : "#94a3b8" }}>
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

      {(activeTab === "reports" || activeTab === "ledger") && (
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
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    Past Advances
                  </span>
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
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Pending Payments
                  </span>
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
                <label>Allocation Date</label>
                <input 
                  type="date" 
                  value={directAdvanceDate} 
                  onChange={(e) => setDirectAdvanceDate(e.target.value)} 
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
                {shiftsList.length > 0 ? (
                  shiftsList.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.timings || "Fixed timings"})
                    </option>
                  ))
                ) : (
                  <option value="">No shifts available. Please create a shift first.</option>
                )}
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
                {weeklyOffsList.length > 0 ? (
                  weeklyOffsList.map(w => (
                    <option key={w.name} value={w.name}>
                      {w.name} {w.isDefault ? "(DEFAULT)" : ""}
                    </option>
                  ))
                ) : (
                  <option value="">No weekly off available.</option>
                )}
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

              {/* Conditional Rendering: Fixed Shift Timings vs Flexible Work Hours */}
              {newShiftType === "fixed" ? (
                /* Fixed Shift Timings View */
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
              ) : (
                /* Flexible Work Hours View (Matching Reference Screenshot) */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                  
                  {/* Gross Hours Checkbox */}
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={expectGrossHours} 
                      onChange={(e) => setExpectGrossHours(e.target.checked)} 
                    />
                    Employees are expected to complete defined Gross hours once they come in
                  </label>

                  {/* Accordion: Advance option */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginTop: "8px" }}>
                    <div 
                      onClick={() => setIsAdvanceOptionOpen(!isAdvanceOptionOpen)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", color: "#0f172a" }}
                    >
                      <span>{isAdvanceOptionOpen ? "∧" : "∨"}</span>
                      <span>Advance option</span>
                    </div>

                    {isAdvanceOptionOpen && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        
                        {/* Maximum shift duration input */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#334155", flexWrap: "wrap" }}>
                            <span>Maximum shift duration possible is</span>
                            <input 
                              type="text" 
                              value={maxShiftDurationHours} 
                              onChange={(e) => setMaxShiftDurationHours(e.target.value)}
                              style={{ width: "50px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", textAlign: "center" }}
                            />
                            <span>hours after the employee's first punch in for the day.</span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                            {maxShiftDurationHours || "16"} hrs 0 mins
                          </span>
                        </div>

                        {/* Explanation Paragraph */}
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                          <strong style={{ color: "#334155" }}>For e.g.</strong> suppose the first punch is on Day 1 - 9:30pm and max shift limit is set to {maxShiftDurationHours || "16"}hrs. Then, all logs until Day 2 - 1:30pm are considered as logs for Day 1. Any logs beyond Day 2 - 1:30pm is considered as first log for Day 2.
                        </p>

                        {/* Diagram Card View */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
                          
                          {/* DAY - 1 LOGS CARD */}
                          <div style={{ border: "1px solid #e2e8f0", background: "#ffffff", borderRadius: "6px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", minWidth: "320px" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", letterSpacing: "0.05em" }}>DAY - 1 LOGS</span>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              
                              {/* FIRST CLOCK-IN BOX */}
                              <div style={{ border: "1px solid #f1f5f9", background: "#f8fafc", padding: "10px 14px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", fontWeight: "700", color: "#64748b" }}>FIRST CLOCK-IN</div>
                                  <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#0f172a" }}>Day 1 - 09:30 PM</div>
                                </div>
                              </div>

                              {/* Arrow 16 hrs */}
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "600" }}>{maxShiftDurationHours || "16"} hrs</span>
                                <span style={{ color: "#94a3b8" }}>➔</span>
                              </div>

                              {/* LAST POSSIBLE CLOCK-OUT BOX */}
                              <div style={{ border: "1px solid #f1f5f9", background: "#f8fafc", padding: "10px 14px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.65rem", fontWeight: "700", color: "#64748b" }}>LAST POSSIBLE CLOCK-OUT FOR DAY 1</div>
                                  <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#0f172a" }}>Day 2 - 01:30 PM</div>
                                </div>
                              </div>

                            </div>

                            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Employee can clock-out anytime before the last possible clock-out time</span>
                          </div>

                          <span style={{ color: "#94a3b8", fontSize: "1.2rem" }}>➔</span>

                          {/* DAY - 2 LOGS CARD */}
                          <div style={{ border: "1px solid #e2e8f0", background: "#ffffff", borderRadius: "6px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", minWidth: "220px" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", letterSpacing: "0.05em" }}>DAY - 2 LOGS</span>
                            
                            <div style={{ border: "1px solid #f1f5f9", background: "#f8fafc", padding: "10px 14px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.65rem", fontWeight: "700", color: "#64748b" }}>FIRST POSSIBLE CLOCK-IN FOR DAY 2</div>
                                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#0f172a" }}>Any log after 01:30 PM</div>
                              </div>
                            </div>

                          </div>

                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}

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

