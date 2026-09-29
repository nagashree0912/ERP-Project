"use client";

import React, { useMemo, useState } from "react";
import { Shell } from "@/components/shell2";
import { Badge, statusTone } from "@/components/ui";
import { Modal, Empty, Field } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid, csv, download } from "@/lib/data";
import {
  FileText, CheckCircle2, XCircle, BarChart3, ChevronDown,
  ChevronUp, AlertTriangle, MessageSquare, BookOpen, Download
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────── */

export default function MarksPage() {
  const s = useStore();
  const { user } = useAuth();

  const isParent = user?.role === "parent";
  const canEnterMarks = user?.role === "principal" || user?.role === "teacher";

  const child = isParent ? s.getParentStudent(user?.email) : null;

  if (isParent && !child) {
    return (
      <Shell>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">No Student Linked</h2>
          <p className="mt-2 text-slate-500">Your parent account is not linked to a student. Please contact the college administrator.</p>
        </div>
      </Shell>
    );
  }

  if (isParent) return <ParentMarksView child={child} marks={s.marks} />;
  return <StaffMarksView canEnterMarks={canEnterMarks} />;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  PARENT view — full rich UI matching the screenshot                  */
/* ─────────────────────────────────────────────────────────────────── */

function ParentMarksView({ child, marks }: { child: any; marks: any[] }) {
  const [academicYear, setAcademicYear] = useState("2025 - 2026");
  const [examType, setExamType] = useState("Mid Semester");
  const [semester, setSemester] = useState("3rd Year - Semester 1");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter marks for this child + selected exam type
  const childMarks = useMemo(() =>
    marks.filter((m: any) =>
      m.student_id === child?.id &&
      (examType === "All" || m.exam === examType)
    ), [marks, child, examType]);

  // Stats
  const totalSubjects = childMarks.length;
  const passed = childMarks.filter((m: any) => m.status === "Pass").length;
  const failed = childMarks.filter((m: any) => m.status === "Fail").length;
  const totalMarks = childMarks.reduce((sum: number, m: any) => sum + (m.total || 0), 0);
  const maxMarks = totalSubjects * 100;
  const overallPct = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : "0.00";

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <Shell>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-600">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Marks</h1>
            <p className="text-sm text-slate-500">Your child&apos;s academic performance and detailed subject scores</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill label="Academic Year" value={academicYear} onChange={setAcademicYear}
            options={["2025 - 2026", "2024 - 2025", "2023 - 2024"]} />
          <FilterPill label="Exam Type" value={examType} onChange={setExamType}
            options={["Mid Semester", "Unit Test", "Final", "All"]} />
          <FilterPill label="Semester" value={semester} onChange={setSemester}
            options={["3rd Year - Semester 1", "3rd Year - Semester 2", "2nd Year - Semester 1", "2nd Year - Semester 2"]} />
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<BookOpen size={22} className="text-slate-500" />}
          bg="bg-slate-50"
          border="border-slate-200"
          label="Total Subjects"
          value={totalSubjects}
          valueColor="text-slate-800"
        />
        <StatCard
          icon={<CheckCircle2 size={22} className="text-emerald-500" />}
          bg="bg-emerald-50"
          border="border-emerald-100"
          label="Passed"
          value={passed}
          valueColor="text-emerald-700"
        />
        <StatCard
          icon={<XCircle size={22} className="text-rose-500" />}
          bg="bg-rose-50"
          border="border-rose-100"
          label="Failed"
          value={failed}
          valueColor="text-rose-600"
        />
        <StatCard
          icon={<BarChart3 size={22} className="text-indigo-500" />}
          bg="bg-indigo-50"
          border="border-indigo-100"
          label="Overall Percentage"
          value={`${overallPct}%`}
          valueColor="text-indigo-700"
          large
        />
      </div>

      {/* ── Table ── */}
      {childMarks.length === 0 ? (
        <Empty title="No marks found" sub="No marks recorded for this exam type yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Exam Type</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Internal<span className="block font-normal normal-case">(20)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  External<span className="block font-normal normal-case">(80)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total<span className="block font-normal normal-case">(100)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {childMarks.map((mark: any) => {
                const isFail = mark.status === "Fail";
                const isExpanded = expandedId === mark.id;
                return (
                  <React.Fragment key={mark.id}>
                    <tr className={`transition hover:bg-slate-50/50 ${isFail ? "bg-rose-50/30" : ""}`}>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{mark.subject}</td>
                      <td className="px-4 py-3.5 text-slate-500">{mark.exam}</td>
                      <td className={`px-4 py-3.5 text-center font-semibold ${isFail && mark.internal < 8 ? "text-rose-600 bg-rose-50 rounded" : "text-slate-700"}`}>
                        {mark.internal}
                      </td>
                      <td className={`px-4 py-3.5 text-center font-semibold ${isFail && mark.external < 32 ? "text-rose-600 bg-rose-50 rounded" : "text-slate-700"}`}>
                        {mark.external}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{mark.total}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center h-7 w-10 rounded-lg text-xs font-bold ${mark.grade === "F" ? "bg-rose-100 text-rose-700" : mark.grade === "A+" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
                          {mark.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${mark.status === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {mark.status === "Pass"
                            ? <CheckCircle2 size={12} />
                            : <XCircle size={12} />}
                          {mark.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isFail ? (
                          <button
                            onClick={() => toggleExpand(mark.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${isExpanded ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                          >
                            View Reason {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* ── Expanded failure detail ── */}
                    {isFail && isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-0 py-0">
                          <div className="mx-4 mb-4 grid gap-3 sm:grid-cols-2 rounded-2xl bg-rose-50/60 border border-rose-100 p-5">
                            {/* Performance Analysis */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <XCircle size={16} className="text-rose-500" />
                                <span className="font-bold text-rose-700 text-sm">Reason for Failure</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Performance Analysis</p>
                              <ul className="space-y-1.5">
                                {(mark.failure_reasons || ["Marks below passing threshold."]).map((reason: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Teacher's Remark */}
                            <div className="rounded-xl bg-white border border-rose-100 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={14} className="text-slate-500" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Teacher&apos;s Remark</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {mark.teacher_remark || "Please consult with your teacher for improvement strategies."}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Export ── */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => download("marks.csv", csv(childMarks))}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <Download size={15} /> Export Marks
        </button>
      </div>
    </Shell>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Filter pill dropdown                                                */
/* ─────────────────────────────────────────────────────────────────── */

function FilterPill({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition cursor-pointer shadow-sm"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Stat card                                                           */
/* ─────────────────────────────────────────────────────────────────── */

function StatCard({ icon, bg, border, label, value, valueColor, large = false }: {
  icon: React.ReactNode; bg: string; border: string;
  label: string; value: string | number; valueColor: string; large?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4 flex items-center gap-3`}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold">{label}</p>
        <p className={`font-extrabold mt-0.5 ${valueColor} ${large ? "text-2xl" : "text-3xl"}`}>{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STAFF view (Principal / Teacher) — original table with add marks   */
/* ─────────────────────────────────────────────────────────────────── */

function StaffMarksView({ canEnterMarks }: { canEnterMarks: boolean }) {
  const s = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = s.marks.filter((m: any) =>
    `${m.student_name} ${m.subject} ${m.exam} ${m.grade}`.toLowerCase().includes(q.toLowerCase())
  );

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEnterMarks) { setOpen(false); s.toast("Not permitted"); return; }
    const f = new FormData(e.currentTarget);
    const internal = Number(f.get("internal"));
    const external = Number(f.get("external"));
    const total = internal + external;
    const grade = total >= 90 ? "A+" : total >= 80 ? "A" : total >= 70 ? "B+" : total >= 60 ? "B" : total >= 50 ? "C" : "F";
    const sid = String(f.get("student_id"));
    const student = s.students.find((x: any) => x.id === sid);
    s.add("marks", {
      id: uid("M"), student_id: sid,
      student_name: student?.full_name || sid,
      class_id: "C1",
      subject: String(f.get("subject")),
      exam: String(f.get("exam")),
      internal, external, total, grade,
      status: total >= 40 ? "Pass" : "Fail",
    });
    setOpen(false);
  };

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" /> Marks &amp; Results
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Auto total, grade &amp; status</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            onClick={() => download("marks.csv", csv(filtered))}>
            <Download size={15} /> Export
          </button>
          {canEnterMarks && (
            <button className="btn-primary" onClick={() => setOpen(true)}>+ Enter Marks</button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="card mb-4 p-4">
        <div className="relative">
          <input
            value={q} onChange={e => setQ(e.target.value)}
            className="input pl-9" placeholder="Search student, subject or exam..."
          />
        </div>
      </div>

      {filtered.length === 0 ? <Empty title="No marks found" /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Exam</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Internal</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">External</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((mark: any) => (
                <tr key={mark.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{mark.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{mark.subject}</td>
                  <td className="px-4 py-3 text-slate-500">{mark.exam}</td>
                  <td className="px-4 py-3 text-center">{mark.internal}</td>
                  <td className="px-4 py-3 text-center">{mark.external}</td>
                  <td className="px-4 py-3 text-center font-bold">{mark.total}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone="purple">{mark.grade}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={statusTone(mark.status)}>{mark.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEnterMarks && (
        <Modal open={open} onClose={() => setOpen(false)} title="Enter Marks">
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
            <Field label="Student">
              <select name="student_id" className="input" required>
                {s.students.map((st: any) => <option key={st.id} value={st.id}>{st.full_name}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <select name="subject" className="input" required>
                {s.subjects.map((sub: any) => <option key={sub.id}>{sub.name}</option>)}
              </select>
            </Field>
            <Field label="Exam">
              <select name="exam" className="input" required>
                <option>Mid Semester</option><option>Unit Test</option><option>Final</option>
              </select>
            </Field>
            <Field label="Internal (20)"><input name="internal" type="number" min={0} max={20} required className="input" /></Field>
            <Field label="External (80)"><input name="external" type="number" min={0} max={80} required className="input" /></Field>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Marks</button>
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  );
}