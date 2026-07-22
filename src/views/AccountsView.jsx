import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import LedgerReports from "../components/LedgerReports";
import ProjectsView from "./ProjectsView";
import RecruiterView from "./RecruiterView";

export default function AccountsView({ activeTab }) {
  const { 
    expenses, 
    users, 
    verifyExpense, 
    advanceRequests,
    verifyAdvanceRequest,
    currentUser,
    settings,
    setToast
  } = useApp();

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Sub-tab selection inside the ledger tab
  const [ledgerSubTab, setLedgerSubTab] = useState("claims"); // 'claims', 'advances', or 'attendance'

  // Calculations
  const pendingClaims = expenses.filter(e => e.status === "Pending");
  const pendingAdvances = advanceRequests.filter(r => r.status === "Pending");
  const approvedClaims = expenses.filter(e => e.status === "Approved");
  const totalApprovedAmount = approvedClaims.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  // Calculate attendance summaries for consultants
  const getAttendanceSummary = (c) => {
    const attendance = c.attendance || [];
    const present = attendance.filter(a => a.status === "Present" || a.status === "Late").length;
    
    // July 2026: Count weekend days (Weekly Offs) up to today (July 19)
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
    const status = present >= (settings.requiredWorkingDays || 22) ? "Completed" : "Pending";

    return {
      present,
      offs,
      absent: abs,
      pct,
      status
    };
  };

  const consultantsList = users.filter(u => u.role === "Consultant");
  const consultantsBelowCompliance = consultantsList.filter(c => {
    const summary = getAttendanceSummary(c);
    return summary.present < (settings.requiredWorkingDays || 22);
  });

  // Filtered expenses list
  const filteredExpenses = expenses.filter(e => {
    if (filterCategory === "All") return true;
    return e.category === filterCategory;
  });

  const handleVerify = (status) => {
    if (!selectedExpense) return;
    if (status === "Rejected" && !reviewNotes.trim()) {
      setToast({ message: "Please provide reviewer remarks explaining what details are missing.", type: "error" });
      return;
    }

    verifyExpense(
      selectedExpense.id,
      status,
      reviewNotes.trim() || "Approved by Accounts Manager.",
      currentUser.name
    );

    setToast({ message: `Expense claim has been successfully ${status.toLowerCase()}!`, type: "success" });
    setSelectedExpense(null);
    setReviewNotes("");
  };

  const handleVerifyAdvance = (requestId, status) => {
    verifyAdvanceRequest(requestId, status, currentUser.name);
    setToast({ 
      message: `Cash advance request has been successfully ${status === "Approved" ? "approved & funded" : "rejected"}!`, 
      type: status === "Approved" ? "success" : "info" 
    });
  };

  const handleExportExcel = () => {
    setToast({ message: "Exporting Monthly Attendance summary to Excel...", type: "success" });
  };

  return (
    <div className="accounts-view-container">
      {/* Top Welcome Bar */}
      <div className="dashboard-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <span className="uppercase-tracking" style={{ color: "var(--text-secondary)" }}>Finance & Accounts desk</span>
          <h1 style={{ fontSize: "1.6rem", color: "var(--text-primary)" }}>Welcome, {currentUser.name}</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>{currentUser.title} • <strong>{currentUser.department} Department</strong></p>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="admin-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          
          {/* Financial KPIs */}
          <div className="glass-card">
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Total Paid Reimbursements</span>
            <strong style={{ fontSize: "1.8rem", color: "var(--text-primary)" }}>₹{totalApprovedAmount.toLocaleString()}</strong>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Pending Claims</span>
            <strong style={{ fontSize: "1.8rem", color: pendingClaims.length > 0 ? "var(--color-warning)" : "var(--text-primary)" }}>{pendingClaims.length} awaiting verify</strong>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Pending Advances</span>
            <strong style={{ fontSize: "1.8rem", color: pendingAdvances.length > 0 ? "var(--color-warning)" : "var(--text-primary)" }}>{pendingAdvances.length} requests</strong>
          </div>

          {/* Compliance Card */}
          <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Under 22-Day Limit</span>
              <strong style={{ fontSize: "1.8rem", color: consultantsBelowCompliance.length > 0 ? "var(--color-error)" : "var(--text-primary)" }}>
                {consultantsBelowCompliance.length} Consultants
              </strong>
            </div>
            {consultantsBelowCompliance.length > 0 && (
              <span className="status-badge todo" style={{ fontSize: "0.7rem" }}>Alert Active</span>
            )}
          </div>

          {/* Sourcing Category Breakdown */}
          <div className="glass-card span-2">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Sourcing Expenses Category Breakdown</h3>
            <p className="uppercase-tracking" style={{ fontSize: "0.65rem", display: "block", marginBottom: "16px" }}>Monthly Settle totals</p>
            <div className="project-stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              {["Food", "Accommodation", "Travel"].map((cat) => {
                const catExpenses = expenses.filter(e => e.category === cat);
                const approvedSum = catExpenses
                  .filter(e => e.status === "Approved")
                  .reduce((s, e) => s + e.amount, 0);
                return (
                  <div key={cat} style={{ background: "var(--bg-tertiary)", padding: "12px", borderRadius: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>{cat}</span>
                    <strong style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>₹{approvedSum.toFixed(2)}</strong>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>{catExpenses.length} claims</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeTab === "expenses" && (
        <div className="expenses-section glass-card">
          {/* Main verification header & tab switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3>Ledger Verification Portal</h3>
              <p className="subtitle">Audit expense claims, fund advance requests, and verify attendance compliance</p>
            </div>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button 
                onClick={() => setLedgerSubTab("claims")}
                className="luxury-button small"
                style={{ 
                  background: ledgerSubTab === "claims" ? "var(--bg-sidebar)" : "none", 
                  border: "1px solid var(--border-color)", 
                  color: ledgerSubTab === "claims" ? "#fff" : "var(--text-secondary)" 
                }}
              >
                Claims Awaiting Audit ({pendingClaims.length})
              </button>
              <button 
                onClick={() => setLedgerSubTab("advances")}
                className="luxury-button small"
                style={{ 
                  background: ledgerSubTab === "advances" ? "var(--bg-sidebar)" : "none", 
                  border: "1px solid var(--border-color)", 
                  color: ledgerSubTab === "advances" ? "#fff" : "var(--text-secondary)" 
                }}
              >
                Advances Awaiting Audit ({pendingAdvances.length})
              </button>
              <button 
                onClick={() => setLedgerSubTab("attendance")}
                className="luxury-button small"
                style={{ 
                  background: ledgerSubTab === "attendance" ? "var(--bg-sidebar)" : "none", 
                  border: "1px solid var(--border-color)", 
                  color: ledgerSubTab === "attendance" ? "#fff" : "var(--text-secondary)" 
                }}
              >
                22-Day Compliance Summary
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Expense claims ledger */}
          {ledgerSubTab === "claims" && (
            <>
              <div className="expenses-header-actions" style={{ marginBottom: "16px" }}>
                <div className="ledger-filter-box">
                  <label htmlFor="category-filter">Category Filter:</label>
                  <select
                    id="category-filter"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="luxury-select"
                  >
                    <option value="All">All Categories</option>
                    <option value="Food">Food</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
              </div>

              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Date Claimed</th>
                    <th>Employee</th>
                    <th>Project</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e) => {
                    const employee = users.find(u => u.id === e.employeeId);
                    return (
                      <tr key={e.id}>
                        <td>{e.submittedDate || e.date}</td>
                        <td>
                          <div className="user-cell">
                            <img src={employee?.avatar} alt={employee?.name} className="avatar-small" />
                            <div className="user-cell-text">
                              <strong>{employee?.name}</strong>
                              <span>{employee?.title}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "4px" }}>
                            {e.projectName || e.projectId || "DCB Bank Sourcing Account"}
                          </span>
                        </td>
                        <td>{e.category}</td>
                        <td className="desc-cell">{e.description}</td>
                        <td className="amount-cell"><strong>₹{e.amount.toFixed(2)}</strong></td>
                        <td>
                          <span className={`status-badge ${e.status.toLowerCase()}`}>
                            {e.status}
                          </span>
                        </td>
                        <td>
                          {e.status === "Pending" ? (
                            <button 
                              className="luxury-button small"
                              onClick={() => {
                                setSelectedExpense(e);
                                setReviewNotes("");
                              }}
                            >
                              Verify Claim
                            </button>
                          ) : (
                            <span className="muted-text">Verified by {e.reviewedBy || "Finance"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center">No expense claims match this category filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* Sub-tab 2: Cash Advance Requests ledger */}
          {ledgerSubTab === "advances" && (
            <>
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Date Requested</th>
                    <th>Employee</th>
                    <th>Purpose</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advanceRequests.map((r) => {
                    const employee = users.find(u => u.id === r.employeeId);
                    return (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>
                          <div className="user-cell">
                            <img src={employee?.avatar} alt={employee?.name} className="avatar-small" />
                            <div className="user-cell-text">
                              <strong>{employee?.name}</strong>
                              <span>{employee?.title}</span>
                            </div>
                          </div>
                        </td>
                        <td className="desc-cell">{r.purpose}</td>
                        <td className="amount-cell"><strong>₹{r.amount.toFixed(2)}</strong></td>
                        <td>
                          <span className={`status-badge ${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                onClick={() => handleVerifyAdvance(r.id, "Approved")}
                                className="luxury-button small approve"
                                style={{ padding: "6px 10px" }}
                              >
                                ✓ Approve & Fund
                              </button>
                              <button 
                                onClick={() => handleVerifyAdvance(r.id, "Rejected")}
                                className="luxury-button small revise"
                                style={{ padding: "6px 10px", backgroundColor: "var(--color-error)" }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            <span className="muted-text">Audited by {r.reviewedBy || "Finance"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {advanceRequests.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center">No cash advance requests on file.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* Sub-tab 3: Compliance Attendance Summary Reports */}
          {ledgerSubTab === "attendance" && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button 
                  onClick={handleExportExcel}
                  className="luxury-button small"
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-sidebar)", color: "#fff" }}
                >
                  📥 Export Excel Report
                </button>
              </div>

              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Consultant Name</th>
                    <th>Required Days</th>
                    <th>Days Present</th>
                    <th>Weekly Offs</th>
                    <th>Absent Days (LOP)</th>
                    <th>Attendance %</th>
                    <th>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consultantsList.map((c) => {
                    const summary = getAttendanceSummary(c);
                    return (
                      <tr key={c.id}>
                        <td className="user-cell">
                          <img src={c.avatar} alt={c.name} className="avatar-small" />
                          <div className="user-cell-text">
                            <strong>{c.name}</strong>
                            <span>{c.title}</span>
                          </div>
                        </td>
                        <td><strong>{settings.requiredWorkingDays || 22} days</strong></td>
                        <td>{summary.present} days</td>
                        <td>{summary.offs} days</td>
                        <td style={{ color: summary.absent > 0 ? "var(--color-error)" : "inherit" }}>{summary.absent} days</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong>{summary.pct}%</strong>
                            <div className="progress-bar-container" style={{ width: "60px", height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                              <div className="progress-bar" style={{ width: `${summary.pct}%`, height: "100%", backgroundColor: summary.pct >= 100 ? "var(--color-success)" : "var(--color-warning)" }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${summary.status === "Completed" ? "completed" : "pending"}`}>
                            {summary.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Verification Review Modal for Expense claims */}
          {selectedExpense && (
            <div className="modal-backdrop" onClick={() => setSelectedExpense(null)}>
              <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.4rem" }}>Verify Expense Claim</h2>
                  <button onClick={() => setSelectedExpense(null)} style={{ fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                </div>
                
                <div className="verification-modal-layout">
                  <div className="verification-details-pane">
                    <div className="verification-row-info" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div className="info-block">
                        <span className="info-lbl" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Employee:</span>
                        <span className="info-val" style={{ fontSize: "0.95rem", fontWeight: "600" }}>{users.find(u => u.id === selectedExpense.employeeId)?.name}</span>
                      </div>
                      <div className="info-block">
                        <span className="info-lbl" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Claim Amount:</span>
                        <span className="info-val gold-text" style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--gold-primary)" }}>₹{selectedExpense.amount.toFixed(2)}</span>
                      </div>
                      <div className="info-block" style={{ marginTop: "8px" }}>
                        <span className="info-lbl" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Category:</span>
                        <span className="info-val" style={{ fontSize: "0.95rem", fontWeight: "600" }}>{selectedExpense.category}</span>
                      </div>
                      <div className="info-block" style={{ marginTop: "8px" }}>
                        <span className="info-lbl" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Date Claimed:</span>
                        <span className="info-val" style={{ fontSize: "0.95rem", fontWeight: "600" }}>{selectedExpense.date}</span>
                      </div>
                    </div>

                    <div className="verification-desc-block" style={{ marginBottom: "20px", fontSize: "0.88rem" }}>
                      <strong>Submission Reason & Details:</strong>
                      <p style={{ marginTop: "4px", color: "var(--text-secondary)", fontStyle: "italic" }}>"{selectedExpense.description}"</p>
                    </div>

                    <div className="verification-attachment-block" style={{ marginBottom: "20px" }}>
                      <strong>Receipt Attachment Record:</strong>
                      <div className="mock-receipt-placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", border: "1.5px dashed var(--border-color)", background: "var(--bg-tertiary)", borderRadius: "8px", marginTop: "8px" }}>
                        <span className="receipt-icon" style={{ fontSize: "2rem" }}>📄</span>
                        <p style={{ fontSize: "0.85rem", fontWeight: "600", margin: "6px 0" }}>RECEIPT DIGITAL FILE ATTACHED</p>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Verified GST invoice matching amount: ₹{selectedExpense.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="verification-action-form">
                      <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Reviewer Remarks (Remarks mandatory for rejection)</label>
                        <textarea
                          placeholder="State approval notes or explanation for rejection..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          style={{ width: "100%", height: "70px", padding: "10px", border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", resize: "none", fontSize: "0.85rem" }}
                        />
                      </div>

                      <div className="action-button-group" style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                        <button 
                          className="luxury-button approve"
                          onClick={() => handleVerify("Approved")}
                          style={{ flex: "1", padding: "12px", color: "#fff" }}
                        >
                          ✓ Approve Claim
                        </button>
                        <button 
                          className="luxury-button revise"
                          onClick={() => handleVerify("Rejected")}
                          style={{ flex: "1", padding: "12px", backgroundColor: "var(--color-error)", color: "#fff" }}
                        >
                          ⚠ Reject Claim
                        </button>
                      </div>
                    </div>
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

      {activeTab === "reports" && (
        <LedgerReports />
      )}
    </div>
  );
}
