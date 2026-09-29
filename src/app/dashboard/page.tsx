"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  UserRound,
  Users,
  Wallet,
  BookOpen,
  Award,
  Bell,
  Megaphone,
  FileBarChart,
  MessageSquareWarning,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import { Shell } from "@/components/shell2";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

function StatCard({ icon: Icon, value, label, change, tone = "indigo" }: any) {
  const tones: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone] || tones.indigo}`}>
          <Icon size={19} />
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
          {change || "Live"}
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  return (
    <div
      className="relative grid h-32 w-32 place-items-center rounded-full"
      style={{ background: `conic-gradient(#10b981 ${percent}%, #e5e7eb ${percent}% 100%)` }}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-2xl font-extrabold text-slate-800">{percent}%</p>
          <p className="text-[9px] text-slate-400">Overall</p>
        </div>
      </div>
    </div>
  );
}

function PageTitle({ title, quote }: any) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold text-slate-400">
          Lead <span className="mx-1">&bull;</span> Manage <span className="mx-1">&bull;</span> Inspire
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#102b5c] sm:text-[28px]">{title}</h1>
      </div>
      {quote && (
        <div className="hidden max-w-[270px] rounded-2xl bg-indigo-50/80 px-4 py-3 text-right text-[11px] italic leading-5 text-slate-500 sm:block">
          &ldquo;{quote}&rdquo;
        </div>
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, tone }: any) {
  return (
    <Link href={href} className="group rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className={`mx-auto grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
        <Icon size={17} />
      </div>
      <p className="mt-2 text-[10px] font-bold text-slate-600 group-hover:text-indigo-600">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const s = useStore();
  if (!user) return null;

  const role = user.role;
  const child = role === "parent" ? s.getParentStudent(user.email) : null;

  /* ===========================================================
     PARENT — no child linked
  =========================================================== */
  if (role === "parent" && !child) {
    return (
      <Shell>
        <PageTitle title="Welcome, Parent!" quote="Your involvement today builds their tomorrow." />
        <div className="card mx-auto max-w-2xl p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
            <UserRound size={28} />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-slate-800">No children linked</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            No child is linked to this parent account. Please contact the college administrator to link a student.
          </p>
          <Link href="/settings" className="btn-primary mt-6">
            Open Settings <ArrowRight size={16} />
          </Link>
        </div>
      </Shell>
    );
  }

  /* ===========================================================
     PARENT — child linked
  =========================================================== */
  if (role === "parent" && child) {
    // Attendance
    const attendance = s.attendance.filter((a: any) => String(a.student_id) === String(child.id));
    const presentCount = attendance.filter((a: any) => String(a.status).toLowerCase() === "present").length;
    const attendancePct = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

    // Marks
    const marks = s.marks.filter((m: any) => String(m.student_id) === String(child.id));
    const sgpa = marks.length
      ? (marks.reduce((sum: number, m: any) => sum + Number(m.total || 0), 0) / marks.length / 10).toFixed(2)
      : "0.00";

    // Exams
    const upcomingExams = s.exams.slice(0, 3);

    // Fees
    const fees = s.fees.filter((f: any) => String(f.student_id || "") === String(child.id));
    const due = fees.reduce((sum: number, f: any) => sum + Number(f.due ?? (Number(f.total || 0) - Number(f.paid || 0))), 0);

    // Notices
    const notices = s.notices
      .filter((n: any) =>
        String(n.audience || "").toLowerCase().includes("student") ||
        String(n.audience || "").toLowerCase().includes("parent")
      )
      .slice(0, 3);

    // Avatar initials
    const initials = child.full_name.split(/\s+/).map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();

    // Date helpers
    const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const getDay = (ds: string) => { const d = new Date(ds); return isNaN(d.getTime()) ? "--" : String(d.getDate()).padStart(2, "0"); };
    const getMonth = (ds: string) => { const d = new Date(ds); return isNaN(d.getTime()) ? "" : MONTHS[d.getMonth()]; };

    const examColors = ["bg-rose-500", "bg-blue-600", "bg-emerald-600"];
    const noticeColors = ["bg-orange-400", "bg-blue-500", "bg-purple-500"];

    return (
      <Shell>
        {/* Page Header */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-slate-400">
            Lead <span className="mx-1">•</span> Manage <span className="mx-1">•</span> Inspire
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#102b5c] sm:text-[28px]">
            Welcome, Parent!
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Stay Connected <span className="mx-2">•</span> Stay Informed
          </p>
        </div>

        {/* Child card + Stat tiles */}
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          {/* Child card */}
          <div className="card flex flex-col gap-3 bg-gradient-to-r from-white to-indigo-50/60 p-5 sm:flex-row sm:items-center">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-extrabold text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">My Child</p>
              <h2 className="mt-0.5 truncate text-lg font-extrabold">{child.full_name}</h2>
              <p className="truncate text-xs text-slate-500">{child.department} · {child.year}</p>
              <p className="text-xs text-slate-500">Roll No: {child.roll_number || child.roll_no}</p>
            </div>
            <Link
              href="/students"
              className="mt-2 shrink-0 rounded-xl border-2 border-indigo-600 px-4 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-600 hover:text-white sm:ml-6 sm:mt-0"
            >
              View Full Details
            </Link>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card flex flex-col items-center justify-center gap-1 p-4 text-center">
              <div className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <ClipboardCheck size={20} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{attendancePct}%</p>
              <p className="text-[11px] font-medium text-slate-500">Attendance</p>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 p-4 text-center">
              <div className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-600">
                <Award size={20} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{sgpa}</p>
              <p className="text-[11px] font-medium text-slate-500">Current SGPA</p>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 p-4 text-center">
              <div className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-600">
                <CalendarDays size={20} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{upcomingExams.length}</p>
              <p className="text-[11px] font-medium text-slate-500">Upcoming Exams</p>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 p-4 text-center">
              <div className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600">
                <Wallet size={20} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                {due > 0 ? `₹${due.toLocaleString()}` : "0"}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Fee Dues</p>
            </div>
          </div>
        </div>

        {/* Complaints Box & Formal Requests Quick Access */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Complaint Box to Principal */}
          <div className="card relative overflow-hidden p-5 border border-rose-100 bg-gradient-to-br from-rose-50/40 via-white to-amber-50/20 dark:border-rose-950/40 dark:from-rose-950/10 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-sm">
                  <MessageSquareWarning size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Complaint Box to Principal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct confidential redressal desk to Dr. Nagashree
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {(s.complaints || []).filter((c: any) => c.status !== "Resolved").length} Active
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-rose-100/60 dark:border-slate-800">
              <p className="text-[11px] text-slate-500">
                Track resolution &amp; Principal remarks
              </p>
              <Link
                href="/complaints"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                Open Complaint Box &rarr;
              </Link>
            </div>
          </div>

          {/* Formal Requests & Applications */}
          <div className="card relative overflow-hidden p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20 dark:border-indigo-950/40 dark:from-indigo-950/10 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-sm">
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Parent Requests &amp; Applications
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Leave applications, Bonafide certificates, PTM with Principal
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {(s.requests || []).length} Submitted
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-indigo-100/60 dark:border-slate-800">
              <p className="text-[11px] text-slate-500">
                Apply for certificates or meetings
              </p>
              <Link
                href="/requests"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Submit / Track Request &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Marks | Upcoming Exams */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-800">Recent Marks</p>
              <Link href="/marks" className="text-[11px] font-bold text-indigo-600 hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 text-left font-bold text-slate-500">Subject</th>
                    <th className="py-2 text-center font-bold text-slate-500">Internal</th>
                    <th className="py-2 text-center font-bold text-slate-500">External</th>
                    <th className="py-2 text-center font-bold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.slice(0, 5).map((m: any) => (
                    <tr key={m.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 font-semibold text-slate-700">{m.subject}</td>
                      <td className="py-2.5 text-center text-slate-600">{m.internal}</td>
                      <td className="py-2.5 text-center text-slate-600">{m.external}</td>
                      <td className="py-2.5 text-center font-bold text-slate-800">{m.total}</td>
                    </tr>
                  ))}
                  {marks.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No marks available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-800">Upcoming Exams</p>
              <Link href="/exams" className="text-[11px] font-bold text-indigo-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-2.5">
              {upcomingExams.map((e: any, i: number) => {
                const ds = e.date || e.exam_date || "";
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <div className={`flex shrink-0 flex-col items-center justify-center rounded-lg px-2.5 py-1.5 text-white ${examColors[i % examColors.length]}`}>
                      <span className="text-[15px] font-extrabold leading-none">{getDay(ds)}</span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">{getMonth(ds)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{e.subject}</p>
                      <p className="truncate text-[10px] text-slate-500">{e.name || e.title || "Examination"}</p>
                    </div>
                  </div>
                );
              })}
              {upcomingExams.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No upcoming exams</p>}
            </div>
          </div>
        </div>

        {/* Notices | Inspirational Banner */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-800">Notices</p>
              <Link href="/notices" className="text-[11px] font-bold text-indigo-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-2.5">
              {notices.map((n: any, i: number) => (
                <div key={n.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white ${noticeColors[i % noticeColors.length]}`}>
                    <Megaphone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">{n.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{n.date}</p>
                  </div>
                </div>
              ))}
              {notices.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No notices</p>}
            </div>
          </div>

          <div
            className="card relative flex min-h-[160px] flex-col justify-end overflow-hidden p-6"
            style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#2d5f8a 40%,#4a90c4 70%,#7bb8e8 100%)" }}
          >
            <div
              className="absolute right-0 top-0 h-full w-2/3 opacity-30"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center right",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent" />
            <div className="relative z-10">
              <p className="text-xl font-extrabold leading-tight text-white">Together</p>
              <p className="text-xl font-extrabold leading-tight text-white">
                for Their <span className="text-blue-200">Dreams</span>
              </p>
              <p className="mt-2 text-[11px] leading-5 text-white/75">
                Thank you for being a part of<br />our journey.
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ===========================================================
     TEACHER
  =========================================================== */
  if (role === "teacher") {
    const classes = s.classes;
    const students = s.students.length;
    const pending = s.assignments.filter((a: any) => String(a.status).toLowerCase() === "pending").length;
    const notices = s.notices
      .filter((n: any) => String(n.audience || "").toLowerCase().includes("teacher") || String(n.audience || "").toLowerCase().includes("everyone"))
      .slice(0, 3);
    const today = [
      { time: "09:00 AM", subject: "Data Structures", section: "CSE - A", room: "R-201" },
      { time: "10:10 AM", subject: "DBMS", section: "CSE - A", room: "R-203" },
      { time: "12:30 PM", subject: "Operating Systems", section: "CSE - B", room: "R-301" },
      { time: "02:00 PM", subject: "Computer Networks", section: "CSE - C", room: "R-305" },
    ];
    const att = s.attendance;
    const present = att.filter((a: any) => String(a.status).toLowerCase() === "present").length;
    const pct = att.length ? Math.round((present / att.length) * 100) : 0;
    return (
      <Shell>
        <PageTitle title="Welcome, Teacher!" quote="A teacher's impact lasts a lifetime." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={BookOpen} value={classes.length || 3} label="My Classes" tone="indigo" />
          <StatCard icon={Users} value={students} label="Total Students" tone="emerald" />
          <StatCard icon={ClipboardCheck} value={pending} label="Pending Tasks" tone="amber" />
          <StatCard icon={BellIcon} value={notices.length} label="New Notices" tone="violet" />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold">Today&apos;s Classes</p>
                <p className="text-[10px] text-slate-400">Monday &middot; Campus timetable</p>
              </div>
              <Link href="/classes" className="text-[10px] font-bold text-indigo-600">View Classes</Link>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="data">
                <thead><tr><th>Time</th><th>Class</th><th>Section</th><th>Room</th></tr></thead>
                <tbody>
                  {today.map((x) => (
                    <tr key={x.time}>
                      <td className="font-semibold">{x.time}</td>
                      <td>{x.subject}</td>
                      <td>{x.section}</td>
                      <td>{x.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold">Attendance (CSE-A)</p>
                <p className="text-[10px] text-slate-400">Current class attendance</p>
              </div>
              <Donut percent={pct} />
            </div>
            <Link href="/attendance" className="btn-primary mt-2 w-full !py-2">Take Attendance</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="card p-5">
            <p className="text-sm font-extrabold">Quick Actions</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickAction href="/attendance" icon={ClipboardCheck} label="Take Attendance" tone="bg-emerald-50 text-emerald-600" />
              <QuickAction href="/marks" icon={AwardIcon} label="Enter Marks" tone="bg-violet-50 text-violet-600" />
              <QuickAction href="/materials" icon={BookOpen} label="Upload Materials" tone="bg-blue-50 text-blue-600" />
              <QuickAction href="/notices" icon={FileText} label="Create Notice" tone="bg-rose-50 text-rose-600" />
            </div>
          </div>
          <div className="card p-5">
            <p className="text-sm font-extrabold">My Notices</p>
            <div className="mt-3 space-y-2">
              {notices.map((n: any) => (
                <div key={n.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold">{n.title}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{n.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ===========================================================
     PRINCIPAL
  =========================================================== */
  const attendance = s.attendance;
  const present = attendance.filter((a: any) => String(a.status).toLowerCase() === "present").length;
  const attendancePct = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const pendingRequests = s.leaves.filter((x: any) => String(x.status).toLowerCase() === "pending");
  const recentRequests = pendingRequests.slice(0, 4);
  const upcoming = s.exams.slice(0, 3);

  return (
    <Shell>
      <PageTitle title="Welcome, Principal!" quote="A great institution is built on great people." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={GraduationCap} value={s.students.length} label="Students" change="&uarr; 5%" tone="indigo" />
        <StatCard icon={Users} value={s.teachers.length} label="Teachers" change="&uarr; 2%" tone="emerald" />
        <StatCard icon={UserRound} value={s.parents.length} label="Parents" change="&uarr; 3%" tone="amber" />
        <StatCard icon={FileText} value={pendingRequests.length} label="Pending Requests" change={pendingRequests.length ? "Action" : "Clear"} tone="violet" />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_.9fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold">Recent Requests</p>
            <Link href="/leaves" className="text-[10px] font-bold text-indigo-600">View All</Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentRequests.length ? recentRequests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                  {String(r.applicant || "U").split(/\s+/).map((x: string) => x[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{r.applicant}</p>
                  <p className="text-[10px] text-slate-500">{r.reason || "Leave request"}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-700">Pending</span>
              </div>
            )) : <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-700">No pending requests.</div>}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold">Attendance Overview</p>
              <p className="text-[10px] text-slate-400">Across recorded classes</p>
            </div>
            <Donut percent={attendancePct} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Present</div>
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" />Absent</div>
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Leave</div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold">Upcoming Exams</p>
            <Link href="/exams" className="text-[10px] font-bold text-indigo-600">View All</Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {upcoming.map((e: any) => (
              <div key={e.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[9px] font-extrabold text-indigo-600 shadow-sm">
                  {String(e.date || "").slice(8, 10) || "--"}
                </div>
                <div>
                  <p className="text-xs font-bold">{e.subject}</p>
                  <p className="text-[10px] text-slate-500">{e.date} &middot; {e.start_time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <QuickAction href="/students" icon={GraduationCap} label="Students" tone="bg-blue-50 text-blue-600" />
        <QuickAction href="/teachers" icon={Users} label="Teachers" tone="bg-emerald-50 text-emerald-600" />
        <QuickAction href="/parents" icon={UserRound} label="Parents" tone="bg-violet-50 text-violet-600" />
        <QuickAction href="/complaints" icon={MessageSquareWarning} label="Complaints" tone="bg-rose-50 text-rose-600" />
        <QuickAction href="/requests" icon={FileCheck} label="Requests" tone="bg-indigo-50 text-indigo-600" />
        <QuickAction href="/notices" icon={Megaphone} label="Notices" tone="bg-amber-50 text-amber-600" />
        <QuickAction href="/reports" icon={FileBarChart} label="Reports" tone="bg-cyan-50 text-cyan-600" />
      </div>
    </Shell>
  );
}

function AwardIcon(props: any) { return <Award {...props} />; }
function BellIcon(props: any) { return <Bell {...props} />; }
