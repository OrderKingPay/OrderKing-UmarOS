import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof process !== "undefined" && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  "https://api.orderkingpay.com";

const supabaseAnonKey =
  (typeof process !== "undefined" && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  "orderking-partner-cloud-token";

export const supabaseCloud = createClient(supabaseUrl, supabaseAnonKey);
