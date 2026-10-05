import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function unavailableClient(message: string): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(message);
    },
  });
}

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseCloud: SupabaseClient =
  url && key
    ? createClient(url, key)
    : unavailableClient(
        "Supabase browser client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before enabling partner realtime/data access.",
      );
