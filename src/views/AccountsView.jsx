import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import LedgerReports from "../components/LedgerReports";
import ProjectsView from "./ProjectsView";

export default function AccountsView({ activeTab: parentActiveTab }) {
  const { 
    expenses, 
    users, 
    verifyExpense, 
    reimburseExpense,
    advanceRequests,
    requestAdvance,
    verifyAdvanceRequest,
    projects,
    currentUser,
    settings,
    updateSettings,
    updateUserProfile,
    setToast
  } = useApp();

  const activeTab = parentActiveTab || "dashboard";

  // Expense modal states
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");

  // Reimbursed payment modal
  const [reimburseModalExpense, setReimburseModalExpense] = useState(null);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer (NEFT/RTGS)");
  const [paymentRef, setPaymentRef] = useState("");

  // Receipt image preview modal
  const [previewReceipts, setPreviewReceipts] = useState(null);

  // Sub-tab selection inside expenses tab
  const [expenseSubTab, setExpenseSubTab] = useState("claims"); // 'claims' or 'advances'

  // Payroll & Costing desk states
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [selectedPayslipConsultant, setSelectedPayslipConsultant] = useState(null);
  const [customDailyRates, setCustomDailyRates] = useState({});

  // Calculations
  const defaultDailyRate = settings?.dailyConsultantRate || 2000;
  const standardWorkingDays = settings?.requiredWorkingDays || 22;

  const pendingClaims = expenses.filter(e => e.status === "Pending");
  const approvedClaims = expenses.filter(e => e.status === "Approved");
  const reimbursedClaims = expenses.filter(e => e.status === "Reimbursed");
  const pendingAdvances = advanceRequests.filter(r => r.status === "Pending");

  const totalApprovedAmount = approvedClaims.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalReimbursedAmount = reimbursedClaims.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalPendingAmount = pendingClaims.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const consultantsList = users.filter(u => u.role === "Consultant" || u.role === "Employee");

  // Helper: Get consultant daily rate
  const getConsultantDailyRate = (consultant) => {
    if (customDailyRates[consultant.id]) return Number(customDailyRates[consultant.id]);
    if (consultant.dailyRate) return Number(consultant.dailyRate);
    if (consultant.salary && Number(consultant.salary) > 0) return Math.round(Number(consultant.salary) / standardWorkingDays);
    return defaultDailyRate;
  };

  // Helper: Calculate attendance summary & payroll for a consultant
  const getConsultantPayroll = (consultant) => {
    const attendance = consultant.attendance || [];
    const presentDays = attendance.filter(a => a.status === "Present" || a.status === "Late").length;
    const weeklyOffs = 8; // Standard weekend days per month
    const approvedLeaves = (attendance.filter(a => a.status === "Leave" || a.status === "On Leave").length) || 0;
    
    // In August 2026, total calendar days = 31
    const totalMonthDays = 31;
    const payableDays = Math.min(totalMonthDays, presentDays + weeklyOffs + approvedLeaves);
    const absentDays = Math.max(0, standardWorkingDays - presentDays - approvedLeaves);

    const dailyRate = getConsultantDailyRate(consultant);
    // Consultant Labor Costing (Manpower Cost)
    const laborCosting = payableDays * dailyRate;

    // Approved & Pending Expenses for this consultant
    const consultantExpenses = expenses.filter(e => e.employeeId === consultant.id || e.employeeName === consultant.name);
    const consultantApprovedExpenses = consultantExpenses
      .filter(e => e.status === "Approved" || e.status === "Reimbursed")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    const consultantPendingExpenses = consultantExpenses
      .filter(e => e.status === "Pending")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Advances deducted
    const advanceDeduction = Number(consultant.advanceAmount) || 0;

    // Net Salary Payable = Labor Costing + Approved Expenses - Advance Deductions
    const netPayable = Math.max(0, laborCosting + consultantApprovedExpenses - advanceDeduction);

    // Total Project Costing Contribution = Labor Costing + All Project Expenses
    const totalCostingContribution = laborCosting + consultantApprovedExpenses;

    return {
      presentDays,
      weeklyOffs,
      approvedLeaves,
      absentDays,
      payableDays,
      dailyRate,
      laborCosting,
      consultantApprovedExpenses,
      consultantPendingExpenses,
      advanceDeduction,
      netPayable,
      totalCostingContribution,
      compliancePct: Math.min(100, Math.round((presentDays / standardWorkingDays) * 100))
    };
  };

  // Aggregate Total Monthly Consultant Labor Costing across company
  const totalCompanyLaborCosting = consultantsList.reduce((sum, c) => sum + getConsultantPayroll(c).laborCosting, 0);
  const totalCompanyCombinedCosting = totalCompanyLaborCosting + totalApprovedAmount + totalReimbursedAmount;

  // Filtered expenses list
  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== "All" && e.category !== filterCategory) return false;
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    if (expenseSearchQuery.trim()) {
      const q = expenseSearchQuery.toLowerCase();
      const matchEmp = (e.employeeName || "").toLowerCase().includes(q) || (users.find(u => u.id === e.employeeId)?.name || "").toLowerCase().includes(q);
      const matchProj = (e.projectName || e.projectId || "").toLowerCase().includes(q);
      const matchDesc = (e.description || "").toLowerCase().includes(q);
      if (!matchEmp && !matchProj && !matchDesc) return false;
    }
    return true;
  });

  // Verification Handler
  const handleVerify = (status) => {
    if (!selectedExpense) return;
    if (status === "Rejected" && !reviewNotes.trim()) {
      setToast({ message: "Please provide reviewer remarks explaining what details are missing.", type: "error" });
      return;
    }

    verifyExpense(
      selectedExpense.id,
      status,
      reviewNotes.trim() || `Verified & ${status} by Finance Accountant.`,
      currentUser?.name || "Finance Accountant"
    );

    setToast({ message: `✓ Expense claim has been successfully ${status.toLowerCase()}!`, type: "success" });
    setSelectedExpense(null);
    setReviewNotes("");
  };

  // Reimbursement / Payout Handler
  const handleConfirmReimbursement = (e) => {
    if (e) e.preventDefault();
    if (!reimburseModalExpense) return;

    reimburseExpense(
      reimburseModalExpense.id,
      paymentMode,
      paymentRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      currentUser?.name || "Finance Accountant"
    );

    setToast({ message: `✓ Claim marked as Reimbursed & Paid via ${paymentMode}!`, type: "success" });
    setReimburseModalExpense(null);
    setPaymentRef("");
  };

  // Cash Advance Handlers
  const handleVerifyAdvance = (requestId, status) => {
    verifyAdvanceRequest(requestId, status, currentUser?.name || "Finance Accountant");
    setToast({ 
      message: `Cash advance request has been successfully ${status === "Approved" ? "approved & funded" : "rejected"}!`, 
      type: status === "Approved" ? "success" : "info" 
    });
  };

  // Export Payroll Register to CSV
  const handleExportPayrollCSV = () => {
    const headers = [
      "Employee Code",
      "Consultant Name",
      "Job Title",
      "Department",
      "Daily Rate (INR)",
      "Days Present",
      "Weekly Offs",
      "Paid Leaves",
      "Payable Days",
      "Labor Costing / Basic Earned (INR)",
      "Approved Reimbursements (INR)",
      "Advance Deductions (INR)",
      "Net Payable Salary (INR)",
      "Total Project Costing Contribution (INR)"
    ];

    const rows = consultantsList.map(c => {
      const p = getConsultantPayroll(c);
      return [
        c.empCode || c.id,
        `"${c.name}"`,
        `"${c.title || c.role}"`,
        `"${c.department || 'Consulting'}"`,
        p.dailyRate,
        p.presentDays,
        p.weeklyOffs,
        p.approvedLeaves,
        p.payableDays,
        p.laborCosting,
        p.consultantApprovedExpenses,
        p.advanceDeduction,
        p.netPayable,
        p.totalCostingContribution
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ACME_Payroll_and_Costing_Register_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ message: `✓ Exported ${selectedMonth} Payroll & Costing Register to CSV!`, type: "success" });
  };

  return (
    <div className="accounts-view-container" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", color: "#0f172a" }}>
      
      {/* Top Welcome Bar */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="uppercase-tracking" style={{ color: "#2563eb", fontWeight: "700", fontSize: "0.75rem", letterSpacing: "1px" }}>
            🏛️ FINANCE & PAYROLL DESK
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
            Welcome, {currentUser?.name || "Finance Officer"}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
            {currentUser?.title || "Chief Accountant"} • <strong>{currentUser?.department || "Finance & Accounts"}</strong> • Dedicated Portal
          </p>
        </div>

        {/* Global Action Badges */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 16px", borderRadius: "10px", textAlign: "right" }}>
            <span style={{ fontSize: "0.7rem", color: "#1d4ed8", fontWeight: "700", textTransform: "uppercase", display: "block" }}>Active Claims Pending</span>
            <strong style={{ fontSize: "1.1rem", color: pendingClaims.length > 0 ? "#d97706" : "#16a34a" }}>
              {pendingClaims.length} Claims (₹{totalPendingAmount.toLocaleString()})
            </strong>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 16px", borderRadius: "10px", textAlign: "right" }}>
            <span style={{ fontSize: "0.7rem", color: "#15803d", fontWeight: "700", textTransform: "uppercase", display: "block" }}>Monthly Labor Costing</span>
            <strong style={{ fontSize: "1.1rem", color: "#166534" }}>
              ₹{totalCompanyLaborCosting.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* ────────────────── 1. FINANCE & COSTING DASHBOARD ────────────────── */}
      {activeTab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Executive KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                💰 Total Paid Reimbursements
              </span>
              <strong style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: "800" }}>₹{totalReimbursedAmount.toLocaleString()}</strong>
              <span style={{ fontSize: "0.72rem", color: "#16a34a", display: "block", marginTop: "4px" }}>✓ Disbursed to Consultants</span>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                ⏳ Approved Awaiting Payout
              </span>
              <strong style={{ fontSize: "1.6rem", color: totalApprovedAmount > 0 ? "#2563eb" : "#0f172a", fontWeight: "800" }}>₹{totalApprovedAmount.toLocaleString()}</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginTop: "4px" }}>{approvedClaims.length} verified claims</span>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                ⚠️ Claims Awaiting Audit
              </span>
              <strong style={{ fontSize: "1.6rem", color: pendingClaims.length > 0 ? "#d97706" : "#0f172a", fontWeight: "800" }}>{pendingClaims.length} Claims</strong>
              <span style={{ fontSize: "0.72rem", color: "#d97706", display: "block", marginTop: "4px" }}>₹{totalPendingAmount.toLocaleString()} awaiting audit</span>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                ⏱️ Consultant Labor Costing
              </span>
              <strong style={{ fontSize: "1.6rem", color: "#7c3aed", fontWeight: "800" }}>₹{totalCompanyLaborCosting.toLocaleString()}</strong>
              <span style={{ fontSize: "0.72rem", color: "#7c3aed", display: "block", marginTop: "4px" }}>Days Worked × Per Day Rate</span>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                📊 Combined Monthly Outflow
              </span>
              <strong style={{ fontSize: "1.6rem", color: "#0f172a", fontWeight: "800" }}>₹{totalCompanyCombinedCosting.toLocaleString()}</strong>
              <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginTop: "4px" }}>Labor Cost + Expenses</span>
            </div>

          </div>

          {/* Quick Action Tables: Pending Claims & Advance Requests */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>⚡ Quick Audit Desk</h3>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>Pending items requiring finance verification</p>
              </div>
            </div>

            {pendingClaims.length === 0 && pendingAdvances.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <span style={{ fontSize: "2rem" }}>🎉</span>
                <p style={{ fontWeight: "700", color: "#166534", margin: "8px 0 0 0" }}>All Caught Up! No pending claims or advances awaiting audit.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {pendingClaims.slice(0, 5).map(e => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.92rem" }}>
                        {e.employeeName || (users.find(u => u.id === e.employeeId)?.name) || "Consultant"} • <span style={{ color: "#2563eb" }}>₹{Number(e.amount).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {e.category} • {e.projectName || "General"} • {e.date || e.submittedDate}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => { setSelectedExpense(e); setReviewNotes(""); }}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
                      >
                        Audit & Verify →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ────────────────── 2. EXPENSE VERIFICATION & REIMBURSEMENTS ────────────────── */}
      {activeTab === "expenses" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          
          {/* Main verification header & tab switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                💳 Expense Claims Audit & Payout Desk
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                Verify submitted claims, review receipt attachments, and disburse reimbursements
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button 
                onClick={() => setFilterStatus("All")}
                style={{ background: filterStatus === "All" ? "#0f172a" : "#f1f5f9", color: filterStatus === "All" ? "#ffffff" : "#475569", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                All Claims ({expenses.length})
              </button>
              <button 
                onClick={() => setFilterStatus("Pending")}
                style={{ background: filterStatus === "Pending" ? "#d97706" : "#fef3c7", color: filterStatus === "Pending" ? "#ffffff" : "#92400e", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                Pending Audit ({pendingClaims.length})
              </button>
              <button 
                onClick={() => setFilterStatus("Approved")}
                style={{ background: filterStatus === "Approved" ? "#2563eb" : "#eff6ff", color: filterStatus === "Approved" ? "#ffffff" : "#1e40af", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                Approved / Ready for Payout ({approvedClaims.length})
              </button>
              <button 
                onClick={() => setFilterStatus("Reimbursed")}
                style={{ background: filterStatus === "Reimbursed" ? "#16a34a" : "#f0fdf4", color: filterStatus === "Reimbursed" ? "#ffffff" : "#166534", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                Reimbursed / Paid ({reimbursedClaims.length})
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1", minWidth: "240px" }}>
              <input
                type="text"
                placeholder="🔍 Search by consultant, project, or description..."
                value={expenseSearchQuery}
                onChange={(e) => setExpenseSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
              >
                <option value="All">All Categories</option>
                <option value="Food">Food</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Travel">Travel</option>
                <option value="Fuel">Fuel</option>
                <option value="Stationery">Stationery</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Claims Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "12px 14px" }}>Date</th>
                  <th style={{ padding: "12px 14px" }}>Consultant</th>
                  <th style={{ padding: "12px 14px" }}>Project</th>
                  <th style={{ padding: "12px 14px" }}>Category</th>
                  <th style={{ padding: "12px 14px" }}>Description</th>
                  <th style={{ padding: "12px 14px" }}>Receipts</th>
                  <th style={{ padding: "12px 14px" }}>Amount</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => {
                  const employee = users.find(u => u.id === e.employeeId || u.name === e.employeeName);
                  const receiptsList = e.receipts && e.receipts.length > 0 
                    ? e.receipts 
                    : (e.receipt ? [e.receipt] : []);

                  return (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: "#64748b" }}>{e.submittedDate || e.date}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img src={employee?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${e.employeeName || 'Staff'}`} alt="avatar" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{e.employeeName || employee?.name || "Staff"}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{employee?.empCode || "EMP"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                          {e.projectName || e.projectId || "General Account"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "600" }}>{e.category}</td>
                      <td style={{ padding: "12px 14px", maxWidth: "200px", color: "#475569" }}>{e.description || "-"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        {receiptsList.length > 0 ? (
                          <button
                            onClick={() => setPreviewReceipts(receiptsList)}
                            style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "3px 8px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                          >
                            📎 View ({receiptsList.length})
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>No receipt</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0f172a" }}>₹{Number(e.amount).toLocaleString()}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          background: e.status === "Pending" ? "#fef3c7" : e.status === "Approved" ? "#eff6ff" : e.status === "Reimbursed" ? "#f0fdf4" : "#fef2f2",
                          color: e.status === "Pending" ? "#92400e" : e.status === "Approved" ? "#1e40af" : e.status === "Reimbursed" ? "#166534" : "#991b1b"
                        }}>
                          {e.status === "Reimbursed" ? "✓ Reimbursed (Paid)" : e.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {e.status === "Pending" && (
                          <button 
                            onClick={() => { setSelectedExpense(e); setReviewNotes(""); }}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                          >
                            Audit Claim
                          </button>
                        )}
                        {e.status === "Approved" && (
                          <button 
                            onClick={() => { setReimburseModalExpense(e); setPaymentRef(""); }}
                            style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                          >
                            💳 Mark Paid
                          </button>
                        )}
                        {e.status === "Reimbursed" && (
                          <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600" }}>
                            Paid via {e.paymentMode || "Bank"}
                          </span>
                        )}
                        {e.status === "Rejected" && (
                          <span style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: "600" }}>
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                      No expense claims match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ────────────────── 3. CASH ADVANCES & PETTY CASH DESK ────────────────── */}
      {activeTab === "advances" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              💵 Cash Advances & Petty Cash Desk
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
              Audit requests for operational field cash and manage consultant recovery balances
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "12px 14px" }}>Date Requested</th>
                  <th style={{ padding: "12px 14px" }}>Consultant</th>
                  <th style={{ padding: "12px 14px" }}>Purpose / Notes</th>
                  <th style={{ padding: "12px 14px" }}>Amount</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {advanceRequests.map((r) => {
                  const employee = users.find(u => u.id === r.employeeId);
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px", color: "#64748b" }}>{r.date || r.allocatedDate}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{employee?.name || "Consultant"}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{employee?.empCode || "EMP"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569" }}>{r.purpose || "Field Operations Advance"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0f172a" }}>₹{Number(r.amount).toLocaleString()}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          background: r.status === "Pending" ? "#fef3c7" : r.status === "Approved" ? "#f0fdf4" : "#fef2f2",
                          color: r.status === "Pending" ? "#92400e" : r.status === "Approved" ? "#166534" : "#991b1b"
                        }}>
                          {r.status === "Approved" ? "✓ Funded & Active" : r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {r.status === "Pending" ? (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleVerifyAdvance(r.id, "Approved")}
                              style={{ background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                            >
                              ✓ Approve & Fund
                            </button>
                            <button
                              onClick={() => handleVerifyAdvance(r.id, "Rejected")}
                              style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Audited by {r.reviewedBy || "Finance"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {advanceRequests.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                      No cash advance requests recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────── 4. ATTENDANCE FOR PAYROLL & MANPOWER COSTING ────────────────── */}
      {activeTab === "attendance" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          
          {/* Header & Month Selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                ⏱️ Attendance for Payroll & Consultant Costing
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
                Calculates consultant per-day salary costing separately alongside expense claims for monthly disbursement
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff" }}
              >
                <option value="August 2026">📅 August 2026 (Current)</option>
                <option value="July 2026">📅 July 2026</option>
                <option value="September 2026">📅 September 2026</option>
              </select>

              <button
                onClick={handleExportPayrollCSV}
                style={{ background: "#166534", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                📥 Export Payroll CSV
              </button>
            </div>
          </div>

          {/* Model Summary Notice */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <strong style={{ color: "#166534", fontSize: "0.88rem" }}>💡 Separate Per-Day Costing Calculation Rule Active:</strong>
              <div style={{ fontSize: "0.8rem", color: "#15803d", marginTop: "2px" }}>
                Consultant labor is calculated as <strong>Payable Days × Per-Day Rate</strong>. Operational expenses are added on top as reimbursements, and any unrecovered advance is deducted to derive the Net Salary Payable.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "#166534", textTransform: "uppercase", fontWeight: "700" }}>Total Payroll Outlay</span>
              <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#166534" }}>
                ₹{consultantsList.reduce((sum, c) => sum + getConsultantPayroll(c).netPayable, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "12px 10px" }}>Consultant</th>
                  <th style={{ padding: "12px 10px" }}>Daily Rate (₹/day)</th>
                  <th style={{ padding: "12px 10px" }}>Present</th>
                  <th style={{ padding: "12px 10px" }}>Offs / Leaves</th>
                  <th style={{ padding: "12px 10px" }}>Payable Days</th>
                  <th style={{ padding: "12px 10px" }}>Labor Costing (Earned)</th>
                  <th style={{ padding: "12px 10px" }}>Approved Expenses (+)</th>
                  <th style={{ padding: "12px 10px" }}>Advance Recovered (-)</th>
                  <th style={{ padding: "12px 10px" }}>Net Salary Payable</th>
                  <th style={{ padding: "12px 10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultantsList.map(c => {
                  const p = getConsultantPayroll(c);
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} alt="avatar" style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{c.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{c.empCode || "C0001"} • {c.title || "Consultant"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <input
                          type="number"
                          value={customDailyRates[c.id] !== undefined ? customDailyRates[c.id] : p.dailyRate}
                          onChange={(e) => setCustomDailyRates({ ...customDailyRates, [c.id]: e.target.value })}
                          style={{ width: "80px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: "700", color: "#0f172a" }}
                        />
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: "700", color: "#16a34a" }}>
                        {p.presentDays} days
                      </td>
                      <td style={{ padding: "12px 10px", color: "#64748b" }}>
                        {p.weeklyOffs} Offs + {p.approvedLeaves} Leaves
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: "800", color: "#0f172a" }}>
                        {p.payableDays} days
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: "800", color: "#7c3aed" }}>
                        ₹{p.laborCosting.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: "700", color: "#2563eb" }}>
                        +₹{p.consultantApprovedExpenses.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: "700", color: p.advanceDeduction > 0 ? "#dc2626" : "#64748b" }}>
                        {p.advanceDeduction > 0 ? `-₹${p.advanceDeduction.toLocaleString()}` : "₹0"}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <strong style={{ fontSize: "0.95rem", color: "#166534" }}>
                          ₹{p.netPayable.toLocaleString()}
                        </strong>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedPayslipConsultant({ consultant: c, payroll: p })}
                          style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          📄 Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ────────────────── 5. FINANCIAL LEDGER REPORTS ────────────────── */}
      {activeTab === "reports" && (
        <LedgerReports />
      )}

      {/* ────────────────── 6. PROJECTS OVERVIEW ────────────────── */}
      {activeTab === "projects" && (
        <ProjectsView />
      )}

      {/* ────────────────── MODAL: VERIFY EXPENSE CLAIM ────────────────── */}
      {selectedExpense && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "560px", padding: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>🔍 Audit Expense Claim</h3>
              <span onClick={() => setSelectedExpense(null)} style={{ cursor: "pointer", fontSize: "1.2rem", fontWeight: "700", color: "#64748b" }}>✕</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", display: "block" }}>Consultant</span>
                <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{selectedExpense.employeeName || "Consultant"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", display: "block" }}>Claim Amount</span>
                <strong style={{ fontSize: "1.1rem", color: "#2563eb" }}>₹{Number(selectedExpense.amount).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", display: "block" }}>Category</span>
                <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{selectedExpense.category}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", display: "block" }}>Project</span>
                <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{selectedExpense.projectName || selectedExpense.projectId || "General"}</strong>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", display: "block" }}>Description / Purpose</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#334155", fontStyle: "italic" }}>"{selectedExpense.description}"</p>
            </div>

            {/* Receipt button in modal */}
            {((selectedExpense.receipts && selectedExpense.receipts.length > 0) || selectedExpense.receipt) && (
              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={() => setPreviewReceipts(selectedExpense.receipts || [selectedExpense.receipt])}
                  style={{ width: "100%", background: "#eff6ff", color: "#2563eb", border: "1px dashed #3b82f6", padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer" }}
                >
                  📎 Click to View Uploaded Receipt Attachment
                </button>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Reviewer Remarks</label>
              <textarea
                placeholder="Approval notes or reason for revision/rejection..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={{ width: "100%", height: "70px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => handleVerify("Approved")}
                style={{ flex: 1, background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer" }}
              >
                ✓ Approve Claim
              </button>
              <button
                onClick={() => handleVerify("Rejected")}
                style={{ flex: 1, background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer" }}
              >
                ✕ Reject Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: MARK REIMBURSEMENT AS PAID ────────────────── */}
      {reimburseModalExpense && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>💳 Disburse Reimbursement</h3>
              <span onClick={() => setReimburseModalExpense(null)} style={{ cursor: "pointer", fontSize: "1.2rem", fontWeight: "700", color: "#64748b" }}>✕</span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 16px 0" }}>
              Record payout for <strong>{reimburseModalExpense.employeeName}</strong> for amount <strong style={{ color: "#16a34a" }}>₹{Number(reimburseModalExpense.amount).toLocaleString()}</strong>.
            </p>

            <form onSubmit={handleConfirmReimbursement} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                >
                  <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI / IMPS">UPI / IMPS</option>
                  <option value="Cash / Petty Cash">Cash / Petty Cash</option>
                  <option value="Company Debit Card">Company Debit Card</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Transaction / UTR Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9823472918"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer" }}
                >
                  ✓ Confirm Payout & Mark Reimbursed
                </button>
                <button
                  type="button"
                  onClick={() => setReimburseModalExpense(null)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "12px 18px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: RECEIPT PREVIEW ────────────────── */}
      {previewReceipts && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "600px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>📎 Uploaded Receipt Attachment</h3>
              <span onClick={() => setPreviewReceipts(null)} style={{ cursor: "pointer", fontSize: "1.2rem", fontWeight: "700", color: "#64748b" }}>✕</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {previewReceipts.map((src, idx) => (
                <div key={idx} style={{ textAlign: "center" }}>
                  <img src={src} alt={`Receipt ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px", border: "1px solid #e2e8f0", objectFit: "contain" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: OFFICIAL PAYSLIP & COSTING BREAKDOWN ────────────────── */}
      {selectedPayslipConsultant && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "680px", padding: "32px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "900", color: "#0f172a" }}>ACME CONSULTING WORKCENTRE</h2>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Consultant Salary & Engagement Costing Statement</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>CONFIDENTIAL PAYSLIP</span>
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>Month: {selectedMonth}</div>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.82rem" }}>
              <div>
                <span style={{ color: "#64748b" }}>Consultant Name:</span> <strong>{selectedPayslipConsultant.consultant.name}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Employee Code:</span> <strong>{selectedPayslipConsultant.consultant.empCode || "C0001"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Designation:</span> <strong>{selectedPayslipConsultant.consultant.title || "Consultant"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Per-Day Costing Rate:</span> <strong>₹{selectedPayslipConsultant.payroll.dailyRate}/day</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Days Present (Punch Verified):</span> <strong>{selectedPayslipConsultant.payroll.presentDays} days</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Payable Days (Incl Offs):</span> <strong>{selectedPayslipConsultant.payroll.payableDays} days</strong>
              </div>
            </div>

            {/* Costing Breakdown Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "24px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Description</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1", textAlign: "right" }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                    <strong>Consultant Labor Costing (Earned Base)</strong>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{selectedPayslipConsultant.payroll.payableDays} payable days × ₹{selectedPayslipConsultant.payroll.dailyRate}/day</div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: "700", color: "#7c3aed" }}>
                    ₹{selectedPayslipConsultant.payroll.laborCosting.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                    <strong>Approved Operational Expense Reimbursements (+)</strong>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Food, Travel, Lodging claims verified by Accounts</div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: "700", color: "#2563eb" }}>
                    +₹{selectedPayslipConsultant.payroll.consultantApprovedExpenses.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                    <strong>Petty Cash Advance Deductions (-)</strong>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Unsettled field operational cash advance</div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: "700", color: selectedPayslipConsultant.payroll.advanceDeduction > 0 ? "#dc2626" : "#64748b" }}>
                    {selectedPayslipConsultant.payroll.advanceDeduction > 0 ? `-₹${selectedPayslipConsultant.payroll.advanceDeduction.toLocaleString()}` : "₹0"}
                  </td>
                </tr>
                <tr style={{ background: "#f0fdf4" }}>
                  <td style={{ padding: "12px", fontWeight: "900", color: "#166534", fontSize: "0.95rem" }}>
                    NET SALARY PAYABLE TO CONSULTANT
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "900", color: "#166534", fontSize: "1.1rem" }}>
                    ₹{selectedPayslipConsultant.payroll.netPayable.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Engagement Cost Contribution */}
            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#475569", marginBottom: "24px" }}>
              🏢 <strong>Total Client Project Costing Contribution:</strong> ₹{selectedPayslipConsultant.payroll.totalCostingContribution.toLocaleString()} (Labor Costing: ₹{selectedPayslipConsultant.payroll.laborCosting.toLocaleString()} + Expenses: ₹{selectedPayslipConsultant.payroll.consultantApprovedExpenses.toLocaleString()})
            </div>

            {/* Signatures & Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Authorized by: <strong>{currentUser?.name || "Finance Officer"}</strong><br/>
                Date: {new Date().toLocaleDateString()}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => window.print()}
                  style={{ background: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  Print Payslip
                </button>
                <button
                  onClick={() => setSelectedPayslipConsultant(null)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
