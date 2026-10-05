import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const supabaseConfigured = Boolean(url && key);
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, key)
  : null;
