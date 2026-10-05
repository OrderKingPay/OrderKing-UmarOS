import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const production = import.meta.env.PROD;

if (production && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error("OrderKing Customer Supabase client is not configured for production.");
}

const clientUrl = supabaseUrl ?? "http://127.0.0.1:54321";
const clientKey = supabaseAnonKey ?? "development-placeholder";

export const supabase = createClient(clientUrl, clientKey);
