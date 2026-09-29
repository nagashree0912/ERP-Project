"use client";
import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader } from "@/components/ui";
import { Field } from "@/components/ui2";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";
export default function SettingsPage() {
  const { user, signOut } = useAuth();
  useStore(); // keep store context mounted for toasts
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.full_name || "");
  const [saved, setSaved] = useState("");
  return (<Shell><PageHeader title="Settings" sub="Account, appearance & data" />
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-5"><p className="font-bold mb-3">Profile</p>
        <Field label="Full name"><input className="input" value={name} onChange={e => setName(e.target.value)} /></Field>
        <div className="mt-2"><Field label="Email"><input className="input" value={user?.email} disabled /></Field></div>
        <p className="mt-2 text-xs text-slate-500 capitalize">Role: {user?.role}</p>
        <button className="btn-primary mt-3" onClick={() => { const s = JSON.parse(localStorage.getItem("cf_session") || "{}"); localStorage.setItem("cf_session", JSON.stringify({ ...s, full_name: name })); setSaved("Profile updated — takes effect on reload."); }}>Save Profile</button>
        {saved && <p className="mt-2 text-xs text-emerald-600">{saved}</p>}</div>
      <div className="card p-5"><p className="font-bold mb-3">Appearance</p>
        <div className="flex gap-2"><button onClick={() => setTheme("light")} className={`btn-secondary flex-1 ${theme !== "dark" ? "!border-indigo-500" : ""}`}>Light</button><button onClick={() => setTheme("dark")} className={`btn-secondary flex-1 ${theme === "dark" ? "!border-indigo-500" : ""}`}>Dark</button></div>
        <p className="font-bold mt-5 mb-2">Change password (demo)</p>
        <form onSubmit={e => { e.preventDefault(); setSaved("Password changed (demo mode)."); }} className="grid gap-2">
          <input type="password" required placeholder="New password" className="input" />
          <button className="btn-secondary">Update Password</button>
        </form></div>
      <div className="card p-5"><p className="font-bold mb-2">Demo data</p><p className="text-xs text-slate-500 mb-3">Reset all records to the original seed (12 students, teachers, marks, fees…).</p>
        <button className="btn-secondary" onClick={() => { localStorage.removeItem("campusflow_db_v1"); location.reload(); }}>Reset Demo Data</button></div>
      <div className="card p-5"><p className="font-bold mb-2">Session</p><p className="text-xs text-slate-500 mb-3">Signed in as {user?.email}</p>
        <button className="btn-secondary" onClick={() => { signOut(); location.href = "/login"; }}>Sign Out</button></div>
    </div>
  </Shell>);
}
