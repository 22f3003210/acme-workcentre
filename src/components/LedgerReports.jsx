import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LedgerReports() {
  const { users, expenses, verifyExpense, currentUser, getEmployeeLedger, setToast } = useApp();

  const [activeReportSubTab, setActiveReportSubTab] = useState("daywise"); // 'claims', 'daywise', or 'individual'
  // Default to today in YYYY-MM-DD
  const todayISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'calendar'
  const [selectedExpenseGroup, setSelectedExpenseGroup] = useState(null);
  const [activeItemInGroup, setActiveItemInGroup] = useState(null);
  const [expandedConsultantId, setExpandedConsultantId] = useState(null);

  const consultants = users.filter(u => u.role === "Consultant");
  const activeEmployeeId = selectedEmployeeId || (consultants[0]?.id || "");

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

    const rows = consultants.map((c, idx) => {
      const ledger = getEmployeeLedger(c.id);
      const dayRow = ledger.ledgerRows.find(r => r.date === formattedQueryDate) || {
        opening: 0,
        received: 0,
        food: 0,
        stay: 0,
        travel: 0,
        spent: 0,
        balance: 0,
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
          >
            🧾 Claims Desk
          </button>
          <button
            onClick={() => setActiveReportSubTab("daywise")}
            className={`segmented-button ${activeReportSubTab === "daywise" ? "active" : ""}`}
          >
            📋 Day-wise Head
          </button>
          <button
            onClick={() => setActiveReportSubTab("individual")}
            className={`segmented-button ${activeReportSubTab === "individual" ? "active" : ""}`}
          >
            👤 Individual Ledgers
          </button>
        </div>
      </div>

      {activeReportSubTab === "claims" && (
        <div className="report-container">
          <div style={{ overflowX: "auto" }}>
            <table className="luxury-table">
              <thead>
                <tr>
                  <th>Ref No.</th>
                  <th>Employee</th>
                  <th>Submitted Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
                      No expense claims logged.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => {
                    const emp = users.find(u => u.id === e.employeeId) || { name: e.employeeName || "Employee", avatar: "" };
                    return (
                      <tr 
                        key={e.id}
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
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ fontWeight: "700", color: "#475569", fontSize: "0.78rem" }}>{getUniqueNumber(e.id)}</td>
                        <td className="user-cell">
                          <img src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`} alt={emp.name} className="avatar-small" />
                          <div className="user-cell-text">
                            <strong>{emp.name}</strong>
                            <span style={{ textTransform: "none", fontSize: "0.7rem", color: "#94a3b8" }}>{e.employeeId}</span>
                          </div>
                        </td>
                        <td>{e.submittedDate || e.date}</td>
                        <td>
                          <span style={{
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor: e.category === "Food" ? "#fef3c7" : e.category === "Accommodation" ? "#e0f2fe" : "#fee2e2",
                            color: e.category === "Food" ? "#b45309" : e.category === "Accommodation" ? "#0369a1" : "#b91c1c"
                          }}>
                            {e.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: "700", color: "#0f172a" }}>₹{e.amount.toLocaleString()}</td>
                        <td style={{ fontSize: "0.8rem", color: "#475569", maxWidth: "240px", wordBreak: "break-word" }}>{e.description}</td>
                        <td>
                          <span className={`role-badge ${e.status.toLowerCase()}`}>
                            {e.status}
                          </span>
                        </td>
                        <td>
                          {e.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => {
                                  if (confirm(`Approve expense claim of ₹${e.amount} for ${emp.name}?`)) {
                                    verifyExpense(e.id, "Approved", "Approved by Admin", currentUser.name);
                                    setToast({ message: "Expense claim approved successfully!", type: "success" });
                                  }
                                }}
                                className="luxury-button small"
                                style={{ backgroundColor: "#22c55e", color: "#ffffff", padding: "4px 8px", border: "none", borderRadius: "4px" }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const notes = prompt("Enter rejection reason:");
                                  if (notes !== null) {
                                    verifyExpense(e.id, "Rejected", notes || "Rejected by Admin", currentUser.name);
                                    setToast({ message: "Expense claim rejected.", type: "info" });
                                  }
                                }}
                                className="delete-btn"
                                style={{ padding: "4px 8px" }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              Reviewed by {e.reviewedBy || "System"}
                            </span>
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
                  const dayExpenses = expenses.filter(e =>
                    e.employeeId === row.consultant.id &&
                    (e.submittedDate === selectedDate || e.date === selectedDate)
                  );
                  const foodExps   = dayExpenses.filter(e => e.category === "Food");
                  const stayExps   = dayExpenses.filter(e => e.category === "Accommodation");
                  const travelExps = dayExpenses.filter(e => e.category === "Travel");

                  const makeCategoryBtn = (exps, label, category) => {
                    if (exps.length === 0) return <span style={{ color: "#cbd5e1" }}>—</span>;
                    const total = exps.reduce((s, i) => s + i.amount, 0);
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

                  const rowExp = dayExpenses.find(e => e.projectName || e.projectId);
                  const displayProjName = (rowExp && (rowExp.projectName || rowExp.projectId)) || "DCB Bank Sourcing Account";

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
                        <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                          {displayProjName}
                        </span>
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", color: row.opening < 0 ? "var(--color-error)" : "inherit" }}>
                        ₹{row.opening.toFixed(2)}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-success)", fontWeight: row.received > 0 ? "700" : "400" }}>
                        {row.received > 0 ? `₹${row.received.toFixed(2)}` : "—"}
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
                >
                  📋 Grid View
                </button>
                <button 
                  onClick={() => setViewMode("calendar")}
                  className={`segmented-button ${viewMode === "calendar" ? "active" : ""}`}
                >
                  📅 Calendar View
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
                      <th style={{ padding: "8px", textAlign: "center" }}>FOOD</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>STAY</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>TRAVEL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>TOTAL</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>RECEIVED</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeeLedger.ledgerRows.map((row) => {
                      // Parse the row date (format: D/M/YYYY) back to YYYY-MM-DD for expense matching
                      const rowISO = (() => {
                        const parts = row.date.split("/");
                        if (parts.length !== 3) return "";
                        return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
                      })();

                      const dayExpenses = expenses.filter(e =>
                        e.employeeId === activeEmployeeId &&
                        (e.date === rowISO || e.submittedDate === rowISO)
                      );
                      const foodExps   = dayExpenses.filter(e => e.category === "Food");
                      const stayExps   = dayExpenses.filter(e => e.category === "Accommodation");
                      const travelExps = dayExpenses.filter(e => e.category === "Travel");

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
                          <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-success)", fontWeight: row.received > 0 ? "700" : "400" }}>
                            {row.received > 0 ? `₹${row.received.toFixed(2)}` : "—"}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "700", color: row.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                            ₹{row.balance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    
                    <tr style={{ background: "var(--bg-tertiary)", fontWeight: "700", borderTop: "2.5px double var(--border-color)" }}>
                      <td colSpan="5" style={{ padding: "10px", textAlign: "center" }}>TOTAL</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.food.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.stay.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.travel.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>₹{selectedEmployeeLedger.totals.spent.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "var(--color-success)" }}>₹{selectedEmployeeLedger.totals.received.toFixed(2)}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: selectedEmployeeLedger.ledgerRows[selectedEmployeeLedger.ledgerRows.length - 1]?.balance < 0 ? "var(--color-error)" : "var(--color-success)" }}>
                        ₹{selectedEmployeeLedger.ledgerRows[selectedEmployeeLedger.ledgerRows.length - 1]?.balance.toFixed(2) || "0.00"}
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

      {/* View Expense Detail Modal */}
      {selectedExpenseGroup && activeItemInGroup && (() => {
        const emp = users.find(u => u.id === selectedExpenseGroup.employeeId) || { name: selectedExpenseGroup.employeeName || "Employee", title: "Consultant", avatar: "" };
        const costCenter = activeItemInGroup.projectName || activeItemInGroup.projectId || "DCB Bank Sourcing Account (DCB-SR-01)";
        const dateStr = activeItemInGroup.submittedDate || activeItemInGroup.date || "16 Aug 2025";
        const statusColor = activeItemInGroup.status === "Approved" ? "#22c55e" : activeItemInGroup.status === "Rejected" ? "#ef4444" : "#eab308";
        const statusBg = activeItemInGroup.status === "Approved" ? "#f0fdf4" : activeItemInGroup.status === "Rejected" ? "#fef2f2" : "#fef9c3";
        const statusText = activeItemInGroup.status === "Approved" ? `Expense last Approved by ${activeItemInGroup.reviewedBy || activeItemInGroup.approvedBy || "HR MANAGER"}` : activeItemInGroup.status === "Rejected" ? `Expense Rejected: ${activeItemInGroup.rejectionReason || "Rejection notes logged"}` : "Expense pending approval review";

        return (
          <div className="task-modal-overlay" style={{ zIndex: "9999", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#ffffff", width: "90%", maxWidth: "1200px", height: "85vh", display: "flex", flexDirection: "column", borderRadius: "0", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden", border: "1px solid #cbd5e1" }}>
              
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
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setActiveItemInGroup(item)}
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
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>0 files</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>INR {item.amount}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Middle column Receipt Viewer */}
                <div style={{ flex: 1, backgroundColor: "#475569", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#cbd5e1", padding: "24px", gap: "12px" }}>
                  <span style={{ fontSize: "2.5rem" }}>🖼️</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>No receipts to show</span>
                </div>

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

                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
