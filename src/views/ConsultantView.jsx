import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import ProjectsView from "./ProjectsView";

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
    settings 
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [ledgerViewMode, setLedgerViewMode] = useState("grid"); // 'grid' or 'calendar'
  const [profileTab, setProfileTab] = useState("TIME");
  const [timeSubTab, setTimeSubTab] = useState("Attendance");
  const [statsRange, setStatsRange] = useState("Last Week");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClockTime = (dateObj) => {
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatClockDate = (dateObj) => {
    return dateObj.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const myAttendance = currentUser.attendance || [];
  const todayPunch = myAttendance.find(a => a.date === todayStr);

  // Handlers
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

  // Generate July 2026 Calendar days
  const generateJulyCalendar = () => {
    const calendarDays = [];
    // July 2026 starts on Wednesday, so Mon & Tue are empty paddings
    calendarDays.push({ day: null, status: "empty" });
    calendarDays.push({ day: null, status: "empty" });

    for (let d = 1; d <= 31; d++) {
      const dateStr = `2026-07-${d < 10 ? "0" + d : d}`;
      const isWeekOff = [6, 0].includes(new Date(2026, 6, d).getDay());
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
      } else if (d < 19) {
        status = "absent"; // Past weekdays without check-in are LOP absences
      }

      calendarDays.push({ day: d, dateStr, status });
    }
    return calendarDays;
  };

  const calendarDays = generateJulyCalendar();

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
            <span style={{ color: "#64748b" }}>✉</span> <span>{currentUser.email || "mrmarvelmani1999@gmail.com"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>📞</span> <span>+91-7569099549</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>📍</span> <span>Mehdipatnam</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#64748b" }}>🪪</span> <span>HBJ00007</span>
          </div>
        </div>

        {/* Joining / Department / Reporting Manager Strip */}
        <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "48px", fontSize: "0.82rem" }}>
          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>JOINING DATE</span>
            <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>24 Jan 2025</span>
          </div>

          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>DEPARTMENT</span>
            <span style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px", display: "block" }}>{currentUser.department?.toUpperCase() || "IT & SYSTEMS SUPPORT"}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block" }}>REPORTING MANAGER</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" alt="Manager" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
              <span style={{ fontWeight: "600", color: "#2563eb" }}>Shikhar Jain</span>
            </div>
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
                    onClick={handlePunchIn}
                    style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "4px", padding: "8px 14px", fontWeight: "600", fontSize: "0.82rem", cursor: "pointer", width: "100%" }}
                  >
                    ✔ Check In Shift
                  </button>
                ) : !todayPunch.checkOut ? (
                  <button 
                    type="button" 
                    onClick={handlePunchOut}
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
    </div>
  );
}
