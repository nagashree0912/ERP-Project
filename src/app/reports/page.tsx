"use client";
import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { csv, download } from "@/lib/data";
const TABS = ["Students", "Attendance", "Marks", "Fees", "Exams"] as const;
export default function ReportsPage() {
  const s = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Students");
  const data: any[] = tab === "Students" ? s.students : tab === "Attendance" ? s.attendance : tab === "Marks" ? s.marks : tab === "Fees" ? s.fees : s.exams;
  return (<Shell><PageHeader title="Reports" sub="Filter, export & print" actions={<><button className="btn-secondary" onClick={() => download(`${tab.toLowerCase()}-report.csv`, csv(data))}>Export CSV</button><button className="btn-primary" onClick={() => window.print()}>Print</button></>} />
    <div className="flex gap-2 mb-4 flex-wrap">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-bold border ${tab === t ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200"}`}>{t}</button>)}</div>
    <div className="table-wrap"><table className="data"><thead><tr>{Object.keys(data[0] || { none: "" }).slice(0, 7).map(k => <th key={k}>{k.replace(/_/g, " ")}</th>)}</tr></thead>
    <tbody>{data.slice(0, 15).map((r: any, i: number) => <tr key={i}>{Object.values(r).slice(0, 7).map((v: any, j: number) => <td key={j}>{String(v)}</td>)}</tr>)}</tbody></table></div>
    <p className="text-xs text-slate-500 px-1 py-3">{data.length} record(s) · showing first 15 · export for full data</p>
  </Shell>);
}
