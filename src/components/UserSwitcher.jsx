import React from "react";
import { useApp } from "../context/AppContext";

export default function UserSwitcher() {
  const { users, currentUser, switchUser } = useApp();

  return (
    <div className="user-switcher-bar">
      <div className="switcher-content">
        <div className="active-badge">
          <div className="pulse-indicator"></div>
          <span>Workcentre System Demo: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
        </div>
        
        <div className="switcher-actions">
          <label htmlFor="user-select">Select Login Account:</label>
          <select 
            id="user-select" 
            value={currentUser.id} 
            onChange={(e) => switchUser(e.target.value)}
            className="luxury-select"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} - {u.role} ({u.title})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
