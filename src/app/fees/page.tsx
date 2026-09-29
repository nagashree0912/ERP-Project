"use client";
import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone, StatCard } from "@/components/ui";
import { SearchBar, Empty, Pager, usePager } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Wallet, CircleCheck, Clock } from "lucide-react";
import { csv, download } from "@/lib/data";
export default function FeesPage() {
  const s = useStore();
  const { user } = useAuth();
  const canCollect = user?.role === "principal" || user?.role === "teacher";
  const [q, setQ] = useState("");
  const rows = s.fees.filter(f => !q || f.student_name.toLowerCase().includes(q.toLowerCase()));
  const { page, setPage, pages, slice } = usePager(rows);
  const collected = s.fees.reduce((a, f) => a + f.paid, 0);
  const due = s.fees.reduce((a, f) => a + f.due, 0);
  return (<Shell><PageHeader title="Fees" sub="Records, dues & collection" actions={<button className="btn-secondary" onClick={() => download("fees.csv", csv(rows))}>Export CSV</button>} />
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      <StatCard label="Collected" value={"Rs." + (collected / 1000).toFixed(0) + "k"} icon={<CircleCheck size={18} />} tone="emerald" />
      <StatCard label="Pending dues" value={"Rs." + (due / 1000).toFixed(0) + "k"} icon={<Clock size={18} />} tone="amber" />
      <StatCard label="Students" value={s.fees.length} icon={<Wallet size={18} />} tone="indigo" />
    </div>
    <div className="card p-4 mb-4"><SearchBar value={q} onChange={setQ} placeholder="Search student…" /></div>
    {slice.length === 0 ? <Empty title="No fee records" /> : (<><div className="table-wrap"><table className="data"><thead><tr><th>Student</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {slice.map(f => <tr key={f.id}><td className="font-semibold">{f.student_name}</td><td>Rs.{f.total.toLocaleString()}</td><td>Rs.{f.paid.toLocaleString()}</td><td className="font-bold">Rs.{f.due.toLocaleString()}</td><td><Badge tone={statusTone(f.status)}>{f.status}</Badge></td>
      <td>{f.due > 0 ? (canCollect ? <button className="text-xs font-bold text-emerald-600" onClick={() => s.update("fees", f.id, { paid: f.total, due: 0, status: "Paid" })}>Mark Paid</button> : <span className="text-xs text-amber-600 font-semibold">Due — contact office</span>) : <span className="text-xs text-slate-400">Done</span>}</td></tr>)}
    </tbody></table></div><Pager page={page} pages={pages} onPage={setPage} total={rows.length} /></>)}
  </Shell>);
}
