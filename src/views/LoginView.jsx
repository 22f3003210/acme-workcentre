import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import logoImg from "../assets/logo.png";

export default function LoginView({ onOpenRegister }) {
  const { login, sendOtp, verifyOtp, users } = useApp();
  
  // Login form state
  const [method, setMethod] = useState("email"); // 'email' or 'phone'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // OTP state
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedSms, setSimulatedSms] = useState("");
  
  // Errors and feedback
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your corporate email address.");
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError("No registered staff account found matching that email. Please check spelling.");
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError("");
    setSimulatedSms("");

    if (!phone.trim()) {
      setError("Please enter your registered mobile number.");
      return;
    }

    const code = sendOtp(phone);
    if (code) {
      setOtpSent(true);
      setSimulatedSms(`Code sent to ${phone}: ${code}`);
    } else {
      setError("Mobile number not recognized in the system. Use the Admin details: +1 (555) 019-9302.");
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");

    if (!otpCode.trim()) {
      setError("Please input the 6-digit code.");
      return;
    }

    const success = verifyOtp(phone, otpCode);
    if (success) {
      setOtpSent(false);
      setSimulatedSms("");
    } else {
      setError("Incorrect verification code. Please check the simulated SMS code above or enter bypass '123456'.");
    }
  };

  return (
    <div className="login-landing-container">
      
      {/* LEFT SIDE PANEL: MIDNIGHT BLUE GRADIENT WITH WELCOME TITLE */}
      <div className="login-brand-panel">
        <div className="brand-panel-content-centered">
          <h1>Welcome to Acme Portal !!</h1>
          <p className="brand-subtitle">From Concept to Cash-Flow, All-in-One Operations Desk for Consultants</p>
        </div>
      </div>

      {/* RIGHT SIDE PANEL: CREDENTIALS SIGN IN */}
      <div className="login-form-panel">
        <div className="form-panel-content">
          
          {/* Bigger corporate logo render */}
          <div className="login-logo-holder">
            <img
              src={logoImg}
              className="login-logo-img"
              alt="Acme Consulting Logo"
              style={{ width: "420px", maxWidth: "95%", height: "auto", objectFit: "contain" }}
            />
          </div>

          {/* Switch method bar */}
          <div className="login-method-bar">
            <button
              onClick={() => {
                setMethod("email");
                setError("");
                setSimulatedSms("");
                setOtpSent(false);
              }}
              className={`login-method-btn ${method === "email" ? "active" : ""}`}
            >
              Email Login
            </button>
            <button
              onClick={() => {
                setMethod("phone");
                setError("");
                setSimulatedSms("");
                setOtpSent(false);
              }}
              className={`login-method-btn ${method === "phone" ? "active" : ""}`}
            >
              Mobile & OTP Login
            </button>
          </div>

          {/* SMS bypass simulated banner */}
          {simulatedSms && (
            <div className="sms-simulator-banner" style={{ width: "100%" }}>
              📱 {simulatedSms}
            </div>
          )}

          {error && (
            <div className="login-error-alert">
              <span>⚠</span>
              <p>{error}</p>
            </div>
          )}

          {/* Email form */}
          {method === "email" ? (
            <form onSubmit={handleEmailSubmit} style={{ width: "100%" }}>
              <div className="form-group-with-icon">
                <label htmlFor="email-input">User ID / Email</label>
                <div className="input-icon-wrapper">
                  <input
                    id="email-input"
                    type="text"
                    placeholder="name@workcentre.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "14px" }}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group-with-icon">
                <label htmlFor="password-input">Password</label>
                <div className="input-icon-wrapper">
                  <input
                    id="password-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "14px" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", width: "100%" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "500" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: "15px", height: "15px", cursor: "pointer" }}
                  />
                  Keep me signed in
                </label>
                <span style={{ fontSize: "0.85rem", color: "#2563EB", cursor: "pointer", fontWeight: "500" }}>Forgot password?</span>
              </div>

              <button type="submit" className="login-submit-btn">
                Sign in
              </button>
            </form>
          ) : (
            /* Phone OTP form */
            <form onSubmit={!otpSent ? handleSendOtp : handleVerifyOtp} style={{ width: "100%" }}>
              <div className="form-group-with-icon">
                <label htmlFor="phone-input">Mobile Number</label>
                <div className="input-icon-wrapper">
                  <input
                    id="phone-input"
                    type="text"
                    placeholder="+1 (555) 019-9302"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    style={{ paddingLeft: "14px" }}
                    required
                  />
                </div>
              </div>
              
              {otpSent && (
                <div className="form-group-with-icon">
                  <label htmlFor="otp-input">Verification Code</label>
                  <div className="input-icon-wrapper">
                    <input
                      id="otp-input"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      style={{ paddingLeft: "14px" }}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="login-submit-btn">
                {!otpSent ? "Send Verification Code" : "Verify & Sign In →"}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--gold-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "center",
                    marginTop: "12px",
                    width: "100%"
                  }}
                >
                  Resend OTP Code
                </button>
              )}
            </form>
          )}

          {/* Candidate Self-Registration Link */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.12)", textAlign: "center" }}>
            <button
              type="button"
              onClick={onOpenRegister}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Received an Onboarding Invite? Complete Self-Registration ➔
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}
