"use client";

import React, { useMemo, useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Field } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useCrud } from "@/components/crud";

export default function ExamsPage() {
  const s = useStore();
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const isPrincipal = user?.role === "principal";
  const child = isParent ? s.getParentStudent(user?.email) : null;
  const [q, setQ] = useState("");
  const c = useCrud("exams");

  const exams = useMemo(() => {
    if (isParent && !child) return [];
    return s.exams;
  }, [s.exams, isParent, child]);

  const filtered = exams.filter((exam: any) =>
    [exam.name, exam.subject, exam.date, exam.start_time, exam.end_time, exam.room, exam.status]
      .filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    c.save({
      name: f.get("name"), title: f.get("name"), exam_name: f.get("name"),
      subject: f.get("subject"), date: f.get("date"), exam_date: f.get("date"),
      start_time: f.get("start_time"), end_time: f.get("end_time"),
      room: f.get("room"), venue: f.get("room"), status: f.get("status") || "Scheduled",
    });
  };

  if (isParent && !child) {
    return <Shell><div className="card p-8 text-center"><h2 className="text-xl font-bold">No Student Linked</h2><p className="mt-2 text-slate-500">Your parent account is not linked to a student. Please contact the college administrator.</p></div></Shell>;
  }

  return <Shell>
    <PageHeader title={isParent ? "My Child's Examinations" : "Examinations"} sub={isParent ? `${child?.full_name} · Examination schedule` : "Manage examination schedule"} actions={isPrincipal ? <button className="btn-primary" onClick={c.startAdd}>+ Add Examination</button> : undefined} />
    <div className="card p-4 mb-4"><SearchBar value={q} onChange={setQ} placeholder="Search examination, subject or date..." /></div>
    {filtered.length === 0 ? <Empty title="No examinations found" /> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((exam: any) => <div key={exam.id} className="card p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Examination</p><h3 className="mt-1 text-lg font-bold">{exam.name || exam.title}</h3></div><Badge tone={statusTone(exam.status || "Scheduled")}>{exam.status || "Scheduled"}</Badge></div>
        <div className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Subject</span><b>{exam.subject || "All Subjects"}</b></div><div className="flex justify-between gap-4"><span className="text-slate-500">Date</span><b>{exam.date}</b></div><div className="flex justify-between gap-4"><span className="text-slate-500">Time</span><b>{exam.start_time} - {exam.end_time}</b></div><div className="flex justify-between gap-4"><span className="text-slate-500">Venue</span><b>{exam.room || exam.venue || "Not assigned"}</b></div></div>
        {isPrincipal && <div className="mt-5 flex gap-2 border-t pt-4"><button className="text-xs font-bold text-slate-600" onClick={() => c.startEdit(exam)}>Edit</button><button className="text-xs font-bold text-rose-600" onClick={() => c.setDel(exam)}>Delete</button></div>}
      </div>)}
    </div>}

    {isPrincipal && <>
      <Modal open={c.open} onClose={() => c.setOpen(false)} title={c.edit ? "Edit Examination" : "Add Examination"}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Examination name"><input name="name" required defaultValue={c.edit?.name} className="input" /></Field>
          <Field label="Subject"><input name="subject" required defaultValue={c.edit?.subject} className="input" /></Field>
          <Field label="Date"><input name="date" type="date" required defaultValue={c.edit?.date} className="input" /></Field>
          <Field label="Status"><select name="status" defaultValue={c.edit?.status || "Scheduled"} className="input"><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></Field>
          <Field label="Start time"><input name="start_time" required defaultValue={c.edit?.start_time || "10:00 AM"} className="input" /></Field>
          <Field label="End time"><input name="end_time" required defaultValue={c.edit?.end_time || "12:00 PM"} className="input" /></Field>
          <div className="sm:col-span-2"><Field label="Room / Venue"><input name="room" required defaultValue={c.edit?.room || c.edit?.venue} className="input" /></Field></div>
          <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button><button className="btn-primary">Save Examination</button></div>
        </form>
      </Modal>
      <Confirm open={!!c.del} onClose={() => c.setDel(null)} onYes={() => c.doDelete(c.del.id)} title="Delete examination" msg={`Delete ${c.del?.name || "this examination"}?`} />
    </>}
  </Shell>;
}
