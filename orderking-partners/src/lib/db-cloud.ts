import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Realtime is optional at shell boot. Never construct a fake/dummy Supabase
 * client: production must use real provisioned credentials, while a missing
 * browser key must not prevent the Partner shell from rendering.
 */
export const supabaseCloud =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
