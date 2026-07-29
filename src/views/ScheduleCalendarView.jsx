import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function ScheduleCalendarView() {
  const { schedules, addSchedule, deleteSchedule, projects, users, currentUser, setToast } = useApp();

  // Current view mode: 'Week', 'Day', 'Month'
  const [viewMode, setViewMode] = useState("Week");

  // Selected date state (defaults to 2026-07-27)
  const [currentDate, setCurrentDate] = useState(new Date("2026-07-27"));
  const [selectedDay, setSelectedDay] = useState("2026-07-27");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schTitle, setSchTitle] = useState("");
  const [schCategory, setSchCategory] = useState("Client Meeting");
  const [schDate, setSchDate] = useState("2026-07-27");
  const [schStartTime, setSchStartTime] = useState("10:00 AM");
  const [schEndTime, setSchEndTime] = useState("12:00 PM");
  const [schProject, setSchProject] = useState(projects?.[0]?.code || "PRJ-101");
  const [schConsultant, setSchConsultant] = useState(currentUser?.name || "Sayed");
  const [schColor, setSchColor] = useState("blue");

  // Month Names & Short Days
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper date format YYYY-MM-DD
  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to get days for current week (Sun-Sat)
  const getWeekDays = (baseDate) => {
    const start = new Date(baseDate);
    const day = start.getDay();
    const diff = start.getDate() - day; // Sunday start
    const sun = new Date(start.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(sun);
      next.setDate(sun.getDate() + i);
      week.push(next);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);

  // Strictly Work Hours 10:00 AM to 7:00 PM
  const timeSlots = [
    "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM"
  ];

  // Helper to calculate card top offset and height in timeline grid (10 AM start, 65px row height)
  const getTimePosition = (startTimeStr, endTimeStr) => {
    const parseHour = (str) => {
      if (!str) return 10;
      const parts = str.trim().split(" ");
      const [hStr, mStr] = parts[0].split(":");
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr || "0", 10);
      const isPM = parts[1]?.toUpperCase() === "PM";
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return h + m / 60;
    };

    const startH = parseHour(startTimeStr);
    const endH = parseHour(endTimeStr);

    // Grid starts at 10 AM (10.0) and ends at 7 PM (19.0)
    // Total row height is 65px
    const top = Math.max(0, (startH - 10) * 65);
    const height = Math.max(45, (endH - startH) * 65);

    return { top: `${top}px`, height: `${height}px` };
  };

  // Modern Linear/Google style Color Mapping with left border accent
  const getColorStyle = (colorName) => {
    switch (colorName) {
      case "purple":
        return { background: "#faf5ff", border: "1px solid #e9d5ff", borderLeft: "4px solid #9333ea", color: "#6b21a8" };
      case "orange":
        return { background: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "4px solid #ea580c", color: "#c2410c" };
      case "green":
        return { background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a", color: "#15803d" };
      case "red":
        return { background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "4px solid #dc2626", color: "#b91c1c" };
      case "blue":
      default:
        return { background: "#eff6ff", border: "1px solid #bfdbfe", borderLeft: "4px solid #2563eb", color: "#1e40af" };
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date("2026-07-27");
    setCurrentDate(today);
    setSelectedDay("2026-07-27");
  };

  // Create Schedule submit
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!schTitle.trim()) {
      if (setToast) setToast({ message: "Please enter a schedule title.", type: "error" });
      return;
    }

    const selectedProj = projects?.find(p => p.code === schProject);

    addSchedule({
      title: schTitle,
      category: schCategory,
      date: schDate,
      startTime: schStartTime,
      endTime: schEndTime,
      projectCode: schProject,
      projectName: selectedProj ? selectedProj.name : schProject,
      consultant: schConsultant,
      color: schColor
    });

    if (setToast) setToast({ message: `Schedule '${schTitle}' created successfully!`, type: "success" });

    setSchTitle("");
    setShowCreateModal(false);
  };

  // Today schedule filter for right sidebar
  const todaySchedules = schedules?.filter(s => s.date === selectedDay) || [];

  return (
    <div className="schedule-calendar-container" style={{ display: "flex", gap: "24px", padding: "24px", background: "#f8fafc", minHeight: "calc(100vh - 80px)", fontFamily: "Inter, sans-serif" }}>
      
      {/* LEFT / MAIN CALENDAR WORKSPACE */}
      <div style={{ flex: 1, background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
        
        {/* Workspace Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Calendar</h1>
            <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "4px 0 0 0" }}>Workplace Schedule & Field Operations Planner (10:00 AM – 7:00 PM)</p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" }}
          >
            <span>+</span> Create Schedule
          </button>
        </div>

        {/* View Switcher Bar & Month Navigator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
          
          {/* Month Navigator */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleToday}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0 14px", height: "32px", cursor: "pointer", fontWeight: "700", fontSize: "0.82rem", color: "#475569" }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
              >
                ›
              </button>
            </div>
          </div>

          {/* View Mode Pills (Week / Day / Month) */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "4px", border: "1px solid #e2e8f0" }}>
            {["Week", "Day", "Month"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? "#ffffff" : "transparent",
                  color: viewMode === mode ? "#4f46e5" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 18px",
                  fontWeight: "700",
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  boxShadow: viewMode === mode ? "0 2px 4px rgba(0,0,0,0.08)" : "none"
                }}
              >
                {mode}
              </button>
            ))}
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 1: DAY VIEW (NO TOP DAYS BAR - 10 AM to 7 PM)      */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Day" && (
          <div>
            {/* Day Header Banner (e.g. Monday, 27 July 2026) */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: "800", textTransform: "uppercase" }}>SELECTED DAY SCHEDULE</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1e3a8a", margin: "2px 0 0 0" }}>
                  {new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h3>
              </div>
              <span style={{ background: "#2563eb", color: "#ffffff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                {schedules?.filter(s => s.date === selectedDay).length || 0} Tasks Scheduled
              </span>
            </div>

            {/* Single-Column Timeline (10 AM to 7 PM) */}
            <div style={{ position: "relative", borderTop: "1px solid #e2e8f0" }}>
              {timeSlots.map((time, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr", height: "65px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700", transform: "translateY(-10px)" }}>
                    {time}
                  </div>
                  <div style={{ borderLeft: "1px solid #e2e8f0" }} />
                </div>
              ))}

              {/* Event Cards Rendered Full-Width in Day Mode */}
              <div style={{ position: "absolute", top: 0, left: "80px", right: 0, bottom: 0, pointerEvents: "none" }}>
                {schedules?.filter(s => s.date === selectedDay).map((sch) => {
                  const pos = getTimePosition(sch.startTime, sch.endTime);
                  const colorStyle = getColorStyle(sch.color);

                  return (
                    <div
                      key={sch.id}
                      onClick={() => {
                        if (window.confirm(`Delete schedule '${sch.title}'?`)) deleteSchedule(sch.id);
                      }}
                      style={{
                        position: "absolute",
                        top: pos.top,
                        height: pos.height,
                        left: "12px",
                        right: "12px",
                        borderRadius: "10px",
                        padding: "12px 18px",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        zIndex: 5,
                        ...colorStyle
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "2px" }}>{sch.title}</div>
                        <div style={{ fontSize: "0.78rem", opacity: 0.85, fontWeight: "600" }}>
                          ⏰ {sch.startTime} - {sch.endTime} • <span style={{ fontWeight: "700" }}>{sch.projectName}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", background: "rgba(255,255,255,0.7)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.08)" }}>
                          {sch.category}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", opacity: 0.8 }}>👤 {sch.consultant}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 2: WEEK VIEW (TOP DAYS HEADER BAR - 10 AM to 7 PM)  */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Week" && (
          <div>
            {/* Days Header Row (Sun to Sat) */}
            <div style={{ display: "grid", gridTemplateColumns: "70px repeat(7, 1fr)", gap: "8px", marginBottom: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700" }}>GMT +05:30</div>
              {weekDays.map((d, index) => {
                const dateYmd = formatYMD(d);
                const isSelected = dateYmd === selectedDay;
                const isToday = dateYmd === "2026-07-27";

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDay(dateYmd)}
                    style={{ cursor: "pointer", padding: "6px 0" }}
                  >
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>
                      {dayNamesShort[d.getDay()]}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: isSelected ? "#4f46e5" : isToday ? "#eff6ff" : "transparent",
                        color: isSelected ? "#ffffff" : isToday ? "#2563eb" : "#0f172a",
                        fontWeight: "800",
                        fontSize: "0.92rem",
                        boxShadow: isSelected ? "0 2px 6px rgba(79,70,229,0.3)" : "none"
                      }}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hourly Timeline Grid (10 AM - 7 PM) */}
            <div style={{ position: "relative", borderTop: "1px solid #e2e8f0" }}>
              {timeSlots.map((time, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "70px 1fr", height: "65px", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700", transform: "translateY(-10px)" }}>
                    {time}
                  </div>
                  <div style={{ borderLeft: "1px solid #f1f5f9" }} />
                </div>
              ))}

              {/* Red Current Time Marker (12:46 PM) */}
              <div style={{ position: "absolute", top: "180px", left: "60px", right: 0, height: "2px", background: "#ef4444", zIndex: 10, display: "flex", alignItems: "center" }}>
                <div style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", transform: "translateX(-48px)" }}>
                  12:46 PM
                </div>
                <div style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", transform: "translateX(-4px)" }} />
              </div>

              {/* Render Schedule Cards on 7-Column Grid */}
              <div style={{ position: "absolute", top: 0, left: "70px", right: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", pointerEvents: "none" }}>
                {weekDays.map((d, colIdx) => {
                  const dateYmd = formatYMD(d);
                  const daySchedules = schedules?.filter(s => s.date === dateYmd) || [];

                  return (
                    <div key={colIdx} style={{ position: "relative", height: "100%" }}>
                      {daySchedules.map((sch) => {
                        const pos = getTimePosition(sch.startTime, sch.endTime);
                        const colorStyle = getColorStyle(sch.color);

                        return (
                          <div
                            key={sch.id}
                            onClick={() => {
                              if (window.confirm(`Delete schedule '${sch.title}'?`)) deleteSchedule(sch.id);
                            }}
                            style={{
                              position: "absolute",
                              top: pos.top,
                              height: pos.height,
                              left: "3px",
                              right: "3px",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              pointerEvents: "auto",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                              zIndex: 5,
                              overflow: "hidden",
                              ...colorStyle
                            }}
                          >
                            <div style={{ fontSize: "0.8rem", fontWeight: "800", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {sch.title}
                            </div>
                            <div style={{ fontSize: "0.7rem", opacity: 0.85, fontWeight: "600" }}>
                              {sch.startTime} - {sch.endTime}
                            </div>
                            <div style={{ marginTop: "4px", fontSize: "0.66rem", fontWeight: "800", background: "rgba(255,255,255,0.7)", padding: "1px 5px", borderRadius: "4px", display: "inline-block" }}>
                              {sch.category}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 3: MONTH VIEW (FULL 7x5 MONTH EVENT BOX GRID)       */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Month" && (
          <div>
            {/* Days of Week Header Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#e2e8f0", border: "1px solid #e2e8f0", borderRadius: "8px 8px 0 0", textAlign: "center" }}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                <div key={i} style={{ background: "#f8fafc", padding: "10px", fontSize: "0.8rem", fontWeight: "800", color: "#475569" }}>
                  {day}
                </div>
              ))}
            </div>

            {/* 7x5 Month Grid Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#e2e8f0", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const dateStr = `2026-07-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = schedules?.filter(s => s.date === dateStr) || [];
                const isSelected = dateStr === selectedDay;

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      setSelectedDay(dateStr);
                      setViewMode("Day");
                    }}
                    style={{
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      minHeight: "105px",
                      padding: "8px",
                      cursor: "pointer",
                      transition: "background 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "0.84rem",
                        fontWeight: "800",
                        color: isSelected ? "#2563eb" : "#334155",
                        background: isSelected ? "#dbeafe" : "transparent",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#4f46e5", background: "#eef2ff", padding: "1px 6px", borderRadius: "10px" }}>
                          {dayEvents.length} items
                        </span>
                      )}
                    </div>

                    {/* Stacked Event Badges inside day box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {dayEvents.map(sch => {
                        const colorStyle = getColorStyle(sch.color);
                        return (
                          <div
                            key={sch.id}
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              padding: "3px 6px",
                              borderRadius: "4px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              ...colorStyle
                            }}
                          >
                            {sch.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* RIGHT SIDEBAR: MINI MONTH DATEPICKER & TODAY AGENDA */}
      <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Mini Monthly Calendar Widget */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={handlePrevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "700", color: "#64748b" }}>‹</button>
              <button onClick={handleNextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "700", color: "#64748b" }}>›</button>
            </div>
          </div>

          {/* Day Labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", marginBottom: "8px" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <span key={i} style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700" }}>{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const dayStr = `2026-07-${String(d).padStart(2, '0')}`;
              const isSelected = dayStr === selectedDay;

              return (
                <div
                  key={d}
                  onClick={() => setSelectedDay(dayStr)}
                  style={{
                    padding: "6px 0",
                    fontSize: "0.8rem",
                    fontWeight: isSelected ? "800" : "600",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isSelected ? "#4f46e5" : "transparent",
                    color: isSelected ? "#ffffff" : "#334155"
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Summary */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Day Agenda</h3>
            <span style={{ fontSize: "0.78rem", color: "#4f46e5", fontWeight: "700", cursor: "pointer" }} onClick={() => setViewMode("Day")}>View Full Day →</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 16px 0", fontWeight: "600" }}>{selectedDay}</p>

          {todaySchedules.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {todaySchedules.map((sch) => {
                const colorStyle = getColorStyle(sch.color);

                return (
                  <div
                    key={sch.id}
                    style={{
                      borderRadius: "10px",
                      padding: "12px 14px",
                      ...colorStyle
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.9rem" }}>📋</span>
                      <div style={{ fontSize: "0.88rem", fontWeight: "800" }}>{sch.title}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontWeight: "700", opacity: 0.9 }}>
                      <span>{sch.startTime} - {sch.endTime}</span>
                      <span>{sch.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", fontStyle: "italic" }}>
              No tasks scheduled for {selectedDay}. Click '+ Create Schedule' to add one.
            </div>
          )}

        </div>

      </div>

      {/* CREATE SCHEDULE MODAL (10 AM - 7 PM Bounds) */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "480px", maxWidth: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Create New Schedule</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Schedule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic Photography & Audit"
                  value={schTitle}
                  onChange={(e) => setSchTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Category</label>
                  <select
                    value={schCategory}
                    onChange={(e) => setSchCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem" }}
                  >
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Site Audit">Site Audit</option>
                    <option value="Field Audit">Field Audit</option>
                    <option value="Team Call">Team Call</option>
                    <option value="Client Review">Client Review</option>
                    <option value="Internal Audit">Internal Audit</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Color Theme</label>
                  <select
                    value={schColor}
                    onChange={(e) => setSchColor(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem" }}
                  >
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Date</label>
                <input
                  type="date"
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Start Time (10 AM - 7 PM)</label>
                  <select
                    value={schStartTime}
                    onChange={(e) => setSchStartTime(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem" }}
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>End Time (10 AM - 7 PM)</label>
                  <select
                    value={schEndTime}
                    onChange={(e) => setSchEndTime(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem" }}
                  >
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "10px 18px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", border: "none", borderRadius: "8px", background: "#4f46e5", color: "#ffffff", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Save Schedule
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
