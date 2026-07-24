import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function AddEmployeeWizard() {
  const navigate = useNavigate();
  const {
    jobTitles,
    departments,
    numberSeries,
    shifts,
    weeklyOffs,
    addUser,
    setToast
  } = useApp();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Details
  const [workCountry, setWorkCountry] = useState("India");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [empCode, setEmpCode] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Step 2: Job Details
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [jobTitle, setJobTitle] = useState("");
  const [secondaryJobTitle, setSecondaryJobTitle] = useState("");
  const [showSecondaryJobTitle, setShowSecondaryJobTitle] = useState(false);
  const [department, setDepartment] = useState("");
  const [timeType, setTimeType] = useState("Full Time");

  // Step 3: Work Details
  const [inviteToLogin, setInviteToLogin] = useState(false);
  const [leavePlan, setLeavePlan] = useState("Standard Leave Plan");
  const [attendanceTracking, setAttendanceTracking] = useState(true);
  const [shift, setShift] = useState("General Shift (9 AM - 6 PM)");
  const [weeklyOff, setWeeklyOff] = useState("Sunday");
  const [timeTrackingPolicy, setTimeTrackingPolicy] = useState("Attendance Capture Scheme");
  const [expensePolicy, setExpensePolicy] = useState("Standard Expense Policy");
  const [advancePolicy, setAdvancePolicy] = useState("Standard Advance Policy");

  // Step 4: Compensation
  const [currency, setCurrency] = useState("INR");
  const [annualCtc, setAnnualCtc] = useState("");

  // Auto-fill Display Name when First or Last Name changes
  useEffect(() => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn || ln) {
      setDisplayName(`${fn} ${ln}`.trim());
    }
  }, [firstName, lastName]);

  // Set default series if available and auto-generate code
  useEffect(() => {
    if (numberSeries && numberSeries.length > 0 && !selectedSeriesId) {
      setSelectedSeriesId(numberSeries[0].id);
      generateEmpCode(numberSeries[0]);
    }
  }, [numberSeries]);

  const handleSeriesChange = (seriesId) => {
    setSelectedSeriesId(seriesId);
    const series = numberSeries.find(s => s.id === seriesId);
    if (series) {
      generateEmpCode(series);
    }
  };

  const generateEmpCode = (series) => {
    const prefix = series.prefix || "";
    const digits = series.digits || 3;
    const nextNum = series.nextNumber || 101;
    const suffix = series.suffix || "";
    const numStr = String(nextNum).padStart(digits, "0");
    setEmpCode(`${prefix}${numStr}${suffix}`);
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim() || !workEmail.trim()) {
        alert("Please fill in all required fields: First Name, Last Name, and Work Email.");
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newEmpData = {
      empCode: empCode || `EMP-${Date.now().toString().slice(-4)}`,
      name: displayName || `${firstName} ${lastName}`.trim(),
      email: workEmail.trim().toLowerCase(),
      phone: mobileNumber,
      role: "Consultant",
      title: jobTitle || (jobTitles[0] ? (typeof jobTitles[0] === "string" ? jobTitles[0] : jobTitles[0].titleName) : "Consultant"),
      department: department || (departments[0] ? (typeof departments[0] === "string" ? departments[0] : departments[0].name) : "General"),
      location: workCountry === "India" ? "Mumbai / HQ" : workCountry,
      status: "Active",
      // Extended onboarding fields
      firstName,
      middleName,
      lastName,
      displayName,
      gender,
      dob,
      nationality,
      workCountry,
      joiningDate,
      timeType,
      secondaryJobTitle,
      inviteToLogin,
      enableOnboarding,
      leavePlan,
      holidayList,
      attendanceTracking,
      shift,
      weeklyOff,
      timeTrackingPolicy,
      expensePolicy,
      advancePolicy,
      annualCtc: Number(annualCtc) || 0,
      currency
    };

    if (addUser) {
      await addUser(newEmpData);
    }

    if (setToast) {
      setToast({ type: "success", message: `Employee ${newEmpData.name} (${newEmpData.empCode}) onboarded successfully!` });
    }

    navigate("/employee/directory");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px 40px" }}>
      {/* Top Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Add Employee Wizard</h2>
        <button
          type="button"
          onClick={() => navigate("/employee/directory")}
          style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#64748b", cursor: "pointer", padding: "4px 8px" }}
          title="Close Wizard"
        >
          &times;
        </button>
      </div>

      {/* Stepper Header Navigation */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px 32px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "800px", margin: "0 auto" }}>
          {[
            { step: 1, label: "BASIC DETAILS" },
            { step: 2, label: "JOB DETAILS" },
            { step: 3, label: "WORK DETAILS" },
            { step: 4, label: "COMPENSATION" }
          ].map((item, idx, arr) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <React.Fragment key={item.step}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: isCompleted ? "pointer" : "default" }} onClick={() => isCompleted && setCurrentStep(item.step)}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: isActive ? "#5b50a1" : isCompleted ? "#22c55e" : "#f1f5f9",
                      color: isActive || isCompleted ? "#ffffff" : "#64748b",
                      border: isActive ? "none" : isCompleted ? "none" : "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "0.85rem"
                    }}
                  >
                    {isCompleted ? "✓" : item.step}
                  </div>
                  <span style={{ fontSize: "0.78rem", fontWeight: isActive ? "700" : "500", color: isActive ? "#0f172a" : "#64748b", letterSpacing: "0.04em" }}>
                    {item.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: currentStep > item.step ? "#5b50a1" : "#e2e8f0", margin: "0 16px" }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Form Area */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "32px", maxWidth: "960px", margin: "0 auto", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        
        {/* STEP 1: BASIC DETAILS */}
        {currentStep === 1 && (
          <form onSubmit={handleNext}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Work Country</label>
                <select value={workCountry} onChange={e => setWorkCountry(e.target.value)} style={selectStyle}>
                  <option value="India">India</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>First Name *</label>
                <input type="text" required placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Middle Name</label>
                <input type="text" placeholder="Middle Name" value={middleName} onChange={e => setMiddleName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Last Name *</label>
                <input type="text" required placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Display Name *</label>
                <input type="text" required placeholder="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Gender *</label>
                <select value={gender} onChange={e => setGender(e.target.value)} required style={selectStyle}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Date of Birth *</label>
                <input type="date" required value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Nationality *</label>
                <select value={nationality} onChange={e => setNationality(e.target.value)} style={selectStyle}>
                  <option value="Indian">Indian</option>
                  <option value="Emirati">Emirati</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Number Series</label>
                <select value={selectedSeriesId} onChange={e => handleSeriesChange(e.target.value)} style={selectStyle}>
                  {numberSeries && numberSeries.length > 0 ? (
                    numberSeries.map(ns => (
                      <option key={ns.id} value={ns.id}>{ns.seriesName} ({ns.prefix || "No prefix"})</option>
                    ))
                  ) : (
                    <option value="">Default Number Series</option>
                  )}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Employee Number *</label>
                <input type="text" required value={empCode} onChange={e => setEmpCode(e.target.value)} style={{ ...inputStyle, background: "#f8fafc", fontWeight: "700" }} />
              </div>
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginTop: "32px", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              Contact Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div>
                <label style={labelStyle}>Work Email *</label>
                <input type="email" required placeholder="Work Email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Mobile Number</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ padding: "10px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.85rem", color: "#475569", fontWeight: "600" }}>+91</span>
                  <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
              <button type="button" onClick={() => navigate("/employee/directory")} style={secondaryBtnStyle}>Cancel</button>
              <button type="submit" style={primaryBtnStyle}>Continue</button>
            </div>
          </form>
        )}

        {/* STEP 2: JOB DETAILS */}
        {currentStep === 2 && (
          <form onSubmit={handleNext}>
            <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: "6px", padding: "12px 16px", color: "#0369a1", fontSize: "0.85rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>ℹ️</span> Policies are pre filled based on the rules defined as per policy
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>Employment Details</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Joining Date *</label>
                <input type="date" required value={joiningDate} onChange={e => setJoiningDate(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Job Title *</label>
                <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={selectStyle}>
                  <option value="">Select Job Title</option>
                  {jobTitles.map((jt, idx) => {
                    const name = typeof jt === "string" ? jt : (jt.titleName || jt.name);
                    return <option key={idx} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                {!showSecondaryJobTitle ? (
                  <button type="button" onClick={() => setShowSecondaryJobTitle(true)} style={{ background: "none", border: "none", color: "#5b50a1", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>
                    + Add secondary job title
                  </button>
                ) : (
                  <div>
                    <label style={labelStyle}>Secondary Job Title</label>
                    <input type="text" placeholder="Secondary Job Title" value={secondaryJobTitle} onChange={e => setSecondaryJobTitle(e.target.value)} style={inputStyle} />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} style={selectStyle}>
                  <option value="">Select Department</option>
                  {departments.map((d, idx) => {
                    const name = typeof d === "string" ? d : (d.dept_name || d.name);
                    return <option key={idx} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Time Type *</label>
                <select value={timeType} onChange={e => setTimeType(e.target.value)} style={selectStyle}>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
              <button type="button" onClick={handleBack} style={secondaryBtnStyle}>Back</button>
              <button type="submit" style={primaryBtnStyle}>Continue</button>
            </div>
          </form>
        )}

        {/* STEP 3: WORK DETAILS */}
        {currentStep === 3 && (
          <form onSubmit={handleNext}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "#1e293b", cursor: "pointer" }}>
                <input type="checkbox" checked={inviteToLogin} onChange={e => setInviteToLogin(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#5b50a1" }} />
                Invite employee to login ℹ️
              </label>
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Leave Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
              <div>
                <label style={labelStyle}>Leave Plan *</label>
                <select value={leavePlan} onChange={e => setLeavePlan(e.target.value)} style={selectStyle}>
                  <option value="Standard Leave Plan">Standard Leave Plan</option>
                  <option value="Executive Leave Plan">Executive Leave Plan</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Attendance Settings</h3>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                <input type="checkbox" checked={attendanceTracking} onChange={e => setAttendanceTracking(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#5b50a1" }} />
                Attendance tracking
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
              <div>
                <label style={labelStyle}>Shift *</label>
                <select value={shift} onChange={e => setShift(e.target.value)} style={selectStyle}>
                  <option value="">Select Shift</option>
                  {shifts.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name} ({s.timings || "General"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Weekly Off *</label>
                <select value={weeklyOff} onChange={e => setWeeklyOff(e.target.value)} style={selectStyle}>
                  <option value="">Select Weekly Off</option>
                  {weeklyOffs.map((w, idx) => (
                    <option key={idx} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Time Tracking Policy *</label>
                <select value={timeTrackingPolicy} onChange={e => setTimeTrackingPolicy(e.target.value)} style={selectStyle}>
                  <option value="Attendance Capture Scheme">Attendance Capture Scheme</option>
                  <option value="Flexible Timing Policy">Flexible Timing Policy</option>
                </select>
              </div>
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Expense & Advance Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div>
                <label style={labelStyle}>Expense Policy</label>
                <select value={expensePolicy} onChange={e => setExpensePolicy(e.target.value)} style={selectStyle}>
                  <option value="Standard Expense Policy">Standard Expense Policy</option>
                  <option value="Executive Expense Policy">Executive Expense Policy</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Advance Policy</label>
                <select value={advancePolicy} onChange={e => setAdvancePolicy(e.target.value)} style={selectStyle}>
                  <option value="Standard Advance Policy">Standard Advance Policy (Up to ₹50,000)</option>
                  <option value="Executive Advance Policy">Executive Advance Policy (Up to ₹2,000,000)</option>
                  <option value="No Advance">No Advance Allowed</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
              <button type="button" onClick={handleBack} style={secondaryBtnStyle}>Back</button>
              <button type="submit" style={primaryBtnStyle}>Save & Continue</button>
            </div>
          </form>
        )}

        {/* STEP 4: COMPENSATION */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>Compensation Details</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div>
                <label style={labelStyle}>Currency *</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={selectStyle}>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (AED)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Annual CTC *</label>
                <input type="number" placeholder="e.g. 1200000" value={annualCtc} onChange={e => setAnnualCtc(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
              <button type="button" onClick={handleBack} style={secondaryBtnStyle}>Back</button>
              <button type="submit" style={{ ...primaryBtnStyle, background: "#22c55e" }}>Complete Onboarding</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: "0.82rem",
  fontWeight: "600",
  color: "#334155",
  display: "block",
  marginBottom: "6px"
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  fontSize: "0.85rem",
  color: "#0f172a",
  background: "#ffffff",
  outline: "none"
};

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  fontSize: "0.85rem",
  color: "#0f172a",
  background: "#ffffff",
  outline: "none"
};

const primaryBtnStyle = {
  padding: "10px 24px",
  background: "#5b50a1",
  border: "none",
  borderRadius: "4px",
  color: "#ffffff",
  fontWeight: "600",
  fontSize: "0.88rem",
  cursor: "pointer"
};

const secondaryBtnStyle = {
  padding: "10px 20px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  color: "#475569",
  fontWeight: "600",
  fontSize: "0.88rem",
  cursor: "pointer"
};
