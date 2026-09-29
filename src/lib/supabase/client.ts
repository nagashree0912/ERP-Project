import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

// Placeholder values used when no real Supabase project is configured.
// The demo app runs entirely on localStorage so real credentials are not required.
const PLACEHOLDER_URLS = [
  "https://your-project.supabase.co",
  "https://placeholder.supabase.co",
];

function isPlaceholder(value?: string): boolean {
  if (!value) return true;
  return PLACEHOLDER_URLS.some((p) => value.startsWith(p)) || value.includes("your-project");
}

export function createClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If real credentials are provided, use them.
  if (supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl)) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  }

  // Demo mode: return a no-op mock so the app can boot without Supabase.
  // All authentication is handled by the local auth store (localStorage).
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: {}, error: { message: "Demo mode: use local login" } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as unknown as SupabaseClient;

  return supabaseClient;
}