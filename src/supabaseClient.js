import { createClient } from "@supabase/supabase-js";

// Supabase Configuration
// Use environment variables if available, otherwise use defaults
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "https://supabase.pasha-technology.net";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY2NDcwOTc5LCJleHAiOjE5MjQxNTA5Nzl9.GEIafEWxyRcC84B58RyrxeMTpzdPicoTRdtCcKypT7s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
