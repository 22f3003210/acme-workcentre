import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppProvider, useApp } from '../context/AppContext';
import {
  initialUsers,
  initialExpenses,
  initialSettings,
  initialProjects,
  initialCandidates
} from '../data/initialData';

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

describe('Tier 3: Database & Context Integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('workcentre_data_version', 'v13');
  });

  describe('AppContext State Hydration', () => {
    it('hydrates initial state from initialData when localStorage is clean', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.users).toEqual(initialUsers);
      expect(result.current.expenses).toEqual(initialExpenses);
      expect(result.current.settings).toEqual(initialSettings);
      expect(result.current.projects).toEqual(initialProjects);
      expect(result.current.candidates).toEqual(initialCandidates);
      expect(result.current.currentUser.id).toBe(initialUsers[0].id);
    });

    it('hydrates state from existing valid localStorage data', () => {
      const customUser = {
        id: 'cust-1',
        empCode: 'EMP-999',
        name: 'Custom Preserved User',
        email: 'custom@acme.com',
        role: 'Admin',
        status: 'Active'
      };
      localStorage.setItem('workcentre_users', JSON.stringify([customUser]));
      localStorage.setItem('workcentre_current_user_id', 'cust-1');

      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.users.length).toBe(1);
      expect(result.current.users[0].name).toBe('Custom Preserved User');
      expect(result.current.currentUser.id).toBe('cust-1');
    });
  });

  describe('User CRUD & Onboarding Lifecycle Integrity', () => {
    it('adds a new employee and syncs state to localStorage', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const newEmp = {
        name: 'Jane Doe',
        email: 'jane.doe@acme.com',
        role: 'Consultant',
        title: 'Retail Consultant',
        department: 'Advisory',
        phone: '9876543210'
      };

      await act(async () => {
        await result.current.addUser(newEmp);
      });

      expect(result.current.users.some(u => u.email === 'jane.doe@acme.com')).toBe(true);

      const savedUsersInStorage = JSON.parse(localStorage.getItem('workcentre_users'));
      expect(savedUsersInStorage.some(u => u.email === 'jane.doe@acme.com')).toBe(true);
    });

    it('executes two-step consultant onboarding: invite -> self-registration -> active status', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Step 1: Admin sends onboarding invite
      let inviteResult;
      act(() => {
        inviteResult = result.current.onboardConsultantInvite({
          name: 'Onboard Candidate',
          email: 'candidate@acme.com',
          phone: '9988776655',
          title: 'Jewellery BD Consultant',
          advanceAmount: '3000'
        });
      });

      expect(inviteResult.inviteToken).toBeDefined();
      expect(inviteResult.user.status).toBe('Pending Onboarding');
      expect(result.current.users.some(u => u.email === 'candidate@acme.com')).toBe(true);

      // Step 2: Candidate completes self-registration in portal
      let regSuccess;
      act(() => {
        regSuccess = result.current.completeConsultantRegistration({
          userId: inviteResult.user.id,
          inviteToken: inviteResult.inviteToken,
          password: 'SecretPassword123',
          specialization: 'Retail Jewellery BD',
          emergencyContact: '9123456789',
          bankUpi: 'candidate@upi',
          location: 'Mumbai / Showroom Site'
        });
      });

      expect(regSuccess).toBe(true);
      const registeredUser = result.current.users.find(u => u.email === 'candidate@acme.com');
      expect(registeredUser.status).toBe('Active');
      expect(registeredUser.password).toBe('SecretPassword123');
      expect(result.current.currentUser.id).toBe(registeredUser.id);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('deletes user successfully and updates state and localStorage', () => {
      const userToDelete = {
        id: 'user-to-del-1',
        name: 'User To Delete',
        email: 'del@acme.com',
        role: 'Consultant'
      };
      localStorage.setItem('workcentre_users', JSON.stringify([...initialUsers, userToDelete]));

      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.users.some(u => u.id === 'user-to-del-1')).toBe(true);

      let success;
      act(() => {
        success = result.current.deleteUser('user-to-del-1');
      });

      expect(success).toBe(true);
      expect(result.current.users.some(u => u.id === 'user-to-del-1')).toBe(false);

      const savedUsers = JSON.parse(localStorage.getItem('workcentre_users'));
      expect(savedUsers.some(u => u.id === 'user-to-del-1')).toBe(false);
    });
  });

  describe('Project & Sub-Entity Management Integrity', () => {
    it('creates project, posts discussion notes, schedules events, records visits, and toggles checklist items', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // 1. Add Project
      act(() => {
        result.current.addProject({
          code: 'PROJ-TEST-01',
          name: 'Test Retail Audit Project',
          client: 'Heerabhai Jewellers',
          pocName: 'Anant Sarraf',
          pocContact: '9876543210',
          budget: 500000,
          status: 'Active'
        });
      });

      const proj = result.current.projects.find(p => p.code === 'PROJ-TEST-01');
      expect(proj).toBeDefined();
      expect(proj.name).toBe('Test Retail Audit Project');

      // 2. Add Project Discussion
      act(() => {
        result.current.addProjectDiscussion(proj.id, {
          text: 'Initial vault stock audit completed',
          category: 'Audit Update'
        });
      });

      const updatedProjAfterDisc = result.current.projects.find(p => p.id === proj.id);
      expect(updatedProjAfterDisc.discussions.length).toBe(1);
      expect(updatedProjAfterDisc.discussions[0].text).toBe('Initial vault stock audit completed');

      // 3. Schedule Event
      act(() => {
        result.current.addProjectScheduledEvent(proj.id, {
          title: 'Store Manager Strategy Call',
          type: 'Call Scheduling',
          date: '2026-08-01',
          time: '11:00 AM',
          consultant: 'Shikhar Jain'
        });
      });

      const updatedProjAfterEvt = result.current.projects.find(p => p.id === proj.id);
      expect(updatedProjAfterEvt.scheduledEvents.length).toBe(1);
      expect(updatedProjAfterEvt.scheduledEvents[0].title).toBe('Store Manager Strategy Call');

      // 4. Record Visit
      act(() => {
        result.current.addProjectVisit(proj.id, {
          visitTitle: 'On-site Vault Inspection',
          startDate: '2026-08-05',
          endDate: '2026-08-06',
          durationDays: 2,
          visitingConsultants: ['Darla Manikanta'],
          understandings: 'Vault stock matched physical tags.',
          workDone: 'Audited 500 gold items.'
        });
      });

      const updatedProjAfterVisit = result.current.projects.find(p => p.id === proj.id);
      expect(updatedProjAfterVisit.clientVisits.length).toBe(1);
      expect(updatedProjAfterVisit.clientVisits[0].visitTitle).toBe('On-site Vault Inspection');

      // 5. Toggle Checklist Item
      act(() => {
        result.current.toggleProjectChecklistItem(proj.id, 0, 0);
      });

      const updatedProjAfterChecklist = result.current.projects.find(p => p.id === proj.id);
      expect(updatedProjAfterChecklist.checklists[0].items[0].completed).toBe(true);

      // Verify localStorage sync for projects
      const savedProjects = JSON.parse(localStorage.getItem('workcentre_projects'));
      expect(savedProjects.some(p => p.code === 'PROJ-TEST-01')).toBe(true);
    });
  });

  describe('Expense Claims & Verification Lifecycle', () => {
    it('creates expense claim and verifies status approval', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Add Expense
      let newExpId;
      act(() => {
        result.current.addExpense({
          employeeId: 'admin-acme',
          projectId: 'proj-1',
          category: 'Food',
          amount: 450,
          reason: 'Client lunch meeting',
          description: 'Mahalaxmi Hotel Food Court'
        });
      });

      const exp = result.current.expenses[0];
      expect(exp).toBeDefined();
      expect(exp.status).toBe('Pending');
      expect(exp.amount).toBe(450);
      newExpId = exp.id;

      // Verify (Approve) Expense
      act(() => {
        result.current.verifyExpense(newExpId, 'Approved', 'Valid receipt provided', 'Sophia Laurent');
      });

      const approvedExp = result.current.expenses.find(e => e.id === newExpId);
      expect(approvedExp.status).toBe('Approved');
      expect(approvedExp.reviewedBy).toBe('Sophia Laurent');

      // Verify localStorage persistence
      const savedExpenses = JSON.parse(localStorage.getItem('workcentre_expenses'));
      expect(savedExpenses.find(e => e.id === newExpId).status).toBe('Approved');
    });
  });

  describe('Hiring Requisitions & Candidate Pipeline Integrity', () => {
    it('adds hiring requisition and transitions candidate stage and status', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Add Requisition
      let newReq;
      act(() => {
        newReq = result.current.addHiringRequisition({
          jobTitle: 'Store Operations Supervisor',
          clientName: 'DCB Bank Ltd',
          location: 'Mumbai HQ',
          department: 'OPERATIONS',
          positionsCount: 2,
          status: 'Open'
        });
      });

      expect(result.current.hiringRequisitions.some(r => r.jobTitle === 'Store Operations Supervisor')).toBe(true);

      // Add Candidate
      let newCand;
      act(() => {
        newCand = result.current.addCandidate({
          fullName: 'Karamjit Singh',
          email: 'karamjit@gmail.com',
          phone: '9811223344',
          currentCity: 'Mumbai',
          appliedReqId: newReq.id,
          stage: 'Sourced / Applied',
          status: 'In Process'
        });
      });

      expect(result.current.candidates.some(c => c.fullName === 'Karamjit Singh')).toBe(true);

      // Update Candidate Stage
      act(() => {
        result.current.updateCandidateStage(newCand.id, 'Level 1: HQ Virtual Interview');
      });

      const updatedCandStage = result.current.candidates.find(c => c.id === newCand.id);
      expect(updatedCandStage.stage).toBe('Level 1: HQ Virtual Interview');

      // Update Candidate Status
      act(() => {
        result.current.updateCandidateStatus(newCand.id, 'Joined / Hired');
      });

      const updatedCandStatus = result.current.candidates.find(c => c.id === newCand.id);
      expect(updatedCandStatus.status).toBe('Joined / Hired');
    });
  });
});
