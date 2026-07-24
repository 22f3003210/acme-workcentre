-- ====================================================================
-- ACME WORKCENTRE - SUPABASE / POSTGRESQL PRODUCTION SCHEMA SCRIPT
-- ====================================================================
-- This schema prepares clean database tables ready for dynamic user entry.
-- All mock data is removed. Every table starts empty (0 records).
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    emp_code TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Consultant',
    title TEXT,
    department TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    avatar TEXT,
    advance_amount NUMERIC DEFAULT 0,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    display_name TEXT,
    gender TEXT,
    dob DATE,
    nationality TEXT DEFAULT 'Indian',
    work_country TEXT DEFAULT 'India',
    joining_date DATE,
    secondary_job_title TEXT,
    time_type TEXT DEFAULT 'Full Time',
    invite_to_login BOOLEAN DEFAULT false,
    enable_onboarding BOOLEAN DEFAULT true,
    leave_plan TEXT,
    holiday_list TEXT,
    attendance_tracking BOOLEAN DEFAULT true,
    shift TEXT,
    weekly_off TEXT,
    attendance_number TEXT,
    time_tracking_policy TEXT,
    penalization_policy TEXT,
    overtime_policy TEXT,
    expense_policy TEXT,
    annual_ctc NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Schema Migration Script (Run in Supabase SQL Editor if users table already exists)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian',
  ADD COLUMN IF NOT EXISTS work_country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS joining_date DATE,
  ADD COLUMN IF NOT EXISTS secondary_job_title TEXT,
  ADD COLUMN IF NOT EXISTS time_type TEXT DEFAULT 'Full Time',
  ADD COLUMN IF NOT EXISTS invite_to_login BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_onboarding BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS leave_plan TEXT,
  ADD COLUMN IF NOT EXISTS holiday_list TEXT,
  ADD COLUMN IF NOT EXISTS attendance_tracking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS shift TEXT,
  ADD COLUMN IF NOT EXISTS weekly_off TEXT,
  ADD COLUMN IF NOT EXISTS attendance_number TEXT,
  ADD COLUMN IF NOT EXISTS time_tracking_policy TEXT,
  ADD COLUMN IF NOT EXISTS penalization_policy TEXT,
  ADD COLUMN IF NOT EXISTS overtime_policy TEXT,
  ADD COLUMN IF NOT EXISTS expense_policy TEXT,
  ADD COLUMN IF NOT EXISTS annual_ctc NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';


-- 2. JOB TITLES TABLE
CREATE TABLE IF NOT EXISTS public.job_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_name TEXT UNIQUE NOT NULL,
    department TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. EMPLOYEE NUMBER SERIES TABLE
CREATE TABLE IF NOT EXISTS public.employee_number_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT UNIQUE NOT NULL,
    description TEXT,
    department TEXT NOT NULL DEFAULT 'All Departments',
    prefix TEXT NOT NULL DEFAULT '',
    digits INTEGER NOT NULL DEFAULT 3,
    suffix TEXT DEFAULT '',
    next_number INTEGER NOT NULL DEFAULT 101,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dept_name TEXT UNIQUE NOT NULL,
    head_name TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL, -- 'P', 'L', 'HD', 'A', 'OFF'
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. EXPENSES & TRAVEL TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. ADVANCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.advance_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    purpose TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    approved_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT,
    business_unit TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) and grant anon permissions for local/anon access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_number_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read job_titles" ON public.job_titles FOR SELECT USING (true);
CREATE POLICY "Allow public insert job_titles" ON public.job_titles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update job_titles" ON public.job_titles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete job_titles" ON public.job_titles FOR DELETE USING (true);

CREATE POLICY "Allow public read number_series" ON public.employee_number_series FOR SELECT USING (true);
CREATE POLICY "Allow public insert number_series" ON public.employee_number_series FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update number_series" ON public.employee_number_series FOR UPDATE USING (true);
CREATE POLICY "Allow public delete number_series" ON public.employee_number_series FOR DELETE USING (true);

CREATE POLICY "Allow public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public insert departments" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update departments" ON public.departments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete departments" ON public.departments FOR DELETE USING (true);

CREATE POLICY "Allow public read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance" ON public.attendance FOR UPDATE USING (true);

CREATE POLICY "Allow public read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);

CREATE POLICY "Allow public read advance_requests" ON public.advance_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert advance_requests" ON public.advance_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update advance_requests" ON public.advance_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete projects" ON public.projects FOR DELETE USING (true);
