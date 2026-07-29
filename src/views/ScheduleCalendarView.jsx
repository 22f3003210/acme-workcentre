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

  // Filtered schedules based on category checkboxes
  const filteredSchedules = (schedules || []).filter(s => categoryFilters[s.category] !== false);

  // Handlers for date navigation
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

  // Toggle category filter
  const toggleFilter = (cat) => {
    setCategoryFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
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

  return (
    <div className="schedule-calendar-workspace" style={{ display: "flex", gap: "20px", padding: "20px", background: "#f8fafc", minHeight: "calc(100vh - 80px)", fontFamily: "Inter, sans-serif" }}>
      
      {/* ----------------------------------------------------------------- */}
      {/* LEFT SIDEBAR: CREATE BUTTON, MINI CALENDAR & CATEGORY FILTERS    */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* + Create Pill Button (Google Calendar Style) */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "28px",
            padding: "14px 24px",
            fontWeight: "800",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 6px 16px rgba(79,70,229,0.25)",
            transition: "transform 0.15s ease"
          }}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>+</span> Create Event
        </button>

        {/* Mini 7x5 Month Datepicker Widget */}
        <div style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.92rem", fontWeight: "800", color: "#0f172a" }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <div style={{ display: "flex", gap: "2px" }}>
              <button onClick={handlePrevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "700", color: "#64748b", fontSize: "0.9rem" }}>‹</button>
              <button onClick={handleNextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "700", color: "#64748b", fontSize: "0.9rem" }}>›</button>
            </div>
          </div>

          {/* Day Labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center", marginBottom: "6px" }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700" }}>{d}</span>
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
                    padding: "5px 0",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? "800" : "600",
                    borderRadius: "50%",
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

        {/* Categories / Calendars Filter Panel */}
        <div style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            My Calendars
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { cat: "Site Audit", color: "#2563eb" },
              { cat: "Client Meeting", color: "#2563eb" },
              { cat: "Field Audit", color: "#ea580c" },
              { cat: "Team Call", color: "#9333ea" },
              { cat: "Client Review", color: "#9333ea" },
              { cat: "Board Sync", color: "#dc2626" }
            ].map(item => (
              <label key={item.cat} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                <input
                  type="checkbox"
                  checked={categoryFilters[item.cat] !== false}
                  onChange={() => toggleFilter(item.cat)}
                  style={{ accentColor: item.color, cursor: "pointer" }}
                />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
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
        
        {/* Top Navigation & View Mode Controls Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
          
          {/* Navigator Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={handleToday}
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 16px", fontWeight: "700", fontSize: "0.85rem", color: "#334155", cursor: "pointer" }}
            >
              Today
            </button>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={handlePrevMonth} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", fontWeight: "700", color: "#475569" }}>‹</button>
              <button onClick={handleNextMonth} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", fontWeight: "700", color: "#475569" }}>›</button>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          {/* View Switcher Select Dropdown / Pills */}
          <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "4px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            {["Day", "Week", "Month", "Schedule"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? "#ffffff" : "transparent",
                  color: viewMode === mode ? "#4f46e5" : "#64748b",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 16px",
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
        {/* VIEW MODE 1: DAY VIEW (SINGLE DAY COLUMN - 10 AM to 7 PM)     */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Day" && (
          <div style={{ flex: 1 }}>
            {/* Day Title Header Banner */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: "800", textTransform: "uppercase" }}>DAY VIEW</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1e3a8a", margin: "2px 0 0 0" }}>
                  {new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h3>
              </div>
              <span style={{ background: "#2563eb", color: "#ffffff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                {filteredSchedules.filter(s => s.date === selectedDay).length} Scheduled Events
              </span>
            </div>

            {/* Timeline Grid (10 AM to 7 PM) */}
            <div style={{ position: "relative", borderTop: "1px solid #e2e8f0" }}>
              {timeSlots.map((time, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr", height: "65px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700", transform: "translateY(-10px)" }}>
                    {time}
                  </div>
                  <div style={{ borderLeft: "1px solid #e2e8f0" }} />
                </div>
              ))}

              {/* Event Cards Rendered Full Width */}
              <div style={{ position: "absolute", top: 0, left: "80px", right: 0, bottom: 0, pointerEvents: "none" }}>
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
                        left: "12px",
                        right: "12px",
                        borderRadius: "10px",
                        padding: "12px 18px",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                        display: "flex",
                        justifyContent: "space-between",
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
        {/* VIEW MODE 2: WEEK VIEW (7 COLUMNS - 10 AM to 7 PM)             */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Week" && (
          <div style={{ flex: 1 }}>
            {/* Week Days Header Row */}
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
                        fontSize: "0.92rem"
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

              {/* Red Current Time Line Marker */}
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
        {/* VIEW MODE 3: MONTH VIEW (FULL 7x5 MONTH BOX GRID)             */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Month" && (
          <div style={{ flex: 1 }}>
            {/* Days Header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#e2e8f0", border: "1px solid #e2e8f0", borderRadius: "8px 8px 0 0", textAlign: "center" }}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                <div key={i} style={{ background: "#f8fafc", padding: "10px", fontSize: "0.8rem", fontWeight: "800", color: "#475569" }}>
                  {day}
                </div>
              ))}
            </div>

            {/* 7x5 Boxes Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#e2e8f0", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
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
                      minHeight: "105px",
                      padding: "8px",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.84rem", fontWeight: "800", color: isSelected ? "#2563eb" : "#334155" }}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#4f46e5", background: "#eef2ff", padding: "1px 6px", borderRadius: "10px" }}>
                          {dayEvents.length} items
                        </span>
                      )}
                    </div>

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

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 4: SCHEDULE / AGENDA VIEW MODE                      */}
        {/* ------------------------------------------------------------- */}
        {viewMode === "Schedule" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "0.88rem", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>
              Chronological Workplace Agenda
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
                      borderRadius: "12px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ minWidth: "120px" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#2563eb", textTransform: "uppercase" }}>
                          {new Date(sch.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                          {sch.startTime} - {sch.endTime}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.98rem", fontWeight: "800", color: "#0f172a" }}>{sch.title}</div>
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px" }}>
                          Project: <strong>{sch.projectName}</strong> • Assigned: <strong>{sch.consultant}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: "800", padding: "4px 12px", borderRadius: "20px", ...colorStyle }}>
                        {sch.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSchedule(sch.id)}
                        style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "480px", maxWidth: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Create Event</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Event Title *</label>
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
                    <option value="Board Sync">Board Sync</option>
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
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Start Time</label>
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
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>End Time</label>
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
