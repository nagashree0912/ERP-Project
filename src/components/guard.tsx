"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function Guard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { user, loading } = useAuth();

  const store = useStore();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    /*
     * Only check parent accounts.
     */
    if (user.role === "parent") {
      const linkedStudent =
        store.getParentStudent(user.email);

      /*
       * Parent has no linked child.
       * Do not allow the parent portal.
       */
      if (!linkedStudent) {
        router.replace("/login?error=no-child");
        return;
      }
    }

    setChecking(false);
  }, [
    user,
    loading,
    store,
    router,
  ]);

  if (
    loading ||
    checking
  ) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

          <p className="text-sm font-medium text-slate-600">
            Checking account…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}