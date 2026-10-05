import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

function createUnavailableClient(): SupabaseClient {
  const fail = () => {
    throw new Error(
      "Supabase is not configured for the Customer app. Realtime/storage features remain unavailable until real production credentials are provisioned.",
    );
  };
  return new Proxy({} as SupabaseClient, {
    get: () => fail,
  });
}

export const supabase: SupabaseClient =
  url && key ? createClient(url, key) : createUnavailableClient();
