import React, { useState, useEffect } from "react";

/**
 * Helper to build Google Calendar template URL
 */
export const generateGoogleCalendarUrl = ({ title, date, timeSlot, durationMinutes = 60, description, location = "Google Meet", attendees = "" }) => {
  if (!date) return "https://calendar.google.com/calendar/u/0/r/eventedit";

  // Parse time (e.g., "11:00 AM" or "14:30")
  let hours = 11;
  let minutes = 0;

  if (timeSlot) {
    const match = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
    }
  }

  const [y, m, d] = date.split("-").map(Number);
  const startDate = new Date(y, (m || 1) - 1, d || 1, hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatGoogleDate = (dt) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  };

  const startIso = formatGoogleDate(startDate);
  const endIso = formatGoogleDate(endDate);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "ACME Pre-Audit Virtual Strategy Session",
    dates: `${startIso}/${endIso}`,
    details: description || "Pre-Audit baseline discussion, inventory verification, and showroom diagnostic overview.",
    location: location || "Google Meet",
  });

  if (attendees) {
    params.append("add", attendees);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Validate Google Meet URL
 */
export const isValidGoogleMeetUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed === "https://meet.google.com/new" ||
    /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i.test(trimmed) ||
    /^https:\/\/meet\.google\.com\/[a-zA-Z0-9_-]+(\?.*)?$/i.test(trimmed)
  );
};

export default function InlineGMeetScheduler({
  project,
  users = [],
  currentUser,
  onUpdateProject,
  onScheduleSync,
  setToast = () => {}
}) {
  const preAuditData = project?.preAuditData || {};

  const todayStr = new Date().toISOString().split("T")[0];
  const [meetingDate, setMeetingDate] = useState(preAuditData.scheduledDate || todayStr);
  const [meetingTime, setMeetingTime] = useState(preAuditData.scheduledTime || "11:00 AM - 12:30 PM");
  const [duration, setDuration] = useState(preAuditData.duration || "60");
  const [leadConsultant, setLeadConsultant] = useState(
    preAuditData.consultantName || currentUser?.name || "Darla Manikanta"
  );
  const [clientContact, setClientContact] = useState(
    preAuditData.clientContact || project?.pocContact || project?.pocName || ""
  );
  const [meetUrl, setMeetUrl] = useState(
    preAuditData.gmeetLink && !preAuditData.gmeetLink.includes("acm-") && !preAuditData.gmeetLink.includes("acm-pre-aud")
      ? preAuditData.gmeetLink
      : ""
  );
  const [meetingNotes, setMeetingNotes] = useState(
    preAuditData.agenda ||
      "• Showroom retail baseline & footfall review\n• ERP / POS sales software reconciliation\n• Tagged inventory & vault verification methodology\n• Field audit schedule & team allocation"
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Sync state when project changes
  useEffect(() => {
    const curPre = project?.preAuditData || {};
    if (curPre.scheduledDate) setMeetingDate(curPre.scheduledDate);
    if (curPre.scheduledTime) setMeetingTime(curPre.scheduledTime);
    if (curPre.duration) setDuration(curPre.duration);
    if (curPre.consultantName) setLeadConsultant(curPre.consultantName);
    if (curPre.clientContact || project?.pocContact) setClientContact(curPre.clientContact || project?.pocContact || "");
    if (curPre.gmeetLink && !curPre.gmeetLink.includes("acm-") && !curPre.gmeetLink.includes("acm-pre-aud")) {
      setMeetUrl(curPre.gmeetLink);
    }
    if (curPre.agenda) setMeetingNotes(curPre.agenda);
  }, [project?.id]);

  const hasConfiguredMeet = Boolean(meetUrl && meetUrl.trim().length > 0);
  const isValidUrl = hasConfiguredMeet ? isValidGoogleMeetUrl(meetUrl) : false;

  // Open Google Meet Room Creation in real tab
  const handleOpenGoogleMeetNew = () => {
    window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
    setToast({
      message: "🚀 Google Meet instant room opened in new tab. Once created, copy the link and paste it here!",
      type: "info"
    });
  };

  // Open Google Calendar with Pre-filled Event
  const handleOpenGoogleCalendar = () => {
    const calUrl = generateGoogleCalendarUrl({
      title: `Pre-Audit Virtual Session: ${project?.name || "Client Project"}`,
      date: meetingDate,
      timeSlot: meetingTime,
      durationMinutes: parseInt(duration, 10) || 60,
      description: `🏛️ ACME Consulting - Pre-Audit Strategy Session\n\n📌 Client: ${project?.name || "Client"}\n👤 Consultant: ${leadConsultant}\n📞 Client Contact: ${clientContact}\n\n📋 Session Agenda:\n${meetingNotes}\n\n📹 Meeting URL: ${meetUrl || "Google Meet"}`,
      location: meetUrl || "Google Meet",
      attendees: clientContact && clientContact.includes("@") ? clientContact : ""
    });

    window.open(calUrl, "_blank", "noopener,noreferrer");
    setToast({
      message: "📅 Google Calendar Scheduler opened! Google will auto-attach video conferencing to your event.",
      type: "success"
    });
  };

  // Copy Meet Link
  const handleCopyMeetLink = () => {
    const targetUrl = meetUrl || "https://meet.google.com/new";
    try {
      navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      setToast({ message: `Google Meet link copied to clipboard: ${targetUrl}`, type: "success" });
    } catch (e) {
      setToast({ message: "Failed to copy to clipboard", type: "error" });
    }
  };

  // Copy Formatted Client Invitation
  const handleCopyClientInvite = () => {
    const inviteMessage = `🏛️ *ACME Consulting — Pre-Audit Virtual Strategy Session*\n` +
      `────────────────────────────────────\n` +
      `📌 *Project:* ${project?.name || "Jewellery Retail Audit"}\n` +
      `📅 *Date:* ${meetingDate}\n` +
      `⏰ *Time Slot:* ${meetingTime} (${duration} mins)\n` +
      `👨‍💼 *Lead Consultant:* ${leadConsultant}\n` +
      `📹 *Google Meet Link:* ${meetUrl || "https://meet.google.com/new (Live Link to be provided)"}\n\n` +
      `📋 *Meeting Agenda & Objectives:*\n${meetingNotes}\n` +
      `────────────────────────────────────\n` +
      `_Please join 5 minutes prior to the scheduled session with your key department representatives._`;

    try {
      navigator.clipboard.writeText(inviteMessage);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
      setToast({ message: "📋 Client WhatsApp / Email invitation copied to clipboard!", type: "success" });
    } catch (e) {
      setToast({ message: "Failed to copy client invite", type: "error" });
    }
  };

  // Save & Sync Schedule
  const handleSaveAndSync = () => {
    if (!meetingDate) {
      setToast({ message: "Please select a meeting date for the Pre-Audit session.", type: "warning" });
      return;
    }

    const effectiveMeetUrl = meetUrl.trim() || "https://meet.google.com/new";

    const updatedPreAudit = {
      ...preAuditData,
      scheduledDate: meetingDate,
      scheduledTime: meetingTime,
      duration,
      consultantName: leadConsultant,
      clientContact,
      gmeetLink: effectiveMeetUrl,
      agenda: meetingNotes,
      lastSyncedAt: new Date().toISOString()
    };

    if (typeof onUpdateProject === "function") {
      onUpdateProject(project.id, { preAuditData: updatedPreAudit });
    }

    if (typeof onScheduleSync === "function") {
      onScheduleSync({
        projectId: project?.id,
        projectName: project?.name,
        date: meetingDate,
        time: meetingTime,
        consultant: leadConsultant,
        gmeetLink: effectiveMeetUrl,
        agenda: meetingNotes
      });
    }

    setToast({
      message: `✅ Pre-Audit session successfully scheduled for ${meetingDate} at ${meetingTime} and synced to ACME Calendar!`,
      type: "success"
    });
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
      }}
    >
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "18px" }}>
        <div style={{ flex: "1 1 340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
              📹
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                Google Meet Pre-Audit Session & Calendar Scheduler
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                Official Google Meet video room creation, calendar synchronization, and client invitation management.
              </p>
            </div>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {hasConfiguredMeet ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#dcfce7", color: "#15803d", padding: "6px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "800", border: "1px solid #bbf7d0" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Google Meet Configured
            </div>
          ) : meetingDate ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fef3c7", color: "#b45309", padding: "6px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "800", border: "1px solid #fde68a" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              Date Set (Pending Meet Link)
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", color: "#64748b", padding: "6px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
              ⚪ Not Scheduled
            </div>
          )}
        </div>
      </div>

      {/* QUICK LAUNCH & CALENDAR ACTION ROW */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          border: "1px solid #e0e7ff",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            ⚡ Genuine Google Meet Provisioning
          </span>
          <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "600" }}>
            Generate actual Google Meet video rooms or sync directly via Google Calendar
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleOpenGoogleMeetNew}
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 10px rgba(79, 70, 229, 0.3)"
            }}
          >
            <span>✨</span> Create Live Meet (meet.google.com/new)
          </button>

          <button
            type="button"
            onClick={handleOpenGoogleCalendar}
            style={{
              background: "#ffffff",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
            }}
          >
            <span>📅</span> Schedule in Google Calendar
          </button>
        </div>
      </div>

      {/* ACTIVE GOOGLE MEET URL DISPLAY & MANAGEMENT */}
      <div
        style={{
          background: "#ffffff",
          border: isValidUrl ? "1px solid #86efac" : hasConfiguredMeet ? "1px solid #cbd5e1" : "1px dashed #cbd5e1",
          borderRadius: "12px",
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
            🔗 Active Google Meet URL / Join Link:
          </label>
          {isValidUrl && (
            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
              ✓ Valid Google Meet Room Format
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px", position: "relative" }}>
            <input
              type="text"
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              placeholder="e.g. https://meet.google.com/abc-defg-hij or paste newly created room link"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                fontFamily: "monospace",
                fontWeight: "600",
                color: "#1e293b",
                boxSizing: "border-box",
                background: "#f8fafc"
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleCopyMeetLink}
            style={{
              background: copiedLink ? "#dcfce7" : "#ffffff",
              color: copiedLink ? "#15803d" : "#334155",
              border: "1px solid #cbd5e1",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>{copiedLink ? "✓" : "📋"}</span>
            {copiedLink ? "Copied!" : "Copy Link"}
          </button>

          <a
            href={meetUrl || "https://meet.google.com/new"}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#16a34a",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "800",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)"
            }}
          >
            <span>🚀</span> Launch Meet ➔
          </a>
        </div>
      </div>

      {/* SESSION SCHEDULING DETAILS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
        {/* Date */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>
            📅 MEETING DATE
          </label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              boxSizing: "border-box",
              fontWeight: "600"
            }}
          />
        </div>

        {/* Time Slot */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>
            ⏰ TIME SLOT
          </label>
          <input
            type="text"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            placeholder="e.g. 11:00 AM - 12:30 PM"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              boxSizing: "border-box",
              fontWeight: "600"
            }}
          />
          {/* Quick preset chips */}
          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
            {["10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMeetingTime(`${t} - ${t.includes("10") ? "11:30 AM" : t.includes("11") ? "01:00 PM" : t.includes("02") ? "03:30 PM" : "05:30 PM"}`)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>
            ⏳ DURATION
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              boxSizing: "border-box",
              fontWeight: "600"
            }}
          >
            <option value="30">30 Minutes</option>
            <option value="45">45 Minutes</option>
            <option value="60">60 Minutes (1 Hour)</option>
            <option value="90">90 Minutes (1.5 Hours)</option>
            <option value="120">120 Minutes (2 Hours)</option>
          </select>
        </div>

        {/* Lead Consultant */}
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>
            👨‍💼 LEAD CONSULTANT
          </label>
          <select
            value={leadConsultant}
            onChange={(e) => setLeadConsultant(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              boxSizing: "border-box",
              fontWeight: "600"
            }}
          >
            {(users || []).map((u) => (
              <option key={u.id} value={u.name}>
                {u.name} ({u.role || "Consultant"})
              </option>
            ))}
            {(!users || users.length === 0) && (
              <option value="Darla Manikanta">Darla Manikanta (Lead Auditor)</option>
            )}
          </select>
        </div>
      </div>

      {/* CLIENT CONTACT & AGENDA SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>
            📱 CLIENT POC CONTACT / ATTENDEE EMAIL
          </label>
          <input
            type="text"
            value={clientContact}
            onChange={(e) => setClientContact(e.target.value)}
            placeholder="e.g. client@jewellery.com or +91 98765 43210"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>
            📝 PRE-AUDIT VIRTUAL AGENDA & OBJECTIVES
          </label>
          <textarea
            rows={3}
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              lineHeight: "1.5",
              boxSizing: "border-box",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>
      </div>

      {/* FOOTER ACTIONS: SAVE & INVITATION COPY */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "18px"
        }}
      >
        <button
          type="button"
          onClick={handleCopyClientInvite}
          style={{
            background: copiedInvite ? "#dcfce7" : "#f8fafc",
            color: copiedInvite ? "#15803d" : "#334155",
            border: "1px solid #cbd5e1",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>{copiedInvite ? "✓" : "💬"}</span>
          {copiedInvite ? "Invite Copied!" : "Copy WhatsApp / Email Client Invite"}
        </button>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleSaveAndSync}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
            }}
          >
            <span>💾</span> Save & Sync to ACME Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
