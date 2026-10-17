"use client";

import React, { useMemo, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Pager, usePager, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import {
  Mail, Phone, BookOpen, CalendarDays, Users, User, Hash,
  GraduationCap, ChevronDown, Download, Upload, Plus, Trash2,
  BarChart3, X, Eye
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

/* ─────────────────────────────────────────────────────────────────── */
/*  Entry point                                                         */
/* ─────────────────────────────────────────────────────────────────── */

export default function StudentsPage() {
  const { user } = useAuth();
  const store = useStore();
  const isParent = user?.role === "parent";

  if (isParent) {
    const child = store.getParentStudent(user?.email);
    return <Shell><ParentChildView child={child} classrooms={store.classes} /></Shell>;
  }

  if (user?.role !== "principal") {
    return (
      <Shell>
        <div className="card p-10 text-center">
          <GraduationCap className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-4 text-lg font-extrabold">Access Restricted</h2>
          <p className="mt-1 text-sm text-slate-500">Student management is available to the Principal portal.</p>
        </div>
      </Shell>
    );
  }

  return <PrincipalStudents />;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Principal view                                                      */
/* ─────────────────────────────────────────────────────────────────── */

function PrincipalStudents() {
  const c = useCrud("students");
  const store = useStore();
  const [q, setQ] = useState("");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterYear, setFilterYear] = useState("All Years");
  const [filterSection, setFilterSection] = useState("All Sections");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [classroomError, setClassroomError] = useState("");

  const allStudents: any[] = c.rows as any[];
  const classrooms = store.classes as { id: string; name: string }[];

  /* filter helpers */
  const departments = useMemo(() => ["All Departments", ...Array.from(new Set(allStudents.map((s: any) => s.department).filter(Boolean)))], [allStudents]);
  const years = useMemo(() => ["All Years", "1st Year", "2nd Year", "3rd Year", "4th Year"], []);
  const sections = useMemo(() => ["All Sections", ...Array.from(new Set(allStudents.map((s: any) => s.section).filter(Boolean))).sort()], [allStudents]);

  const rows = useMemo(() => allStudents.filter((x: any) => {
    const matchQ = !q || `${x.full_name} ${x.email} ${x.roll_number} ${x.department}`.toLowerCase().includes(q.toLowerCase());
    const matchDept = filterDept === "All Departments" || x.department === filterDept;
    const matchYear = filterYear === "All Years" || x.year === filterYear;
    const matchSection = filterSection === "All Sections" || x.section === filterSection;
    return matchQ && matchDept && matchYear && matchSection;
  }), [allStudents, q, filterDept, filterYear, filterSection]);

  const { page, setPage, pages, slice } = usePager(rows, 10);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const classId = String(f.get("class_id") || "");
    if (!classrooms.some(classroom => String(classroom.id) === classId)) {
      setClassroomError(classrooms.length ? "Please select a valid classroom." : "No classrooms are available. Add a classroom before adding students.");
      return;
    }

    setClassroomError("");
    c.save({
      full_name: f.get("full_name"), email: f.get("email"), phone: f.get("phone"),
      department: f.get("department"), course: f.get("course"), year: f.get("year"),
      section: f.get("section"), roll_number: f.get("roll_number"), class_id: classId,
      status: "Active", admission_date: f.get("admission_date") || "2026-08-01"
    });
  };

  const handleBulkSave = (students: any[]) => {
    students.forEach(s => store.add("students", { ...s, id: crypto.randomUUID(), status: "Active" }));
    store.toast(`${students.length} student(s) added successfully`);
    setShowBulkModal(false);
  };

  return (
    <Shell>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <GraduationCap size={26} className="text-indigo-600" /> Students
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Total {allStudents.length} students</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Export */}
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Download size={15} /> Export
          </button>
          {/* Add Students dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
              onClick={() => setShowAddMenu(v => !v)}
            >
              <Plus size={15} /> Add Students <ChevronDown size={14} />
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 mt-2 z-40 w-52 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                    onClick={() => { setShowAddMenu(false); c.startAdd(); }}
                  >
                    <User size={15} /> Add Single Student
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition border-t border-slate-100"
                    onClick={() => { setShowAddMenu(false); setShowBulkModal(true); }}
                  >
                    <Users size={15} /> Add Multiple Students
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchBar value={q} onChange={setQ} placeholder="Search students, roll number, department…" />
        </div>
        <SelectFilter value={filterDept} onChange={setFilterDept} options={departments} />
        <SelectFilter value={filterYear} onChange={setFilterYear} options={years} />
        <SelectFilter value={filterSection} onChange={setFilterSection} options={sections} />
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
          Filter
        </button>
      </div>

      {/* Table */}
      {slice.length === 0 ? <Empty title="No students found" /> : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" className="rounded" /></th>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Roll Number</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Classroom</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((x: any, i: number) => (
                  <tr key={x.id}>
                    <td><input type="checkbox" className="rounded" /></td>
                    <td className="text-slate-500">{(page - 1) * 10 + i + 1}</td>
                    <td><p className="font-semibold text-slate-800">{x.full_name}</p></td>
                    <td className="text-slate-500 text-xs">{x.email}</td>
                    <td className="font-mono text-xs">{x.roll_number || x.roll_no}</td>
                    <td>{x.department}</td>
                    <td>{x.year}</td>
                    <td>{classroomName(classrooms, x.class_id)}</td>
                    <td><span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{x.section || "—"}</span></td>
                    <td><Badge tone={statusTone(x.status)}>{x.status || "Active"}</Badge></td>
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

      {/* Section-wise Overview */}
      <SectionOverview students={allStudents} />

      {/* Single Add/Edit Modal */}
      <Modal open={c.open} onClose={() => c.setOpen(false)} title={c.edit ? "Edit Student" : "Add Student"}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input name="full_name" required defaultValue={c.edit?.full_name} className="input" /></Field>
          <Field label="Email"><input type="email" name="email" required defaultValue={c.edit?.email} className="input" /></Field>
          <Field label="Phone"><input name="phone" defaultValue={c.edit?.phone} className="input" /></Field>
          <Field label="Roll number"><input name="roll_number" required defaultValue={c.edit?.roll_number} className="input" /></Field>
          <Field label="Department"><input name="department" required defaultValue={c.edit?.department} className="input" /></Field>
          <Field label="Course"><input name="course" defaultValue={c.edit?.course || "B.Tech"} className="input" /></Field>
          <Field label="Year">
            <select name="year" defaultValue={c.edit?.year || "3rd Year"} className="input">
              <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
            </select>
          </Field>
          <Field label="Classroom *">
            <select
              name="class_id"
              required
              defaultValue={c.edit?.class_id || ""}
              disabled={classrooms.length === 0}
              onInvalid={() => setClassroomError("Please select a classroom.")}
              onChange={() => setClassroomError("")}
              className="input"
            >
              <option value="">Select a classroom</option>
              {classrooms.map(classroom => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
            </select>
            {classroomError && <p role="alert" className="mt-1 text-xs text-rose-600">{classroomError}</p>}
            {classrooms.length === 0 && <p className="mt-1 text-xs text-amber-700">No classrooms are available. Add a classroom before adding students.</p>}
          </Field>
          <Field label="Section">
            <select name="section" defaultValue={c.edit?.section || "A"} className="input">
              <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
            </select>
          </Field>
          <Field label="Admission date"><input name="admission_date" type="date" defaultValue={c.edit?.admission_date} className="input" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={classrooms.length === 0}>Save Student</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Confirm open={!!c.del} onClose={() => c.setDel(null)} onYes={() => c.doDelete(c.del.id)} title="Delete student" msg={`Delete ${c.del?.full_name}?`} />

      {/* Bulk Add Modal */}
      <BulkAddModal open={showBulkModal} onClose={() => setShowBulkModal(false)} onSave={handleBulkSave} classrooms={classrooms} />
    </Shell>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Select Filter pill                                                  */
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
/*  Bulk Add Students Modal                                             */
/* ─────────────────────────────────────────────────────────────────── */

interface BulkRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string;
  gender: string;
}

const emptyRow = (): BulkRow => ({
  id: crypto.randomUUID(),
  full_name: "", email: "", phone: "", roll_number: "", gender: "Female"
});

function BulkAddModal({ open, onClose, onSave, classrooms }: { open: boolean; onClose: () => void; onSave: (rows: any[]) => void; classrooms: { id: string; name: string }[] }) {
  const [dept, setDept] = useState("Computer Science(CS)");
  const [course, setCourse] = useState("B.Tech");
  const [year, setYear] = useState("3rd Year");
  const [section, setSection] = useState("A");
  const [admDate, setAdmDate] = useState("2026-09-28");
  const [classId, setClassId] = useState("");
  const [classroomError, setClassroomError] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const updateRow = (id: string, field: keyof BulkRow, val: string) => {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const addRow = () => setBulkRows(prev => [...prev, emptyRow()]);

  const removeRow = (id: string) => setBulkRows(prev => prev.filter(r => r.id !== id));

  const handleSave = () => {
    if (!classrooms.some(classroom => classroom.id === classId)) {
      setClassroomError(classrooms.length ? "Please select a classroom." : "No classrooms are available. Add a classroom before adding students.");
      return;
    }
    const valid = bulkRows.filter(r => r.full_name.trim() && r.email.trim() && r.roll_number.trim());
    if (valid.length === 0) return;
    onSave(valid.map(r => ({
      full_name: r.full_name, email: r.email, phone: r.phone,
      roll_number: r.roll_number, gender: r.gender,
      department: dept, course, year, section, admission_date: admDate, class_id: classId
    })));
    setBulkRows([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  };

  const downloadTemplate = () => {
    const csv = "Full Name,Email,Phone,Roll Number,Gender\n,,,, ";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "student_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(1);
      const imported: BulkRow[] = lines.map(l => {
        const [full_name, email, phone, roll_number, gender] = l.split(",").map(s => s.trim());
        return { id: crypto.randomUUID(), full_name: full_name || "", email: email || "", phone: phone || "", roll_number: roll_number || "", gender: gender || "Female" };
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
            <h3 className="font-extrabold text-slate-800 text-lg">Bulk Add Students</h3>
            <p className="text-xs text-slate-500">Add multiple students for a section at once</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-xl p-2 hover:bg-slate-100 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-5">
          {/* Section Details */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><Users size={13} /></div>
              <span className="font-bold text-sm text-slate-700">Section Details</span>
              <span className="text-xs text-slate-500">(Common for all students)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">Classroom *</label>
                <select
                  value={classId}
                  onChange={e => { setClassId(e.target.value); setClassroomError(""); }}
                  disabled={classrooms.length === 0}
                  className="input mt-1 text-sm"
                >
                  <option value="">Select a classroom</option>
                  {classrooms.map(classroom => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
                </select>
                {classroomError && <p role="alert" className="mt-1 text-xs text-rose-600">{classroomError}</p>}
                {classrooms.length === 0 && <p className="mt-1 text-xs text-amber-700">No classrooms are available. Add a classroom before adding students.</p>}
              </div>
              <div>
                <label className="label text-xs">Department *</label>
                <select value={dept} onChange={e => setDept(e.target.value)} className="input mt-1 text-sm">
                  <option>Computer Science(CS)</option>
                  <option>Electronics(ECE)</option>
                  <option>Mechanical(ME)</option>
                  <option>Civil(CE)</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Course *</label>
                <select value={course} onChange={e => setCourse(e.target.value)} className="input mt-1 text-sm">
                  <option>B.Tech</option><option>M.Tech</option><option>BCA</option><option>MCA</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Year *</label>
                <select value={year} onChange={e => setYear(e.target.value)} className="input mt-1 text-sm">
                  <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Section *</label>
                <select value={section} onChange={e => setSection(e.target.value)} className="input mt-1 text-sm">
                  <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Admission Date *</label>
                <input type="date" value={admDate} onChange={e => setAdmDate(e.target.value)} className="input mt-1 text-sm" />
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><BookOpen size={13} /></div>
                <span className="font-bold text-sm text-slate-700">Student Details</span>
                <span className="text-xs text-slate-500">Add multiple students below or import from Excel/CSV</span>
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
                  <Upload size={13} /> Import Excel/CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Full Name *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Email *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Phone *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Roll Number *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Gender *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkRows.map((row, i) => (
                    <tr key={row.id} className="bg-white hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2 text-xs text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.full_name}
                          onChange={e => updateRow(row.id, "full_name", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="Full name"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="email"
                          value={row.email}
                          onChange={e => updateRow(row.id, "email", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="email@campus.edu"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.phone}
                          onChange={e => updateRow(row.id, "phone", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="9XXXXXXXXX"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.roll_number}
                          onChange={e => updateRow(row.id, "roll_number", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
                          placeholder="CS24A001"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={row.gender}
                          onChange={e => updateRow(row.id, "gender", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition bg-white"
                        >
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => removeRow(row.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
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
                <Plus size={13} /> Add Student Row
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Total Students: <span className="text-indigo-700">{bulkRows.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSave}
            disabled={classrooms.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
          >
            <GraduationCap size={15} /> Save All Students
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Section-wise Overview (bar chart + detail panel)                   */
/* ─────────────────────────────────────────────────────────────────── */

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function SectionOverview({ students }: { students: any[] }) {
  const [viewBy, setViewBy] = useState("Section");
  const [selDept, setSelDept] = useState("Computer Science(CS)");
  const [selCourse, setSelCourse] = useState("B.Tech");
  const [selYear, setSelYear] = useState("3rd Year");
  const [applied, setApplied] = useState({ dept: "Computer Science(CS)", course: "B.Tech", year: "3rd Year" });
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filtered = useMemo(() => students.filter((s: any) => {
    const deptMatch = s.department === applied.dept;
    const yearMatch = s.year === applied.year;
    return deptMatch && yearMatch;
  }), [students, applied]);

  const sectionData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((s: any) => {
      const sec = s.section || "?";
      map[sec] = (map[sec] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const totalStudents = filtered.length;
  const totalSections = sectionData.length;
  const largestSection = sectionData.reduce((a, b) => (b.count > a.count ? b : a), sectionData[0] || { name: "—", count: 0 });
  const avgPerSection = totalSections > 0 ? (totalStudents / totalSections).toFixed(2) : "0";

  const activeData = useMemo(() => {
    if (!activeSection) return null;
    const sec = filtered.filter((s: any) => s.section === activeSection);
    const male = sec.filter((s: any) => s.gender === "Male" || s.gender === "male").length;
    const female = sec.filter((s: any) => s.gender === "Female" || s.gender === "female").length;
    return { section: activeSection, total: sec.length, male, female, active: sec.filter((s: any) => (s.status || "Active") === "Active").length };
  }, [activeSection, filtered]);

  return (
    <div className="mt-6 card p-6">
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800">Section-wise Student Overview</h2>
            <p className="text-xs text-slate-500">Student distribution across departments, years and sections</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">View By</span>
            <select value={viewBy} onChange={e => setViewBy(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option>Section</option><option>Year</option><option>Department</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Department</span>
            <select value={selDept} onChange={e => setSelDept(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option>Computer Science(CS)</option>
              <option>Electronics(ECE)</option>
              <option>Mechanical(ME)</option>
              <option>Civil(CE)</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Course</span>
            <select value={selCourse} onChange={e => setSelCourse(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option>B.Tech</option><option>M.Tech</option><option>BCA</option><option>MCA</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Year</span>
            <select value={selYear} onChange={e => setSelYear(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <span className="text-[10px] text-transparent">.</span>
            <button
              onClick={() => setApplied({ dept: selDept, course: selCourse, year: selYear })}
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<Users size={20} className="text-indigo-500" />}
          iconBg="bg-indigo-50"
          label="Total Students"
          value={totalStudents}
        />
        <StatCard
          icon={<div className="grid h-5 w-5 place-items-center rounded bg-purple-200 text-purple-700 text-[10px] font-bold">⊞</div>}
          iconBg="bg-purple-50"
          label="Total Sections"
          value={totalSections}
        />
        <StatCard
          icon={<span className="text-amber-500 text-lg">🏆</span>}
          iconBg="bg-amber-50"
          label="Largest Section"
          value={<><span className="font-extrabold text-2xl">{largestSection?.name}</span><span className="text-sm text-slate-500 ml-1">({largestSection?.count} students)</span></>}
          large
        />
        <StatCard
          icon={<BarChart3 size={20} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
          label="Average per Section"
          value={avgPerSection}
        />
      </div>

      {/* Chart + detail panel */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bar chart */}
        <div>
          <h3 className="font-bold text-slate-700 mb-3 text-sm">Students by Section</h3>
          {sectionData.length === 0 ? (
            <div className="flex items-center justify-center h-48 rounded-2xl bg-slate-50 text-slate-400 text-sm">
              No data for selected filters
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectionData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} onClick={(e) => { if (e?.activePayload) setActiveSection(e.activePayload[0]?.payload?.name); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} label={{ value: "Section", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} label={{ value: "Number of Students", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", fontSize: "12px" }}
                  formatter={(v: any) => [`${v} students`, "Count"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer">
                  {sectionData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={activeSection === entry.name ? "#4f46e5" : BAR_COLORS[i % BAR_COLORS.length]}
                      opacity={activeSection && activeSection !== entry.name ? 0.5 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-slate-400 text-center mt-1">Click a bar to view section details</p>
        </div>

        {/* Detail panel */}
        {activeData ? (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span className="font-extrabold text-slate-800">Section Details - {activeData.section}</span>
              </div>
              <button onClick={() => setActiveSection(null)} className="rounded-lg p-1 hover:bg-slate-200 text-slate-400 transition">
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="text-slate-500">Department</div>
              <div className="font-semibold text-slate-700">{applied.dept.split("(")[0].trim()}</div>
              <div className="text-slate-500">Course</div>
              <div className="font-semibold text-slate-700">{applied.course}</div>
              <div className="text-slate-500">Year</div>
              <div className="font-semibold text-slate-700">{applied.year}</div>
              <div className="text-slate-500">Section</div>
              <div className="font-semibold text-slate-700">{activeData.section}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Total Students</p>
                <p className="text-2xl font-extrabold text-indigo-700">{activeData.total}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Male Students</p>
                <p className="text-2xl font-extrabold text-blue-600">{activeData.male}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Female Students</p>
                <p className="text-2xl font-extrabold text-rose-500">{activeData.female}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Active Students</p>
                <p className="text-2xl font-extrabold text-emerald-600">{activeData.active}</p>
              </div>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
              <Eye size={14} /> View Students
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <BarChart3 size={32} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500 text-sm">Select a section</p>
            <p className="text-xs text-slate-400 mt-1">Click any bar in the chart to see detailed section information</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, large = false }: { icon: React.ReactNode; iconBg: string; label: string; value: React.ReactNode; large?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3 shadow-sm">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-semibold">{label}</p>
        {large ? (
          <div className="mt-0.5 flex items-baseline gap-1">{value}</div>
        ) : (
          <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Parent child view                                                   */
/* ─────────────────────────────────────────────────────────────────── */

function ParentChildView({ child, classrooms }: { child: any | null; classrooms: { id: string; name: string }[] }) {
  if (!child) return (
    <div className="card mx-auto max-w-xl p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500"><Users size={28} /></div>
      <h1 className="mt-5 text-xl font-extrabold">No children linked</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">This parent account is not linked to any student. Please contact the college administrator.</p>
    </div>
  );
  const name = child.full_name || child.name || "Student";
  const roll = child.roll_number || child.roll_no || "Not available";
  return (
    <>
      <PageHeader title="My Child" sub="Only the student linked to your parent account is displayed." />
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-[#132d62] to-indigo-600 p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold">
              {name.split(/\s+/).map((x: string) => x[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-white/60">My Child</p>
              <h2 className="mt-1 text-2xl font-extrabold">{name}</h2>
              <p className="mt-1 text-sm text-white/75">Roll Number: {roll}</p>
            </div>
            <Badge tone="green">{child.status || "Active"}</Badge>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-extrabold">Student Information</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info icon={<User size={17} />} label="Full Name" value={name} />
            <Info icon={<Hash size={17} />} label="Roll Number" value={roll} />
            <Info icon={<Mail size={17} />} label="Email" value={child.email || "Not available"} />
            <Info icon={<Phone size={17} />} label="Phone" value={child.phone || "Not available"} />
            <Info icon={<BookOpen size={17} />} label="Department" value={child.department || "Not available"} />
            <Info icon={<GraduationCap size={17} />} label="Course" value={child.course || "B.Tech"} />
            <Info icon={<CalendarDays size={17} />} label="Year" value={child.year || "Not available"} />
            <Info icon={<Users size={17} />} label="Classroom" value={classroomName(classrooms, child.class_id)} />
            <Info icon={<Users size={17} />} label="Section" value={child.section || "Not available"} />
          </div>
        </div>
      </div>
    </>
  );
}

function classroomName(classrooms: { id: string; name: string }[], classId?: string) {
  return classrooms.find(classroom => String(classroom.id) === String(classId))?.name || (classId ? "Classroom unavailable" : "Not assigned");
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</p>
        </div>
      </div>
    </div>
  );
}
