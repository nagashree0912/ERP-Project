"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell2";
import { PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
export default function SearchPage() {
  const s = useStore(); const router = useRouter();
  const [q, setQ] = useState("");
  const ql = q.toLowerCase();
  const st = q ? s.students.filter(x => (x.full_name + x.roll_number + x.email).toLowerCase().includes(ql)).slice(0, 5) : [];
  const tc = q ? s.teachers.filter(x => (x.full_name + x.subject).toLowerCase().includes(ql)).slice(0, 5) : [];
  const nt = q ? s.notices.filter(x => (x.title + x.description).toLowerCase().includes(ql)).slice(0, 5) : [];
  const ex = q ? s.exams.filter(x => (x.subject + x.name).toLowerCase().includes(ql)).slice(0, 5) : [];
  return (<Shell><PageHeader title="Global Search" sub="Students, teachers, notices, exams" />
    <input autoFocus className="input !py-3 !text-base mb-4" value={q} onChange={e => setQ(e.target.value)} placeholder="Type to search everything…" />
    {!q && <p className="text-sm text-slate-500">Try “Aarav”, “Data Structures”, “Exam”…</p>}
    {q && (<div className="grid sm:grid-cols-2 gap-4">
      <div className="card p-4"><p className="font-bold mb-2">Students ({st.length})</p>{st.map(x => <button key={x.id} onClick={() => router.push("/students")} className="block w-full text-left rounded-lg px-2 py-1.5 hover:bg-slate-50 text-sm"><b>{x.full_name}</b> · {x.roll_number}</button>) || null}{st.length === 0 && <p className="text-xs text-slate-400">None</p>}</div>
      <div className="card p-4"><p className="font-bold mb-2">Teachers ({tc.length})</p>{tc.map(x => <button key={x.id} onClick={() => router.push("/teachers")} className="block w-full text-left rounded-lg px-2 py-1.5 hover:bg-slate-50 text-sm"><b>{x.full_name}</b> · {x.subject}</button>)}{tc.length === 0 && <p className="text-xs text-slate-400">None</p>}</div>
      <div className="card p-4"><p className="font-bold mb-2">Notices ({nt.length})</p>{nt.map(x => <button key={x.id} onClick={() => router.push("/notices")} className="block w-full text-left rounded-lg px-2 py-1.5 hover:bg-slate-50 text-sm"><b>{x.title}</b></button>)}{nt.length === 0 && <p className="text-xs text-slate-400">None</p>}</div>
      <div className="card p-4"><p className="font-bold mb-2">Exams ({ex.length})</p>{ex.map(x => <button key={x.id} onClick={() => router.push("/exams")} className="block w-full text-left rounded-lg px-2 py-1.5 hover:bg-slate-50 text-sm"><b>{x.subject}</b> · {x.date}</button>)}{ex.length === 0 && <p className="text-xs text-slate-400">None</p>}</div>
    </div>)}
  </Shell>);
}
