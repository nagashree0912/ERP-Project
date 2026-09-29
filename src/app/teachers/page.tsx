"use client";

import React, { useMemo, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell2";
import { Badge, statusTone } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Pager, usePager, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import { csv, download } from "@/lib/data";
import {
  Users, User, GraduationCap, ChevronDown, Download, Upload,
  Plus, Trash2, BarChart3, X, Eye, Phone, Mail, BookOpen,
  Award, Briefcase, CalendarDays
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

/* ─────────────────────────────────────────────────────────────────── */
/*  Entry point                                                         */
/* ─────────────────────────────────────────────────────────────────── */

export default function TeachersPage() {
  const { user } = useAuth();
  if (user?.role !== "principal") {
    return (
      <Shell>
        <div className="card p-10 text-center">
          <GraduationCap className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-4 text-lg font-extrabold">Access Restricted</h2>
          <p className="mt-1 text-sm text-slate-500">Teacher management is available to the Principal portal.</p>
        </div>
      </Shell>
    );
  }
  return <PrincipalTeachers />;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Principal Teachers View                                             */
/* ─────────────────────────────────────────────────────────────────── */

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function PrincipalTeachers() {
  const c = useCrud("teachers");
  const store = useStore();
  const [q, setQ] = useState("");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const allTeachers: any[] = c.rows as any[];

  const departments = useMemo(() => [
    "All Departments",
    ...Array.from(new Set(allTeachers.map((t: any) => t.department).filter(Boolean))).sort()
  ], [allTeachers]);

  const rows = useMemo(() => allTeachers.filter((x: any) => {
    const matchQ = !q || `${x.full_name} ${x.email} ${x.subject} ${x.department}`.toLowerCase().includes(q.toLowerCase());
    const matchDept = filterDept === "All Departments" || x.department === filterDept;
    const matchStatus = filterStatus === "All Status" || x.status === filterStatus;
    return matchQ && matchDept && matchStatus;
  }), [allTeachers, q, filterDept, filterStatus]);

  const { page, setPage, pages, slice } = usePager(rows, 10);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    c.save({
      full_name: f.get("full_name"), email: f.get("email"), phone: f.get("phone"),
      department: f.get("department"), subject: f.get("subject"),
      qualification: f.get("qualification"), experience: f.get("experience"),
      joining_date: f.get("joining_date") || "2026-08-01", status: "Active"
    });
  };

  const handleBulkSave = (teachers: any[]) => {
    teachers.forEach(t => store.add("teachers", { ...t, id: crypto.randomUUID(), status: "Active" }));
    store.toast(`${teachers.length} teacher(s) added successfully`);
    setShowBulkModal(false);
  };

  // Stats
  const active = allTeachers.filter((t: any) => t.status === "Active").length;
  const onLeave = allTeachers.filter((t: any) => t.status === "On Leave").length;
  const deptCount = new Set(allTeachers.map((t: any) => t.department).filter(Boolean)).size;

  return (
    <Shell>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users size={26} className="text-indigo-600" /> Teachers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Total {allTeachers.length} faculty members</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            onClick={() => download("teachers.csv", csv(allTeachers))}
          >
            <Download size={15} /> Export
          </button>
          <div className="relative">
            <button
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
              onClick={() => setShowAddMenu(v => !v)}
            >
              <Plus size={15} /> Add Teacher <ChevronDown size={14} />
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 mt-2 z-40 w-52 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                    onClick={() => { setShowAddMenu(false); c.startAdd(); }}
                  >
                    <User size={15} /> Add Single Teacher
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition border-t border-slate-100"
                    onClick={() => { setShowAddMenu(false); setShowBulkModal(true); }}
                  >
                    <Users size={15} /> Add Multiple Teachers
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <QuickStat icon={<Users size={20} className="text-indigo-500" />} bg="bg-indigo-50" label="Total Faculty" value={allTeachers.length} />
        <QuickStat icon={<Award size={20} className="text-emerald-500" />} bg="bg-emerald-50" label="Active" value={active} />
        <QuickStat icon={<CalendarDays size={20} className="text-amber-500" />} bg="bg-amber-50" label="On Leave" value={onLeave} />
        <QuickStat icon={<BookOpen size={20} className="text-purple-500" />} bg="bg-purple-50" label="Departments" value={deptCount} />
      </div>

      {/* ── Filters ── */}
      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={q} onChange={setQ} placeholder="Search teacher, subject, department…" />
        </div>
        <SelectFilter value={filterDept} onChange={setFilterDept} options={departments} />
        <SelectFilter value={filterStatus} onChange={setFilterStatus} options={["All Status", "Active", "On Leave", "Inactive"]} />
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
          Filter
        </button>
      </div>

      {/* ── Table ── */}
      {slice.length === 0 ? <Empty title="No teachers found" /> : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" className="rounded" /></th>
                  <th>#</th>
                  <th>Teacher Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Subject</th>
                  <th>Qualification</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((x: any, i: number) => (
                  <tr key={x.id}>
                    <td><input type="checkbox" className="rounded" /></td>
                    <td className="text-slate-500">{(page - 1) * 10 + i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold">
                          {(x.full_name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{x.full_name}</p>
                          <p className="text-xs text-slate-400">{x.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs">{x.email}</td>
                    <td>
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {x.department}
                      </span>
                    </td>
                    <td className="text-sm">{x.subject}</td>
                    <td className="text-xs text-slate-500">{x.qualification || "—"}</td>
                    <td className="text-xs text-slate-500">{x.experience || "—"}</td>
                    <td><Badge tone={x.status === "On Leave" ? "yellow" : statusTone(x.status)}>{x.status || "Active"}</Badge></td>
                    <td>
                      <div className="flex gap-3">
                        <button className="text-xs font-bold text-indigo-600 hover:underline" onClick={() => c.startEdit(x)}>Edit</button>
                        <span className="text-slate-300">|</span>
                        <button className="text-xs font-bold text-rose-600 hover:underline" onClick={() => c.setDel(x)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pages={pages} onPage={setPage} total={rows.length} />
        </>
      )}

      {/* ── Department-wise Overview ── */}
      <DeptOverview teachers={allTeachers} />

      {/* ── Single Add/Edit Modal ── */}
      <Modal open={c.open} onClose={() => c.setOpen(false)} title={c.edit ? "Edit Teacher" : "Add Teacher"}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input name="full_name" required defaultValue={c.edit?.full_name} className="input" /></Field>
          <Field label="Email"><input type="email" name="email" required defaultValue={c.edit?.email} className="input" /></Field>
          <Field label="Phone"><input name="phone" defaultValue={c.edit?.phone} className="input" /></Field>
          <Field label="Department">
            <select name="department" defaultValue={c.edit?.department || "Computer Science"} className="input">
              <option>Computer Science</option>
              <option>Electronics</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>
          </Field>
          <Field label="Subject"><input name="subject" required defaultValue={c.edit?.subject} className="input" /></Field>
          <Field label="Qualification"><input name="qualification" defaultValue={c.edit?.qualification} className="input" /></Field>
          <Field label="Experience (e.g. 5 years)"><input name="experience" defaultValue={c.edit?.experience} className="input" /></Field>
          <Field label="Joining date"><input name="joining_date" type="date" defaultValue={c.edit?.joining_date} className="input" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button>
            <button className="btn-primary">Save Teacher</button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Confirm open={!!c.del} onClose={() => c.setDel(null)} onYes={() => c.doDelete(c.del.id)} title="Delete teacher" msg={`Delete ${c.del?.full_name}?`} />

      {/* ── Bulk Add Modal ── */}
      <BulkAddTeacherModal open={showBulkModal} onClose={() => setShowBulkModal(false)} onSave={handleBulkSave} />
    </Shell>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Quick stat card                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function QuickStat({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3 shadow-sm">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-semibold">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Select Filter                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function SelectFilter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition cursor-pointer"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Bulk Add Teachers Modal                                             */
/* ─────────────────────────────────────────────────────────────────── */

interface BulkTeacherRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  qualification: string;
}

const emptyTeacherRow = (): BulkTeacherRow => ({
  id: crypto.randomUUID(),
  full_name: "", email: "", phone: "", subject: "", qualification: ""
});

function BulkAddTeacherModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (rows: any[]) => void }) {
  const [dept, setDept] = useState("Computer Science");
  const [joiningDate, setJoiningDate] = useState("2026-09-28");
  const [bulkRows, setBulkRows] = useState<BulkTeacherRow[]>([
    emptyTeacherRow(), emptyTeacherRow(), emptyTeacherRow()
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const updateRow = (id: string, field: keyof BulkTeacherRow, val: string) => {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };
  const addRow = () => setBulkRows(prev => [...prev, emptyTeacherRow()]);
  const removeRow = (id: string) => setBulkRows(prev => prev.filter(r => r.id !== id));

  const handleSave = () => {
    const valid = bulkRows.filter(r => r.full_name.trim() && r.email.trim() && r.subject.trim());
    if (valid.length === 0) return;
    onSave(valid.map(r => ({
      full_name: r.full_name, email: r.email, phone: r.phone,
      subject: r.subject, qualification: r.qualification,
      department: dept, joining_date: joiningDate
    })));
    setBulkRows([emptyTeacherRow(), emptyTeacherRow(), emptyTeacherRow()]);
  };

  const downloadTemplate = () => {
    const csv = "Full Name,Email,Phone,Subject,Qualification\n,,,, ";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "teacher_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(1);
      const imported: BulkTeacherRow[] = lines.map(l => {
        const [full_name, email, phone, subject, qualification] = l.split(",").map(s => s.trim());
        return { id: crypto.randomUUID(), full_name: full_name || "", email: email || "", phone: phone || "", subject: subject || "", qualification: qualification || "" };
      }).filter(r => r.full_name);
      if (imported.length > 0) setBulkRows(imported);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Bulk Add Teachers</h3>
            <p className="text-xs text-slate-500">Add multiple faculty members for a department at once</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-xl p-2 hover:bg-slate-100 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-5">
          {/* Department Details */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><Users size={13} /></div>
              <span className="font-bold text-sm text-slate-700">Department Details</span>
              <span className="text-xs text-slate-500">(Common for all teachers)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Department *</label>
                <select value={dept} onChange={e => setDept(e.target.value)} className="input mt-1 text-sm">
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Joining Date *</label>
                <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="input mt-1 text-sm" />
              </div>
            </div>
          </div>

          {/* Teacher Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><BookOpen size={13} /></div>
                <span className="font-bold text-sm text-slate-700">Teacher Details</span>
                <span className="text-xs text-slate-500">Add below or import from CSV</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  <Download size={13} /> Download CSV Template
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                >
                  <Upload size={13} /> Import CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Full Name *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Email *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Phone</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Subject *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Qualification</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkRows.map((row, i) => (
                    <tr key={row.id} className="bg-white hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2 text-xs text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <input value={row.full_name} onChange={e => updateRow(row.id, "full_name", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="Dr. Full Name" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="email" value={row.email} onChange={e => updateRow(row.id, "email", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="teacher@campus.edu" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={row.phone} onChange={e => updateRow(row.id, "phone", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="9XXXXXXXXX" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={row.subject} onChange={e => updateRow(row.id, "subject", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="Subject name" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={row.qualification} onChange={e => updateRow(row.id, "qualification", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="Ph.D / M.Tech" />
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeRow(row.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
              >
                <Plus size={13} /> Add Teacher Row
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Total Teachers: <span className="text-indigo-700">{bulkRows.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
          >
            <Users size={15} /> Save All Teachers
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Department-wise Overview (bar chart + detail panel)                 */
/* ─────────────────────────────────────────────────────────────────── */

function DeptOverview({ teachers }: { teachers: any[] }) {
  const [activeDept, setActiveDept] = useState<string | null>(null);

  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    teachers.forEach((t: any) => {
      const d = t.department || "Unknown";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }));
  }, [teachers]);

  const totalTeachers = teachers.length;
  const totalDepts = deptData.length;
  const largestDept = deptData.reduce((a, b) => b.count > a.count ? b : a, deptData[0] || { name: "—", count: 0 });
  const avgPerDept = totalDepts > 0 ? (totalTeachers / totalDepts).toFixed(1) : "0";

  const activeDetail = useMemo(() => {
    if (!activeDept) return null;
    const dep = teachers.filter((t: any) => t.department === activeDept);
    const active = dep.filter((t: any) => t.status === "Active").length;
    const onLeave = dep.filter((t: any) => t.status === "On Leave").length;
    const subjects = Array.from(new Set(dep.map((t: any) => t.subject).filter(Boolean)));
    return { dept: activeDept, total: dep.length, active, onLeave, subjects };
  }, [activeDept, teachers]);

  return (
    <div className="mt-6 card p-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
          <BarChart3 size={20} />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-800">Department-wise Faculty Overview</h2>
          <p className="text-xs text-slate-500">Faculty distribution across all departments</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <OverviewStat icon={<Users size={20} className="text-indigo-500" />} bg="bg-indigo-50" label="Total Faculty" value={totalTeachers} />
        <OverviewStat icon={<Briefcase size={20} className="text-purple-500" />} bg="bg-purple-50" label="Departments" value={totalDepts} />
        <OverviewStat
          icon={<span className="text-amber-500 text-lg">🏆</span>}
          bg="bg-amber-50"
          label="Largest Dept"
          value={<><span className="font-extrabold text-xl">{largestDept?.name?.split(" ")[0]}</span><span className="text-sm text-slate-500 ml-1">({largestDept?.count})</span></>}
          large
        />
        <OverviewStat icon={<BarChart3 size={20} className="text-emerald-500" />} bg="bg-emerald-50" label="Avg per Dept" value={avgPerDept} />
      </div>

      {/* Chart + Detail */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bar chart */}
        <div>
          <h3 className="font-bold text-slate-700 mb-3 text-sm">Faculty by Department</h3>
          {deptData.length === 0 ? (
            <div className="flex items-center justify-center h-48 rounded-2xl bg-slate-50 text-slate-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={deptData}
                margin={{ top: 5, right: 10, bottom: 25, left: 0 }}
                onClick={(e) => { if (e?.activePayload) setActiveDept(e.activePayload[0]?.payload?.name); }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.split(" ")[0]}
                  label={{ value: "Department", position: "insideBottom", offset: -15, fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false}
                  label={{ value: "Faculty Count", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", fontSize: "12px" }}
                  formatter={(v: any) => [`${v} teachers`, "Count"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer">
                  {deptData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={activeDept === entry.name ? "#4f46e5" : BAR_COLORS[i % BAR_COLORS.length]}
                      opacity={activeDept && activeDept !== entry.name ? 0.5 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-slate-400 text-center mt-1">Click a bar to view department details</p>
        </div>

        {/* Detail panel */}
        {activeDetail ? (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span className="font-extrabold text-slate-800">Dept Details — {activeDetail.dept}</span>
              </div>
              <button onClick={() => setActiveDept(null)} className="rounded-lg p-1 hover:bg-slate-200 text-slate-400 transition">
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Total</p>
                <p className="text-2xl font-extrabold text-indigo-700">{activeDetail.total}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Active</p>
                <p className="text-2xl font-extrabold text-emerald-600">{activeDetail.active}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">On Leave</p>
                <p className="text-2xl font-extrabold text-amber-600">{activeDetail.onLeave}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Subjects Taught</p>
              <div className="flex flex-wrap gap-1.5">
                {activeDetail.subjects.map((s: string) => (
                  <span key={s} className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">{s}</span>
                ))}
              </div>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
              <Eye size={14} /> View Faculty
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <BarChart3 size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500 text-sm">Select a department</p>
            <p className="text-xs text-slate-400 mt-1">Click any bar in the chart to see department details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewStat({ icon, bg, label, value, large = false }: {
  icon: React.ReactNode; bg: string; label: string; value: React.ReactNode; large?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3 shadow-sm">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-semibold">{label}</p>
        {large
          ? <div className="mt-0.5 flex items-baseline gap-1">{value}</div>
          : <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>}
      </div>
    </div>
  );
}
