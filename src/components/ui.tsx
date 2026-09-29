"use client";
import React from "react";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}</div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
export function StatCard({ label, value, sub, icon, tone = "indigo" }: { label: string; value: string | number; sub?: string; icon?: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-600 to-violet-600", emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500", rose: "from-rose-500 to-pink-500",
    cyan: "from-cyan-500 to-sky-500", blue: "from-blue-600 to-indigo-600",
  };
  return (
    <div className="card p-5 relative overflow-hidden animate-fadeUp">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${tones[tone]} opacity-10`} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        {icon && <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-soft`}>{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Badge({ tone = "slate", children }: { tone?: string; children: React.ReactNode }) {
  const m: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${m[tone]}`}>{children}</span>;
}
export const statusTone = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["active", "present", "paid", "approved", "pass", "completed"].includes(v)) return "green";
  if (["absent", "rejected", "fail", "overdue"].includes(v)) return "red";
  if (["pending", "partial", "late", "leave", "upcoming"].includes(v)) return "amber";
  return "slate";
};