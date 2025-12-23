import { createClient } from "@supabase/supabase-js";

 const supabaseUrl = "http://127.0.0.1:54321";
 const supabaseAnonKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
//const supabaseUrl = "https://supabase.pasha-technology.net";
//const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY2NDcwOTc5LCJleHAiOjE5MjQxNTA5Nzl9.GEIafEWxyRcC84B58RyrxeMTpzdPicoTRdtCcKypT7s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
