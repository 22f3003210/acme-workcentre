import React from "react";

export default function LoadingSpinner() {
  return (
    <div
      className="loading-spinner-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        padding: "40px",
        gap: "16px"
      }}
    >
      <div
        className="spinner"
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(37, 99, 235, 0.15)",
          borderTop: "4px solid #2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "#64748b" }}>
        Loading ACME Workcentre...
      </span>
    </div>
  );
}
