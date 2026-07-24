import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://gvaeukrwjeknyjwbjwcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2YWV1a3J3amVrbnlqd2Jqd2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTg2NTIsImV4cCI6MjEwMDQ3NDY1Mn0.qAJJnDfQDNMVd5eAQEJpi8Z7odQitL5QRXArltnq9oA";

export const isSupabaseConfigured = () => true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

