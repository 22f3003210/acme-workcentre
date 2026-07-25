import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppProvider, useApp } from '../context/AppContext';
import { initialUsers, initialSettings } from '../data/initialData';

// Helper component to extract context values for testing logic directly
const ContextInspector = ({ callback }) => {
  const context = useApp();
  callback(context);
  return <div data-testid="context-inspector">Inspector Active</div>;
};

describe('Tier 2: Edge & Boundary Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('workcentre_data_version', 'v13');
  });

  describe('Corrupted LocalStorage Recovery', () => {
    it('gracefully handles corrupted JSON in localStorage users key and falls back to initialUsers', () => {
      localStorage.setItem('workcentre_users', '{corrupted_invalid_json:::');
      
      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      expect(contextRef.users).toBeDefined();
      expect(Array.isArray(contextRef.users)).toBe(true);
      expect(contextRef.users.length).toBeGreaterThan(0);
      expect(contextRef.users[0].id).toBe('admin-acme');
    });

    it('gracefully handles corrupted JSON in expenses, settings, and projects', () => {
      localStorage.setItem('workcentre_expenses', 'INVALID_JSON');
      localStorage.setItem('workcentre_settings', '{"broken":');
      localStorage.setItem('workcentre_projects', 'NOT_AN_ARRAY');

      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      expect(contextRef.expenses).toBeDefined();
      expect(contextRef.settings).toEqual(initialSettings);
      expect(contextRef.projects).toBeDefined();
    });

    it('recovers when saved current_user_id does not exist in user database', () => {
      localStorage.setItem('workcentre_current_user_id', 'non-existent-user-999');

      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      expect(contextRef.currentUser).toBeDefined();
      expect(contextRef.currentUser.id).toBe(initialUsers[0].id);
    });
  });

  describe('Missing Optional Properties Handling', () => {
    it('handles user objects missing optional properties like attendance, advanceAmount, or status', () => {
      const incompleteUser = {
        id: 'emp-inc-1',
        name: 'Incomplete Employee',
        role: 'Consultant',
        email: 'incomplete@acme.com'
        // Missing: attendance, advanceAmount, status, title, department, etc.
      };
      localStorage.setItem('workcentre_users', JSON.stringify([incompleteUser]));

      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      // getEmployeeBalanceDetails should handle missing openingBalance or advanceAmount safely
      const details = contextRef.getEmployeeBalanceDetails('emp-inc-1');
      expect(details).toBeDefined();
      expect(details.initialAdvance).toBe(0);
      expect(details.totalSpent).toBe(0);
      expect(details.availableBalance).toBe(0);

      // getEmployeeLedger should generate ledger rows without throwing exception
      const ledger = contextRef.getEmployeeLedger('emp-inc-1', '2026-07');
      expect(ledger.ledgerRows).toBeDefined();
      expect(ledger.ledgerRows.length).toBe(31); // 31 days in July
    });

    it('handles non-existent or null employeeId in getEmployeeLedger and getEmployeeBalanceDetails', () => {
      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      expect(contextRef.getEmployeeBalanceDetails('null-id')).toBeNull();
      expect(contextRef.getEmployeeBalanceDetails(null)).toBeNull();

      const emptyLedger = contextRef.getEmployeeLedger(null);
      expect(emptyLedger.ledgerRows).toEqual([]);
      expect(emptyLedger.totals.spent).toBe(0);
    });
  });

  describe('Currency & Financial Boundary Calculations', () => {
    it('accurately calculates balances with floating point precision and refills', () => {
      const consultant = {
        id: 'c-calc-1',
        name: 'Calc Consultant',
        role: 'Consultant',
        email: 'calc@acme.com',
        openingBalance: 5000.50
      };
      const expense1 = {
        id: 'exp-c-1',
        employeeId: 'c-calc-1',
        category: 'Food',
        amount: 250.75,
        status: 'Approved',
        date: '2026-07-05'
      };
      const refill1 = {
        id: 'ref-c-1',
        employeeId: 'c-calc-1',
        amount: 2000.00,
        status: 'Approved',
        date: '2026-07-10'
      };

      localStorage.setItem('workcentre_users', JSON.stringify([consultant]));
      localStorage.setItem('workcentre_expenses', JSON.stringify([expense1]));
      localStorage.setItem('workcentre_advance_requests', JSON.stringify([refill1]));

      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      const details = contextRef.getEmployeeBalanceDetails('c-calc-1');
      expect(details.initialAdvance).toBe(7000.50);
      expect(details.totalSpent).toBe(250.75);
      expect(details.availableBalance).toBe(6749.75);
      expect(details.categoriesSum.Food).toBe(250.75);
      expect(details.categoriesSum.Accommodation).toBe(0);
    });

    it('handles negative available balances when expenses exceed advance refills', () => {
      const consultant = {
        id: 'c-over-1',
        name: 'Overspent Consultant',
        role: 'Consultant',
        email: 'over@acme.com',
        openingBalance: 1000
      };
      const expense = {
        id: 'exp-o-1',
        employeeId: 'c-over-1',
        category: 'Travel',
        amount: 3500,
        status: 'Approved',
        date: '2026-07-02'
      };

      localStorage.setItem('workcentre_users', JSON.stringify([consultant]));
      localStorage.setItem('workcentre_expenses', JSON.stringify([expense]));

      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      const details = contextRef.getEmployeeBalanceDetails('c-over-1');
      expect(details.availableBalance).toBe(-2500);
    });
  });

  describe('Unhandled Error States & Security Safeguards', () => {
    it('prevents self-deletion of active logged-in user in deleteUser', () => {
      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      const activeUserId = contextRef.currentUser.id;
      let deleteResult;
      act(() => {
        deleteResult = contextRef.deleteUser(activeUserId);
      });

      expect(deleteResult).toBe(false);
      expect(contextRef.users.some(u => u.id === activeUserId)).toBe(true);
    });

    it('handles invalid authentication attempts gracefully in login', () => {
      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      let success;
      act(() => {
        success = contextRef.login('nonexistent@acme.com', 'wrongpassword');
      });

      expect(success).toBe(false);
      expect(contextRef.isAuthenticated).toBe(false);
    });

    it('handles invalid OTP numbers and verification codes', () => {
      let contextRef;
      render(
        <AppProvider>
          <ContextInspector callback={(ctx) => { contextRef = ctx; }} />
        </AppProvider>
      );

      // Sending OTP to non-existent phone number returns null
      let otpCode;
      act(() => {
        otpCode = contextRef.sendOtp('0000000000');
      });
      expect(otpCode).toBeNull();

      // Verifying invalid OTP code returns false
      let verifySuccess;
      act(() => {
        verifySuccess = contextRef.verifyOtp('0000000000', '999999');
      });
      expect(verifySuccess).toBe(false);
    });
  });
});
