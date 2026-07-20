import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import logoImg from "../assets/logo.png";

export default function RegisterView({ onCancel, initialToken }) {
  const { users, completeConsultantRegistration, setToast } = useApp();

  const [tokenInput, setTokenInput] = useState(initialToken || "");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialization, setSpecialization] = useState("Retail Jewellery BD");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [bankUpi, setBankUpi] = useState("");
  const [location, setLocation] = useState("Mumbai / Showroom Site");

  // Get all pending candidates
  const pendingUsers = users.filter(u => u.status === "Pending Onboarding" || u.inviteToken);

  useEffect(() => {
    if (initialToken) {
      const found = users.find(u => u.inviteToken === initialToken || u.id === initialToken);
      if (found) {
        setSelectedCandidate(found);
        setTokenInput(found.inviteToken || found.id);
      }
    } else if (pendingUsers.length > 0 && !selectedCandidate) {
      setSelectedCandidate(pendingUsers[0]);
      setTokenInput(pendingUsers[0].inviteToken || pendingUsers[0].id);
    }
  }, [initialToken, users]);

  const handleSelectCandidate = (tok) => {
    setTokenInput(tok);
    const found = users.find(u => u.inviteToken === tok || u.id === tok);
    if (found) {
      setSelectedCandidate(found);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      setToast({ message: "No valid onboarding candidate selected.", type: "error" });
      return;
    }

    if (!password || password.length < 4) {
      setToast({ message: "Password must be at least 4 characters long.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ message: "Passwords do not match.", type: "error" });
      return;
    }

    if (emergencyContact && emergencyContact.length !== 10) {
      setToast({ message: "Emergency contact number must be exactly 10 digits.", type: "error" });
      return;
    }

    const success = completeConsultantRegistration({
      userId: selectedCandidate.id,
      inviteToken: selectedCandidate.inviteToken,
      password,
      specialization,
      emergencyContact,
      bankUpi,
      location
    });

    if (success) {
      setToast({ message: `Welcome ${selectedCandidate.name}! Self-registration complete. You are now logged in.`, type: "success" });
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      boxSizing: "border-box"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #cbd5e1",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        width: "100%",
        maxWidth: "600px",
        overflow: "hidden"
      }}>
        
        {/* Header */}
        <div style={{
          background: "#0f172a",
          color: "#ffffff",
          padding: "28px 32px",
          display: "flex",
          justify: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <img src={logoImg} alt="ACME Logo" style={{ height: "32px", objectFit: "contain", background: "#fff", padding: "3px 6px", borderRadius: "6px" }} />
              <span style={{ fontSize: "0.75rem", background: "#2563eb", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
                ONBOARDING PORTAL
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800" }}>Consultant Self-Registration</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
              Complete your profile registration to access your consultant hub
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Candidate Selector if multiple invites exist */}
        {pendingUsers.length > 0 && (
          <div style={{ background: "#f8fafc", padding: "16px 32px", borderBottom: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
              Select Onboarding Candidate / Invite Code:
            </label>
            <select
              value={tokenInput}
              onChange={e => handleSelectCandidate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.9rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: "600"
              }}
            >
              {pendingUsers.map(u => (
                <option key={u.id} value={u.inviteToken || u.id}>
                  {u.name} ({u.email}) — Invite: {u.inviteToken || u.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Verification Card */}
        {selectedCandidate ? (
          <form onSubmit={handleSubmit} style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Admin Verified Badge */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: "800", textTransform: "uppercase" }}>
                ✓ Admin Pre-Verified Details
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px", fontSize: "0.88rem" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Full Name:</span>
                  <div style={{ fontWeight: "700", color: "#0f172a" }}>{selectedCandidate.name}</div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Email ID:</span>
                  <div style={{ fontWeight: "700", color: "#0f172a" }}>{selectedCandidate.email}</div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Mobile Number:</span>
                  <div style={{ fontWeight: "700", color: "#0f172a" }}>+91 {selectedCandidate.phone || "9876543210"}</div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Designation:</span>
                  <div style={{ fontWeight: "700", color: "#2563eb" }}>{selectedCandidate.title || "Retail BD Consultant"}</div>
                </div>
              </div>
            </div>

            {/* Create Password */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Create Account Password *
                </label>
                <input
                  type="password"
                  placeholder="Set your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                  required
                />
              </div>
            </div>

            {/* Specialization & Base Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Primary Specialization
                </label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "#fff",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="Retail Jewellery BD">Retail Jewellery BD</option>
                  <option value="Gold Sourcing & Inventory Audit">Gold Sourcing & Inventory Audit</option>
                  <option value="Multi-Store Operations">Multi-Store Operations</option>
                  <option value="Bridal Collection Advisory">Bridal Collection Advisory</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Primary Work Location
                </label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "#fff",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="Mumbai / Showroom Site">Mumbai / Showroom Site</option>
                  <option value="Hyderabad / HQ">Hyderabad / HQ</option>
                  <option value="Bengaluru / South Region">Bengaluru / South Region</option>
                  <option value="Surat / Diamond Desk">Surat / Diamond Desk</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact & Bank UPI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Emergency Contact (10 Digits)
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit number"
                  value={emergencyContact}
                  maxLength={10}
                  onChange={e => setEmergencyContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Bank UPI / Reimbursement ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. name@okaxis or Bank A/C"
                  value={bankUpi}
                  onChange={e => setBankUpi(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 28px",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                }}
              >
                Complete Onboarding & Access Portal ➔
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <p style={{ fontSize: "1.05rem", fontWeight: "600" }}>No pending onboarding invitations found.</p>
            <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Please ask your HR Admin to send an onboarding invitation first!</p>
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  marginTop: "16px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Back to Login
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
