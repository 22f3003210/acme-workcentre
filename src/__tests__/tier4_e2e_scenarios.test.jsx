import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../context/AppContext';
import RegisterView from '../views/RegisterView';

const wrapper = ({ children }) => (
  <AppProvider>
    <MemoryRouter initialEntries={['/']}>
      {children}
    </MemoryRouter>
  </AppProvider>
);

describe('Tier 4: End-to-End User Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('workcentre_data_version', 'v13');
    localStorage.setItem('workcentre_authenticated', 'true');
    localStorage.setItem('workcentre_current_user_id', 'admin-acme');
  });

  describe('Scenario 1: Employee Onboarding E2E Flow', () => {
    it('executes full flow: Admin sends invite -> Candidate self-registers -> Candidate logs in', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Step 1: Admin sends onboarding invitation
      let inviteInfo;
      act(() => {
        inviteInfo = result.current.onboardConsultantInvite({
          name: 'Sarah Connor',
          email: 'sarah.connor@acme.com',
          phone: '9876543210',
          title: 'Senior BD Consultant',
          department: 'Advisory',
          advanceAmount: '5000'
        });
      });

      expect(inviteInfo.inviteToken).toBeDefined();
      const invitedUser = result.current.users.find(u => u.email === 'sarah.connor@acme.com');
      expect(invitedUser.status).toBe('Pending Onboarding');

      // Step 2: Candidate self-registers in portal
      let regSuccess;
      act(() => {
        regSuccess = result.current.completeConsultantRegistration({
          userId: invitedUser.id,
          inviteToken: inviteInfo.inviteToken,
          password: 'SarahSecurePass2026',
          specialization: 'Retail Jewellery BD',
          emergencyContact: '9876543210',
          bankUpi: 'sarah@upi',
          location: 'Mumbai / Showroom Site'
        });
      });

      expect(regSuccess).toBe(true);

      // Step 3: Verify candidate status is now Active and user is authenticated
      const registeredUser = result.current.users.find(u => u.email === 'sarah.connor@acme.com');
      expect(registeredUser.status).toBe('Active');

      let loginSuccess;
      act(() => {
        loginSuccess = result.current.login('sarah.connor@acme.com', 'SarahSecurePass2026');
      });

      expect(loginSuccess).toBe(true);
      expect(result.current.currentUser.email).toBe('sarah.connor@acme.com');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Scenario 2: Expense Submission & Approval E2E Flow', () => {
    it('executes full flow: Consultant submits expense claim -> Admin approves -> Ledger & balance update', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Step 1: Consultant logs in and submits a food expense claim
      const consultant = {
        id: 'c-e2e-1',
        name: 'Rohan Sharma',
        role: 'Consultant',
        email: 'rohan@acme.com',
        openingBalance: 4000
      };
      act(() => {
        result.current.addUser(consultant);
        result.current.switchUser('c-e2e-1');
      });

      let initialBalance = result.current.getEmployeeBalanceDetails('c-e2e-1');
      expect(initialBalance.availableBalance).toBe(4000);

      act(() => {
        result.current.addExpense({
          employeeId: 'c-e2e-1',
          projectId: 'proj-1',
          category: 'Food',
          amount: 650,
          reason: 'Showroom Client Catering',
          description: 'Mahalaxmi Hotel Food Court',
          date: '2026-07-15'
        });
      });

      const submittedExpense = result.current.expenses[0];
      expect(submittedExpense.status).toBe('Pending');

      // Step 2: Switch to Admin and approve claim
      act(() => {
        result.current.switchUser('admin-acme');
        result.current.verifyExpense(submittedExpense.id, 'Approved', 'Receipt verified by Admin', 'ACME Admin');
      });

      const approvedExp = result.current.expenses.find(e => e.id === submittedExpense.id);
      expect(approvedExp.status).toBe('Approved');
      expect(approvedExp.reviewedBy).toBe('ACME Admin');

      // Step 3: Verify balance and ledger update for consultant
      const updatedBalance = result.current.getEmployeeBalanceDetails('c-e2e-1');
      expect(updatedBalance.totalSpent).toBe(650);
      expect(updatedBalance.availableBalance).toBe(3350);

      const ledger = result.current.getEmployeeLedger('c-e2e-1', '2026-07');
      const day15Row = ledger.ledgerRows.find(r => r.srNo === 15);
      expect(day15Row.food).toBe(650);
      expect(day15Row.spent).toBe(650);
    });
  });

  describe('Scenario 3: Candidate Recruitment E2E Pipeline Flow', () => {
    it('executes full flow: Create Job Requisition -> Add Candidate -> Move candidate through stages to Hired', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Step 1: Create Job Requisition
      let newReq;
      act(() => {
        newReq = result.current.addHiringRequisition({
          jobTitle: 'Senior Retail Store Manager',
          clientName: 'Heerabhai Jewellers',
          location: 'Hyderabad - Mehdipatnam',
          department: 'SALES',
          minExperienceYears: 5,
          budgetAnnual: 800000,
          status: 'Open'
        });
      });

      expect(result.current.hiringRequisitions.some(r => r.jobTitle === 'Senior Retail Store Manager')).toBe(true);

      // Step 2: Add Candidate to requisition
      let candidate;
      act(() => {
        candidate = result.current.addCandidate({
          fullName: 'Vikramaditya Rao',
          email: 'vikram.rao@gmail.com',
          phone: '9848012345',
          currentCity: 'Hyderabad',
          appliedReqId: newReq.id,
          candidateRole: 'Senior Retail Store Manager',
          stage: 'Sourced / Applied',
          status: 'In Process'
        });
      });

      expect(result.current.candidates.some(c => c.fullName === 'Vikramaditya Rao')).toBe(true);

      // Step 3: Advance candidate through recruitment stages
      act(() => {
        result.current.updateCandidateStage(candidate.id, 'Screening / Telephonic Round');
      });
      expect(result.current.candidates.find(c => c.id === candidate.id).stage).toBe('Screening / Telephonic Round');

      act(() => {
        result.current.updateCandidateStage(candidate.id, 'Level 1: HQ Virtual Interview');
      });
      expect(result.current.candidates.find(c => c.id === candidate.id).stage).toBe('Level 1: HQ Virtual Interview');

      act(() => {
        result.current.updateCandidateStage(candidate.id, 'Level 2: Client Site Dispatched');
      });
      expect(result.current.candidates.find(c => c.id === candidate.id).stage).toBe('Level 2: Client Site Dispatched');

      // Step 4: Final Hire & Offer Acceptance
      act(() => {
        result.current.updateCandidateStage(candidate.id, 'Joined / Hired');
        result.current.updateCandidateStatus(candidate.id, 'Joined / Hired');
      });

      const hiredCandidate = result.current.candidates.find(c => c.id === candidate.id);
      expect(hiredCandidate.stage).toBe('Joined / Hired');
      expect(hiredCandidate.status).toBe('Joined / Hired');
    });
  });

  describe('Scenario 4: Ledger Reporting & Multi-Day Financial Reconciliation', () => {
    it('reconciles multi-day expenses and advance refill credits across July 2026', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const consultant = {
        id: 'c-ledger-1',
        name: 'Darla Manikanta',
        role: 'Consultant',
        email: 'darla@acme.com',
        openingBalance: 10000
      };

      // Multi-day expenses and advance refills
      const expensesList = [
        { id: 'exp-l-1', employeeId: 'c-ledger-1', category: 'Food', amount: 300, status: 'Approved', date: '2026-07-02', description: 'Breakfast' },
        { id: 'exp-l-2', employeeId: 'c-ledger-1', category: 'Accommodation', amount: 2500, status: 'Approved', date: '2026-07-02', description: 'Hotel Comfort Stay' },
        { id: 'exp-l-3', employeeId: 'c-ledger-1', category: 'Travel', amount: 800, status: 'Approved', date: '2026-07-05', description: 'Uber Transit' },
        { id: 'exp-l-4', employeeId: 'c-ledger-1', category: 'Food', amount: 500, status: 'Approved', date: '2026-07-10', description: 'Team Dinner' }
      ];

      const refillList = [
        { id: 'adv-l-1', employeeId: 'c-ledger-1', amount: 5000, status: 'Approved', date: '2026-07-03', purpose: 'Mid-month Refill' }
      ];

      localStorage.setItem('workcentre_users', JSON.stringify([consultant]));
      localStorage.setItem('workcentre_expenses', JSON.stringify(expensesList));
      localStorage.setItem('workcentre_advance_requests', JSON.stringify(refillList));

      const { result: reloadedResult } = renderHook(() => useApp(), { wrapper });

      const ledger = reloadedResult.current.getEmployeeLedger('c-ledger-1', '2026-07');
      expect(ledger.ledgerRows.length).toBe(31);

      // Verify Day 2 (July 2, 2026)
      const day2 = ledger.ledgerRows.find(r => r.srNo === 2);
      expect(day2.opening).toBe(10000);
      expect(day2.food).toBe(300);
      expect(day2.stay).toBe(2500);
      expect(day2.spent).toBe(2800);
      expect(day2.balance).toBe(7200);

      // Verify Day 3 (July 3, 2026 - Refill received)
      const day3 = ledger.ledgerRows.find(r => r.srNo === 3);
      expect(day3.opening).toBe(7200);
      expect(day3.received).toBe(5000);
      expect(day3.balance).toBe(12200);

      // Verify July totals
      expect(ledger.totals.food).toBe(800); // 300 + 500
      expect(ledger.totals.stay).toBe(2500);
      expect(ledger.totals.travel).toBe(800);
      expect(ledger.totals.spent).toBe(4100);
      expect(ledger.totals.received).toBe(5000);

      // End of month closing balance: 10000 (opening) + 5000 (received) - 4100 (spent) = 10900
      const lastDay = ledger.ledgerRows[ledger.ledgerRows.length - 1];
      expect(lastDay.balance).toBe(10900);
    });
  });
});
