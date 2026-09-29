"use client";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
export function DashboardCharts() {
  const s = useStore();
  const deptData = [...new Set(s.students.map(x => x.department))].map(d => ({ name: d, students: s.students.filter(x => x.department === d).length }));
  const attTrend = ["18", "19", "20", "21", "22"].map(d => { const day = s.attendance.filter(a => a.date.endsWith(d)); const p = day.filter(a => a.status === "Present").length; return { day: `Sep ${d}`, pct: day.length ? Math.round(p / day.length * 100) : 0 }; });
  const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];
  return (<>
    <div className="grid lg:grid-cols-3 gap-4 mt-4">
      <div className="card p-5 lg:col-span-2"><p className="font-bold">Attendance Trend (%)</p><p className="text-xs text-slate-500 mb-3">Last 5 days</p><div className="h-56"><ResponsiveContainer><LineChart data={attTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div></div>
      <div className="card p-5"><p className="font-bold">Students by Department</p><div className="h-56"><ResponsiveContainer><PieChart><Pie data={deptData} dataKey="students" nameKey="name" outerRadius={75} label>{deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
    </div>
    <div className="grid lg:grid-cols-3 gap-4 mt-4">
      <div className="card p-5 lg:col-span-2"><p className="font-bold">Department Strength</p><div className="h-56 mt-2"><ResponsiveContainer><BarChart data={deptData}><XAxis dataKey="name" fontSize={10} interval={0} angle={-15} dy={10} height={55} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="students" fill="#6366f1" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      <div className="card p-5"><p className="font-bold mb-3">Quick Actions</p><div className="grid grid-cols-2 gap-2">{[["Add Student", "/students"], ["Take Attendance", "/attendance"], ["Enter Marks", "/marks"], ["Schedule Exam", "/exams"], ["Create Notice", "/notices"], ["Collect Fee", "/fees"]].map(([t, h]) => <Link key={t} href={h} className="rounded-xl border p-3 text-xs font-bold hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 text-center">{t}</Link>)}</div>
        <p className="font-bold mt-4 mb-2">Recent Notices</p>{s.notices.slice(0, 3).map(n => <div key={n.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 mb-2"><p className="text-xs font-bold">{n.title}</p><p className="text-[11px] text-slate-500">{n.date} · {n.audience}</p></div>)}</div>
    </div>
  </>);
}
