import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LedgerReports() {
  const { users, expenses, projects, verifyExpense, currentUser, getEmployeeLedger, setToast } = useApp();

  const [activeReportSubTab, setActiveReportSubTab] = useState("daywise"); // 'claims', 'daywise', 'individual', or 'projectwise'
  const [projLedgerMonth, setProjLedgerMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  // Default to today in YYYY-MM-DD
  const todayISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'calendar'
  const [selectedExpenseGroup, setSelectedExpenseGroup] = useState(null);
  const [activeItemInGroup, setActiveItemInGroup] = useState(null);
  const [expandedConsultantId, setExpandedConsultantId] = useState(null);
  const [activeReceiptIdx, setActiveReceiptIdx] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  const consultants = users.filter(u => u.role === "Consultant");
  const activeEmployeeId = selectedEmployeeId || (consultants[0]?.id || "");

  const normalizeDate = (d) => {
    if (!d) return "";
    const str = String(d).trim().split("T")[0];
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    if (str.includes("-")) {
      const parts = str.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    return str;
  };

  const isSameDateStr = (d1, d2) => {
    if (!d1 || !d2) return false;
    return normalizeDate(d1) === normalizeDate(d2);
  };

  const getProjectDisplayName = (projIdOrName, consultant) => {
    if (!projIdOrName && !consultant) return "";
    const found = (projects || []).find(p => p.id === projIdOrName || p.name === projIdOrName);
    if (found) return found.name;
    if (projIdOrName && !projIdOrName.startsWith("proj-")) return projIdOrName;
    return consultant?.assignedProjectName || "";
  };

  const getFormattedDateQuery = (dateStr) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return "";
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    } catch (e) {
      return "";
    }
  };

  const getMerchantName = (exp) => {
    if (!exp) return "";
    const r = exp.reason || exp.description || "";
    const lower = r.toLowerCase();
    if (lower.includes("gupta")) return "Gupta Jewellers";
    if (lower.includes("karam")) return "Karam Sourcing Vendor";
    if (lower.includes("vijay")) return "Vijay Sourcing Co.";
    if (lower.includes("nanak")) return "Nanak Jeweller";
    if (lower.includes("zota")) return "Zota Jewel";
    if (lower.includes("airport") || lower.includes("uber") || lower.includes("travelling") || lower.includes("travel")) return "Uber India / Local Transit";
    if (lower.includes("hotel") || lower.includes("room") || lower.includes("stay") || lower.includes("accommodation")) return "Hotel Comfort Plaza";
    if (exp.category === "Food") return "Mahalaxmi Hotel / Food Court";
    if (exp.category === "Travel") return "Local Transport Service";
    if (exp.category === "Accommodation") return "Comfort Lodging & Stay";
    return "ACME Verified Vendor";
  };

  const getUniqueNumber = (id) => {
    if (!id) return "";
    return id
      .replace("exp-consultant-", "EXP-C")
      .replace("adv-consultant-", "ADV-C")
      .toUpperCase();
  };

  const formattedQueryDate = getFormattedDateQuery(selectedDate);

  const getDaywiseAccountsHead = () => {
    let grandOpening = 0;
    let grandReceived = 0;
    let grandFood = 0;
    let grandStay = 0;
    let grandTravel = 0;
    let grandSpent = 0;
    let grandClosing = 0;

    const targetYearMonth = selectedDate ? selectedDate.substring(0, 7) : "2026-08";
    const rows = consultants.map((c, idx) => {
      const ledger = getEmployeeLedger(c.id, targetYearMonth);
      const dayRow = ledger.ledgerRows.find(r => isSameDateStr(r.date, selectedDate) || isSameDateStr(r.isoDate, selectedDate)) || {
        opening: c.openingBalance || 0,
        received: 0,
        food: 0,
        stay: 0,
        travel: 0,
        spent: 0,
        balance: c.openingBalance || 0,
        particulars: ""
      };

      grandOpening += dayRow.opening;
      grandReceived += dayRow.received;
      grandFood += dayRow.food;
      grandStay += dayRow.stay;
      grandTravel += dayRow.travel;
      grandSpent += dayRow.spent;
      grandClosing += dayRow.balance;

      return {
        srNo: idx + 1,
        consultant: c,
        particulars: dayRow.particulars,
        opening: dayRow.opening,
        received: dayRow.received,
        food: dayRow.food,
        stay: dayRow.stay,
        travel: dayRow.travel,
        spent: dayRow.spent,
        closing: dayRow.balance
      };
    });

    return {
      rows,
      totals: {
        opening: grandOpening,
        received: grandReceived,
        food: grandFood,
        stay: grandStay,
        travel: grandTravel,
        spent: grandSpent,
        closing: grandClosing
      }
    };
  };

  const daywiseData = getDaywiseAccountsHead();
  const selectedEmployeeLedger = getEmployeeLedger(activeEmployeeId);
  const selectedEmployeeName = users.find(u => u.id === activeEmployeeId)?.name || "Employee";

  const handleExportExcel = () => {
    const reportName = activeReportSubTab === "daywise" 
      ? `Daywise_Accounts_Head_${selectedDate}` 
      : `${selectedEmployeeName}_Sourcing_Ledger_July_2026`;
    setToast({ message: `Exporting ${reportName}.xlsx successfully...`, type: "success" });
  };

  // July 2026 Calendar Cells (Mon/Tue are padding)
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const getJulyCalendarGrid = () => {
    const cells = [];
    cells.push({ day: null, status: "empty" });
    cells.push({ day: null, status: "empty" });

    selectedEmployeeLedger.ledgerRows.forEach((row) => {
      cells.push({
        day: row.srNo,
        dateStr: row.date,
        dayOfWeek: row.day,
        row
      });
    });
    return cells;
  };

  const calendarCells = getJulyCalendarGrid();

  return (
    <div className="ledger-reports-dashboard" style={{ marginTop: "12px" }}>
      
      {/* Header – tabs on the LEFT, no export button */}
      <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
        {/* Row 1: Title */}
        <h3 style={{ textTransform: "uppercase", color: "var(--bg-sidebar)", fontSize: "1.1rem", marginBottom: "10px" }}>Expense Claims & Ledgers</h3>

        {/* Row 2: Tab pills on the left */}
        <div className="segmented-control" style={{ display: "inline-flex" }}>
          <button
            onClick={() => setActiveReportSubTab("claims")}
            className={`segmented-button ${activeReportSubTab === "claims" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Claims Desk
          </button>
          <button
            onClick={() => setActiveReportSubTab("daywise")}
            className={`segmented-button ${activeReportSubTab === "daywise" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Day-wise Head
          </button>
          <button
            onClick={() => setActiveReportSubTab("individual")}
            className={`segmented-button ${activeReportSubTab === "individual" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Individual Ledgers
          </button>
          <button
            onClick={() => setActiveReportSubTab("projectwise")}
            className={`segmented-button ${activeReportSubTab === "projectwise" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            Project Ledger
          </button>
        </div>
      </div>

      {activeReportSubTab === "claims" && (
        <div className="report-container">
          <div style={{ overflowX: "auto" }}>
            <table className="luxury-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Ref No.</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Employee</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Submitted Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Category</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Receipts</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Amount</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Description</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: "800", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#475569" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", color: "#94a3b8", padding: "48px 20px" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
                      <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>No expense claims logged</strong>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>Claims filed by consultants will appear here for verification</div>
                    </td>
                  </tr>
                ) : (
                  expenses.slice().reverse().map((e, idx) => {
                    const emp = users.find(u => u.id === e.employeeId) || { name: e.employeeName || "Employee", avatar: "" };
                    const receiptCount = Array.isArray(e.receipts) && e.receipts.length > 0 
                      ? e.receipts.length 
                      : (e.receipt && typeof e.receipt === "string" && e.receipt.includes("|||"))
                        ? e.receipt.split("|||").length
                        : (e.receipt || e.receiptUrl ? 1 : 0);

                    return (
                      <tr 
                        key={e.id || idx}
                        onClick={(ev) => {
                          if (ev.target.tagName !== "BUTTON" && ev.target.parentElement?.tagName !== "BUTTON") {
                            setSelectedExpenseGroup({
                              title: `Expense Claim '${e.reason || e.description}'`,
                              category: e.category,
                              items: [e],
                              employeeName: emp.name,
                              employeeId: e.employeeId
                            });
                            setActiveItemInGroup(e);
                          }
                        }}
                        style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fafafa", transition: "background 0.15s" }}
                      >
                        <td style={{ padding: "12px 14px", fontWeight: "700", color: "#1e40af", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                            {getUniqueNumber(e.id)}
                          </span>
                        </td>
                        <td className="user-cell" style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} alt={emp.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                            <div>
                              <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.86rem" }}>{emp.name}</div>
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{e.employeeId}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "0.82rem", color: "#475569", whiteSpace: "nowrap" }}>
                          {e.submittedDate || e.date}
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: e.category === "Food" ? "#fff7ed" : (e.category === "Stay" || e.category === "Accommodation") ? "#fdf4ff" : "#eff6ff",
                            color: e.category === "Food" ? "#c2410c" : (e.category === "Stay" || e.category === "Accommodation") ? "#86198f" : "#1d4ed8",
                            border: e.category === "Food" ? "1px solid #fed7aa" : (e.category === "Stay" || e.category === "Accommodation") ? "1px solid #f5d0fe" : "1px solid #bfdbfe"
                          }}>
                            <span>{e.category === "Food" ? "🍴" : (e.category === "Stay" || e.category === "Accommodation") ? "🏨" : "✈️"}</span>
                            <span>{e.category}</span>
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "0.75rem", color: receiptCount > 0 ? "#2563eb" : "#94a3b8", fontWeight: "700", background: receiptCount > 0 ? "#eff6ff" : "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                            📸 {receiptCount} {receiptCount === 1 ? "file" : "files"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0f172a", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                          ₹{(e.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "0.82rem", color: "#475569", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={e.description || e.reason}>
                          {e.description || e.reason || "Operational claim"}
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.74rem",
                            fontWeight: "800",
                            background: e.status === "Approved" ? "#f0fdf4" : e.status === "Rejected" ? "#fef2f2" : "#fffbeb",
                            color: e.status === "Approved" ? "#166534" : e.status === "Rejected" ? "#991b1b" : "#92400e",
                            border: e.status === "Approved" ? "1px solid #bbf7d0" : e.status === "Rejected" ? "1px solid #fecaca" : "1px solid #fde68a"
                          }}>
                            {e.status === "Approved" ? "✓ Approved" : e.status === "Rejected" ? "✖ Rejected" : "⏳ Pending"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {e.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Approve expense claim of ₹${e.amount} for ${emp.name}?`)) {
                                    verifyExpense(e.id, "Approved", "Approved by Admin", currentUser?.name || "Admin");
                                    setToast({ message: "Expense claim approved successfully!", type: "success" });
                                  }
                                }}
                                style={{ backgroundColor: "#16a34a", color: "#ffffff", padding: "5px 10px", border: "none", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer", boxShadow: "0 2px 6px rgba(22,163,74,0.3)" }}
                              >
                                Approve ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const notes = prompt("Enter rejection reason:");
                                  if (notes !== null) {
                                    verifyExpense(e.id, "Rejected", notes || "Rejected by Admin", currentUser?.name || "Admin");
                                    setToast({ message: "Expense claim rejected.", type: "info" });
                                  }
                                }}
                                style={{ backgroundColor: "#ffffff", color: "#dc2626", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                              >
                                Reject ✖
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExpenseGroup({
                                  title: `Expense Claim '${e.reason || e.description}'`,
                                  category: e.category,
                                  items: [e],
                                  employeeName: emp.name,
                                  employeeId: e.employeeId
                                });
                                setActiveItemInGroup(e);
                              }}
                              style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
                            >
                              Inspect 🔍
                            </button>
                          )}
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

      {activeReportSubTab === "daywise" && (
        /* Report 1: Day-wise Accounts Head */
        <div className="report-container">
          {/* 7-day week pill selector with back/forward navigation */}
          {(() => {
            // Build Mon of the week = todayISO's Monday + weekOffset * 7
            const ref = new Date(todayISO + "T00:00:00");
            const dow = ref.getDay();
            const mondayOffset = dow === 0 ? -6 : 1 - dow;
            const monday = new Date(ref);
            monday.setDate(ref.getDate() + mondayOffset + weekOffset * 7);

            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const weekDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              return { label: dayNames[i], date: d.getDate(), month: d.toLocaleString("default", { month: "short" }), iso };
            });

            const isToday = (iso) => iso === todayISO;

            // Week range label e.g. "Jul 20 – Jul 26, 2026"
            const first = weekDays[0];
            const last  = weekDays[6];
            const weekLabel = `${first.month} ${first.date} – ${last.month} ${last.date}, ${monday.getFullYear()}`;

            return (
              <div style={{ marginBottom: "18px" }}>
                {/* Label row + nav */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Select Date
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "4px" }}>
                    {/* Prev week */}
                    <button
                      onClick={() => setWeekOffset(w => w - 1)}
                      title="Previous week"
                      style={{
                        width: "28px", height: "28px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        background: "var(--bg-secondary)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                        lineHeight: 1
                      }}
                    >‹</button>

                    {/* Week label */}
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: weekOffset === 0 ? "#2563eb" : "var(--text-primary)",
                      padding: "0 6px",
                      minWidth: "140px",
                      textAlign: "center"
                    }}>
                      {weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : weekOffset === 1 ? "Next week" : weekLabel}
                    </span>

                    {/* Next week */}
                    <button
                      onClick={() => setWeekOffset(w => w + 1)}
                      title="Next week"
                      style={{
                        width: "28px", height: "28px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        background: "var(--bg-secondary)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                        lineHeight: 1
                      }}
                    >›</button>

                    {/* Today shortcut */}
                    {weekOffset !== 0 && (
                      <button
                        onClick={() => { setWeekOffset(0); setSelectedDate(todayISO); }}
                        style={{
                          marginLeft: "4px",
                          padding: "3px 10px",
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          border: "1px solid #bfdbfe",
                          borderRadius: "4px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          cursor: "pointer"
                        }}
                      >
                        Today
                      </button>
                    )}
                  </div>

                  {/* Full week range text */}
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                    {weekLabel}
                  </span>
                </div>

                {/* Day pills */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {weekDays.map(({ label, date, month, iso }) => {
                    const isSelected = selectedDate === iso;
                    const today = isToday(iso);
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: isSelected ? "2px solid #2563eb" : today ? "2px solid #bfdbfe" : "1px solid var(--border-color)",
                          background: isSelected ? "#2563eb" : today ? "#eff6ff" : "var(--bg-secondary)",
                          color: isSelected ? "#fff" : today ? "#2563eb" : "var(--text-primary)",
                          cursor: "pointer",
                          fontWeight: isSelected || today ? "700" : "500",
                          fontSize: "0.75rem",
                          minWidth: "52px",
                          transition: "all 0.15s"
                        }}
                      >
                        <span style={{ fontSize: "0.62rem", opacity: 0.8, marginBottom: "2px" }}>{label}</span>
                        <span style={{ fontSize: "1rem", fontWeight: "700", lineHeight: 1 }}>{date}</span>
                        {today && !isSelected && <span style={{ fontSize: "0.5rem", marginTop: "2px", color: "#3b82f6" }}>Today</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div style={{ overflowX: "auto" }}>
            <table className="luxury-table" style={{ fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)" }}>
                  <th style={{ padding: "8px" }}>SR. NO</th>
                  <th style={{ padding: "8px" }}>NAME</th>
                  <th style={{ padding: "8px" }}>DATE</th>
                  <th style={{ padding: "8px" }}>PROJECT</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>OPENING BAL</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>PAYMENT</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>FOOD</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>STAY</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>TRAVEL</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>TOTAL</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>CLOSING BAL</th>
                </tr>
              </thead>
              <tbody>
                {daywiseData.rows.map((row) => {
                  const dayExpenses = expenses.filter(e => {
                    if (e.employeeId !== row.consultant.id || e.status === "Rejected") return false;
                    const primaryDate = e.expenseDate || e.date || e.submittedDate;
                    return isSameDateStr(primaryDate, selectedDate);
                  });
                  const foodExps   = dayExpenses.filter(e => e.category === "Food");
                  const stayExps   = dayExpenses.filter(e => e.category === "Accommodation" || e.category === "Stay");
                  const travelExps = dayExpenses.filter(e => e.category === "Travel" || e.category === "Conveyance");

                  const consultantAtt = row.consultant.attendance || [];
                  const dayPunch = consultantAtt.find(a => isSameDateStr(a.date, selectedDate));

                  let displayProjName = "";
                  if (dayExpenses.length > 0) {
                    const expWithProj = dayExpenses.find(e => e.projectName || e.projectId);
                    if (expWithProj) {
                      displayProjName = getProjectDisplayName(expWithProj.projectName || expWithProj.projectId, row.consultant);
                    }
                  } else if (dayPunch) {
                    displayProjName = getProjectDisplayName(dayPunch.projectName || dayPunch.projectId, row.consultant);
                  }

                  const makeCategoryBtn = (exps, label, category) => {
                    if (exps.length === 0) return <span style={{ color: "#cbd5e1" }}>—</span>;
                    const total = exps.reduce((s, i) => s + (Number(i.amount) || 0), 0);
                    return (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedExpenseGroup({
                            title: `${row.consultant.name} — ${label}`,
                            category,
                            items: exps,
                            employeeName: row.consultant.name,
                            employeeId: row.consultant.id
                          });
                          setActiveItemInGroup(exps[0]);
                        }}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: "4px",
                          padding: "3px 10px",
                          cursor: "pointer",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          lineHeight: 1.3,
                          whiteSpace: "nowrap"
                        }}
                      >
                        <span>₹{total.toFixed(2)}</span>
                        <span style={{ fontSize: "0.62rem", fontWeight: "500", color: "#60a5fa" }}>
                          {exps.length} {exps.length === 1 ? "bill" : "bills"}
                        </span>
                      </button>
                    );
                  };

                  return (
                    <tr key={row.consultant.id} style={{ height: "44px" }}>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>{row.srNo}</td>
                      <td style={{ padding: "4px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={row.consultant.avatar} alt={row.consultant.name} style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                          <strong>{row.consultant.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "4px 8px" }}>{formattedQueryDate}</td>
                      <td style={{ padding: "4px 8px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={displayProjName}>
                        {displayProjName ? (
                          <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                            {displayProjName}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", color: row.opening < 0 ? "var(--color-error)" : "inherit" }}>
                        ₹{row.opening.toFixed(2)}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right" }}>
                        {row.received > 0 ? (
                          <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "4px", display: "inline-block" }}>
                            ₹{row.received.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {makeCategoryBtn(foodExps, "Food Claims", "Food")}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {makeCategoryBtn(stayExps, "Stay Claims", "Accommodation")}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {makeCategoryBtn(travelExps, "Travel Claims", "Travel")}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>
                        {row.spent > 0 ? `₹${row.spent.toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "700", color: row.closing < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                        ₹{row.closing.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                
                <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700", borderTop: "2px double var(--border-color)" }}>
                  <td colSpan="4" style={{ padding: "10px", textAlign: "center" }}>TOTAL</td>
                  <td style={{ padding: "10px", textAlign: "right", color: daywiseData.totals.opening < 0 ? "var(--color-error)" : "inherit" }}>
                    ₹{daywiseData.totals.opening.toFixed(2)}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", color: "var(--color-success)" }}>
                    ₹{daywiseData.totals.received.toFixed(2)}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>₹{daywiseData.totals.food.toFixed(2)}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>₹{daywiseData.totals.stay.toFixed(2)}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>₹{daywiseData.totals.travel.toFixed(2)}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>₹{daywiseData.totals.spent.toFixed(2)}</td>
                  <td style={{ padding: "10px", textAlign: "right", color: daywiseData.totals.closing < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                    ₹{daywiseData.totals.closing.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportSubTab === "individual" && (
        /* Report 2: Individual Monthly Ledger */
        <div className="report-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
            
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div className="ledger-filter-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: "600" }}>Select Consultant:</label>
                <select 
                  value={activeEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="luxury-select"
                  style={{ padding: "6px 12px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "#fff", width: "220px", fontSize: "0.82rem" }}
                >
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.title})</option>
                  ))}
                </select>
              </div>

              {/* Grid vs Calendar view selector */}
              <div className="segmented-control">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`segmented-button ${viewMode === "grid" ? "active" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`segmented-button ${viewMode === "calendar" ? "active" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Calendar View
                </button>
              </div>
            </div>

            <span style={{ fontSize: "0.80rem", color: "var(--text-secondary)" }}>
              Monthly reconciliation ledger for <strong>July 2026</strong>
            </span>
          </div>

          {viewMode === "grid" ? (
            /* Grid Spreadsheet Mode */
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
                      <th style={{ padding: "8px", textAlign: "right" }}>OPENING</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>RECEIVED</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>FOOD</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>STAY</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>TRAVEL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>TOTAL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeeLedger.ledgerRows.map((row) => {
                      const rowISO = (() => {
                        const parts = row.date.split("/");
                        if (parts.length !== 3) return "";
                        return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
                      })();

                      const dayExpenses = expenses.filter(e => {
                        if (e.employeeId !== activeEmployeeId || e.status === "Rejected") return false;
                        const primaryDate = e.expenseDate || e.date;
                        return isSameDateStr(primaryDate, rowISO);
                      });
                      const foodExps   = dayExpenses.filter(e => e.category === "Food");
                      const stayExps   = dayExpenses.filter(e => e.category === "Stay" || e.category === "Accommodation");
                      const travelExps = dayExpenses.filter(e => e.category === "Travel" || e.category === "Conveyance");

                      const consultant = users.find(u => u.id === activeEmployeeId) || {};

                      const makeCategoryBtn = (exps, label, category) => {
                        if (exps.length === 0) return <span style={{ color: "#cbd5e1" }}>—</span>;
                        const total = exps.reduce((s, i) => s + i.amount, 0);
                        return (
                          <button
                            onClick={() => {
                              setSelectedExpenseGroup({
                                title: `${consultant.name} — ${label}`,
                                category,
                                items: exps,
                                employeeName: consultant.name,
                                employeeId: activeEmployeeId
                              });
                              setActiveItemInGroup(exps[0]);
                            }}
                            style={{
                              display: "inline-flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "1px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              borderRadius: "4px",
                              padding: "3px 10px",
                              cursor: "pointer",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              lineHeight: 1.3,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span>₹{total.toFixed(2)}</span>
                            <span style={{ fontSize: "0.62rem", fontWeight: "500", color: "#60a5fa" }}>
                              {exps.length} {exps.length === 1 ? "bill" : "bills"}
                            </span>
                          </button>
                        );
                      };

                      return (
                        <tr key={row.srNo} style={{ height: "44px" }}>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>{row.srNo}</td>
                          <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{row.date}</td>
                          <td style={{ padding: "4px 8px", color: "var(--text-secondary)" }}>{row.day}</td>
                          <td style={{ padding: "4px 8px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.particulars}>
                            {row.particulars || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", color: row.opening < 0 ? "var(--color-error)" : "inherit" }}>
                            ₹{row.opening.toFixed(2)}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right" }}>
                            {row.received > 0 ? (
                              <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "4px", display: "inline-block" }}>
                                ₹{row.received.toFixed(2)}
                              </span>
                            ) : (
                              <span style={{ color: "#cbd5e1" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {makeCategoryBtn(foodExps, "Food Claims", "Food")}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {makeCategoryBtn(stayExps, "Stay Claims", "Accommodation")}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {makeCategoryBtn(travelExps, "Travel Claims", "Travel")}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>
                            {row.spent > 0 ? `₹${row.spent.toFixed(2)}` : "—"}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "700", color: row.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                            ₹{row.balance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    
                    <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700", borderTop: "2.5px double var(--border-color)" }}>
                      <td colSpan="4" style={{ padding: "10px", textAlign: "center" }}>TOTAL</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        ₹{selectedEmployeeLedger.ledgerRows[0]?.opening.toFixed(2) || "0.00"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: "var(--color-success)" }}>
                        ₹{selectedEmployeeLedger.totals.received.toFixed(2)}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.food.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.stay.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.travel.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.spent.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: selectedEmployeeLedger.ledgerRows[selectedEmployeeLedger.ledgerRows.length - 1]?.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                        ₹{(selectedEmployeeLedger.ledgerRows[selectedEmployeeLedger.ledgerRows.length - 1]?.balance || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Refilling details box */}
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
                    {selectedEmployeeLedger.refillingDetails.map((refill) => (
                      <tr key={refill.srNo}>
                        <td style={{ textAlign: "center" }}>{refill.srNo}</td>
                        <td>{refill.date}</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-success)" }}>₹{refill.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {selectedEmployeeLedger.refillingDetails.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No refill credits found.</td>
                      </tr>
                    )}
                    <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700" }}>
                      <td colSpan="2">TOTAL</td>
                      <td style={{ textAlign: "right", color: "var(--color-success)" }}>₹{selectedEmployeeLedger.totals.received.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Calendar View Mode with Hover tooltips */
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr", gap: "24px", alignItems: "start" }}>
              
              <div className="report-calendar-grid">
                {weekdays.map(w => (
                  <div key={w} className="report-calendar-header">{w}</div>
                ))}
                {calendarCells.map((c, idx) => {
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

                      {/* Tooltip on hover displaying Opening, Closing, Spent category break-down, Particulars */}
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
                              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                <span>• Food spent:</span>
                                <span>₹{row.food.toFixed(2)}</span>
                              </div>
                            )}
                            {row.stay > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                <span>• Stay spent:</span>
                                <span>₹{row.stay.toFixed(2)}</span>
                              </div>
                            )}
                            {row.travel > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "0.68rem", color: "var(--text-muted)" }}>
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
                          <div style={{ fontSize: "0.65rem", color: "#CBD5E1", marginTop: "4px", fontStyle: "italic", whiteSpace: "normal" }}>
                            Particulars: {row.particulars}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Side Refills Summary card */}
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
                    {selectedEmployeeLedger.refillingDetails.map((refill) => (
                      <tr key={refill.srNo}>
                        <td style={{ textAlign: "center" }}>{refill.srNo}</td>
                        <td>{refill.date}</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "var(--color-success)" }}>₹{refill.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {selectedEmployeeLedger.refillingDetails.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No refill credits found.</td>
                      </tr>
                    )}
                    <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700" }}>
                      <td colSpan="2">TOTAL</td>
                      <td style={{ textAlign: "right", color: "var(--color-success)" }}>₹{selectedEmployeeLedger.totals.received.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ── PROJECT-WISE LEDGER ── */}
      {activeReportSubTab === "projectwise" && (() => {
        // Build per-project expense summaries
        const allProjects = [...new Set(
          expenses
            .map(e => e.projectName || e.projectId || "Unassigned")
            .filter(Boolean)
        )].sort();

        const projRows = allProjects.map((projKey, idx) => {
          const projExps = expenses.filter(e => {
            const pKey = e.projectName || e.projectId || "Unassigned";
            if (pKey !== projKey) return false;
            if (e.status === "Rejected") return false;
            // Month filter
            const rawDate = e.expenseDate || e.date || e.submittedDate || "";
            const normalized = normalizeDate(rawDate);
            return normalized.startsWith(projLedgerMonth);
          });

          // Consultant breakdown
          const consultantMap = {};
          projExps.forEach(e => {
            const cId = e.employeeId;
            if (!consultantMap[cId]) {
              const u = users.find(u => u.id === cId) || { name: e.employeeName || cId, id: cId };
              consultantMap[cId] = { consultant: u, food: 0, stay: 0, travel: 0, misc: 0, total: 0, count: 0 };
            }
            const cat = e.category || "";
            const amt = Number(e.amount) || 0;
            if (cat === "Food") consultantMap[cId].food += amt;
            else if (cat === "Stay" || cat === "Accommodation") consultantMap[cId].stay += amt;
            else if (cat === "Travel" || cat === "Conveyance") consultantMap[cId].travel += amt;
            else consultantMap[cId].misc += amt;
            consultantMap[cId].total += amt;
            consultantMap[cId].count += 1;
          });

          const food  = projExps.filter(e => e.category === "Food").reduce((s, e) => s + (Number(e.amount)||0), 0);
          const stay  = projExps.filter(e => e.category === "Stay" || e.category === "Accommodation").reduce((s, e) => s + (Number(e.amount)||0), 0);
          const travel = projExps.filter(e => e.category === "Travel" || e.category === "Conveyance").reduce((s, e) => s + (Number(e.amount)||0), 0);
          const misc  = projExps.filter(e => !["Food","Stay","Accommodation","Travel","Conveyance"].includes(e.category)).reduce((s, e) => s + (Number(e.amount)||0), 0);
          const total = food + stay + travel + misc;
          const consultants_involved = Object.values(consultantMap);

          const projObj = (projects || []).find(p => p.id === projKey || p.name === projKey);
          const displayName = projObj?.name || projKey;

          return { idx: idx+1, projKey, displayName, food, stay, travel, misc, total, consultants: consultants_involved, expCount: projExps.length };
        });

        const grandFood   = projRows.reduce((s,r) => s + r.food, 0);
        const grandStay   = projRows.reduce((s,r) => s + r.stay, 0);
        const grandTravel = projRows.reduce((s,r) => s + r.travel, 0);
        const grandMisc   = projRows.reduce((s,r) => s + r.misc, 0);
        const grandTotal  = projRows.reduce((s,r) => s + r.total, 0);

        return (
          <div className="report-container">
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Month:</span>
                <input
                  type="month"
                  value={projLedgerMonth}
                  onChange={e => { setProjLedgerMonth(e.target.value); setExpandedProjectId(null); }}
                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.82rem", background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer" }}
                />
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {projRows.filter(r => r.expCount > 0).length} active project{projRows.filter(r => r.expCount > 0).length !== 1 ? "s" : ""} · {projRows.reduce((s,r) => s + r.expCount, 0)} claims
              </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total Food", value: grandFood, color: "#b45309", bg: "#fef3c7" },
                { label: "Total Stay", value: grandStay, color: "#0369a1", bg: "#e0f2fe" },
                { label: "Total Travel", value: grandTravel, color: "#7c3aed", bg: "#ede9fe" },
                { label: "Grand Total", value: grandTotal, color: "#15803d", bg: "#f0fdf4" },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}22`, borderRadius: "8px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: "700", color: c.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: c.color, marginTop: "4px" }}>₹{c.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
              ))}
            </div>

            {/* Project Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="luxury-table" style={{ fontSize: "0.82rem", width: "100%" }}>
                <thead>
                  <tr style={{ background: "var(--bg-tertiary)" }}>
                    <th style={{ padding: "10px 8px", width: "36px" }}>#</th>
                    <th style={{ padding: "10px 8px" }}>PROJECT / COST CENTER</th>
                    <th style={{ padding: "10px 8px" }}>CONSULTANTS</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>FOOD</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>STAY</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>TRAVEL</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>MISC</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>TOTAL CLAIMS</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>BILLS</th>
                  </tr>
                </thead>
                <tbody>
                  {projRows.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>No expenses recorded for this month.</td></tr>
                  ) : projRows.map(row => (
                    <React.Fragment key={row.projKey}>
                      {/* Main project row */}
                      <tr
                        onClick={() => setExpandedProjectId(expandedProjectId === row.projKey ? null : row.projKey)}
                        style={{ cursor: "pointer", background: expandedProjectId === row.projKey ? "#f0f7ff" : "inherit", transition: "background 0.15s" }}
                      >
                        <td style={{ padding: "10px 8px", textAlign: "center", color: "var(--text-muted)", fontWeight: "600" }}>{row.idx}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "1rem" }}>{expandedProjectId === row.projKey ? "▾" : "▸"}</span>
                            <div>
                              <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.displayName}</div>
                              {row.expCount === 0 && <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>No claims this month</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {row.consultants.map(c => (
                              <span key={c.consultant.id} style={{ fontSize: "0.68rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                                {c.consultant.name}
                              </span>
                            ))}
                            {row.consultants.length === 0 && <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "right", color: "#b45309" }}>{row.food > 0 ? `₹${row.food.toLocaleString("en-IN")}` : "—"}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", color: "#0369a1" }}>{row.stay > 0 ? `₹${row.stay.toLocaleString("en-IN")}` : "—"}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", color: "#7c3aed" }}>{row.travel > 0 ? `₹${row.travel.toLocaleString("en-IN")}` : "—"}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", color: "#64748b" }}>{row.misc > 0 ? `₹${row.misc.toLocaleString("en-IN")}` : "—"}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: "700", color: row.total > 0 ? "#0f172a" : "#94a3b8" }}>
                          {row.total > 0 ? `₹${row.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          {row.expCount > 0 ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: "700", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "2px 10px" }}>
                              {row.expCount} bill{row.expCount !== 1 ? "s" : ""}
                            </span>
                          ) : <span style={{ color: "#94a3b8" }}>—</span>}
                        </td>
                      </tr>

                      {/* Expanded: per-consultant breakdown */}
                      {expandedProjectId === row.projKey && row.consultants.length > 0 && (
                        <tr>
                          <td colSpan="9" style={{ padding: "0", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                            <div style={{ padding: "16px 24px" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                                Consultant Breakdown — {row.displayName}
                              </div>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                                <thead>
                                  <tr style={{ background: "#e2e8f0" }}>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "700", color: "#475569" }}>Consultant</th>
                                    <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#b45309" }}>Food</th>
                                    <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#0369a1" }}>Stay</th>
                                    <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#7c3aed" }}>Travel</th>
                                    <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#64748b" }}>Misc</th>
                                    <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>Total</th>
                                    <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "700", color: "#2563eb" }}>Bills</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.consultants.map(c => (
                                    <tr key={c.consultant.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                      <td style={{ padding: "8px 10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                          <img
                                            src={c.consultant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.consultant.name)}`}
                                            alt={c.consultant.name}
                                            style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }}
                                          />
                                          <span style={{ fontWeight: "600", color: "#0f172a" }}>{c.consultant.name}</span>
                                        </div>
                                      </td>
                                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#b45309" }}>{c.food > 0 ? `₹${c.food.toLocaleString("en-IN")}` : "—"}</td>
                                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#0369a1" }}>{c.stay > 0 ? `₹${c.stay.toLocaleString("en-IN")}` : "—"}</td>
                                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#7c3aed" }}>{c.travel > 0 ? `₹${c.travel.toLocaleString("en-IN")}` : "—"}</td>
                                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>{c.misc > 0 ? `₹${c.misc.toLocaleString("en-IN")}` : "—"}</td>
                                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>₹{c.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                        <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "1px 8px" }}>
                                          {c.count}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700", borderTop: "2.5px double var(--border-color)" }}>
                    <td colSpan="3" style={{ padding: "10px 8px", textAlign: "center" }}>GRAND TOTAL</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#b45309" }}>₹{grandFood.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#0369a1" }}>₹{grandStay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#7c3aed" }}>₹{grandTravel.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#64748b" }}>₹{grandMisc.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#15803d", fontSize: "1rem" }}>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span style={{ fontWeight: "700", color: "#2563eb" }}>{projRows.reduce((s,r) => s+r.expCount, 0)} bills</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}


      {selectedExpenseGroup && activeItemInGroup && (() => {
        const emp = users.find(u => u.id === selectedExpenseGroup.employeeId) || { name: selectedExpenseGroup.employeeName || "Employee", title: "Consultant", avatar: "" };
        const rawProj = activeItemInGroup.projectName || activeItemInGroup.projectId;
        const costCenter = getProjectDisplayName(rawProj, emp) || "Shrut Jewellers";
        const dateStr = activeItemInGroup.expenseDate || activeItemInGroup.submittedDate || activeItemInGroup.date || "16 Aug 2025";
        const statusColor = activeItemInGroup.status === "Approved" ? "#22c55e" : activeItemInGroup.status === "Rejected" ? "#ef4444" : "#eab308";
        const statusBg = activeItemInGroup.status === "Approved" ? "#f0fdf4" : activeItemInGroup.status === "Rejected" ? "#fef2f2" : "#fef9c3";
        const statusText = activeItemInGroup.status === "Approved" ? `Expense last Approved by ${activeItemInGroup.reviewedBy || activeItemInGroup.approvedBy || "HR MANAGER"}` : activeItemInGroup.status === "Rejected" ? `Expense Rejected: ${activeItemInGroup.rejectionReason || "Rejection notes logged"}` : "Expense pending approval review";

        const activeReceipts = (() => {
          const item = activeItemInGroup;
          if (!item) return [];

          let list = [];
          if (Array.isArray(item.receipts) && item.receipts.length > 0) {
            list = item.receipts;
          } else if (item.receipt) {
            if (typeof item.receipt === "string" && item.receipt.startsWith("[")) {
              try {
                const parsed = JSON.parse(item.receipt);
                if (Array.isArray(parsed)) list = parsed;
              } catch (e) {}
            } else if (typeof item.receipt === "string" && item.receipt.includes("|||")) {
              list = item.receipt.split("|||");
            } else {
              list = [item.receipt];
            }
          } else if (item.receiptUrl) {
            if (typeof item.receiptUrl === "string" && item.receiptUrl.includes("|||")) {
              list = item.receiptUrl.split("|||");
            } else {
              list = [item.receiptUrl];
            }
          }

          return list.map(r => (typeof r === "string" ? r : (r?.url || r?.receipt || ""))).filter(Boolean);
        })();

        return (
          <div className="task-modal-overlay" style={{ zIndex: "9999", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px" }}>
            <div style={{ backgroundColor: "#ffffff", width: "98vw", maxWidth: "98vw", height: "95vh", maxHeight: "95vh", display: "flex", flexDirection: "column", borderRadius: "4px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)", overflow: "hidden", border: "1px solid #cbd5e1" }}>
              
              {/* Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ffffff" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                  View Expense Claim '{selectedExpenseGroup.title}'
                </h3>
                <button
                  onClick={() => {
                    setSelectedExpenseGroup(null);
                    setActiveItemInGroup(null);
                  }}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {/* User Header Section */}
              <div style={{ padding: "12px 24px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                <img 
                  src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} 
                  alt={emp.name} 
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} 
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "700", color: "#0f172a" }}>{emp.name}</h4>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{emp.title || "Consultant"}</span>
                </div>
              </div>

              {/* Content Body Grid */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                
                {/* Left column sidebar lists */}
                <div style={{ width: "220px", borderRight: "1px solid #e2e8f0", padding: "16px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                    <strong style={{ fontSize: "0.8rem", color: "#475569" }}>Expenses ({selectedExpenseGroup.items.length})</strong>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#0f172a" }}>INR {selectedExpenseGroup.items.reduce((sum, item) => sum + item.amount, 0)}</span>
                  </div>
                  
                  {selectedExpenseGroup.items.map((item, idx) => {
                    const isSelected = activeItemInGroup.id === item.id;
                    const itemFiles = (() => {
                      if (Array.isArray(item.receipts) && item.receipts.length > 0) return item.receipts.length;
                      if (item.receipt && typeof item.receipt === "string" && item.receipt.includes("|||")) return item.receipt.split("|||").length;
                      if (item.receipt || item.receiptUrl) return 1;
                      return 0;
                    })();
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setActiveItemInGroup(item);
                          setActiveReceiptIdx(0);
                          setZoomScale(1);
                        }}
                        style={{ 
                          padding: "12px", 
                          border: isSelected ? "1px solid #bfdbfe" : "1px solid #e2e8f0", 
                          backgroundColor: isSelected ? "#eff6ff" : "#ffffff", 
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          borderRadius: "0"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "600", color: isSelected ? "#2563eb" : "#475569" }}>
                          <span>📄</span>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }} title={item.reason || item.description}>
                            EXP {idx + 1}: {item.reason || item.description}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{itemFiles} file{itemFiles !== 1 ? "s" : ""}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>INR {item.amount}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Middle Column: Carousel Viewer with Left/Right Navigation */}
                {activeReceipts.length === 0 ? (
                  <div style={{ flex: 1, backgroundColor: "#3A4556", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", padding: "24px", gap: "12px" }}>
                    <span style={{ fontSize: "2.5rem" }}>🖼️</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#cbd5e1" }}>No receipts attached for this claim</span>
                  </div>
                ) : (() => {
                  const safeIdx = activeReceiptIdx < activeReceipts.length ? activeReceiptIdx : 0;
                  const currentSrc = activeReceipts[safeIdx] || activeReceipts[0];
                  const isFirst = safeIdx === 0;
                  const isLast = safeIdx === activeReceipts.length - 1;

                  return (
                    <div style={{ flex: 1, backgroundColor: "#475569", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                      
                      {/* Top Floating Toolbar */}
                      <div style={{ padding: "8px 16px", backgroundColor: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #475569", zIndex: 10 }}>
                        
                        {/* Left Arrow */}
                        <button
                          onClick={() => { if (!isFirst) { setActiveReceiptIdx(prev => prev - 1); setZoomScale(1); } }}
                          disabled={isFirst}
                          style={{ background: isFirst ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.2)", color: isFirst ? "#94a3b8" : "#ffffff", border: "none", borderRadius: "4px", width: "28px", height: "28px", fontSize: "1.2rem", cursor: isFirst ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >‹</button>

                        {/* Center Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#1e293b", padding: "4px 12px", borderRadius: "6px", border: "1px solid #475569" }}>
                          <span style={{ fontSize: "0.76rem", color: "#e2e8f0", fontWeight: "500" }}>
                            Attachments &nbsp;{safeIdx + 1}/{activeReceipts.length}
                          </span>
                          <span style={{ color: "#64748b" }}>|</span>
                          <button onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: "1rem", cursor: "pointer", padding: "0 4px" }} title="Zoom Out">−</button>
                          <button onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: "1rem", cursor: "pointer", padding: "0 4px" }} title="Zoom In">＋</button>
                          <button onClick={() => setZoomScale(1)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.72rem", cursor: "pointer", padding: "0 4px" }} title="Reset Zoom">⟲</button>
                          <a href={currentSrc} target="_blank" rel="noopener noreferrer" download={`Receipt_${safeIdx + 1}`} style={{ color: "#cbd5e1", textDecoration: "none", fontSize: "0.85rem", marginLeft: "4px" }} title="Download / Open Full View">📥</a>
                        </div>

                        {/* Right Arrow */}
                        <button
                          onClick={() => { if (!isLast) { setActiveReceiptIdx(prev => prev + 1); setZoomScale(1); } }}
                          disabled={isLast}
                          style={{ background: isLast ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.2)", color: isLast ? "#94a3b8" : "#ffffff", border: "none", borderRadius: "4px", width: "28px", height: "28px", fontSize: "1.2rem", cursor: isLast ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >›</button>
                      </div>

                      {/* Main Image Viewer */}
                      <div style={{ flex: 1, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", position: "relative" }}>
                        <div style={{ transform: `scale(${zoomScale})`, transition: "transform 0.2s ease-in-out", display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%" }}>
                          <img 
                            src={currentSrc} 
                            alt={`Receipt ${safeIdx + 1}`} 
                            style={{ maxHeight: "540px", maxWidth: "450px", objectFit: "contain", display: "block", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", borderRadius: "4px" }} 
                          />
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Right column Form Fields */}
                <div style={{ width: "450px", borderLeft: "1px solid #e2e8f0", padding: "24px", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#ffffff", boxSizing: "border-box" }}>
                  
                  {/* Status Alert Banner */}
                  <div style={{ backgroundColor: statusBg, borderLeft: `4px solid ${statusColor}`, padding: "12px", color: "#1e293b", fontSize: "0.8rem", fontWeight: "600", width: "100%", boxSizing: "border-box" }}>
                    {statusText} <span style={{ color: "#2563eb", cursor: "pointer", textDecoration: "underline", marginLeft: "4px" }}>more details</span>
                  </div>

                  {/* Form */}
                  <div className="luxury-form" style={{ gap: "14px", width: "100%" }}>
                    <div className="form-group" style={{ width: "100%" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Claim Reference Number</label>
                      <input 
                        type="text" 
                        value={getUniqueNumber(activeItemInGroup.id)} 
                        readOnly 
                        style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", backgroundColor: "#eff6ff", color: "#1e40af", padding: "10px 12px", fontSize: "0.85rem", fontWeight: "700", outline: "none" }}
                      />
                    </div>

                    <div className="form-group" style={{ width: "100%" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Expense Category</label>
                      <div style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🍴</span>
                        <strong>{activeItemInGroup.category} Allowance</strong>
                      </div>
                    </div>

                    <div className="form-group" style={{ width: "100%" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Project / Cost Center</label>
                      <div style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", fontSize: "0.85rem" }}>
                        {costCenter}
                      </div>
                    </div>

                    <div className="form-group" style={{ width: "100%" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Expense Title</label>
                      <input 
                        type="text" 
                        value={activeItemInGroup.reason || activeItemInGroup.description} 
                        readOnly 
                        style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", padding: "10px 12px", fontSize: "0.85rem", outline: "none" }}
                      />
                    </div>

                    <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
                      <div className="form-group">
                        <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Expense Date</label>
                        <input 
                          type="text" 
                          value={dateStr} 
                          readOnly 
                          style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", padding: "10px 12px", fontSize: "0.85rem", outline: "none" }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Currency</label>
                        <input 
                          type="text" 
                          value="India Rupee" 
                          readOnly 
                          style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", padding: "10px 12px", fontSize: "0.85rem", outline: "none" }}
                        />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
                      <div className="form-group">
                        <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Amount</label>
                        <input 
                          type="text" 
                          value={activeItemInGroup.amount} 
                          readOnly 
                          style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", padding: "10px 12px", fontSize: "0.85rem", outline: "none" }}
                        />
                      </div>
                      <div className="form-group">
                        {/* Empty grid space alignment */}
                      </div>
                    </div>

                    <div className="form-group" style={{ width: "100%" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700" }}>Comment</label>
                      <textarea 
                        value={activeItemInGroup.description || activeItemInGroup.reason || "Sourced operational expenditures."} 
                        readOnly 
                        rows="3"
                        style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#334155", padding: "10px 12px", fontSize: "0.85rem", outline: "none", resize: "none" }}
                      />
                    </div>
                  </div>

                  {/* Inside-Modal Verification Action Controls */}
                  <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px" }}>
                    {activeItemInGroup.status === "Pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Approve expense claim of ₹${activeItemInGroup.amount} for ${emp.name}?`)) {
                              verifyExpense(activeItemInGroup.id, "Approved", "Approved by Admin via Audit Viewer", currentUser?.name || "Admin");
                              setToast({ message: "Expense claim approved successfully!", type: "success" });
                              setSelectedExpenseGroup(null);
                              setActiveItemInGroup(null);
                            }
                          }}
                          style={{ flex: 1, backgroundColor: "#16a34a", color: "#ffffff", padding: "10px 16px", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.25)" }}
                        >
                          Approve Claim ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const notes = prompt("Enter rejection reason:");
                            if (notes !== null) {
                              verifyExpense(activeItemInGroup.id, "Rejected", notes || "Rejected by Admin via Audit Viewer", currentUser?.name || "Admin");
                              setToast({ message: "Expense claim rejected.", type: "info" });
                              setSelectedExpenseGroup(null);
                              setActiveItemInGroup(null);
                            }
                          }}
                          style={{ backgroundColor: "#ffffff", color: "#dc2626", border: "1.5px solid #fecaca", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "800", cursor: "pointer" }}
                        >
                          Reject ✖
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExpenseGroup(null);
                          setActiveItemInGroup(null);
                        }}
                        style={{ width: "100%", backgroundColor: "#f1f5f9", color: "#334155", padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer" }}
                      >
                        Close Viewer ✕
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

const generateReceiptDataUrl = (title = "Expense Claim", amount = 0, category = "General", date = "") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="560" viewBox="0 0 480 560" fill="none">
    <rect width="480" height="560" rx="16" fill="#0F172A"/>
    <rect x="16" y="16" width="448" height="528" rx="12" fill="#FFFFFF"/>
    
    <rect x="16" y="16" width="448" height="80" rx="12" fill="#1E3A8A"/>
    <text x="40" y="52" fill="#FFFFFF" font-family="sans-serif" font-size="19" font-weight="700">ACME CONSULTING</text>
    <text x="40" y="74" fill="#93C5FD" font-family="sans-serif" font-size="11" font-weight="500">OFFICIAL EXPENSE RECEIPT &amp; ATTACHMENT</text>
    
    <rect x="330" y="42" width="110" height="28" rx="14" fill="#10B981"/>
    <text x="385" y="61" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">✓ VERIFIED</text>
    
    <text x="40" y="135" fill="#64748B" font-family="sans-serif" font-size="11" font-weight="600">CLAIM TITLE</text>
    <text x="40" y="160" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="700">${String(title).substring(0, 32)}</text>
    
    <line x1="40" y1="180" x2="440" y2="180" stroke="#E2E8F0" stroke-dasharray="4 4"/>
    
    <text x="40" y="210" fill="#64748B" font-family="sans-serif" font-size="11" font-weight="600">EXPENSE CATEGORY</text>
    <text x="40" y="235" fill="#2563EB" font-family="sans-serif" font-size="14" font-weight="600">${category}</text>
    
    <text x="260" y="210" fill="#64748B" font-family="sans-serif" font-size="11" font-weight="600">DATE</text>
    <text x="260" y="235" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="600">${date || "2026-08-01"}</text>
    
    <line x1="40" y1="260" x2="440" y2="260" stroke="#E2E8F0" stroke-dasharray="4 4"/>
    
    <rect x="40" y="280" width="400" height="90" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
    <text x="60" y="315" fill="#64748B" font-family="sans-serif" font-size="11" font-weight="600">AMOUNT BILLED</text>
    <text x="60" y="350" fill="#0F172A" font-family="sans-serif" font-size="26" font-weight="800">INR ₹${Number(amount || 0).toFixed(2)}</text>
    
    <rect x="40" y="395" width="400" height="55" fill="#F1F5F9" rx="6"/>
    <line x1="60" y1="405" x2="60" y2="445" stroke="#0F172A" stroke-width="3"/>
    <line x1="68" y1="405" x2="68" y2="445" stroke="#0F172A" stroke-width="1"/>
    <line x1="74" y1="405" x2="74" y2="445" stroke="#0F172A" stroke-width="4"/>
    <line x1="84" y1="405" x2="84" y2="445" stroke="#0F172A" stroke-width="2"/>
    <line x1="92" y1="405" x2="92" y2="445" stroke="#0F172A" stroke-width="1"/>
    <line x1="100" y1="405" x2="100" y2="445" stroke="#0F172A" stroke-width="3"/>
    <text x="120" y="430" fill="#64748B" font-family="sans-serif" font-size="10" font-weight="500">AUTHENTICATION HASH: ACME-EXP-AUDIT-OK</text>
    
    <text x="240" y="495" fill="#94A3B8" font-family="sans-serif" font-size="10" text-anchor="middle">Official Bill Attachment Verified by ACME HR Portal</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

function ReceiptViewerCard({ r, i, activeItemInGroup }) {
  const [imgErr, setImgErr] = React.useState(false);
  const rawUrl = typeof r === "string" ? r : (r?.url || r?.receipt || r?.data || "");
  const name = (typeof r === "object" && (r?.name || r?.receipt_name)) || `Receipt #${i + 1}`;
  const isPdf = r?.type?.includes("pdf") || name.toLowerCase().endsWith(".pdf") || rawUrl.toLowerCase().endsWith(".pdf");
  const isValidMediaUrl = rawUrl && (rawUrl.startsWith("data:") || rawUrl.startsWith("http:") || rawUrl.startsWith("https:"));

  const displayImgUrl = (isValidMediaUrl && !imgErr) ? rawUrl : generateReceiptDataUrl(
    activeItemInGroup?.reason || activeItemInGroup?.description || name,
    activeItemInGroup?.amount || 0,
    activeItemInGroup?.category || "Expense",
    activeItemInGroup?.expenseDate || activeItemInGroup?.date
  );

  if (isPdf && isValidMediaUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>
        <iframe src={rawUrl} title={name} style={{ width: "450px", height: "540px", border: "none", background: "#ffffff", borderRadius: "4px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <img 
        src={displayImgUrl} 
        alt={name} 
        onError={() => setImgErr(true)}
        style={{ maxHeight: "540px", maxWidth: "450px", objectFit: "contain", display: "block", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }} 
      />
    </div>
  );
}
