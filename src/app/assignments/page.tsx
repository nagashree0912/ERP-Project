"use client";
import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { Modal, Confirm, Empty, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import { useStore } from "@/lib/store";
export default function AssignmentsPage() {
  const c = useCrud("assignments");
  const s = useStore();
  const save = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget);
    c.save({ title: f.get("title"), subject: String(f.get("subject")), class_id: "C1", description: f.get("description"), deadline: f.get("deadline"), max_marks: Number(f.get("max_marks") || 20), status: "Active", submissions: 0 }); };
  return (<Shell><PageHeader title="Assignments" sub="Create, submit & grade" actions={<button className="btn-primary" onClick={c.startAdd}>+ Create Assignment</button>} />
    {(c.rows as any[]).length === 0 ? <Empty title="No assignments" /> : <div className="grid sm:grid-cols-2 gap-4">{(c.rows as any[]).map((x: any) => (
      <div key={x.id} className="card p-5"><div className="flex items-start justify-between gap-2"><p className="font-extrabold">{x.title}</p><Badge tone={statusTone(x.status)}>{x.status}</Badge></div>
      <p className="text-xs text-slate-500">{x.subject} · Due {x.deadline} · {x.max_marks} marks</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{x.description}</p>
      <div className="mt-3 flex gap-2"><button className="btn-secondary !py-1.5 text-xs flex-1" onClick={() => { s.update("assignments", x.id, { submissions: (x.submissions || 0) + 1 }); }}>Submit (student)</button><button className="btn-secondary !py-1.5 text-xs" onClick={() => c.startEdit(x)}>Edit</button><button className="btn-secondary !py-1.5 text-xs" onClick={() => c.setDel(x)}>Del</button></div>
      <p className="mt-2 text-[11px] text-slate-500">{x.submissions || 0} submissions</p></div>))}</div>}
    <Modal open={c.open} onClose={() => c.setOpen(false)} title={c.edit ? "Edit Assignment" : "Create Assignment"}>
      <form onSubmit={save} className="grid gap-3">
        <Field label="Title"><input name="title" required defaultValue={c.edit?.title} className="input" /></Field>
        <Field label="Subject"><select name="subject" className="input" defaultValue={c.edit?.subject}>{s.subjects.map(t => <option key={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Description"><textarea name="description" defaultValue={c.edit?.description} className="input" rows={3} /></Field>
        <Field label="Deadline"><input name="deadline" type="date" required defaultValue={c.edit?.deadline} className="input" /></Field>
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button><button className="btn-primary">Save</button></div>
      </form>
    </Modal>
    <Confirm open={!!c.del} onClose={() => c.setDel(null)} onYes={() => c.doDelete(c.del.id)} title="Delete" msg={`Delete ${c.del?.title}?`} />
  </Shell>);
}
