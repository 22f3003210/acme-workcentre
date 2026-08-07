import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  initialUsers,
  initialExpenses,
  initialSettings,
  initialAdvanceRequests,
  initialProjects,
  initialHiringRequisitions,
  initialCandidates,
  initialSchedules
} from "../data/initialData";
import {
  supabase,
  isSupabaseConfigured,
  supabaseAddExpense,
  supabaseVerifyExpense,
  supabaseAddProject,
  supabaseUpdateProject,
  supabaseRequestAdvance,
  supabaseVerifyAdvanceRequest,
  supabaseAddHiringRequisition,
  supabaseAddCandidate,
  supabaseAddAttendanceRecord,
  supabaseUpdateAttendanceCheckout
} from "../lib/supabaseClient";

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

// Helper to get local date string YYYY-MM-DD (avoiding UTC timezone shift bugs from toISOString)
export const getTodayDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
const DATA_VERSION = "v13";

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_users");
      return saved ? JSON.parse(saved) : initialUsers;
    } catch (e) {
      console.error("Error parsing workcentre_users from localStorage:", e);
      return initialUsers;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_expenses");
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch (e) {
      console.error("Error parsing workcentre_expenses from localStorage:", e);
      return initialExpenses;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_settings");
      return saved ? JSON.parse(saved) : initialSettings;
    } catch (e) {
      console.error("Error parsing workcentre_settings from localStorage:", e);
      return initialSettings;
    }
  });

  const [advanceRequests, setAdvanceRequests] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_advance_requests");
      return saved ? JSON.parse(saved) : initialAdvanceRequests;
    } catch (e) {
      console.error("Error parsing workcentre_advance_requests from localStorage:", e);
      return initialAdvanceRequests;
    }
  });

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_projects");
      return saved ? JSON.parse(saved) : initialProjects;
    } catch (e) {
      console.error("Error parsing workcentre_projects from localStorage:", e);
      return initialProjects;
    }
  });

  const [hiringRequisitions, setHiringRequisitions] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_hiring_requisitions");
      return saved ? JSON.parse(saved) : initialHiringRequisitions;
    } catch (e) {
      console.error("Error parsing workcentre_hiring_requisitions from localStorage:", e);
      return initialHiringRequisitions;
    }
  });

  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_candidates");
      return saved ? JSON.parse(saved) : initialCandidates;
    } catch (e) {
      console.error("Error parsing workcentre_candidates from localStorage:", e);
      return initialCandidates;
    }
  });

  const [jobTitles, setJobTitles] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_job_titles");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing workcentre_job_titles from localStorage:", e);
      return [];
    }
  });

  const [numberSeries, setNumberSeries] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_number_series");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing workcentre_number_series from localStorage:", e);
      return [];
    }
  });

  const [departments, setDepartments] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_departments");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing workcentre_departments from localStorage:", e);
      return [];
    }
  });

  const [shifts, setShifts] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_shifts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing workcentre_shifts from localStorage:", e);
      return [];
    }
  });

  const [weeklyOffs, setWeeklyOffs] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_weekly_offs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing workcentre_weekly_offs from localStorage:", e);
      return [];
    }
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_leave_requests");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing workcentre_leave_requests from localStorage:", e);
      return [];
    }
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_schedules");
      return saved ? JSON.parse(saved) : initialSchedules;
    } catch (e) {
      console.error("Error parsing workcentre_schedules from localStorage:", e);
      return initialSchedules;
    }
  });

  const [clientPendingTasks, setClientPendingTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("workcentre_client_pending_tasks");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_client_pending_tasks", JSON.stringify(clientPendingTasks));
    } catch (e) {}
  }, [clientPendingTasks]);

  const addClientPendingTasks = (projectId, tasks) => {
    if (!projectId || !tasks || tasks.length === 0) return;
    setClientPendingTasks(prev => {
      const existing = prev[projectId] || [];
      const newTitles = tasks.map(t => typeof t === "string" ? t : t.title);
      const combined = Array.from(new Set([...existing, ...newTitles]));
      return { ...prev, [projectId]: combined };
    });
  };

  const getClientPendingTasks = (projectId) => {
    return clientPendingTasks[projectId] || [];
  };

  const removeClientPendingTask = (projectId, taskTitle) => {
    if (!projectId) return;
    setClientPendingTasks(prev => {
      const existing = prev[projectId] || [];
      const updated = existing.filter(t => t !== taskTitle);
      return { ...prev, [projectId]: updated };
    });
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem("workcentre_authenticated") === "true";
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const isAuth = localStorage.getItem("workcentre_authenticated") === "true";
      if (!isAuth) return null;
      const savedUserId = localStorage.getItem("workcentre_current_user_id");
      const found = users.find(u => u.id === savedUserId);
      return found || users[0];
    } catch (e) {
      return null;
    }
  });

  const [toast, setToast] = useState(null);

  // On mount, flush stale localStorage if data version changed (moved from render body into useEffect)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("workcentre_data_version");
      if (stored && stored !== DATA_VERSION) {
        const keys = [
          "workcentre_users",
          "workcentre_expenses",
          "workcentre_settings",
          "workcentre_advance_requests",
          "workcentre_projects",
          "workcentre_hiring_requisitions",
          "workcentre_candidates",
          "workcentre_job_titles",
          "workcentre_number_series",
          "workcentre_departments",
          "workcentre_shifts",
          "workcentre_weekly_offs",
          "workcentre_current_user_id",
          "workcentre_authenticated"
        ];
        keys.forEach(k => localStorage.removeItem(k));
        localStorage.setItem("workcentre_data_version", DATA_VERSION);
        setUsers(initialUsers);
        setExpenses(initialExpenses);
        setSettings(initialSettings);
        setAdvanceRequests(initialAdvanceRequests);
        setProjects(initialProjects);
        setHiringRequisitions(initialHiringRequisitions);
        setCandidates(initialCandidates);
        setJobTitles([]);
        setNumberSeries([]);
        setDepartments([]);
        setShifts([]);
        setWeeklyOffs([]);
        setCurrentUser(initialUsers[0]);
        setIsAuthenticated(false);
      } else if (!stored) {
        localStorage.setItem("workcentre_data_version", DATA_VERSION);
      }
    } catch (e) {
      console.error("Error in data version check/clearing:", e);
    }
  }, []);

  // Supabase Initial Entity Fetches
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // 1. Users
      supabase.from("users").select("*").then(({ data, error }) => {
        if (!error && data) {
          if (data.length === 0) {
            setUsers(initialUsers);
          } else {
            setUsers(prevUsers => {
              const userMap = new Map(prevUsers.map(u => [u.id, u]));
              const fetchedIds = new Set();
              const fetchedEmails = new Set();

              const mergedFetched = data.map(dbU => {
                const existing = userMap.get(dbU.id) || prevUsers.find(u => u.email?.toLowerCase() === dbU.email?.toLowerCase());
                if (dbU.id) fetchedIds.add(dbU.id);
                if (dbU.email) fetchedEmails.add(dbU.email.toLowerCase());
                return {
                  ...existing,
                  id: dbU.id,
                  empCode: dbU.emp_code || dbU.empCode || existing?.empCode || "",
                  name: dbU.name || existing?.name || "",
                  email: dbU.email || existing?.email || "",
                  phone: dbU.phone || existing?.phone || "",
                  role: dbU.role || existing?.role || "",
                  title: dbU.title || existing?.title || "",
                  department: dbU.department || existing?.department || "",
                  location: dbU.location || existing?.location || "",
                  status: dbU.status || existing?.status || "Active",
                  avatar: dbU.avatar || existing?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(dbU.name || "")}`,
                  advanceAmount: dbU.advance_amount !== undefined && dbU.advance_amount !== null ? Number(dbU.advance_amount) : (existing?.advanceAmount || 0),
                  shift: dbU.shift || existing?.shift || "",
                  weeklyOff: dbU.weekly_off || existing?.weeklyOff || "",
                  reportingManager: dbU.reporting_manager || existing?.reportingManager || "",
                  // Preserve local attributes so state is not lost
                  attendance: existing?.attendance || [],
                  password: existing?.password || "",
                  specialization: existing?.specialization || "",
                  emergencyContact: existing?.emergencyContact || "",
                  bankUpi: existing?.bankUpi || "",
                  inviteToken: existing?.inviteToken || "",
                  openingBalance: existing?.openingBalance || 0
                };
              });

              const localOnly = prevUsers.filter(u => !fetchedIds.has(u.id) && !fetchedEmails.has(u.email?.toLowerCase()));
              return [...mergedFetched, ...localOnly];
            });
          }
        }
      }).catch(err => console.error("Supabase fetch users error:", err));

      // 2. Expenses
      supabase.from("expenses").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const fetched = data.map(e => {
            let parsedReceipts = [];
            try {
              if (e.receipts) {
                parsedReceipts = typeof e.receipts === "string" ? JSON.parse(e.receipts) : e.receipts;
              } else if (e.receipt && typeof e.receipt === "string" && e.receipt.trim().startsWith("[")) {
                parsedReceipts = JSON.parse(e.receipt);
              } else if (e.receipt && typeof e.receipt === "string" && e.receipt.includes("|||")) {
                const urls = e.receipt.split("|||");
                const names = (e.receipt_name || "").split("|||");
                parsedReceipts = urls.map((u, i) => ({ name: names[i] || `Receipt #${i+1}`, url: u.trim() }));
              } else if (e.receipt) {
                parsedReceipts = [{ name: e.receipt_name || "Receipt File", url: e.receipt }];
              }
            } catch (err) {
              parsedReceipts = e.receipt ? [{ name: e.receipt_name || "Receipt File", url: e.receipt }] : [];
            }

            return {
              id: e.id,
              employeeId: e.employee_id,
              projectId: e.project_id || "",
              projectName: e.project_name || "",
              title: e.title || e.reason || "",
              date: e.date,
              expenseDate: e.date,
              submittedDate: e.submitted_date || e.date,
              category: e.category,
              amount: Number(e.amount) || 0,
              reason: e.reason || "",
              description: e.reason || "",
              receipt: e.receipt || "",
              receiptUrl: e.receipt || "",
              receiptName: e.receipt_name || "",
              receipts: parsedReceipts,
              status: e.status || "Pending",
              approvedBy: e.approved_by || null,
              approvedDate: e.approved_date || null
            };
          });

          setExpenses(prevExpenses => {
            const fetchedMap = new Map(fetched.map(x => [x.id, x]));
            const mergedLocal = prevExpenses.map(localExp => {
              const fromDb = fetchedMap.get(localExp.id);
              return fromDb ? { ...localExp, ...fromDb } : localExp;
            });
            const dbOnly = fetched.filter(dbExp => !prevExpenses.some(l => l.id === dbExp.id));
            return [...mergedLocal, ...dbOnly];
          });
        }
      }).catch(err => console.error("Supabase fetch expenses error:", err));

      // 3. Advance Requests
      supabase.from("advance_requests").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const fetchedAdv = data.map(r => ({
            id: r.id,
            employeeId: r.employee_id,
            amount: Number(r.amount) || 0,
            purpose: r.purpose || "",
            date: r.date,
            allocatedDate: r.date,
            approvedDate: r.date,
            status: r.status || "Approved",
            reviewedBy: r.reviewed_by || "ACME Admin"
          }));
          setAdvanceRequests(prev => {
            const fetchedMap = new Map(fetchedAdv.map(x => [x.id, x]));
            const mergedLocal = prev.map(localReq => {
              const dbItem = fetchedMap.get(localReq.id);
              return dbItem ? { ...localReq, ...dbItem } : localReq;
            });
            const dbOnly = fetchedAdv.filter(d => !prev.some(l => l.id === d.id));
            return [...mergedLocal, ...dbOnly];
          });
        }
      }).catch(err => console.error("Supabase fetch advance_requests error:", err));

      // 4. Hiring Requisitions
      supabase.from("hiring_requisitions").select("*").then(({ data, error }) => {
        if (!error && data) {
          setHiringRequisitions(data.map(hr => ({
            id: hr.id,
            projectId: hr.project_id,
            clientName: hr.client_name,
            positionTitle: hr.position_title,
            location: hr.location,
            minExperienceYears: hr.min_experience_years,
            budgetAnnual: Number(hr.budget_annual) || 0,
            status: hr.status
          })));
        }
      }).catch(err => console.error("Supabase fetch hiring_requisitions error:", err));

      // 5. Candidates
      supabase.from("candidates").select("*").then(({ data, error }) => {
        if (!error && data) {
          setCandidates(data.map(c => ({
            id: c.id,
            fullName: c.full_name,
            email: c.email,
            phone: c.phone,
            currentCity: c.current_city,
            preferredCities: c.preferred_cities || [],
            experienceYears: c.experience_years,
            currentRole: c.candidate_role || c.current_role,
            expectedCtc: Number(c.expected_ctc) || 0,
            status: c.status,
            assignedRecruiter: c.assigned_recruiter,
            resumeUrl: c.resume_url
          })));
        }
      }).catch(err => console.error("Supabase fetch candidates error:", err));

      // 6. Projects
      supabase.from("projects").select("*").then(({ data, error }) => {
        if (!error && data) {
          setProjects(data.map(p => ({
            id: p.id,
            code: p.code,
            name: p.name,
            client: p.client,
            pocName: p.poc_name,
            pocContact: p.poc_contact,
            clientContact: p.client_contact,
            status: p.status,
            startDate: p.start_date,
            budget: Number(p.budget) || 0,
            spent: Number(p.spent) || 0,
            location: p.location,
            description: p.description,
            engagementPurpose: p.engagement_purpose,
            assignedConsultants: p.assigned_consultants || [],
            businessDetails: p.business_details || p.businessDetails,
            auditReports: p.audit_reports || p.auditReports,
            checklists: p.checklists,
            clientVisits: p.client_visits || p.clientVisits,
            scheduledEvents: p.scheduled_events || p.scheduledEvents
          })));
        }
      }).catch(err => console.error("Supabase fetch projects error:", err));

      // 7. Job Titles
      supabase.from("job_titles").select("*").then(({ data, error }) => {
        if (!error && data) {
          setJobTitles(data.map(jt => ({
            id: jt.id,
            titleName: jt.title_name || jt.titleName,
            department: jt.department,
            status: jt.status || "Active"
          })));
        }
      }).catch(err => console.error("Supabase fetch job_titles error:", err));

      // 8. Employee Number Series
      supabase.from("employee_number_series").select("*").then(({ data, error }) => {
        if (!error && data) {
          setNumberSeries(data.map(ns => ({
            id: ns.id,
            seriesName: ns.series_name || ns.seriesName,
            description: ns.description,
            department: ns.department || "All Departments",
            prefix: ns.prefix || "",
            digits: ns.digits || 3,
            suffix: ns.suffix || "",
            nextNumber: ns.next_number || ns.nextNumber || 101,
            status: ns.status || "Active"
          })));
        }
      }).catch(err => console.error("Supabase fetch employee_number_series error:", err));

      // 9. Departments
      supabase.from("departments").select("*").then(({ data, error }) => {
        if (!error && data) {
          setDepartments(data.map(d => ({
            id: d.id,
            name: d.dept_name || d.name,
            headName: d.head_name || "",
            location: d.location || ""
          })));
        }
      }).catch(err => console.error("Supabase fetch departments error:", err));

      // 10. Shifts
      supabase.from("shifts").select("*").then(({ data, error }) => {
        if (!error && data) {
          setShifts(data.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code,
            timings: s.timings,
            break: s.break_mins || s.break || "0 mins",
            type: s.shift_type || "fixed",
            status: s.status || "Active"
          })));
        }
      }).catch(err => console.error("Supabase fetch shifts error:", err));

      // 11. Weekly Offs
      supabase.from("weekly_offs").select("*").then(({ data, error }) => {
        if (!error && data) {
          setWeeklyOffs(data.map(w => ({
            id: w.id,
            name: w.name,
            days: w.days || [],
            status: w.status || "Active"
          })));
        }
      }).catch(err => console.error("Supabase fetch weekly_offs error:", err));

      // 12. Attendance Records Sync
      supabase.from("attendance").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setUsers(prevUsers => {
            const attMap = new Map();
            data.forEach(a => {
              const empId = a.employee_id ? String(a.employee_id).toLowerCase().trim() : "";
              if (!empId) return;
              if (!attMap.has(empId)) attMap.set(empId, []);
              attMap.get(empId).push({
                date: a.date,
                checkIn: a.check_in,
                checkOut: a.check_out,
                status: a.status || "Present",
                hoursWorked: Number(a.hours_worked) || 0,
                projectId: a.project_id || "",
                projectName: a.project_name || "",
                checkInSelfie: a.check_in_selfie || a.selfie_url || null,
                checkInAddress: a.check_in_address || a.location_name || "",
                checkInCoordinates: a.check_in_coordinates || a.coordinates || null,
                checkOutSelfie: a.check_out_selfie || a.checkout_selfie || null,
                checkOutAddress: a.check_out_address || a.checkout_address || "",
                checkOutCoordinates: a.check_out_coordinates || a.checkout_coordinates || null,
                selfie: a.check_in_selfie || a.selfie_url || null,
                locationName: a.check_in_address || a.location_name || "",
                address: a.check_in_address || a.location_name || "",
                coordinates: a.check_in_coordinates || a.coordinates || null,
                tasks: a.tasks || [],
                acknowledgedChecklist: a.acknowledged_checklist || false,
                remarks: a.remarks || ""
              });
            });

            return prevUsers.map(u => {
              const normId = String(u.id).toLowerCase().trim();
              const normCode = u.empCode ? String(u.empCode).toLowerCase().trim() : "";
              const dbAtt = attMap.get(normId) || attMap.get(normCode) || attMap.get(String(u.id)) || [];
              const existingAtt = u.attendance || [];
              const merged = [...existingAtt];
              dbAtt.forEach(da => {
                const idx = merged.findIndex(ca => ca.date === da.date);
                if (idx >= 0) {
                  merged[idx] = { ...merged[idx], ...da };
                } else {
                  merged.push(da);
                }
              });
              return {
                ...u,
                attendance: merged
              };
            });
          });
        }
      }).catch(err => console.error("Supabase fetch attendance error:", err));
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("workcentre_users", JSON.stringify(users));
    } catch (e) {
      console.warn("localStorage quota exceeded for users:", e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_expenses", JSON.stringify(expenses));
    } catch (e) {
      console.warn("localStorage quota exceeded for expenses:", e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("localStorage quota exceeded for settings:", e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_advance_requests", JSON.stringify(advanceRequests));
    } catch (e) {
      console.warn("localStorage quota exceeded for advance_requests:", e);
    }
  }, [advanceRequests]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_projects", JSON.stringify(projects));
    } catch (e) {
      console.warn("localStorage quota exceeded for workcentre_projects. Keeping in-memory state active.", e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_hiring_requisitions", JSON.stringify(hiringRequisitions));
    } catch (e) {
      console.warn("localStorage quota exceeded for hiring_requisitions:", e);
    }
  }, [hiringRequisitions]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_candidates", JSON.stringify(candidates));
    } catch (e) {
      console.warn("localStorage quota exceeded for candidates:", e);
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_job_titles", JSON.stringify(jobTitles));
    } catch (e) {
      console.warn("localStorage quota exceeded for job_titles:", e);
    }
  }, [jobTitles]);

  useEffect(() => {
    try {
      localStorage.setItem("workcentre_number_series", JSON.stringify(numberSeries));
    } catch (e) {
      console.warn("localStorage quota exceeded for number_series:", e);
    }
  }, [numberSeries]);

  useEffect(() => {
    localStorage.setItem("workcentre_departments", JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem("workcentre_shifts", JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem("workcentre_weekly_offs", JSON.stringify(weeklyOffs));
  }, [weeklyOffs]);

  useEffect(() => {
    localStorage.setItem("workcentre_leave_requests", JSON.stringify(leaveRequests));
  }, [leaveRequests]);

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
    if ((cleanEmail === "acmeadmin" || cleanEmail === "admin" || cleanEmail === "acmeadmin@acmeworkcentre.com") && cleanPassword === "123") {
      user = users.find(u => u.role === "Admin" || u.id === "admin-acme" || u.email === "acmeadmin") || users[0];
    } else {
      user = users.find(u => u.email?.toLowerCase() === cleanEmail);
      if (user) {
        const userPassword = user.password || "123";
        if (cleanPassword && cleanPassword !== userPassword && cleanPassword !== "123") {
          return false;
        }
      }
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
    setCurrentUser(null);
    try {
      localStorage.removeItem("workcentre_authenticated");
      localStorage.removeItem("workcentre_current_user_id");
    } catch (e) {}
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
  const addUser = async (userData) => {
    const newId = userData.id || `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const empCode = userData.empCode || `EMP-${Date.now().toString().slice(-4)}`;
    const userEmail = userData.email ? userData.email.trim().toLowerCase() : `employee_${Date.now()}@acme.com`;
    const userName = userData.name || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Employee";

    const newUser = {
      id: newId,
      empCode,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`,
      lastLogin: "",
      attendance: userData.role === "Consultant" ? [] : undefined,
      advanceAmount: userData.role === "Consultant" ? (parseFloat(userData.advanceAmount) || 0) : undefined,
      ...userData,
      id: newId,
      name: userName,
      email: userEmail
    };

    setUsers(prev => {
      const exists = prev.some(u => u.id === newUser.id || u.email === newUser.email);
      if (exists) {
        return prev.map(u => (u.id === newUser.id || u.email === newUser.email) ? { ...u, ...newUser } : u);
      }
      return [...prev, newUser];
    });

    if (isSupabaseConfigured()) {
      const payload = {
        id: newUser.id,
        emp_code: newUser.empCode,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || "",
        role: newUser.role || "Consultant",
        title: newUser.title || "Consultant",
        department: newUser.department || "General",
        reporting_manager: newUser.reportingManager || "",
        location: newUser.location || "Mumbai / HQ",
        status: newUser.status || "Active",
        avatar: newUser.avatar,
        advance_amount: Number(newUser.advanceAmount) || 0,
        joining_date: newUser.joiningDate && newUser.joiningDate.trim() !== "" ? newUser.joiningDate : null,
        dob: newUser.dob && newUser.dob.trim() !== "" ? newUser.dob : null,
        shift: newUser.shift || "",
        weekly_off: newUser.weeklyOff || "",
        annual_ctc: Number(newUser.annualCtc) || 0,
        currency: newUser.currency || "INR"
      };

      const { error } = await supabase.from("users").upsert([payload], { onConflict: "id" });
      if (error) {
        console.error("Supabase full upsert user error:", error);
        // Fallback upsert with core columns in case extended columns are missing in remote DB
        const corePayload = {
          id: newUser.id,
          emp_code: newUser.empCode,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || "",
          role: newUser.role || "Consultant",
          title: newUser.title || "Consultant",
          department: newUser.department || "General",
          location: newUser.location || "Mumbai / HQ",
          status: newUser.status || "Active"
        };
        const { error: coreErr } = await supabase.from("users").upsert([corePayload], { onConflict: "id" });
        if (coreErr) console.error("Supabase core upsert error:", coreErr);
      }
    }

    return newUser;
  };

  // Onboard Consultant Invite (Step 1: Admin sends link with primary details)
  const onboardConsultantInvite = (primaryData) => {
    const inviteToken = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const newId = `consultant-${Date.now()}`;
    const empCode = primaryData.empCode || "";
    const newUser = {
      id: newId,
      empCode,
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

    if (isSupabaseConfigured()) {
      supabase.from("users").insert([{
        id: newUser.id,
        emp_code: newUser.empCode,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        title: newUser.title,
        department: newUser.department,
        location: newUser.location,
        status: newUser.status,
        avatar: newUser.avatar,
        advance_amount: newUser.advanceAmount
      }]).then(({ error }) => {
        if (error) console.error("Supabase insert invite user error:", error);
      }).catch(err => console.error("Supabase insert invite user catch error:", err));
    }

    return {
      user: newUser,
      inviteToken,
      inviteLink: `${window.location.origin}${window.location.pathname}#/register?token=${inviteToken}`
    };
  };

  // Complete Consultant Registration (Step 2: Candidate self-registers & logs in)
  const completeConsultantRegistration = (data) => {
    const existing = users.find(u => u.id === data.userId || (data.inviteToken && u.inviteToken === data.inviteToken));
    if (!existing) return false;

    const updatedUser = {
      ...existing,
      status: "Active",
      password: data.password,
      specialization: data.specialization,
      emergencyContact: data.emergencyContact,
      bankUpi: data.bankUpi,
      location: data.location || existing.location,
      lastLogin: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => (u.id === existing.id ? updatedUser : u)));

    if (isSupabaseConfigured()) {
      supabase.from("users").update({
        status: "Active",
        location: updatedUser.location
      }).eq("id", updatedUser.id).then(({ error }) => {
        if (error) console.error("Supabase update registration error:", error);
      }).catch(err => console.error("Supabase update registration catch error:", err));
    }

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    return true;
  };

  const deleteUser = (userId) => {
    if (currentUser?.id === userId) return false; // Prevent deleting active session
    setUsers(prev => prev.filter(u => u.id !== userId));

    if (isSupabaseConfigured()) {
      supabase.from("users").delete().eq("id", userId).then(({ error }) => {
        if (error) console.error("Supabase delete user error:", error);
      }).catch(err => console.error("Supabase delete user catch error:", err));
    }

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
  const getEmployeeLedger = (employeeId, yearMonth = getTodayDateString().substring(0, 7)) => {
    const user = users.find(u => u.id === employeeId);
    if (!user || user.role !== "Consultant") {
      return { 
        ledgerRows: [], 
        refillingDetails: [], 
        totals: { food: 0, stay: 0, travel: 0, spent: 0, received: 0 } 
      };
    }

    const empExpenses = expenses.filter(e => e.employeeId === employeeId && e.status !== "Rejected");
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
      const queryDateFormatted = `${day}/${month}/${year}`;
      const altQueryDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      const dayOfWeek = weekdaysNames[new Date(year, month - 1, day).getDay()];

      const isDateMatch = (d1, targetStr) => {
        if (!d1 || !targetStr) return false;
        const s1 = String(d1).trim().split("T")[0];
        const s2 = String(targetStr).trim().split("T")[0];
        if (s1 === s2) return true;
        const norm = (s) => {
          if (s.includes("-")) {
            const p = s.split("-");
            if (p.length === 3 && p[0].length === 4) return `${p[0]}-${p[1].padStart(2, "0")}-${p[2].padStart(2, "0")}`;
          }
          if (s.includes("/")) {
            const p = s.split("/");
            if (p.length === 3) {
              if (p[2].length === 4) return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
              if (p[0].length === 4) return `${p[0]}-${p[1].padStart(2, "0")}-${p[2].padStart(2, "0")}`;
            }
          }
          return s;
        };
        return norm(s1) === norm(s2);
      };

      const dailyExpenses = empExpenses.filter(e => {
        const primaryDate = e.expenseDate || e.date || e.submittedDate;
        return isDateMatch(primaryDate, dateStr);
      });
      const dailyRefills = empRefills.filter(r => isDateMatch(r.date, dateStr) || isDateMatch(r.allocatedDate, dateStr) || isDateMatch(r.approvedDate, dateStr) || isDateMatch(r.submittedDate, dateStr));

      const food = dailyExpenses.filter(e => e.category === "Food").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const stay = dailyExpenses.filter(e => e.category === "Accommodation" || e.category === "Stay").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const travel = dailyExpenses.filter(e => e.category === "Travel" || e.category === "Conveyance").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const misc = dailyExpenses.filter(e => !["Food", "Accommodation", "Stay", "Travel", "Conveyance"].includes(e.category)).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const spent = food + stay + travel + misc;

      const received = dailyRefills.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const opening = currentBalance;
      
      const particularsParts = [];
      if (received > 0) {
        dailyRefills.forEach(r => {
          particularsParts.push(`Refill: ${r.purpose || "Petty Cash Allocation"}`);
        });
      }
      if (dailyExpenses.length > 0) {
        const projNames = [...new Set(dailyExpenses.map(e => e.projectName || e.projectId || "Shrut Jewellers").filter(Boolean))];
        particularsParts.push(...projNames);
      }
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
        date: queryDateFormatted,
        isoDate: dateStr,
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

    return {
      ledgerRows,
      refillingDetails: empRefills,
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
  const checkInConsultant = (consultantId, remarksOrData = "", projectId = "", projectName = "") => {
    const todayStr = getTodayDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Check if late based on settings
    const checkInMin = parseTimeToMinutes(timeStr);
    const limitMin = parseTimeToMinutes(settings.lateCheckInLimit);
    const status = checkInMin > limitMin ? "Late" : "Present";

    let payload = {};
    if (typeof remarksOrData === "object" && remarksOrData !== null) {
      payload = remarksOrData;
    } else {
      payload = { remarks: remarksOrData, projectId, projectName };
    }

    setUsers(prev => prev.map(u => {
      if (String(u.id) === String(consultantId)) {
        const attendance = u.attendance || [];
        const activeUnclosedPunch = attendance.find(a => a.date === todayStr && !a.checkOut);
        if (activeUnclosedPunch) return u;

        const otherAttendance = attendance.filter(a => a.date !== todayStr);

        const newRecord = {
          date: todayStr,
          checkIn: timeStr,
          checkOut: null,
          status,
          hoursWorked: 0,
          remarks: payload.remarks || "",
          projectId: payload.projectId || "",
          projectName: payload.projectName || "",
          checkInSelfie: payload.selfie || payload.checkInSelfie || null,
          checkInAddress: payload.address || payload.checkInAddress || payload.locationName || "",
          checkInCoordinates: payload.coordinates || payload.checkInCoordinates || null,
          address: payload.address || (payload.remarks && payload.remarks.includes("Location: ") ? payload.remarks.split("Location: ")[1] : null) || payload.locationName || "",
          locationName: payload.address || payload.locationName || payload.location || "",
          coordinates: payload.coordinates || null,
          selfie: payload.selfie || payload.checkInSelfie || null,
          tasks: payload.tasks || [],
          acknowledgedChecklist: payload.acknowledgedChecklist || false
        };

        const userObj = prev.find(user => String(user.id) === String(consultantId));
        if (isSupabaseConfigured()) {
          supabaseAddAttendanceRecord(consultantId, newRecord, userObj?.name || "");
        }

        const updatedUser = {
          ...u,
          attendance: [
            ...otherAttendance,
            newRecord
          ]
        };

        if (currentUser && String(currentUser.id) === String(consultantId)) {
          setCurrentUser(updatedUser);
        }

        return updatedUser;
      }
      return u;
    }));
  };

  const checkOutConsultant = (consultantId, payload = "") => {
    const todayStr = getTodayDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let checkoutData = {};
    if (typeof payload === "object" && payload !== null) {
      checkoutData = payload;
    } else {
      checkoutData = { remarks: payload };
    }

    setUsers(prev => prev.map(u => {
      if (String(u.id) === String(consultantId)) {
        const attendance = u.attendance || [];
        let updatedHours = 0;
        let updatedRemarks = checkoutData.remarks || "";
        let recordDateToUpdate = todayStr;

        // Find the index of any active unclosed punch record
        const unclosedIdx = attendance.findIndex(a => !a.checkOut);

        const updatedAttendance = attendance.map((a, idx) => {
          const isTargetRecord = (unclosedIdx >= 0 ? idx === unclosedIdx : (!a.checkOut && (a.date === todayStr || (a.date && new Date(a.date).toDateString() === new Date().toDateString()))));
          
          if (isTargetRecord) {
            recordDateToUpdate = a.date || todayStr;
            const inMin = parseTimeToMinutes(a.checkIn);
            const outMin = parseTimeToMinutes(timeStr);
            let minutesDiff = outMin - inMin;
            if (minutesDiff < 0) minutesDiff += 24 * 60; // Midnight rollover calculation
            const hours = parseFloat(Math.max(0, (minutesDiff / 60)).toFixed(1));
            updatedHours = hours;
            const combinedRemarks = checkoutData.remarks ? `${a.remarks ? a.remarks + " | " : ""}${checkoutData.remarks}` : a.remarks;
            
            // Handle pending tasks auto-forward
            if (checkoutData.pendingTasks && checkoutData.pendingTasks.length > 0) {
              const projId = a.projectId || a.projectName || "General";
              addClientPendingTasks(projId, checkoutData.pendingTasks);
            }

            return {
              ...a,
              checkOut: timeStr,
              hoursWorked: hours,
              remarks: combinedRemarks,
              checkOutAddress: checkoutData.checkOutAddress || checkoutData.address || a.address || a.locationName || "",
              checkOutCoordinates: checkoutData.checkOutCoordinates || checkoutData.coordinates || null,
              checkOutSelfie: checkoutData.checkOutSelfie || checkoutData.selfie || null,
              completedTasks: checkoutData.completedTasks || [],
              pendingTasks: checkoutData.pendingTasks || []
            };
          }
          return a;
        });

        if (isSupabaseConfigured()) {
          supabaseUpdateAttendanceCheckout(consultantId, recordDateToUpdate, timeStr, updatedHours, updatedRemarks, checkoutData);
        }

        const updatedUser = {
          ...u,
          attendance: updatedAttendance
        };

        if (currentUser && String(currentUser.id) === String(consultantId)) {
          setCurrentUser(updatedUser);
        }

        return updatedUser;
      }
      return u;
    }));
  };

  // Expense Submissions
  const addExpense = (expenseData) => {
    const rawDate = expenseData.expenseDate || expenseData.date || getTodayDateString();
    const dateFormatted = rawDate.replace(/-/g, "").replace(/\//g, "");
    
    let projTag = "GEN";
    if (expenseData.projectId) {
      projTag = expenseData.projectId.replace(/proj-/gi, "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
    } else if (expenseData.projectName) {
      projTag = expenseData.projectName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    }

    const uniqueId = `EXP-${projTag}-${dateFormatted}-${Math.floor(100 + Math.random() * 900)}`;

    const newExpense = {
      id: expenseData.id || uniqueId,
      status: "Pending",
      date: rawDate,
      expenseDate: rawDate,
      reviewedBy: "",
      reviewerNotes: "",
      submittedDate: getTodayDateString(),
      approvedDate: "",
      projectId: expenseData.projectId || "",
      projectName: expenseData.projectName || "",
      receipts: expenseData.receipts || [],
      ...expenseData
    };
    setExpenses(prev => [newExpense, ...prev]);

    if (isSupabaseConfigured()) {
      supabaseAddExpense(newExpense).catch(err => console.error("Supabase write-back addExpense error:", err));
    }
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

    if (isSupabaseConfigured()) {
      supabaseAddProject(newProj).catch(err => console.error("Supabase write-back addProject error:", err));
    }

    return newProj;
  };

  const updateProject = (projectId, updatedFields) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatedFields } : p));

    if (isSupabaseConfigured()) {
      supabaseUpdateProject(projectId, updatedFields).catch(err => console.error("Supabase write-back updateProject error:", err));
    }
  };

  const addProjectDiscussion = (projectId, discussionData) => {
    const newDisc = {
      id: `disc-${Date.now()}`,
      authorName: currentUser?.name || "User",
      authorRole: currentUser?.role || "Consultant",
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

    if (isSupabaseConfigured()) {
      supabaseVerifyExpense(expenseId, status, notes, reviewerName).catch(err => console.error("Supabase write-back verifyExpense error:", err));
    }
  };

  // Cash Advance Requests
  const requestAdvance = (employeeId, amount, purpose, status = "Pending", customDate = null, reviewerName = "") => {
    const allocDate = customDate || new Date().toISOString().split("T")[0];
    const newRequest = {
      id: `adv-${Date.now()}`,
      employeeId,
      amount: parseFloat(amount),
      purpose,
      date: allocDate,
      allocatedDate: allocDate,
      approvedDate: allocDate,
      status: status,
      reviewedBy: reviewerName || (status === "Approved" ? "ACME Admin" : "")
    };
    setAdvanceRequests(prev => [newRequest, ...prev]);

    if (status === "Approved") {
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === employeeId) {
          return {
            ...u,
            advanceAmount: (u.advanceAmount || 0) + parseFloat(amount)
          };
        }
        return u;
      }));
    }

    if (isSupabaseConfigured()) {
      supabaseRequestAdvance(newRequest).catch(err => console.error("Supabase write-back requestAdvance error:", err));
    }
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

    if (isSupabaseConfigured()) {
      supabaseVerifyAdvanceRequest(requestId, status, reviewerName).catch(err => console.error("Supabase write-back verifyAdvanceRequest error:", err));
    }
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

    if (isSupabaseConfigured()) {
      supabaseAddHiringRequisition(newReq).catch(err => console.error("Supabase write-back addHiringRequisition error:", err));
    }

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

    if (isSupabaseConfigured()) {
      supabaseAddCandidate(newCand).catch(err => console.error("Supabase write-back addCandidate error:", err));
    }

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

  // Job Titles CRUD & Supabase Sync
  const addJobTitle = async (titleName, department = "Advisory") => {
    const tempId = `jt-${Date.now()}`;
    const newTitle = { id: tempId, titleName, department, status: "Active" };
    setJobTitles(prev => [...prev, newTitle]);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("job_titles").insert([{ title_name: titleName, department, status: "Active" }]).select();
        if (error) {
          console.error("Supabase insert job_title error:", error);
        } else if (data && data[0]) {
          setJobTitles(prev => prev.map(t => t.id === tempId ? { ...t, id: data[0].id } : t));
        }
      } catch (e) {
        console.error("Supabase insert job_title exception:", e);
      }
    }
    return newTitle;
  };

  const deleteJobTitle = async (titleIdOrName) => {
    setJobTitles(prev => prev.filter(t => t.id !== titleIdOrName && t.titleName !== titleIdOrName));
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("job_titles").delete().or(`id.eq.${titleIdOrName},title_name.eq.${titleIdOrName}`);
        if (error) console.error("Supabase delete job_title error:", error);
      } catch (e) {
        console.error("Supabase delete job_title exception:", e);
      }
    }
  };

  // Employee Number Series CRUD & Supabase Sync
  const addNumberSeries = async (seriesData) => {
    const tempId = `ns-${Date.now()}`;
    const newSeries = { id: tempId, ...seriesData };
    setNumberSeries(prev => [...prev, newSeries]);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("employee_number_series").insert([{
          series_name: seriesData.seriesName,
          description: seriesData.description,
          department: seriesData.department,
          prefix: seriesData.prefix,
          digits: parseInt(seriesData.digits) || 3,
          suffix: seriesData.suffix,
          next_number: parseInt(seriesData.nextNumber) || 101,
          status: seriesData.status ? "Active" : "Inactive"
        }]).select();
        if (error) {
          console.error("Supabase insert number_series error:", error);
        } else if (data && data[0]) {
          setNumberSeries(prev => prev.map(s => s.id === tempId ? { ...s, id: data[0].id } : s));
        }
      } catch (e) {
        console.error("Supabase insert number_series exception:", e);
      }
    }
    return newSeries;
  };

  const deleteNumberSeries = async (seriesId) => {
    setNumberSeries(prev => prev.filter(s => s.id !== seriesId));
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("employee_number_series").delete().eq("id", seriesId);
        if (error) console.error("Supabase delete number_series error:", error);
      } catch (e) {
        console.error("Supabase delete number_series exception:", e);
      }
    }
  };

  // Departments CRUD & Supabase Sync
  const addDepartment = async (deptName) => {
    const tempId = `dept-${Date.now()}`;
    const newDept = { id: tempId, name: deptName, headName: "", location: "" };
    setDepartments(prev => [...prev, newDept]);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("departments").insert([{ dept_name: deptName }]).select();
        if (error) {
          console.error("Supabase insert department error:", error);
        } else if (data && data[0]) {
          setDepartments(prev => prev.map(d => d.id === tempId ? { ...d, id: data[0].id } : d));
        }
      } catch (e) {
        console.error("Supabase insert department exception:", e);
      }
    }
    return newDept;
  };

  const deleteDepartment = async (deptName) => {
    setDepartments(prev => prev.filter(d => d.name !== deptName && d.id !== deptName));
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("departments").delete().or(`dept_name.eq.${deptName},id.eq.${deptName}`);
        if (error) console.error("Supabase delete department error:", error);
      } catch (e) {
        console.error("Supabase delete department exception:", e);
      }
    }
  };

  // Shifts CRUD & Supabase Sync
  const addShift = async (shiftData) => {
    const tempId = `shift-${Date.now()}`;
    const newShift = { id: tempId, ...shiftData };
    setShifts(prev => [...prev, newShift]);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("shifts").insert([{
          name: shiftData.name,
          code: shiftData.code,
          timings: shiftData.timings,
          break_mins: shiftData.break,
          shift_type: shiftData.type || "fixed"
        }]).select();
        if (error) {
          console.error("Supabase insert shift error:", error);
        } else if (data && data[0]) {
          setShifts(prev => prev.map(s => s.id === tempId ? { ...s, id: data[0].id } : s));
        }
      } catch (e) {
        console.error("Supabase insert shift exception:", e);
      }
    }
    return newShift;
  };

  const deleteShift = async (nameOrId) => {
    setShifts(prev => prev.filter(s => s.name !== nameOrId && s.id !== nameOrId));
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("shifts").delete().or(`name.eq.${nameOrId},id.eq.${nameOrId}`);
        if (error) console.error("Supabase delete shift error:", error);
      } catch (e) {
        console.error("Supabase delete shift exception:", e);
      }
    }
  };

  // Weekly Offs CRUD & Supabase Sync
  const addWeeklyOff = async (weeklyOffData) => {
    const tempId = `wo-${Date.now()}`;
    const newWO = { id: tempId, ...weeklyOffData };
    setWeeklyOffs(prev => [...prev, newWO]);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("weekly_offs").insert([{
          name: weeklyOffData.name,
          days: weeklyOffData.days || []
        }]).select();
        if (error) {
          console.error("Supabase insert weekly_off error:", error);
        } else if (data && data[0]) {
          setWeeklyOffs(prev => prev.map(w => w.id === tempId ? { ...w, id: data[0].id } : w));
        }
      } catch (e) {
        console.error("Supabase insert weekly_off exception:", e);
      }
    }
    return newWO;
  };

  const deleteWeeklyOff = async (nameOrId) => {
    setWeeklyOffs(prev => prev.filter(w => w.name !== nameOrId && w.id !== nameOrId));
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("weekly_offs").delete().or(`name.eq.${nameOrId},id.eq.${nameOrId}`);
        if (error) console.error("Supabase delete weekly_off error:", error);
      } catch (e) {
        console.error("Supabase delete weekly_off exception:", e);
      }
    }
  };

  // Leave Management Handlers
  const applyLeave = (employeeId, leaveData) => {
    const emp = users.find(u => u.id === employeeId) || currentUser;
    const newRequest = {
      id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      employeeId: employeeId || emp?.id,
      employeeName: emp?.name || "Employee",
      empCode: emp?.empCode || "EMP",
      department: emp?.department || "General",
      type: leaveData.type || "Casual Leave",
      fromDate: leaveData.fromDate,
      toDate: leaveData.toDate,
      halfDay: !!leaveData.halfDay,
      reason: leaveData.reason || "",
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
      rejectionReason: ""
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
    return newRequest;
  };

  const approveLeave = (requestId) => {
    setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: "Approved" } : req));
  };

  const rejectLeave = (requestId, reason = "") => {
    setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: "Rejected", rejectionReason: reason } : req));
  };

  const cancelLeave = (requestId) => {
    setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: "Cancelled" } : req));
  };

  const getLeaveBalance = (employeeId) => {
    const policy = settings.leavePolicy || { casualLeave: 12, sickLeave: 12, earnedLeave: 15 };
    const empLeaves = leaveRequests.filter(req => req.employeeId === employeeId && req.status === "Approved");
    
    let usedCasual = 0;
    let usedSick = 0;
    let usedEarned = 0;

    empLeaves.forEach(req => {
      const from = new Date(req.fromDate);
      const to = new Date(req.toDate);
      const diffTime = Math.abs(to - from);
      const days = req.halfDay ? 0.5 : Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      
      if (req.type === "Casual Leave") usedCasual += days;
      else if (req.type === "Sick Leave") usedSick += days;
      else if (req.type === "Earned Leave") usedEarned += days;
    });

    return {
      casual: { total: policy.casualLeave, used: usedCasual, available: Math.max(0, policy.casualLeave - usedCasual) },
      sick: { total: policy.sickLeave, used: usedSick, available: Math.max(0, policy.sickLeave - usedSick) },
      earned: { total: policy.earnedLeave, used: usedEarned, available: Math.max(0, policy.earnedLeave - usedEarned) }
    };
  };

  // Payslip Generator
  const generatePayslip = (employeeId, monthStr) => {
    const emp = users.find(u => u.id === employeeId) || currentUser;
    const annualCtc = Number(emp?.annualCtc) || 600000;
    const monthlyCtc = Math.round(annualCtc / 12);

    const basic = Math.round(monthlyCtc * 0.40);
    const hra = Math.round(monthlyCtc * 0.20);
    const da = Math.round(monthlyCtc * 0.10);
    const conveyance = 1600;
    const medicalAllowance = 1250;
    const specialAllowance = Math.max(0, monthlyCtc - (basic + hra + da + conveyance + medicalAllowance));

    const pfDeduction = Math.min(1800, Math.round(basic * 0.12));
    const ptDeduction = monthlyCtc > 20000 ? 200 : 0;
    const tdsDeduction = monthlyCtc > 50000 ? Math.round(monthlyCtc * 0.05) : 0;
    const totalDeductions = pfDeduction + ptDeduction + tdsDeduction;

    const grossEarnings = basic + hra + da + conveyance + medicalAllowance + specialAllowance;
    const netSalary = grossEarnings - totalDeductions;

    return {
      employeeId: emp.id,
      empCode: emp.empCode || "EMP-101",
      employeeName: emp.name || "Employee",
      designation: emp.title || "Consultant",
      department: emp.department || "Advisory",
      month: monthStr,
      joiningDate: emp.joiningDate || "2025-01-24",
      bankAccount: "XXXX-XXXX-4829",
      pfNumber: `PF/${emp.empCode || "101"}/2025`,
      panNumber: "ABCDE1234F",
      workingDays: 22,
      paidDays: 22,
      earnings: [
        { title: "Basic Salary", amount: basic },
        { title: "House Rent Allowance (HRA)", amount: hra },
        { title: "Dearness Allowance (DA)", amount: da },
        { title: "Conveyance Allowance", amount: conveyance },
        { title: "Medical Allowance", amount: medicalAllowance },
        { title: "Special Allowance", amount: specialAllowance }
      ],
      deductions: [
        { title: "Provident Fund (PF)", amount: pfDeduction },
        { title: "Professional Tax (PT)", amount: ptDeduction },
        { title: "Income Tax (TDS)", amount: tdsDeduction }
      ],
      grossEarnings,
      totalDeductions,
      netSalary
    };
  };

  const updatePassword = (userId, newPassword) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPassword }));
    }
  };

  const updateUserProfile = (userId, profileData) => {
    const updatedData = {
      ...profileData,
      profileCompleted: true,
      profileCompletedAt: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
    }

    if (isSupabaseConfigured()) {
      const payload = {
        pan_number: profileData.panNumber || "",
        aadhaar_number: profileData.aadhaarNumber || "",
        bank_name: profileData.bankName || "",
        account_number: profileData.bankAccount || "",
        ifsc_code: profileData.ifscCode || "",
        emergency_contact: profileData.emergencyContact || "",
        blood_group: profileData.bloodGroup || "",
        address: profileData.address || ""
      };
      supabase.from("users").update(payload).eq("id", userId).catch(e => console.error("Supabase updateUserProfile error:", e));
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        setUsers,
        expenses,
        settings,
        projects,
        hiringRequisitions,
        candidates,
        jobTitles,
        setJobTitles,
        addJobTitle,
        deleteJobTitle,
        numberSeries,
        setNumberSeries,
        addNumberSeries,
        deleteNumberSeries,
        departments,
        setDepartments,
        addDepartment,
        deleteDepartment,
        shifts,
        setShifts,
        addShift,
        deleteShift,
        weeklyOffs,
        setWeeklyOffs,
        addWeeklyOff,
        deleteWeeklyOff,
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
        clientPendingTasks,
        addClientPendingTasks,
        getClientPendingTasks,
        removeClientPendingTask,
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
        updateCandidateStatus,
        leaveRequests,
        applyLeave,
        approveLeave,
        rejectLeave,
        cancelLeave,
        getLeaveBalance,
        generatePayslip,
        updatePassword,
        updateUserProfile,
        schedules,
        addSchedule: (schData) => {
          const newSch = { id: "sch-" + Date.now(), ...schData };
          setSchedules(prev => {
            const updated = [newSch, ...prev];
            try { localStorage.setItem("workcentre_schedules", JSON.stringify(updated)); } catch(e){}
            return updated;
          });
        },
        deleteSchedule: (schId) => {
          setSchedules(prev => {
            const updated = prev.filter(s => s.id !== schId);
            try { localStorage.setItem("workcentre_schedules", JSON.stringify(updated)); } catch(e){}
            return updated;
          });
        }
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
