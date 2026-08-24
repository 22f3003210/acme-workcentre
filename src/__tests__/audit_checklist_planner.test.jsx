import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AuditChecklistAndVisitPlanner from "../components/AuditChecklistAndVisitPlanner";

describe("AuditChecklistAndVisitPlanner Component", () => {
  const mockProject = {
    id: "proj-1",
    name: "Sunehri Virasat Jewellers",
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    location: "Hyderabad Flagship",
    assignedConsultantName: "Darla Manikanta",
    assignedAuditors: ["Darla Manikanta"],
    auditChecklistFiles: [
      {
        id: "chk-1",
        name: "Stock_Audit_Checklist.xlsx",
        fileSize: "240 KB",
        fileType: "EXCEL",
        uploadedAt: "2026-08-20",
        uploadedBy: "Darla Manikanta",
        dataUrl: "data:application/vnd.ms-excel;base64,AAAA"
      }
    ],
    auditPlanning: {
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      leadAuditor: "Darla Manikanta",
      siteLocation: "Hyderabad Flagship Showroom",
      scopeFocus: "Gross vs Net weight verification",
      logisticsNotes: "Flight booked. Hotel Taj Vivanta."
    }
  };

  const mockUsers = [
    { id: "usr-1", name: "Darla Manikanta", role: "Lead Auditor" },
    { id: "usr-2", name: "Priya Sharma", role: "Senior Consultant" }
  ];

  it("renders checklist documents and dynamic visit planning form", () => {
    render(
      <AuditChecklistAndVisitPlanner
        project={mockProject}
        users={mockUsers}
        currentUser={{ name: "Darla Manikanta" }}
        onUpdateProject={vi.fn()}
        setToast={vi.fn()}
      />
    );

    expect(screen.getByText("Internal Audit Checklist & Field Preparation Documents")).toBeTruthy();
    expect(screen.getByText("Stock_Audit_Checklist.xlsx")).toBeTruthy();
    expect(screen.getByText("On-Site Visit Planning & Auditor Assignment")).toBeTruthy();
    expect(screen.getByDisplayValue("Gross vs Net weight verification")).toBeTruthy();
  });

  it("allows saving updated visit planning and assigned auditors", () => {
    const onUpdateProjectMock = vi.fn();
    const setToastMock = vi.fn();

    render(
      <AuditChecklistAndVisitPlanner
        project={mockProject}
        users={mockUsers}
        currentUser={{ name: "Darla Manikanta" }}
        onUpdateProject={onUpdateProjectMock}
        setToast={setToastMock}
      />
    );

    const saveBtn = screen.getByText("Save & Update Visit Plan");
    fireEvent.click(saveBtn);

    expect(onUpdateProjectMock).toHaveBeenCalledWith(
      "proj-1",
      expect.objectContaining({
        auditPlanning: expect.objectContaining({
          leadAuditor: "Darla Manikanta",
          siteLocation: "Hyderabad Flagship Showroom"
        }),
        assignedAuditors: ["Darla Manikanta"]
      })
    );

    expect(setToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success"
      })
    );
  });
});
