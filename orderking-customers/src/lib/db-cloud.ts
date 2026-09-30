import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_URL?.trim() : undefined;
const supabaseAnonKey = typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() : undefined;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const missingClient = new Proxy(
  {},
  {
    get() {
      return () => {
        throw new Error(
          "SUPABASE_CLIENT_NOT_CONFIGURED: Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using browser Supabase features.",
        );
      };
    },
  },
) as unknown as SupabaseClient;

export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : missingClient;
