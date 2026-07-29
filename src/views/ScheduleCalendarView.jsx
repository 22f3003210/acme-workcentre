import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function ScheduleCalendarView() {
  const { schedules, addSchedule, deleteSchedule, projects, users, currentUser, setToast } = useApp();

  // Active view mode: 'Day', 'Week', 'Month', 'Schedule'
  const [viewMode, setViewMode] = useState("Week");

  // Selected date state (defaults to 2026-07-27)
  const [currentDate, setCurrentDate] = useState(new Date("2026-07-27"));
  const [selectedDay, setSelectedDay] = useState("2026-07-27");

  // Category filters
  const [categoryFilters, setCategoryFilters] = useState({
    "Site Audit": true,
    "Client Meeting": true,
    "Field Audit": true,
    "Team Call": true,
    "Client Review": true,
    "Internal Audit": true,
    "Board Sync": true
  });

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
  const dayNamesShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

    const top = Math.max(0, (startH - 10) * 65);
    const height = Math.max(48, (endH - startH) * 65);

    return { top: `${top}px`, height: `${height}px` };
  };

  // Category Emoji Helper
  const getCategoryEmoji = (cat) => {
    switch (cat) {
      case "Site Audit": return "📍 Site Audit";
      case "Client Meeting": return "🤝 Client Meeting";
      case "Field Audit": return "🔍 Field Audit";
      case "Team Call": return "📞 Team Call";
      case "Client Review": return "⭐ Client Review";
      case "Board Sync": return "👑 Board Sync";
      default: return `📋 ${cat}`;
    }
  };

  // Modern Premium Color Palette with Uniform Crisp Borders (No borderLeft corner shading artifacts)
  const getColorStyle = (colorName) => {
    switch (colorName) {
      case "purple":
        return {
          background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
          border: "1px solid #c084fc",
          color: "#6b21a8"
        };
      case "orange":
        return {
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          border: "1px solid #fb923c",
          color: "#c2410c"
        };
      case "green":
        return {
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          border: "1px solid #4ade80",
          color: "#15803d"
        };
      case "red":
        return {
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
          border: "1px solid #f87171",
          color: "#b91c1c"
        };
      case "blue":
      default:
        return {
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          border: "1px solid #60a5fa",
          color: "#1e40af"
        };
    }
  };

  // Filtered schedules based on category checkboxes
  const filteredSchedules = (schedules || []).filter(s => categoryFilters[s.category] !== false);

  // Date navigators
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

  const toggleFilter = (cat) => {
    setCategoryFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Create Submit
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

    if (setToast) setToast({ message: `Event '${schTitle}' created successfully!`, type: "success" });

    setSchTitle("");
    setShowCreateModal(false);
  };

  return (
    <div className="schedule-calendar-workspace" style={{ display: "flex", gap: "24px", padding: "24px", background: "#f8fafc", minHeight: "calc(100vh - 80px)", fontFamily: "Inter, sans-serif" }}>
      
      {/* ----------------------------------------------------------------- */}
      {/* LEFT SIDEBAR: CREATE BUTTON, MINI CALENDAR & CATEGORY FILTERS    */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ width: "270px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* + Create Event Gradient Pill Button */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "28px",
            padding: "14px 26px",
            fontWeight: "800",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 6px 20px rgba(79,70,229,0.3)",
            transition: "transform 0.15s ease"
          }}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>+</span> Create Event
        </button>

        {/* Mini 7x5 Month Datepicker Widget */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={handlePrevMonth} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontWeight: "700", color: "#64748b" }}>‹</button>
              <button onClick={handleNextMonth} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontWeight: "700", color: "#64748b" }}>›</button>
            </div>
          </div>

          {/* Day Labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center", marginBottom: "8px" }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: "800" }}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const dayStr = `2026-07-${String(d).padStart(2, '0')}`;
              const isSelected = dayStr === selectedDay;

              return (
                <div
                  key={d}
                  onClick={() => {
                    setSelectedDay(dayStr);
                    setCurrentDate(new Date(dayStr));
                  }}
                  style={{
                    padding: "6px 0",
                    fontSize: "0.8rem",
                    fontWeight: isSelected ? "800" : "600",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: isSelected ? "#4f46e5" : "transparent",
                    color: isSelected ? "#ffffff" : "#334155",
                    boxShadow: isSelected ? "0 2px 8px rgba(79,70,229,0.3)" : "none"
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories / Calendars Filter Panel */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
          <h4 style={{ fontSize: "0.82rem", fontWeight: "800", color: "#64748b", margin: "0 0 14px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            My Calendars
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { cat: "Site Audit", color: "#2563eb" },
              { cat: "Client Meeting", color: "#2563eb" },
              { cat: "Field Audit", color: "#ea580c" },
              { cat: "Team Call", color: "#9333ea" },
              { cat: "Client Review", color: "#9333ea" },
              { cat: "Board Sync", color: "#dc2626" }
            ].map(item => (
              <label key={item.cat} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.84rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                <input
                  type="checkbox"
                  checked={categoryFilters[item.cat] !== false}
                  onChange={() => toggleFilter(item.cat)}
                  style={{ accentColor: item.color, cursor: "pointer", width: "16px", height: "16px" }}
                />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, boxShadow: `0 0 6px ${item.color}66` }} />
                <span>{item.cat}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA: TOP CONTROL BAR & 4 VIEW MODES                */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ flex: 1, background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
        
        {/* Top Control Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
          
          {/* Navigator Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={handleToday}
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 18px", fontWeight: "700", fontSize: "0.86rem", color: "#334155", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              Today
            </button>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={handlePrevMonth} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", width: "34px", height: "34px", cursor: "pointer", fontWeight: "700", color: "#475569" }}>‹</button>
              <button onClick={handleNextMonth} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", width: "34px", height: "34px", cursor: "pointer", fontWeight: "700", color: "#475569" }}>›</button>
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          {/* View Switcher Pills */}
          <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            {["Day", "Week", "Month", "Schedule"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? "#ffffff" : "transparent",
                  color: viewMode === mode ? "#4f46e5" : "#64748b",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 18px",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: viewMode === mode ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
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
          <div style={{ flex: 1 }}>
            {/* Day Title Header Banner */}
            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(37,99,235,0.06)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>DAY VIEW AGENDA</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e3a8a", margin: "2px 0 0 0" }}>
                  {new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h3>
              </div>
              <span style={{ background: "#2563eb", color: "#ffffff", padding: "6px 16px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}>
                {filteredSchedules.filter(s => s.date === selectedDay).length} Events Scheduled
              </span>
            </div>

            {/* Timeline Grid (10 AM to 7 PM) */}
            <div style={{ position: "relative", borderTop: "1px solid #e2e8f0" }}>
              {timeSlots.map((time, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "85px 1fr", height: "65px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "700", transform: "translateY(-10px)" }}>
                    {time}
                  </div>
                  <div style={{ borderLeft: "1px solid #e2e8f0" }} />
                </div>
              ))}

              {/* Day View Beautified Cards */}
              <div style={{ position: "absolute", top: 0, left: "85px", right: 0, bottom: 0, pointerEvents: "none" }}>
                {filteredSchedules.filter(s => s.date === selectedDay).map((sch) => {
                  const pos = getTimePosition(sch.startTime, sch.endTime);
                  const colorStyle = getColorStyle(sch.color);

                  return (
                    <div
                      key={sch.id}
                      onClick={() => {
                        if (window.confirm(`Delete event '${sch.title}'?`)) deleteSchedule(sch.id);
                      }}
                      style={{
                        position: "absolute",
                        top: pos.top,
                        height: pos.height,
                        left: "14px",
                        right: "14px",
                        borderRadius: "12px",
                        padding: "14px 20px",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        zIndex: 5,
                        ...colorStyle
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "1.02rem", fontWeight: "800", marginBottom: "4px" }}>{sch.title}</div>
                        <div style={{ fontSize: "0.8rem", opacity: 0.9, fontWeight: "600" }}>
                          ⏰ {sch.startTime} - {sch.endTime} • <strong style={{ textDecoration: "underline" }}>{sch.projectName}</strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: "800", background: "rgba(255,255,255,0.85)", padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                          {getCategoryEmoji(sch.category)}
                        </span>
                        <span style={{ fontSize: "0.78rem", fontWeight: "700", background: "rgba(255,255,255,0.7)", padding: "4px 10px", borderRadius: "14px" }}>
                          👤 {sch.consultant}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 2: WEEK VIEW (7 COLUMNS - 10 AM to 7 PM)             */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Week" && (
          <div style={{ flex: 1 }}>
            {/* Week Days Header Row */}
            <div style={{ display: "grid", gridTemplateColumns: "70px repeat(7, 1fr)", gap: "8px", marginBottom: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "800" }}>GMT +05:30</div>
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
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "800", marginBottom: "4px" }}>
                      {dayNamesShort[d.getDay()]}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isSelected ? "#4f46e5" : isToday ? "#eff6ff" : "transparent",
                        color: isSelected ? "#ffffff" : isToday ? "#2563eb" : "#0f172a",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        boxShadow: isSelected ? "0 4px 10px rgba(79,70,229,0.35)" : "none"
                      }}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline Grid (10 AM to 7 PM) */}
            <div style={{ position: "relative", borderTop: "1px solid #e2e8f0" }}>
              {timeSlots.map((time, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "70px 1fr", height: "65px", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700", transform: "translateY(-10px)" }}>
                    {time}
                  </div>
                  <div style={{ borderLeft: "1px solid #f1f5f9" }} />
                </div>
              ))}

              {/* Red Current Time Line Indicator (12:46 PM) */}
              <div style={{ position: "absolute", top: "180px", left: "60px", right: 0, height: "2px", background: "#ef4444", zIndex: 10, display: "flex", alignItems: "center" }}>
                <div style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", transform: "translateX(-48px)" }}>
                  12:46 PM
                </div>
                <div style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", transform: "translateX(-4px)" }} />
              </div>

              {/* Event Cards Rendered in 7 Columns */}
              <div style={{ position: "absolute", top: 0, left: "70px", right: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", pointerEvents: "none" }}>
                {weekDays.map((d, colIdx) => {
                  const dateYmd = formatYMD(d);
                  const daySchedules = filteredSchedules.filter(s => s.date === dateYmd);

                  return (
                    <div key={colIdx} style={{ position: "relative", height: "100%" }}>
                      {daySchedules.map((sch) => {
                        const pos = getTimePosition(sch.startTime, sch.endTime);
                        const colorStyle = getColorStyle(sch.color);

                        return (
                          <div
                            key={sch.id}
                            onClick={() => {
                              if (window.confirm(`Delete event '${sch.title}'?`)) deleteSchedule(sch.id);
                            }}
                            style={{
                              position: "absolute",
                              top: pos.top,
                              height: pos.height,
                              left: "3px",
                              right: "3px",
                              borderRadius: "10px",
                              padding: "9px 11px",
                              pointerEvents: "auto",
                              cursor: "pointer",
                              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
                              zIndex: 5,
                              overflow: "hidden",
                              ...colorStyle
                            }}
                          >
                            <div style={{ fontSize: "0.82rem", fontWeight: "800", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {sch.title}
                            </div>
                            <div style={{ fontSize: "0.72rem", opacity: 0.9, fontWeight: "600" }}>
                              {sch.startTime} - {sch.endTime}
                            </div>
                            <div style={{ marginTop: "5px", fontSize: "0.68rem", fontWeight: "800", background: "rgba(255,255,255,0.75)", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>
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
        {/* VIEW MODE 3: MONTH VIEW (FULL 7x5 MONTH BOX GRID)             */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Month" && (
          <div style={{ flex: 1 }}>
            {/* Days Header Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#cbd5e1", border: "1px solid #cbd5e1", borderRadius: "10px 10px 0 0", textAlign: "center" }}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                <div key={i} style={{ background: "#f8fafc", padding: "10px", fontSize: "0.82rem", fontWeight: "800", color: "#475569" }}>
                  {day}
                </div>
              ))}
            </div>

            {/* 7x5 Boxes Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#cbd5e1", border: "1px solid #cbd5e1", borderTop: "none", borderRadius: "0 0 10px 10px" }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const dateStr = `2026-07-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = filteredSchedules.filter(s => s.date === dateStr);
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
                      minHeight: "110px",
                      padding: "10px",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.86rem", fontWeight: "800", color: isSelected ? "#2563eb" : "#334155" }}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#4f46e5", background: "#eef2ff", padding: "2px 8px", borderRadius: "10px" }}>
                          {dayEvents.length} items
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {dayEvents.map(sch => {
                        const colorStyle = getColorStyle(sch.color);
                        return (
                          <div
                            key={sch.id}
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: "700",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 4: SCHEDULE / AGENDA VIEW MODE                      */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Schedule" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "0.88rem", color: "#64748b", fontWeight: "700" }}>
              Chronological Workplace Operations Agenda
            </div>

            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((sch) => {
                const colorStyle = getColorStyle(sch.color);

                return (
                  <div
                    key={sch.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "18px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)",
                      transition: "transform 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ minWidth: "130px", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #f1f5f9", textAlign: "center" }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: "800", color: "#2563eb", textTransform: "uppercase" }}>
                          {new Date(sch.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "700", marginTop: "2px" }}>
                          {sch.startTime} - {sch.endTime}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>{sch.title}</div>
                        <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "4px" }}>
                          Project: <strong style={{ color: "#1e293b" }}>{sch.projectName}</strong> • Assigned: <strong style={{ color: "#1e293b" }}>{sch.consultant}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", padding: "6px 14px", borderRadius: "20px", ...colorStyle }}>
                        {getCategoryEmoji(sch.category)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSchedule(sch.id)}
                        style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem", fontStyle: "italic" }}>
                No events match your selected calendar filters.
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE SCHEDULE MODAL */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "32px", width: "500px", maxWidth: "90%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Create Workplace Event</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>Schedule client audits, meetings, & site visits</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", fontSize: "1rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic Photography & Audit"
                  value={schTitle}
                  onChange={(e) => setSchTitle(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>Category</label>
                  <select
                    value={schCategory}
                    onChange={(e) => setSchCategory(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.9rem" }}
                  >
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Site Audit">Site Audit</option>
                    <option value="Field Audit">Field Audit</option>
                    <option value="Team Call">Team Call</option>
                    <option value="Client Review">Client Review</option>
                    <option value="Board Sync">Board Sync</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>Color Theme</label>
                  <select
                    value={schColor}
                    onChange={(e) => setSchColor(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.9rem" }}
                  >
                    <option value="blue">Blue Accent</option>
                    <option value="purple">Purple Accent</option>
                    <option value="orange">Orange Accent</option>
                    <option value="green">Green Accent</option>
                    <option value="red">Red Accent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>Date</label>
                <input
                  type="date"
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>Start Time (10 AM - 7 PM)</label>
                  <select
                    value={schStartTime}
                    onChange={(e) => setSchStartTime(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.9rem" }}
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
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>End Time (10 AM - 7 PM)</label>
                  <select
                    value={schEndTime}
                    onChange={(e) => setSchEndTime(e.target.value)}
                    style={{ width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.9rem" }}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "12px 20px", border: "1px solid #cbd5e1", borderRadius: "10px", background: "#f8fafc", fontWeight: "700", fontSize: "0.88rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "12px 26px", border: "none", borderRadius: "10px", background: "#4f46e5", color: "#ffffff", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}
                >
                  Save Event
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
