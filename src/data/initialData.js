// Clean Initial Data for Acme Workcentre (Starting Fresh)
export const initialUsers = [
  {
    id: "admin-acme",
    empCode: "",
    name: "ACME Admin",
    email: "acmeadmin",
    phone: "9876543210",
    role: "Admin",
    title: "System Administrator",
    department: "Management",
    location: "HQ",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    advanceAmount: 0
  }
];

export const initialProjects = [];
export const initialExpenses = [];
export const initialSettings = {
  lateCheckInLimit: "09:30 AM",
  standardHoursPerDay: 8,
  dailyMealsAllowance: 250,
  requiredWorkingDays: 22
};
export const initialAdvanceRequests = [];
export const initialHiringRequisitions = [];
export const initialCandidates = [];
