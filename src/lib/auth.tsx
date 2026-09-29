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

const ROLE_KEY = "campusflow_role";
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
  selectedRole?: Role | null
): DemoUser | null {
  if (!sessionUser) {
    return null;
  }

  const metadata = sessionUser.user_metadata || {};

  let savedRole: Role | null = null;

  if (typeof window !== "undefined") {
    savedRole = normalizeRole(
      sessionStorage.getItem(ROLE_KEY)
    );
  }

  const metadataRole =
    metadata.role ||
    metadata.user_role ||
    metadata.account_role ||
    null;

  const role = metadataRole
    ? normalizeRole(metadataRole)
    : selectedRole
      ? normalizeRole(selectedRole)
      : savedRole
        ? savedRole
        : "student";

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
          const savedRole =
            typeof window !== "undefined"
              ? sessionStorage.getItem(ROLE_KEY)
              : null;

          const currentUser = buildUser(
            session.user,
            savedRole ? normalizeRole(savedRole) : null
          );

          setUser(currentUser);
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

      const savedRole =
        typeof window !== "undefined"
          ? sessionStorage.getItem(ROLE_KEY)
          : null;

      const currentUser = buildUser(
        session.user,
        savedRole ? normalizeRole(savedRole) : null
      );

      setUser(currentUser);
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
        sessionStorage.setItem(ROLE_KEY, selectedRole);
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

    if (typeof window !== "undefined") {
      sessionStorage.setItem(ROLE_KEY, selectedRole);
    }

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

      const metadata = data.user.user_metadata || {};
      const metadataRole =
        metadata.role || metadata.user_role || metadata.account_role || null;

      if (metadataRole) {
        const actualRole = normalizeRole(metadataRole);
        if (actualRole !== selectedRole) {
          await supabase.auth.signOut();
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(ROLE_KEY);
          }
          return {
            ok: false,
            error: `This account is registered as ${actualRole}, not ${selectedRole}.`,
          };
        }
      }

      const finalUser = buildUser(data.user, selectedRole);
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
      sessionStorage.removeItem(ROLE_KEY);
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
