import React, { useState, useMemo } from "react";
import { numberToWords, printVouchers } from "../lib/voucherPrinter";

export default function ExpenseVoucherModal({ isOpen, onClose, expenses = [], users = [] }) {
  if (!isOpen) return null;

  const [selectedConsultantId, setSelectedConsultantId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateFilterType, setDateFilterType] = useState("month"); // 'month', 'date', 'all'
  const [statusFilter, setStatusFilter] = useState("Approved"); // 'Approved', 'all'
  
  // Selected voucher IDs for custom selection
  const [selectedVoucherIds, setSelectedVoucherIds] = useState(new Set());
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  const consultants = useMemo(() => {
    return users.filter(u => u.role === "Consultant");
  }, [users]);

  // Filter expenses based on user criteria
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Consultant filter
      if (selectedConsultantId !== "all" && e.employeeId !== selectedConsultantId) {
        return false;
      }
      // Category filter
      if (selectedCategory !== "all" && e.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && e.status !== statusFilter) {
        return false;
      }
      // Date filter
      const rawDate = e.expenseDate || e.date || e.submittedDate || "";
      const normDate = rawDate.split("T")[0];

      if (dateFilterType === "date" && selectedDate) {
        if (normDate !== selectedDate) return false;
      } else if (dateFilterType === "month" && selectedMonth) {
        if (!normDate.startsWith(selectedMonth)) return false;
      }

      return true;
    });
  }, [expenses, selectedConsultantId, selectedCategory, statusFilter, dateFilterType, selectedDate, selectedMonth]);

  // Vouchers to print: if custom selected, use those; else use all filtered
  const activeVouchers = useMemo(() => {
    if (selectedVoucherIds.size > 0) {
      return filteredExpenses.filter(e => selectedVoucherIds.has(e.id));
    }
    return filteredExpenses;
  }, [filteredExpenses, selectedVoucherIds]);

  // Pagination for A4 Landscape Preview (4 per page)
  const totalPages = Math.max(1, Math.ceil(activeVouchers.length / 4));
  const currentVouchers = useMemo(() => {
    const start = currentPageIdx * 4;
    const items = activeVouchers.slice(start, start + 4);
    while (items.length < 4) {
      items.push(null);
    }
    return items;
  }, [activeVouchers, currentPageIdx]);

  const handleToggleSelectAll = () => {
    if (selectedVoucherIds.size === filteredExpenses.length) {
      setSelectedVoucherIds(new Set());
    } else {
      setSelectedVoucherIds(new Set(filteredExpenses.map(e => e.id)));
    }
  };

  const handleToggleSingleVoucher = (id) => {
    setSelectedVoucherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    if (activeVouchers.length === 0) {
      alert("No vouchers available to print.");
      return;
    }
    printVouchers(activeVouchers);
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px"
      }}
    >
      <div 
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "1160px",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div 
          style={{
            background: "#0f172a",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #334155"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🖨️</span>
            <div>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "1.1rem", fontWeight: "800", letterSpacing: "0.3px" }}>
                Expense Voucher Print Desk
              </h3>
              <span style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: "600" }}>
                Print 4 vouchers per A4 Sheet in Landscape format (Filing Ready)
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#ffffff",
              fontSize: "1.1rem",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div 
          style={{
            background: "#f8fafc",
            padding: "14px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Consultant selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Consultant
              </label>
              <select
                value={selectedConsultantId}
                onChange={e => setSelectedConsultantId(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#fff", fontWeight: "600" }}
              >
                <option value="all">All Consultants ({consultants.length})</option>
                {consultants.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Category selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#fff", fontWeight: "600" }}
              >
                <option value="all">All Categories</option>
                <option value="Food">Food</option>
                <option value="Stay">Stay / Accommodation</option>
                <option value="Travel">Travel / Conveyance</option>
                <option value="Office">Office Overheads</option>
                <option value="Misc">Miscellaneous</option>
              </select>
            </div>

            {/* Date filter mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Date Range Mode
              </label>
              <select
                value={dateFilterType}
                onChange={e => setDateFilterType(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#fff", fontWeight: "600" }}
              >
                <option value="month">By Month</option>
                <option value="date">Specific Date</option>
                <option value="all">All Dates</option>
              </select>
            </div>

            {/* Month / Date picker */}
            {dateFilterType === "month" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#fff" }}
                />
              </div>
            )}

            {dateFilterType === "date" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#fff" }}
                />
              </div>
            )}

            {/* Status filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <label style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#fff", fontWeight: "600" }}
              >
                <option value="Approved">Approved Claims Only</option>
                <option value="all">All Claims (Including Pending)</option>
              </select>
            </div>
          </div>

          {/* Selection counter & Primary Print CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#0f172a" }}>
                {activeVouchers.length} Voucher{activeVouchers.length !== 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: "700" }}>
                {totalPages} A4 Landscape Page{totalPages !== 1 ? "s" : ""} (4/Sheet)
              </div>
            </div>

            <button
              onClick={handlePrint}
              disabled={activeVouchers.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "0.82rem",
                fontWeight: "800",
                cursor: activeVouchers.length === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
              }}
            >
              <span>🖨️</span> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Live Preview Container */}
        <div 
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            background: "#f1f5f9",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          {/* Page Switcher Toolbar */}
          <div 
            style={{
              width: "100%",
              maxWidth: "960px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
              Live Print Preview (Page {currentPageIdx + 1} of {totalPages})
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => setCurrentPageIdx(p => Math.max(0, p - 1))}
                disabled={currentPageIdx === 0}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: currentPageIdx === 0 ? "#e2e8f0" : "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: currentPageIdx === 0 ? "not-allowed" : "pointer"
                }}
              >
                ‹ Previous Page
              </button>

              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f172a" }}>
                {currentPageIdx + 1} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPageIdx(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPageIdx >= totalPages - 1}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: currentPageIdx >= totalPages - 1 ? "#e2e8f0" : "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: currentPageIdx >= totalPages - 1 ? "not-allowed" : "pointer"
                }}
              >
                Next Page ›
              </button>
            </div>
          </div>

          {/* 2x2 Grid A4 Landscape Sheet Preview */}
          {activeVouchers.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "960px", border: "1px solid #cbd5e1" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📋</div>
              <h4 style={{ margin: 0, color: "#1e293b", fontSize: "1rem" }}>No matching expense claims found</h4>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                Try adjusting the consultant, category, or date range filters above.
              </p>
            </div>
          ) : (
            <div 
              style={{
                width: "100%",
                maxWidth: "960px",
                aspectRatio: "1.414 / 1", // A4 Landscape ratio
                background: "#ffffff",
                border: "2px solid #94a3b8",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: "14px",
                boxSizing: "border-box"
              }}
            >
              {currentVouchers.map((v, idx) => {
                if (!v) {
                  return (
                    <div 
                      key={`empty-${idx}`}
                      style={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: "0.72rem",
                        fontStyle: "italic"
                      }}
                    >
                      [ Blank Voucher Slot ]
                    </div>
                  );
                }

                const dateStr = v.date || v.expenseDate || v.submittedDate || new Date().toISOString().split("T")[0];
                const consultantName = v.employeeName || v.consultantName || "Consultant";
                const category = v.category || "Expense";
                const title = v.reason || v.description || v.title || "Field Expense";
                const comments = v.comments || v.notes || v.description || "Official Consultant Expense";
                const amountNum = Number(v.amount || 0);
                const amountWords = numberToWords(amountNum);
                const paymentMode = v.paymentMode || "UPI / CASH";
                const paidBy = v.paidBy || consultantName;

                return (
                  <div 
                    key={v.id || idx}
                    style={{
                      border: "2px solid #000000",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxSizing: "border-box",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      color: "#000000",
                      overflow: "hidden"
                    }}
                  >
                    {/* Row 1: Header */}
                    <div 
                      style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        padding: "5px 8px",
                        borderBottom: "1.5px solid #000000",
                        letterSpacing: "0.5px"
                      }}
                    >
                      Expense Voucher - {dateStr}
                    </div>

                    {/* Row 2: Details */}
                    <div 
                      style={{
                        padding: "5px 8px",
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        borderBottom: "1.5px solid #000000",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                      title={`${consultantName} - ${category} - ${title} - ${comments}`}
                    >
                      {consultantName} - {category} - {title} - {comments}
                    </div>

                    {/* Row 3 & 4 Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                      <tbody>
                        <tr>
                          <td style={{ border: "1.5px solid #000000", padding: "4px 6px", width: "30%", fontWeight: "600" }}>
                            Amount (in words)
                          </td>
                          <td colSpan="3" style={{ border: "1.5px solid #000000", padding: "4px 6px", fontWeight: "600", textTransform: "capitalize" }}>
                            {amountWords}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: "1.5px solid #000000", padding: "4px 6px", width: "15%", fontWeight: "bold" }}>
                            Amount :
                          </td>
                          <td style={{ border: "1.5px solid #000000", padding: "4px 6px", width: "35%", fontWeight: "bold", fontSize: "0.78rem" }}>
                            ₹ {amountNum.toFixed(2)}
                          </td>
                          <td style={{ border: "1.5px solid #000000", padding: "4px 6px", width: "25%", fontWeight: "600" }}>
                            Payment Mode:
                          </td>
                          <td style={{ border: "1.5px solid #000000", padding: "4px 6px", width: "25%", fontWeight: "bold", textAlign: "center" }}>
                            {paymentMode}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Middle Spacer */}
                    <div style={{ flexGrow: 1, minHeight: "14px" }}></div>

                    {/* Footer Signatures */}
                    <div 
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        padding: "4px 12px 6px 12px",
                        fontSize: "0.72rem",
                        fontWeight: "600"
                      }}
                    >
                      <div>
                        <div>Paid by: {paidBy}</div>
                        <div style={{ width: "100px", borderBottom: "1px dotted #000000", marginTop: "2px" }}></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div>Authorised Signature</div>
                        <div style={{ width: "110px", borderBottom: "1px dotted #000000", marginTop: "2px", marginLeft: "auto" }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: "14px 24px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            💡 Tip: In the browser print dialog, ensure Orientation is set to <strong>Landscape</strong> and Margins to <strong>Default / Minimum</strong>.
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              disabled={activeVouchers.length === 0}
              style={{
                padding: "8px 22px",
                borderRadius: "6px",
                border: "none",
                background: "#16a34a",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: "800",
                cursor: activeVouchers.length === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
              }}
            >
              🖨️ Print {activeVouchers.length} Vouchers (A4 Landscape)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
