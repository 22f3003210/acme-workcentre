import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://gvaeukrwjeknyjwbjwcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2YWV1a3J3amVrbnlqd2Jqd2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTg2NTIsImV4cCI6MjEwMDQ3NDY1Mn0.qAJJnDfQDNMVd5eAQEJpi8Z7odQitL5QRXArltnq9oA";

export const isSupabaseConfigured = () => true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Supabase Write-Back CRUD Helper Functions ──────────────

// Expenses
export const supabaseAddExpense = async (expense) => {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: expense.id,
    employee_id: expense.employeeId,
    project_id: expense.projectId || null,
    date: expense.date,
    submitted_date: expense.submittedDate,
    category: expense.category,
    amount: Number(expense.amount) || 0,
    reason: expense.reason || expense.description || "",
    receipt: expense.receipt || "",
    status: expense.status || "Pending",
    approved_by: expense.approvedBy || expense.reviewedBy || null,
    approved_date: expense.approvedDate || null
  };
  const { data, error } = await supabase.from("expenses").upsert([payload], { onConflict: "id" });
  if (error) console.error("Supabase add expense error:", error);
  return { data, error };
};

export const supabaseVerifyExpense = async (expenseId, status, notes, reviewerName) => {
  if (!isSupabaseConfigured()) return;
  const approvedDate = status === "Approved" ? new Date().toISOString().split("T")[0] : null;
  const { data, error } = await supabase.from("expenses").update({
    status: status,
    approved_by: reviewerName,
    approved_date: approvedDate
  }).eq("id", expenseId);
  if (error) console.error("Supabase verify expense error:", error);
  return { data, error };
};

// Projects
export const supabaseAddProject = async (project) => {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: project.id,
    code: project.code || "",
    name: project.name || "",
    client: project.client || "",
    poc_name: project.pocName || "",
    poc_contact: project.pocContact || "",
    client_contact: project.clientContact || "",
    status: project.status || "Active",
    start_date: project.startDate || null,
    budget: Number(project.budget) || 0,
    spent: Number(project.spent) || 0,
    location: project.location || "",
    description: project.description || "",
    engagement_purpose: project.engagementPurpose || "",
    assigned_consultants: project.assignedConsultants || []
  };
  const { data, error } = await supabase.from("projects").upsert([payload], { onConflict: "id" });
  if (error) console.error("Supabase add project error:", error);
  return { data, error };
};

export const supabaseUpdateProject = async (projectId, updatedFields) => {
  if (!isSupabaseConfigured()) return;
  const dbPayload = {};
  if (updatedFields.code !== undefined) dbPayload.code = updatedFields.code;
  if (updatedFields.name !== undefined) dbPayload.name = updatedFields.name;
  if (updatedFields.client !== undefined) dbPayload.client = updatedFields.client;
  if (updatedFields.pocName !== undefined) dbPayload.poc_name = updatedFields.pocName;
  if (updatedFields.pocContact !== undefined) dbPayload.poc_contact = updatedFields.pocContact;
  if (updatedFields.clientContact !== undefined) dbPayload.client_contact = updatedFields.clientContact;
  if (updatedFields.status !== undefined) dbPayload.status = updatedFields.status;
  if (updatedFields.startDate !== undefined) dbPayload.start_date = updatedFields.startDate;
  if (updatedFields.budget !== undefined) dbPayload.budget = Number(updatedFields.budget) || 0;
  if (updatedFields.spent !== undefined) dbPayload.spent = Number(updatedFields.spent) || 0;
  if (updatedFields.location !== undefined) dbPayload.location = updatedFields.location;
  if (updatedFields.description !== undefined) dbPayload.description = updatedFields.description;
  if (updatedFields.engagementPurpose !== undefined) dbPayload.engagement_purpose = updatedFields.engagementPurpose;
  if (updatedFields.assignedConsultants !== undefined) dbPayload.assigned_consultants = updatedFields.assignedConsultants;

  const { data, error } = await supabase.from("projects").update(dbPayload).eq("id", projectId);
  if (error) console.error("Supabase update project error:", error);
  return { data, error };
};

// Advance Requests
export const supabaseRequestAdvance = async (request) => {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: request.id,
    employee_id: request.employeeId,
    amount: Number(request.amount) || 0,
    purpose: request.purpose || "",
    date: request.date,
    status: request.status || "Pending",
    reviewed_by: request.reviewedBy || null
  };
  const { data, error } = await supabase.from("advance_requests").upsert([payload], { onConflict: "id" });
  if (error) console.error("Supabase request advance error:", error);
  return { data, error };
};

export const supabaseVerifyAdvanceRequest = async (requestId, status, reviewerName) => {
  if (!isSupabaseConfigured()) return;
  const { data, error } = await supabase.from("advance_requests").update({
    status: status,
    reviewed_by: reviewerName
  }).eq("id", requestId);
  if (error) console.error("Supabase verify advance request error:", error);
  return { data, error };
};

// Hiring Requisitions
export const supabaseAddHiringRequisition = async (reqData) => {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: reqData.id,
    project_id: reqData.projectId || null,
    client_name: reqData.clientName || "",
    position_title: reqData.positionTitle || "",
    location: reqData.location || "",
    min_experience_years: Number(reqData.minExperienceYears) || 0,
    budget_annual: Number(reqData.budgetAnnual) || 0,
    status: reqData.status || "Open"
  };
  const { data, error } = await supabase.from("hiring_requisitions").upsert([payload], { onConflict: "id" });
  if (error) console.error("Supabase add hiring requisition error:", error);
  return { data, error };
};

// Candidates
export const supabaseAddCandidate = async (candData) => {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: candData.id,
    full_name: candData.fullName || "",
    email: candData.email || "",
    phone: candData.phone || "",
    current_city: candData.currentCity || "",
    preferred_cities: candData.preferredCities || [],
    experience_years: Number(candData.experienceYears) || 0,
    current_role: candData.currentRole || candData.candidateRole || "",
    expected_ctc: Number(candData.expectedCtc) || 0,
    status: candData.status || "In Process",
    assigned_recruiter: candData.assignedRecruiter || "",
    resume_url: candData.resumeUrl || ""
  };
  const { data, error } = await supabase.from("candidates").upsert([payload], { onConflict: "id" });
  if (error) console.error("Supabase add candidate error:", error);
  return { data, error };
};
