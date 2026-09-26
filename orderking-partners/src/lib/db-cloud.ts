import { createClient } from "@supabase/supabase-js";

// Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
export const supabaseCloud = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://xezsqsptomcndbksxrvu.supabase.co", 
  import.meta.env.VITE_SUPABASE_ANON_KEY || "dummy"
);
