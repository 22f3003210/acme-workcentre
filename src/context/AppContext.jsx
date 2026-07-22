import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initialUsers,
  initialExpenses,
  initialSettings,
  initialAdvanceRequests,
  initialProjects,
  initialHiringRequisitions,
  initialCandidates
} from "../data/initialData";

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

// Helper to convert time string (e.g., "08:15 AM") to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  try {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } catch (e) {
    return 0;
  }
};

// ── Data version: bump this whenever initialData.js changes ──────────────
const DATA_VERSION = "v9";

export const AppProvider = ({ children }) => {
  // On every mount, flush stale localStorage if data version changed
  (() => {
    const stored = localStorage.getItem("workcentre_data_version");
    if (stored !== DATA_VERSION) {
      const keys = [
        "workcentre_users",
        "workcentre_expenses",
        "workcentre_settings",
        "workcentre_advance_requests",
        "workcentre_projects",
        "workcentre_hiring_requisitions",
        "workcentre_candidates"
      ];
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem("workcentre_data_version", DATA_VERSION);
    }
  })();

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("workcentre_users");
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("workcentre_expenses");
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("workcentre_settings");
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [advanceRequests, setAdvanceRequests] = useState(() => {
    const saved = localStorage.getItem("workcentre_advance_requests");
    return saved ? JSON.parse(saved) : initialAdvanceRequests;
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("workcentre_projects");
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [hiringRequisitions, setHiringRequisitions] = useState(() => {
    const saved = localStorage.getItem("workcentre_hiring_requisitions");
    return saved ? JSON.parse(saved) : initialHiringRequisitions;
  });

  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem("workcentre_candidates");
    return saved ? JSON.parse(saved) : initialCandidates;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUserId = localStorage.getItem("workcentre_current_user_id");
    const found = users.find(u => u.id === savedUserId);
    return found || users[0]; // Sophia Laurent (HR Admin) by default
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("workcentre_authenticated") === "true";
  });

  const [toast, setToast] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("workcentre_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("workcentre_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("workcentre_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("workcentre_advance_requests", JSON.stringify(advanceRequests));
  }, [advanceRequests]);

  useEffect(() => {
    localStorage.setItem("workcentre_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("workcentre_hiring_requisitions", JSON.stringify(hiringRequisitions));
  }, [hiringRequisitions]);

  useEffect(() => {
    localStorage.setItem("workcentre_candidates", JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem("workcentre_authenticated", isAuthenticated ? "true" : "false");
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("workcentre_current_user_id", currentUser.id);
    }
  }, [currentUser]);

  const [activeOtps, setActiveOtps] = useState({});

  // Authentication Handlers
  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password ? password.trim() : "";
    
    let user;
    if (cleanEmail === "admin" && cleanPassword === "123") {
      user = users.find(u => u.role === "Admin" || u.id === "admin-1");
    } else {
      user = users.find(u => u.email.toLowerCase() === cleanEmail);
    }
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Update last active login
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
      ));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const sendOtp = (phoneNumber) => {
    const cleanNum = (s) => s.replace(/\D/g, "");
    const cleanedSearch = cleanNum(phoneNumber);
    const user = users.find(u => u.phone && cleanNum(u.phone) === cleanedSearch);
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveOtps(prev => ({ ...prev, [cleanedSearch]: code }));
      return code;
    }
    return null;
  };

  const verifyOtp = (phoneNumber, code) => {
    const cleanNum = (s) => s.replace(/\D/g, "");
    const cleanedSearch = cleanNum(phoneNumber);
    const user = users.find(u => u.phone && cleanNum(u.phone) === cleanedSearch);
    if (user) {
      const activeCode = activeOtps[cleanedSearch];
      if (activeCode === code || code === "123456" || code === "000000") {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
        ));
        return true;
      }
    }
    return false;
  };

  // Switch Active Account (Demo helper used inside landing page or switcher)
  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, lastLogin: new Date().toISOString() } : u
      ));
    }
  };

  // Employee Directory CRUD (Admin Only)
  const addUser = (userData) => {
    const newId = `${userData.role.toLowerCase().replace(" ", "")}-${Date.now()}`;
    const newUser = {
      id: newId,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
      lastLogin: "",
      attendance: userData.role === "Consultant" ? [] : undefined,
      advanceAmount: userData.role === "Consultant" ? (parseFloat(userData.advanceAmount) || 0) : undefined,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  // Onboard Consultant Invite (Step 1: Admin sends link with primary details)
  const onboardConsultantInvite = (primaryData) => {
    const inviteToken = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const newId = `consultant-${Date.now()}`;
    const newUser = {
      id: newId,
      name: primaryData.name,
      email: primaryData.email,
      phone: (primaryData.phone || "").replace(/\D/g, "").slice(0, 10),
      role: "Consultant",
      title: primaryData.title || "Retail Jewellery BD Consultant",
      department: primaryData.department || "Advisory",
      location: primaryData.location || "Mumbai / Showroom Site",
      status: "Pending Onboarding",
      inviteToken,
      inviteSentAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(primaryData.name)}`,
      attendance: [],
      advanceAmount: parseFloat(primaryData.advanceAmount) || 2000
    };

    setUsers(prev => [...prev, newUser]);
    return {
      user: newUser,
      inviteToken,
      inviteLink: `${window.location.origin}${window.location.pathname}#/register?token=${inviteToken}`
    };
  };

  // Complete Consultant Registration (Step 2: Candidate self-registers & logs in)
  const completeConsultantRegistration = (data) => {
    let updatedUser = null;
    setUsers(prev => prev.map(u => {
      if (u.id === data.userId || u.inviteToken === data.inviteToken) {
        updatedUser = {
          ...u,
          status: "Active",
          password: data.password,
          specialization: data.specialization,
          emergencyContact: data.emergencyContact,
          bankUpi: data.bankUpi,
          location: data.location || u.location,
          lastLogin: new Date().toISOString()
        };
        return updatedUser;
      }
      return u;
    }));

    if (updatedUser) {
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const deleteUser = (userId) => {
    if (currentUser.id === userId) return false; // Prevent deleting active session
    setUsers(prev => prev.filter(u => u.id !== userId));
    return true;
  };

  // Helper to fetch employee petty cash balances (Initial Advance, Spent, Available Balance, Category Sums)
  const getEmployeeBalanceDetails = (employeeId) => {
    const user = users.find(u => u.id === employeeId);
    if (!user || user.role !== "Consultant") return null;

    const empExpenses = expenses.filter(e => e.employeeId === employeeId && e.status === "Approved");
    const empRefills = advanceRequests.filter(r => r.employeeId === employeeId && r.status === "Approved");

    const totalSpent = empExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalReceived = empRefills.reduce((sum, r) => sum + r.amount, 0);

    const categoriesSum = empExpenses.reduce((acc, e) => {
      const cat = e.category;
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, { "Food": 0, "Accommodation": 0, "Travel": 0 });

    const initialAdvance = (user.openingBalance || 0) + totalReceived;
    const availableBalance = initialAdvance - totalSpent;

    return {
      initialAdvance,
      totalSpent,
      availableBalance,
      categoriesSum
    };
  };

  // Compile full-month ledger rows (Date, Particulars, Opening, Food, Stay, Travel, Total Spent, Received, Balance)
  const getEmployeeLedger = (employeeId, yearMonth = "2026-07") => {
    const user = users.find(u => u.id === employeeId);
    if (!user || user.role !== "Consultant") {
      return { 
        ledgerRows: [], 
        refillingDetails: [], 
        totals: { food: 0, stay: 0, travel: 0, spent: 0, received: 0 } 
      };
    }

    const empExpenses = expenses.filter(e => e.employeeId === employeeId && e.status === "Approved");
    const empRefills = advanceRequests.filter(r => r.employeeId === employeeId && r.status === "Approved");

    const ledgerRows = [];
    const [year, month] = yearMonth.split("-").map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    
    let currentBalance = user.openingBalance || 0;
    const weekdaysNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    let totalFood = 0;
    let totalStay = 0;
    let totalTravel = 0;
    let totalSpent = 0;
    let totalReceived = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = weekdaysNames[new Date(year, month - 1, day).getDay()];

      const dailyExpenses = empExpenses.filter(e => e.date === dateStr);
      const dailyRefills = empRefills.filter(r => r.date === dateStr);

      const food = dailyExpenses.filter(e => e.category === "Food").reduce((sum, e) => sum + e.amount, 0);
      const stay = dailyExpenses.filter(e => e.category === "Accommodation").reduce((sum, e) => sum + e.amount, 0);
      const travel = dailyExpenses.filter(e => e.category === "Travel").reduce((sum, e) => sum + e.amount, 0);
      const spent = food + stay + travel;

      const received = dailyRefills.reduce((sum, r) => sum + r.amount, 0);
      const opening = currentBalance;
      
      const particularsParts = [];
      if (received > 0) {
        dailyRefills.forEach(r => {
          particularsParts.push(`Refill: ${r.purpose}`);
        });
      }
      dailyExpenses.forEach(e => {
        particularsParts.push(e.description);
      });
      const particulars = particularsParts.join(" / ") || "";

      const closing = opening + received - spent;
      currentBalance = closing;

      totalFood += food;
      totalStay += stay;
      totalTravel += travel;
      totalSpent += spent;
      totalReceived += received;

      ledgerRows.push({
        srNo: day,
        date: `${day}/${month}/${year}`,
        day: dayOfWeek,
        particulars,
        opening,
        food,
        stay,
        travel,
        spent,
        received,
        balance: closing
      });
    }

    const refillingDetails = empRefills.map((r, i) => ({
      srNo: i + 1,
      date: r.date,
      amount: r.amount
    }));

    return {
      ledgerRows,
      refillingDetails,
      totals: {
        food: totalFood,
        stay: totalStay,
        travel: totalTravel,
        spent: totalSpent,
        received: totalReceived
      }
    };
  };

  // Daily Punch Card (Check In / Check Out)
  const checkInConsultant = (consultantId, remarks = "", projectId = "", projectName = "") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Check if late based on settings
    const checkInMin = parseTimeToMinutes(timeStr);
    const limitMin = parseTimeToMinutes(settings.lateCheckInLimit);
    const status = checkInMin > limitMin ? "Late" : "Present";

    setUsers(prev => prev.map(u => {
      if (u.id === consultantId) {
        const attendance = u.attendance || [];
        const alreadyCheckedIn = attendance.some(a => a.date === todayStr);
        if (alreadyCheckedIn) return u;

        return {
          ...u,
          attendance: [
            ...attendance,
            { date: todayStr, checkIn: timeStr, checkOut: null, status, hoursWorked: 0, remarks, projectId, projectName }
          ]
        };
      }
      return u;
    }));
  };

  const checkOutConsultant = (consultantId, remarks = "") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setUsers(prev => prev.map(u => {
      if (u.id === consultantId) {
        const attendance = u.attendance || [];
        const updatedAttendance = attendance.map(a => {
          if (a.date === todayStr && !a.checkOut) {
            const inMin = parseTimeToMinutes(a.checkIn);
            const outMin = parseTimeToMinutes(timeStr);
            const minutesDiff = outMin - inMin;
            const hours = parseFloat(Math.max(0, (minutesDiff / 60)).toFixed(1));
            return {
              ...a,
              checkOut: timeStr,
              hoursWorked: hours,
              remarks: remarks ? `${a.remarks ? a.remarks + " | " : ""}${remarks}` : a.remarks
            };
          }
          return a;
        });

        return {
          ...u,
          attendance: updatedAttendance
        };
      }
      return u;
    }));
  };

  // Expense Submissions
  const addExpense = (expenseData) => {
    const newExpense = {
      id: `exp-${Date.now()}`,
      status: "Pending",
      date: expenseData.expenseDate || new Date().toISOString().split("T")[0],
      reviewedBy: "",
      reviewerNotes: "",
      submittedDate: new Date().toISOString().split("T")[0],
      approvedDate: "",
      projectId: expenseData.projectId || "",
      projectName: expenseData.projectName || "",
      ...expenseData
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  // Projects Management
  const addProject = (projectData) => {
    const newProj = {
      id: `proj-${Date.now()}`,
      status: "Active",
      spent: 0,
      discussions: [],
      assignedConsultants: [],
      engagementPurpose: projectData.description || "Client requested consulting advisory for store operations, inventory audit, and retail growth.",
      checklists: [
        {
          category: "📦 Inventory Audit Checklist",
          items: [
            { text: "Physical vault stock count & weight reconciliation", completed: false },
            { text: "Hallmarking purity verification & BIS tag audit", completed: false },
            { text: "Vault vs POS software ledger discrepancy analysis", completed: false }
          ]
        },
        {
          category: "📣 Marketing Suggestions Checklist",
          items: [
            { text: "Local billboard & newspaper ad reach evaluation", completed: false },
            { text: "Social media & Meta Ads bridal campaign audit", completed: false }
          ]
        },
        {
          category: "📈 Revenue & Sales Growth Checklist",
          items: [
            { text: "Average transaction ticket size optimization (Gold to Diamond)", completed: false },
            { text: "Solitaire & bridal set cross-selling desk strategy", completed: false }
          ]
        },
        {
          category: "👥 Customer Experience & Showroom Checklist",
          items: [
            { text: "Showroom floor greeter & VIP lounge service standards", completed: false }
          ]
        }
      ],
      scheduledEvents: [],
      clientVisits: [],
      ...projectData
    };
    setProjects(prev => [newProj, ...prev]);
    return newProj;
  };

  const updateProject = (projectId, updatedFields) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatedFields } : p));
  };

  const addProjectDiscussion = (projectId, discussionData) => {
    const newDisc = {
      id: `disc-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      date: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      ...discussionData
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          discussions: [newDisc, ...(p.discussions || [])]
        };
      }
      return p;
    }));
  };

  const addProjectVisit = (projectId, visitData) => {
    const newVisit = {
      id: `visit-${Date.now()}`,
      ...visitData
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          clientVisits: [newVisit, ...(p.clientVisits || [])]
        };
      }
      return p;
    }));
  };

  const addProjectScheduledEvent = (projectId, eventData) => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      status: "Scheduled",
      ...eventData
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          scheduledEvents: [newEvent, ...(p.scheduledEvents || [])]
        };
      }
      return p;
    }));
  };

  const toggleProjectChecklistItem = (projectId, categoryIndex, itemIndex) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId && p.checklists) {
        const updatedChecklists = p.checklists.map((cat, cIdx) => {
          if (cIdx === categoryIndex) {
            const updatedItems = cat.items.map((item, iIdx) => {
              if (iIdx === itemIndex) {
                return { ...item, completed: !item.completed };
              }
              return item;
            });
            return { ...cat, items: updatedItems };
          }
          return cat;
        });
        return { ...p, checklists: updatedChecklists };
      }
      return p;
    }));
  };

  // Expense Verification (Accounts Manager Only)
  const verifyExpense = (expenseId, status, notes, reviewerName) => {
    setExpenses(prev => prev.map(e => 
      e.id === expenseId 
        ? { 
            ...e, 
            status, 
            reviewerNotes: notes, 
            reviewedBy: reviewerName,
            approvedDate: status === "Approved" ? new Date().toISOString().split("T")[0] : "" 
          } 
        : e
    ));
  };

  // Cash Advance Requests
  const requestAdvance = (employeeId, amount, purpose) => {
    const newRequest = {
      id: `adv-${Date.now()}`,
      employeeId,
      amount: parseFloat(amount),
      purpose,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
      reviewedBy: ""
    };
    setAdvanceRequests(prev => [newRequest, ...prev]);
  };

  const verifyAdvanceRequest = (requestId, status, reviewerName) => {
    setAdvanceRequests(prev => prev.map(r => {
      if (r.id === requestId && r.status === "Pending") {
        if (status === "Approved") {
          // Increase user advanceAmount
          setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === r.employeeId) {
              return {
                ...u,
                advanceAmount: (u.advanceAmount || 0) + r.amount
              };
            }
            return u;
          }));
        }
        return { ...r, status, reviewedBy: reviewerName };
      }
      return r;
    }));
  };

  // Settings Config (Admin Only)
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Recruitment Module Handlers
  const addHiringRequisition = (reqData) => {
    const newReq = {
      id: `req-${Date.now()}`,
      createdDate: new Date().toISOString().split("T")[0],
      status: "Open",
      channels: ["LinkedIn", "Naukri", "Meta Ads"],
      ...reqData
    };
    setHiringRequisitions(prev => [newReq, ...prev]);
    return newReq;
  };

  const updateHiringRequisition = (reqId, updates) => {
    setHiringRequisitions(prev => prev.map(r => r.id === reqId ? { ...r, ...updates } : r));
  };

  const addCandidate = (candData) => {
    const newCand = {
      id: `cand-${Date.now()}`,
      stage: "Sourced / Applied",
      status: "In Process",
      updatedDate: new Date().toISOString().split("T")[0],
      ...candData
    };
    setCandidates(prev => [newCand, ...prev]);
    return newCand;
  };

  const updateCandidateStage = (candId, stage) => {
    setCandidates(prev => prev.map(c => c.id === candId ? { ...c, stage, updatedDate: new Date().toISOString().split("T")[0] } : c));
  };

  const updateCandidateStatus = (candId, status, extraNotes = "") => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candId) {
        return {
          ...c,
          status,
          updatedDate: new Date().toISOString().split("T")[0],
          summary: extraNotes ? `${c.summary || ''} [Note: ${extraNotes}]` : c.summary
        };
      }
      return c;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        users,
        expenses,
        settings,
        projects,
        hiringRequisitions,
        candidates,
        currentUser,
        isAuthenticated,
        toast,
        setToast,
        login,
        logout,
        sendOtp,
        verifyOtp,
        switchUser,
        addUser,
        onboardConsultantInvite,
        completeConsultantRegistration,
        deleteUser,
        getEmployeeBalanceDetails,
        getEmployeeLedger,
        checkInConsultant,
        checkOutConsultant,
        addExpense,
        verifyExpense,
        advanceRequests,
        requestAdvance,
        verifyAdvanceRequest,
        updateSettings,
        addProject,
        updateProject,
        addProjectDiscussion,
        addProjectVisit,
        addProjectScheduledEvent,
        toggleProjectChecklistItem,
        addHiringRequisition,
        updateHiringRequisition,
        addCandidate,
        updateCandidateStage,
        updateCandidateStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
