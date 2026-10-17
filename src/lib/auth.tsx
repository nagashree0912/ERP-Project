"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: Role;
  avatar?: string;
  department?: string;
}

interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
    role: Role
  ) => Promise<{
    ok: boolean;
    error?: string;
  }>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

/* =========================================================
   SESSION KEYS
   ========================================================= */

const DEMO_USER_KEY = "campusflow_demo_user";

/* =========================================================
   ROLE NORMALIZER
   ========================================================= */

function normalizeRole(value: any): Role {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (role === "principal") return "principal";
  if (role === "teacher") return "teacher";
  if (role === "parent") return "parent";
  if (role === "student") return "student";

  return "student";
}

function parseProfileRole(value: unknown): Role | null {
  const role = String(value || "").trim().toLowerCase();
  if (role === "principal" || role === "teacher" || role === "parent" || role === "student") {
    return role;
  }
  return null;
}

async function getProfileRole(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: profile, error } = await supabase
    .schema("public")
    .from("profiles")
    .select("id,role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Authenticated profile role lookup failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      role: null,
      error: error.code === "PGRST205"
        ? "The configured Supabase Data API cannot resolve public.profiles. Verify the project URL, exposed public schema, and PostgREST schema cache."
        : "Unable to read your CampusFlow profile. Check the server/database error logs.",
    };
  }

  if (!profile) {
    return {
      role: null,
      error: "No CampusFlow profile exists for this authenticated account. Ask the Principal to link the existing Auth user ID; do not create another Auth user.",
    };
  }
  if (profile.id !== userId) {
    return { role: null, error: "The CampusFlow profile ID does not match the authenticated user ID." };
  }

  const role = parseProfileRole(profile.role);
  if (!role) {
    return { role: null, error: "Your CampusFlow profile has an unsupported role. Ask the Principal to correct the profile role." };
  }

  return { role, error: null };
}

/* =========================================================
   DEMO USERS TABLE
   ========================================================= */

const DEMO_USERS: DemoUser[] = [
  {
    id: "principal-1",
    email: "principal@campusflow.edu",
    password: "password123",
    full_name: "Mr. Ramesh Sharma",
    role: "principal",
  },
  {
    id: "teacher-1",
    email: "priya.rao@campusflow.edu",
    password: "password123",
    full_name: "Dr. Priya Rao",
    role: "teacher",
    department: "Computer Science",
  },
  {
    id: "teacher-2",
    email: "raj.kumar@campusflow.edu",
    password: "password123",
    full_name: "Prof. Raj Kumar",
    role: "teacher",
    department: "Computer Science",
  },
  {
    id: "parent-1",
    email: "roja123@campusflow.edu",
    password: "password123",
    full_name: "Dareddy.Roja",
    role: "parent",
  },
  {
    id: "student-1",
    email: "nagashree@campusflow.edu",
    password: "password123",
    full_name: "Dareddy.Nagashree",
    role: "student",
    department: "Computer Science(CS)",
  },
];

/* =========================================================
   BUILD USER (from Supabase session)
   ========================================================= */

function buildUser(
  sessionUser: any,
  role: Role
): DemoUser | null {
  if (!sessionUser) {
    return null;
  }

  const metadata = sessionUser.user_metadata || {};

  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    password: "",
    full_name:
      metadata.full_name ||
      metadata.name ||
      sessionUser.email ||
      "User",
    role,
    avatar: metadata.avatar || undefined,
    department: metadata.department || undefined,
  };
}

/* =========================================================
   PROVIDER
   ========================================================= */

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* =======================================================
     LOAD EXISTING SESSION
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    // Check for a saved demo user first (localStorage)
    if (typeof window !== "undefined") {
      const savedDemo = localStorage.getItem(DEMO_USER_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo) as DemoUser;
          if (mounted) {
            setUser(parsed);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(DEMO_USER_KEY);
        }
      }
    }

    const supabase = createClient();

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const result = await getProfileRole(supabase, session.user.id);
          if (!mounted) return;
          setUser(result.role ? buildUser(session.user, result.role) : null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading Supabase session:", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setUser(null);
        return;
      }

      void getProfileRole(supabase, session.user.id).then(result => {
        if (mounted) setUser(result.role ? buildUser(session.user, result.role) : null);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     SIGN IN
     ======================================================= */

  async function signIn(
    email: string,
    password: string,
    role: Role
  ) {
    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();
    const selectedRole = normalizeRole(role);

    /* -------------------------------------------------------
       LOCAL DEMO LOGIN — works without real Supabase keys
    ------------------------------------------------------- */

    const demoMatch = DEMO_USERS.find(
      (u) =>
        u.email === cleanEmail &&
        u.password === password &&
        u.role === selectedRole
    );

    if (demoMatch) {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoMatch));
      }
      setUser(demoMatch);
      return { ok: true };
    }

    // Helpful error for known demo accounts with wrong role/password
    const emailMatch = DEMO_USERS.find((u) => u.email === cleanEmail);
    if (emailMatch) {
      if (emailMatch.password !== password) {
        return { ok: false, error: "Incorrect password. Try: password123" };
      }
      if (emailMatch.role !== selectedRole) {
        return {
          ok: false,
          error: `This is a "${emailMatch.role}" account. Please select the "${emailMatch.role}" tab above.`,
        };
      }
    }

    /* -------------------------------------------------------
       FALLBACK — try real Supabase (if configured)
    ------------------------------------------------------- */

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data.user) {
        return { ok: false, error: "Login failed. No user returned." };
      }

      const profileResult = await getProfileRole(supabase, data.user.id);
      if (!profileResult.role) {
        await supabase.auth.signOut();
        return { ok: false, error: profileResult.error || "Unable to verify your CampusFlow profile." };
      }

      if (profileResult.role !== selectedRole) {
        await supabase.auth.signOut();
        return {
          ok: false,
          error: `This account is registered as ${profileResult.role}, not ${selectedRole}.`,
        };
      }

      const finalUser = buildUser(data.user, profileResult.role);
      setUser(finalUser);
      return { ok: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { ok: false, error: error?.message || "Unable to sign in." };
    }
  }

  /* =======================================================
     SIGN OUT
     ======================================================= */

  async function signOut() {
    const supabase = createClient();

    // Clear demo session
    if (typeof window !== "undefined") {
      localStorage.removeItem(DEMO_USER_KEY);
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
