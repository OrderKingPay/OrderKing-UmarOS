import { createClient } from "@supabase/supabase-js";

// Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase configuration is missing. Refusing to initialize the partner app with fake credentials.");
}

export const supabaseCloud = createClient(supabaseUrl, supabaseAnonKey);
