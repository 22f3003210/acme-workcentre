import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InlineGMeetScheduler, {
  generateGoogleCalendarUrl,
  isValidGoogleMeetUrl
} from "../components/InlineGMeetScheduler";

describe("InlineGMeetScheduler Component & Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("URL & Helper Functions", () => {
    it("validates Google Meet URLs properly", () => {
      expect(isValidGoogleMeetUrl("https://meet.google.com/new")).toBe(true);
      expect(isValidGoogleMeetUrl("https://meet.google.com/abc-defg-hij")).toBe(true);
      expect(isValidGoogleMeetUrl("https://meet.google.com/abc-defg-hij?authuser=0")).toBe(true);
      expect(isValidGoogleMeetUrl("")).toBe(false);
      expect(isValidGoogleMeetUrl(null)).toBe(false);
      expect(isValidGoogleMeetUrl("invalid-link")).toBe(false);
    });

    it("constructs Google Calendar URL with query parameters", () => {
      const url = generateGoogleCalendarUrl({
        title: "Pre-Audit Strategy Session",
        date: "2026-09-15",
        timeSlot: "11:00 AM",
        durationMinutes: 60,
        description: "Review showroom inventory and baseline metrics.",
        location: "https://meet.google.com/abc-defg-hij",
        attendees: "client@jewellery.com"
      });

      expect(url).toContain("https://calendar.google.com/calendar/render");
      expect(url).toContain("action=TEMPLATE");
      expect(url).toContain("Pre-Audit+Strategy+Session");
      expect(url).toContain("client%40jewellery.com");
    });
  });

  describe("Component Rendering & Interactions", () => {
    const mockProject = {
      id: "proj-1",
      name: "Emerald Jewels Retail Audit",
      pocContact: "client@emeraldjewels.com",
      pocName: "Rajesh Varma",
      preAuditData: {
        scheduledDate: "2026-09-20",
        scheduledTime: "11:00 AM - 12:30 PM",
        consultantName: "Darla Manikanta",
        gmeetLink: "https://meet.google.com/abc-defg-hij"
      }
    };

    const mockUsers = [
      { id: "u1", name: "Darla Manikanta", role: "Lead Auditor" },
      { id: "u2", name: "Sayed", role: "Admin" }
    ];

    it("renders scheduler with initial project details", () => {
      render(
        <InlineGMeetScheduler
          project={mockProject}
          users={mockUsers}
          currentUser={{ name: "Darla Manikanta" }}
          onUpdateProject={vi.fn()}
          onScheduleSync={vi.fn()}
          setToast={vi.fn()}
        />
      );

      expect(screen.getByText(/Google Meet Pre-Audit Session & Calendar Scheduler/i)).toBeInTheDocument();
      expect(screen.getByText(/Google Meet Configured/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://meet.google.com/abc-defg-hij")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2026-09-20")).toBeInTheDocument();
    });

    it("allows updating the meet URL and saving the schedule", () => {
      const mockUpdate = vi.fn();
      const mockSync = vi.fn();
      const mockToast = vi.fn();

      render(
        <InlineGMeetScheduler
          project={mockProject}
          users={mockUsers}
          currentUser={{ name: "Darla Manikanta" }}
          onUpdateProject={mockUpdate}
          onScheduleSync={mockSync}
          setToast={mockToast}
        />
      );

      const urlInput = screen.getByDisplayValue("https://meet.google.com/abc-defg-hij");
      fireEvent.change(urlInput, { target: { value: "https://meet.google.com/xyz-uvwx-rst" } });

      const saveBtn = screen.getByText(/Save & Sync to ACME Calendar/i);
      fireEvent.click(saveBtn);

      expect(mockUpdate).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({
          preAuditData: expect.objectContaining({
            gmeetLink: "https://meet.google.com/xyz-uvwx-rst",
            scheduledDate: "2026-09-20"
          })
        })
      );

      expect(mockSync).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "proj-1",
          gmeetLink: "https://meet.google.com/xyz-uvwx-rst"
        })
      );

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success"
        })
      );
    });

    it("triggers Google Meet and Calendar creation window.open", () => {
      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => {});

      render(
        <InlineGMeetScheduler
          project={mockProject}
          users={mockUsers}
          currentUser={{ name: "Darla Manikanta" }}
          onUpdateProject={vi.fn()}
          onScheduleSync={vi.fn()}
          setToast={vi.fn()}
        />
      );

      const createMeetBtn = screen.getByText(/Create Live Meet/i);
      fireEvent.click(createMeetBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith("https://meet.google.com/new", "_blank", "noopener,noreferrer");

      const schedCalBtn = screen.getByText(/Schedule in Google Calendar/i);
      fireEvent.click(schedCalBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith(expect.stringContaining("calendar.google.com"), "_blank", "noopener,noreferrer");

      windowOpenSpy.mockRestore();
    });
  });
});
