import React from "react";
import { useApp } from "../context/AppContext";

export default function AttendanceManager() {
  const { users } = useApp();
  const consultants = users.filter(u => u.role === "Consultant");

  return (
    <div className="attendance-manager glass-card" style={{ padding: "24px" }}>
      <h3 style={{ marginBottom: "16px", color: "var(--bg-sidebar)" }}>Attendance Manager</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="luxury-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {consultants.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.role}</td>
                <td>{c.department || "General"}</td>
                <td><span className="role-badge active">{c.status || "Active"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
