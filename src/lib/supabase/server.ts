import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
// Server-side Supabase client (for future server actions / route handlers).
// NOTE: not used by current client-side pages; kept typed loosely on purpose.
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anon) return null;
  const store: any = cookies();
  return createServerClient(url, anon, { cookies: { get(n: string) { return store.get(n)?.value; }, set(n: string, v: string, o: any) { try { store.set(n, v, o); } catch {} }, remove(n: string, o: any) { try { store.set(n, "", o); } catch {} } } });
}

