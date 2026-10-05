import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const disabledQuery = () => {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    eq: () => chain,
    single: () => chain,
    then: (resolve: (value: { data: null; error: { message: string } }) => unknown) =>
      Promise.resolve(resolve({ data: null, error: { message: "Supabase integration is not configured." } })),
  };
  return chain;
};

const disabledSupabase = {
  from: () => disabledQuery(),
  rpc: () => disabledQuery(),
  channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  removeChannel: () => undefined,
} as unknown as SupabaseClient;

export const supabaseConfigured = Boolean(url && key);
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(url, key)
  : disabledSupabase;
