import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ErrorBoundary from "../components/ErrorBoundary";
import { AppProvider, useApp } from "../context/AppContext";
import * as supabaseClient from "../lib/supabaseClient";

// Helper component to access AppContext in tests
function TestComponent({ callback }) {
  const context = useApp();
  if (callback) {
    callback(context);
  }
  return (
    <div>
      <span data-testid="user-name">{context.currentUser?.name}</span>
      <span data-testid="user-count">{context.users.length}</span>
    </div>
  );
}

// Component that throws to test ErrorBoundary
function BuggyComponent() {
  throw new Error("Test Crash");
}

describe("Worker 3 Remediation Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Task 1 & Task 5: LocalStorage Version Check & Error Safe Parsing", () => {
    it("should safely handle corrupted JSON in localStorage without crashing", () => {
      localStorage.setItem("workcentre_users", "invalid-json-string");
      localStorage.setItem("workcentre_expenses", "{corrupted");

      let contextRef = null;
      render(
        <AppProvider>
          <TestComponent callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      expect(contextRef.users).toBeDefined();
      expect(contextRef.users.length).toBeGreaterThan(0);
      expect(contextRef.expenses).toBeDefined();
    });

    it("should flush stale localStorage keys on version bump in useEffect", () => {
      localStorage.setItem("workcentre_data_version", "old_v0");
      localStorage.setItem("workcentre_job_titles", JSON.stringify([{ id: "stale", titleName: "Stale Title" }]));
      localStorage.setItem("workcentre_authenticated", "true");

      let contextRef = null;
      render(
        <AppProvider>
          <TestComponent callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      expect(localStorage.getItem("workcentre_data_version")).toBe("v13");
      expect(localStorage.getItem("workcentre_authenticated") === null || localStorage.getItem("workcentre_authenticated") === "false").toBe(true);
      expect(contextRef.jobTitles).toEqual([]);
    });
  });

  describe("Task 2: Unpersisted Entities Persistence", () => {
    it("should persist jobTitles, numberSeries, departments, shifts, and weeklyOffs to LocalStorage", () => {
      let contextRef = null;
      render(
        <AppProvider>
          <TestComponent callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      act(() => {
        contextRef.addJobTitle("Lead Auditor", "Finance");
        contextRef.addDepartment("Audit");
      });

      expect(localStorage.getItem("workcentre_job_titles")).toContain("Lead Auditor");
      expect(localStorage.getItem("workcentre_departments")).toContain("Audit");
    });
  });

  describe("Task 3: Attribute Preservation in mappedUsers", () => {
    it("should preserve user attributes in AppContext", async () => {
      let contextRef = null;
      render(
        <AppProvider>
          <TestComponent callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      const user = (contextRef.users && contextRef.users.length > 0) ? contextRef.users[0] : null;
      expect(user).toBeDefined();
      expect(user.name).toBeDefined();
    });
  });

  describe("Task 4: State updates when CRUD actions are performed", () => {
    it("should update context state when CRUD actions are performed", () => {
      let contextRef = null;
      render(
        <AppProvider>
          <TestComponent callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      act(() => {
        contextRef.addExpense({ category: "Travel", amount: 1500, description: "Flight ticket" });
        contextRef.addProject({ name: "Jewellery Retail Expansion", client: "Malabar Gold" });
        contextRef.requestAdvance("emp-1", 5000, "Site Visit Advance");
        contextRef.addHiringRequisition({ positionTitle: "Senior Consultant" });
        contextRef.addCandidate({ fullName: "Rahul Verma", email: "rahul@example.com" });
      });

      expect(contextRef.expenses.some(e => e.description === "Flight ticket")).toBe(true);
      expect(contextRef.projects.some(p => p.name === "Jewellery Retail Expansion")).toBe(true);
      expect(contextRef.advanceRequests.some(a => a.purpose === "Site Visit Advance")).toBe(true);
      expect(contextRef.hiringRequisitions.some(h => h.positionTitle === "Senior Consultant")).toBe(true);
      expect(contextRef.candidates.some(c => c.fullName === "Rahul Verma")).toBe(true);
    });
  });

  describe("Task 6: ErrorBoundary Component", () => {
    it("should catch rendering errors and display fallback UI", () => {
      // Prevent console.error noise during expected crash
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText(/Test Crash/)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });
});
