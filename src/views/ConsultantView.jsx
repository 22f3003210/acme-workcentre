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

  // Modal profile state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [ledgerViewMode, setLedgerViewMode] = useState("grid"); // 'grid' or 'calendar'

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
      {/* Top Welcome Title Card */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <span className="uppercase-tracking" style={{ color: "var(--text-secondary)" }}>Employee Workspace Portal</span>
          <h1 style={{ fontSize: "1.8rem", color: "var(--text-primary)" }}>{currentUser.name}</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>{currentUser.title} • <strong>{currentUser.department} Department</strong></p>
        </div>
        <button 
          onClick={() => setShowProfileModal(true)} 
          className="luxury-button"
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-sidebar)", color: "#fff", border: "1px solid var(--bg-sidebar)" }}
        >
          👤 View Profile & Sourcing Balance
        </button>
      </div>

      {activeTab === "punch" && (
        <div className="client-grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr", gap: "24px" }}>
          
          {/* Daily Attendance Card */}
          <div className="glass-card text-center" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Daily Attendance</h3>
              <p className="uppercase-tracking" style={{ fontSize: "0.65rem", display: "block", marginBottom: "16px" }}>Clock in daily shift</p>
              
              <div className="digital-clock-container" style={{ margin: "20px 0" }}>
                <div className="digital-time" style={{ fontSize: "2.4rem", fontWeight: "700", color: "var(--text-primary)" }}>{formatClockTime(time)}</div>
                <div className="digital-date" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>{formatClockDate(time)}</div>
              </div>
            </div>

            <div className="punch-controls">
              <div className="form-group" style={{ marginBottom: "10px", textAlign: "left" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Client Project / Site</label>
                <select
                  value={punchProjectId}
                  onChange={(e) => setPunchProjectId(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.82rem" }}
                >
                  <option value="">General / HQ Operations</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "16px", textAlign: "left" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Shift Remarks (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Remote work, Client site visit..." 
                  value={punchRemarks}
                  onChange={(e) => setPunchRemarks(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border-color)", borderRadius: "6px" }}
                />
              </div>

              {!todayPunch ? (
                <div className="punch-action-area">
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "12px" }}>Official hours start: <strong>9:00 AM</strong>. Grace limit: <strong>{settings.lateCheckInLimit}</strong>.</p>
                  <button 
                    onClick={handlePunchIn}
                    className="luxury-button checkin"
                    style={{ width: "100%", background: "var(--color-success)", color: "#fff" }}
                  >
                    ✔ Check In
                  </button>
                </div>
              ) : !todayPunch.checkOut ? (
                <div className="punch-action-area">
                  <div className="punch-status-badge active-shift" style={{ display: "inline-flex", gap: "8px", alignItems: "center", padding: "6px 12px", background: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600", marginBottom: "12px" }}>
                    <span className="pulse-indicator"></span>
                    <span>Checked In: {todayPunch.checkIn}</span>
                  </div>
                  <button 
                    onClick={handlePunchOut}
                    className="luxury-button checkout-btn"
                    style={{ width: "100%", background: "var(--color-error)", color: "#fff" }}
                  >
                    ⏹ Check Out
                  </button>
                </div>
              ) : (
                <div className="punch-action-area">
                  <div className="punch-status-badge shift-completed" style={{ display: "inline-flex", padding: "6px 12px", background: "var(--color-info-bg)", color: "var(--color-info)", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600", marginBottom: "12px" }}>
                    <span>✓ Completed Today</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Logged: <strong>{todayPunch.checkIn} - {todayPunch.checkOut}</strong> ({todayPunch.hoursWorked} hrs)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Attendance Progress */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Working Days</h3>
              <p className="uppercase-tracking" style={{ fontSize: "0.65rem", display: "block", marginBottom: "16px" }}>Monthly compliance progress</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: "700", color: "var(--text-primary)" }}>{presentDays}</span>
                  <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>/ {targetWorkingDays} Completed</span>
                </div>
                
                {/* Emerald Progress Bar */}
                <div className="progress-bar-container" style={{ height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                  <div className="progress-bar" style={{ width: `${attendancePercentage}%`, height: "100%", backgroundColor: "var(--color-success)" }}></div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Present Days:</span>
                <strong>{presentDays} days</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Weekly Offs:</span>
                <strong>{totalWeeklyOffs} days</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Absent Days (LOP):</span>
                <strong style={{ color: absentDays > 0 ? "var(--color-error)" : "inherit" }}>{absentDays} days</strong>
              </div>
            </div>
          </div>

          {/* Current Month Calendar Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>July 2026 Calendar</h3>
            <p className="uppercase-tracking" style={{ fontSize: "0.65rem", display: "block", marginBottom: "12px" }}>Attendance Register Matrix</p>
            
            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginTop: "12px" }}>
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                <span key={d} style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", textAlign: "center", paddingBottom: "4px" }}>{d}</span>
              ))}
              {calendarDays.map((c, idx) => {
                if (c.status === "empty") {
                  return <div key={`empty-${idx}`} style={{ aspectRatio: "1" }}></div>;
                }
                
                let cellBg = "var(--bg-primary)";
                let cellColor = "var(--text-primary)";
                let borderStyle = "1px solid transparent";

                if (c.status === "present") {
                  cellBg = "var(--color-success-bg)";
                  cellColor = "var(--color-success)";
                  borderStyle = "1px solid rgba(16, 185, 129, 0.15)";
                } else if (c.status === "absent") {
                  cellBg = "var(--color-error-bg)";
                  cellColor = "var(--color-error)";
                  borderStyle = "1px solid rgba(239, 68, 68, 0.15)";
                } else if (c.status === "weekoff") {
                  cellBg = "var(--bg-tertiary)";
                  cellColor = "var(--text-secondary)";
                }

                return (
                  <div 
                    key={c.day} 
                    style={{ 
                      aspectRatio: "1", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: "0.78rem", 
                      fontWeight: "600", 
                      borderRadius: "4px", 
                      background: cellBg,
                      color: cellColor,
                      border: borderStyle
                    }}
                    title={c.status.toUpperCase()}
                  >
                    {c.day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>🟢 Present</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>⚪ Week Off</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>🔴 Absent (LOP)</span>
            </div>
          </div>

          {/* Attendance logs ledger */}
          <div className="glass-card span-3">
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
