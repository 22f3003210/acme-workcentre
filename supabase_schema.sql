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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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

CREATE POLICY "Allow public read number_series" ON public.employee_number_series FOR SELECT USING (true);
CREATE POLICY "Allow public insert number_series" ON public.employee_number_series FOR INSERT WITH CHECK (true);
