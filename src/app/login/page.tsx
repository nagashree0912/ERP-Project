"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, ShieldCheck, Users, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/types";
import { ErrorBox } from "@/components/ui2";

const ROLES: { id: Role; label: string }[] = [
  { id: "principal", label: "Principal" },
  { id: "teacher", label: "Teacher" },
  { id: "parent", label: "Parent" },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<Role>("principal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const chooseRole = (next: Role) => { setRole(next); setEmail(""); setPassword(""); setError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    const result = await signIn(email.trim(), password, role);
    setLoading(false);
    if (!result.ok) { setError(result.error || "Unable to sign in."); return; }
    if (remember) sessionStorage.setItem("campusflow_remember", "1");
    router.replace("/dashboard");
  };

  return <main className="min-h-screen bg-[#f5f7ff] lg:grid lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden lg:flex lg:min-h-screen lg:flex-col lg:justify-between bg-gradient-to-br from-[#dbeafe] via-[#eef2ff] to-[#c4b5fd] p-10">
      <div className="absolute inset-0 bg-[url('/campus-illustration.svg')] bg-cover bg-center opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#eef2ff]/95 via-[#eef2ff]/35 to-[#c7d2fe]/25" />
      <div className="relative z-10">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg"><GraduationCap size={27}/></div><div><p className="text-xl font-extrabold tracking-tight text-[#132b5a]">CampusFlow</p><p className="text-[11px] font-semibold text-indigo-700/75">College ERP</p></div></div>
        <div className="mt-16 max-w-xl"><p className="text-sm font-bold text-indigo-700">For a Smarter Campus</p><h1 className="mt-2 text-5xl font-extrabold leading-[1.08] tracking-tight text-[#122b5a]">Simplify Today.<br/>Empower Tomorrow.</h1><p className="mt-4 max-w-md text-sm leading-6 text-slate-600">One connected platform for principals, teachers and parents to manage academics, communication and student progress.</p></div>
        <div className="mt-8 grid max-w-xl grid-cols-3 gap-3"><Feature icon={ShieldCheck} title="Secure" text="Access for authorized users"/><Feature icon={Users} title="Connect" text="People, academics and growth"/><Feature icon={BarChart3} title="Simplify" text="Management tasks"/></div>
      </div>
      <div className="relative z-10 max-w-xl rounded-2xl bg-white/55 p-4 backdrop-blur-sm"><p className="text-center text-sm font-semibold italic text-[#27416f]">“Education thrives when everyone is connected.”</p></div>
    </section>

    <section className="flex min-h-screen items-center justify-center p-5 sm:p-8">
      <form onSubmit={submit} className="w-full max-w-[430px] rounded-[28px] border border-white bg-white p-6 shadow-[0_20px_70px_rgba(43,53,110,.12)] sm:p-8">
        <div className="mb-7 flex items-center gap-3 lg:hidden"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white"><GraduationCap size={23}/></div><div><p className="font-extrabold text-[#132b5a]">CampusFlow</p><p className="text-[10px] text-slate-400">College ERP</p></div></div>
        <div><p className="text-2xl font-extrabold tracking-tight text-[#102b5c]">Welcome Back!</p><p className="mt-1 text-xs text-slate-400">Sign in to your account</p></div>
        <div className="mt-6 grid grid-cols-3 rounded-xl bg-slate-50 p-1">{ROLES.map((r)=><button key={r.id} type="button" onClick={()=>chooseRole(r.id)} className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${role===r.id?"bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md":"text-slate-500 hover:text-slate-800"}`}>{r.label}</button>)}</div>
        <div className="mt-5 space-y-4"><label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span><div className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-500"><span className="text-slate-400">✉</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" className="w-full bg-transparent px-2 py-3 text-sm outline-none"/></div></label><label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</span><div className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-500"><span className="text-slate-400">⌑</span><input type={showPassword?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="w-full bg-transparent px-2 py-3 text-sm outline-none"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="text-slate-400" aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label></div>
        {error && <div className="mt-4"><ErrorBox msg={error}/></div>}
        <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:brightness-105 disabled:opacity-60">{loading?"Signing in…":"Sign In"}<ArrowRight size={17}/></button>
        <div className="mt-4 flex items-center justify-between text-[11px]"><label className="flex items-center gap-2 text-slate-500"><input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} className="accent-indigo-600"/>Remember me</label><Link href="/forgot-password" className="font-bold text-indigo-600 hover:underline">Forgot password?</Link></div>
        <div className="mt-7 border-t border-slate-100 pt-5 text-center"><p className="text-[10px] text-slate-400">Secure role-based access • CampusFlow ERP</p></div>
      </form>
    </section>
  </main>;
}

function Feature({icon:Icon,title,text}:{icon:any;title:string;text:string}){return <div className="rounded-2xl border border-white/60 bg-white/55 p-3 backdrop-blur-sm"><div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm"><Icon size={16}/></div><p className="mt-2 text-xs font-extrabold text-slate-700">{title}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{text}</p></div>}
