"use client";
import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("");
    const sup = createClient();
    if (sup) { const { error } = await sup.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` }); setMsg(error ? error.message : "Password reset link sent! Check your email."); }
    else setMsg("Supabase not configured. In demo mode, use the demo passwords on the login card.");
    setBusy(false);
  };
  return (<div className="min-h-screen grid place-items-center p-5 bg-slate-100 dark:bg-slate-950">
    <form onSubmit={submit} className="w-full max-w-md card p-7"><h1 className="text-xl font-extrabold">Reset password</h1><p className="text-sm text-slate-500 mt-1">We will email you a reset link.</p>
    <input className="input mt-4" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@campusflow.edu" required type="email" />
    {msg && <p className="mt-3 text-sm rounded-xl bg-indigo-50 border p-3">{msg}</p>}
    <button className="btn-primary w-full mt-4" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
    <Link href="/login" className="block text-center text-sm text-indigo-600 font-bold mt-3">Back to login</Link></form></div>);
}
