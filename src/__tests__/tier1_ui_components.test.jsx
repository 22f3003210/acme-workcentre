import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { getRoutePath, AppRoutes } from '../App';
import AdminView from '../views/AdminView';
import ProjectsView from '../views/ProjectsView';
import RecruiterView from '../views/RecruiterView';
import RegisterView from '../views/RegisterView';
import AddEmployeeWizard from '../views/AddEmployeeWizard';
import LedgerReports from '../components/LedgerReports';

// Helper wrapper to provide AppContext and Router
const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </AppProvider>
  );
};

describe('Tier 1: UI Route & View Components', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('workcentre_data_version', 'v13');
    localStorage.setItem('workcentre_authenticated', 'true');
    localStorage.setItem('workcentre_current_user_id', 'admin-acme');
  });

  describe('Route Mapping Helpers', () => {
    it('should map tab IDs to correct clean route paths using getRoutePath', () => {
      expect(getRoutePath('dashboard')).toBe('/dashboard');
      expect(getRoutePath('directory')).toBe('/employee/directory');
      expect(getRoutePath('add-employee')).toBe('/employee/add');
      expect(getRoutePath('job-titles')).toBe('/employee/job-titles');
      expect(getRoutePath('number-series')).toBe('/employee/number-series');
      expect(getRoutePath('departments')).toBe('/employee/departments');
      expect(getRoutePath('org-tree')).toBe('/employee/org-tree');
      expect(getRoutePath('logins')).toBe('/employee/logins');
      expect(getRoutePath('profile-changes')).toBe('/employee/profile-changes');
      expect(getRoutePath('probation')).toBe('/employee/probation');
      expect(getRoutePath('reports')).toBe('/expenses');
      expect(getRoutePath('expenses')).toBe('/expenses');
      expect(getRoutePath('attendance')).toBe('/time/attendance');
      expect(getRoutePath('projects')).toBe('/projects');
      expect(getRoutePath('recruitment')).toBe('/recruiting');
      expect(getRoutePath('settings')).toBe('/settings');
      expect(getRoutePath('ledger')).toBe('/ledger');
      expect(getRoutePath('unknown-tab')).toBe('/dashboard');
    });
  });

  describe('View Components Rendering', () => {
    it('renders AdminView dashboard mode correctly', () => {
      renderWithProviders(<AdminView activeTab="dashboard" setActiveTab={() => {}} />);
      expect(screen.getByText(/Welcome! ADMIN/i)).toBeInTheDocument();
      expect(screen.getByText(/⚡ Quick Access/i)).toBeInTheDocument();
      expect(screen.getByText(/Add New Consultant/i)).toBeInTheDocument();
      expect(screen.getByText(/Work To Do/i)).toBeInTheDocument();
    });

    it('renders ProjectsView with header stats and empty or project list state', () => {
      renderWithProviders(<ProjectsView />);
      expect(screen.getByText(/TOTAL PROJECTS/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Register New Project/i)).toBeInTheDocument();
    });

    it('renders RecruiterView with recruitment tabs and job management header', () => {
      renderWithProviders(<RecruiterView />);
      expect(screen.getByText(/Approved requisition/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Create Job/i)).toBeInTheDocument();
    });

    it('renders RegisterView consultant self-registration portal', () => {
      renderWithProviders(<RegisterView onCancel={() => {}} />);
      expect(screen.getByText(/Consultant Self-Registration/i)).toBeInTheDocument();
      expect(screen.getByText(/ONBOARDING PORTAL/i)).toBeInTheDocument();
    });

    it('renders AddEmployeeWizard step 1 basic details form', () => {
      renderWithProviders(<AddEmployeeWizard />);
      expect(screen.getByText(/Add Employee Wizard/i)).toBeInTheDocument();
      expect(screen.getByText(/BASIC DETAILS/i)).toBeInTheDocument();
      expect(screen.getByText(/Work Country/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
    });

    it('renders LedgerReports claims desk, daywise head, and individual ledger tabs', () => {
      renderWithProviders(<LedgerReports />);
      expect(screen.getAllByText(/Expense Claims & Ledgers/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Claims Desk/i)).toBeInTheDocument();
      expect(screen.getByText(/Day-wise Head/i)).toBeInTheDocument();
      expect(screen.getByText(/Individual Ledgers/i)).toBeInTheDocument();
    });

    it('allows switching sub-tabs inside LedgerReports', () => {
      renderWithProviders(<LedgerReports />);
      const daywiseBtn = screen.getByText(/Day-wise Head/i);
      fireEvent.click(daywiseBtn);
      expect(screen.getByText(/Select Date/i)).toBeInTheDocument();

      const individualBtn = screen.getByText(/Individual Ledgers/i);
      fireEvent.click(individualBtn);
      expect(screen.getByText(/Select Consultant:/i)).toBeInTheDocument();
    });
  });

  describe('Full Application Routes Navigation', () => {
    it('renders login view when unauthenticated at route /auth/login', () => {
      localStorage.setItem('workcentre_authenticated', 'false');
      renderWithProviders(<AppRoutes />, { route: '/auth/login' });
      expect(screen.getByPlaceholderText(/acmeadmin/i)).toBeInTheDocument();
    });

    it('redirects to /dashboard when authenticated at root route /', () => {
      localStorage.setItem('workcentre_authenticated', 'true');
      renderWithProviders(<AppRoutes />, { route: '/' });
      expect(screen.getByText(/Welcome! ADMIN/i)).toBeInTheDocument();
    });

    it('navigates to /employee/directory route rendering AdminView employee directory', () => {
      localStorage.setItem('workcentre_authenticated', 'true');
      renderWithProviders(<AppRoutes />, { route: '/employee/directory' });
      expect(screen.getAllByText(/Employee Directory/i)[0]).toBeInTheDocument();
    });

    it('navigates to /employee/add route rendering AddEmployeeWizard', () => {
      localStorage.setItem('workcentre_authenticated', 'true');
      renderWithProviders(<AppRoutes />, { route: '/employee/add' });
      expect(screen.getByText(/Add Employee Wizard/i)).toBeInTheDocument();
    });

    it('navigates to /projects route rendering ProjectsView', () => {
      localStorage.setItem('workcentre_authenticated', 'true');
      renderWithProviders(<AppRoutes />, { route: '/projects' });
      expect(screen.getByText(/TOTAL PROJECTS/i)).toBeInTheDocument();
    });

    it('navigates to /ledger route rendering LedgerReports', () => {
      localStorage.setItem('workcentre_authenticated', 'true');
      renderWithProviders(<AppRoutes />, { route: '/ledger' });
      expect(screen.getAllByText(/Expense Claims & Ledgers/i)[0]).toBeInTheDocument();
    });

    it('navigates to /time/attendance route rendering Attendance matrix', () => {
      localStorage.setItem('workcentre_authenticated', 'true');
      renderWithProviders(<AppRoutes />, { route: '/time/attendance' });
      expect(screen.getAllByText(/Attendance Summary/i)[0]).toBeInTheDocument();
    });
  });
});
