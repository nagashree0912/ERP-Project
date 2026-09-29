"use client";
import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
export default function ClassesPage() {
  const c = useCrud("classes");
  const [q, setQ] = useState("");
  const rows = (c.rows as any[]).filter(x => !q || (x.name + x.department + x.room).toLowerCase().includes(q.toLowerCase()));
  const save = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget);
    c.save({ name: f.get("name"), department: f.get("department"), year: f.get("year"), section: f.get("section"), room: f.get("room"), class_teacher: f.get("class_teacher"), strength: Number(f.get("strength") || 60) }); };
  return (<Shell><PageHeader title="Classes" sub={`${rows.length} classes & sections`} actions={<button className="btn-primary" onClick={c.startAdd}>+ Add Class</button>} />
    <div className="card p-4 mb-4"><SearchBar value={q} onChange={setQ} placeholder="Search class…" /></div>
    {rows.length === 0 ? <Empty title="No classes" /> : (<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{rows.map((x: any) => (
      <div key={x.id} className="card p-5"><p className="font-extrabold">{x.name}</p><p className="text-xs text-slate-500">{x.department} · {x.year} Sec {x.section}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p className="text-[11px] text-slate-500">Room</p><p className="font-bold text-sm">{x.room}</p></div><div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p className="text-[11px] text-slate-500">Strength</p><p className="font-bold text-sm">{x.strength}</p></div><div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><p className="text-[11px] text-slate-500">Sec</p><p className="font-bold text-sm">{x.section}</p></div></div>
      <p className="mt-2 text-xs text-slate-500">Class teacher: {x.class_teacher}</p>
      <div className="mt-3 flex gap-2"><button className="btn-secondary !py-1.5 text-xs flex-1" onClick={() => c.startEdit(x)}>Edit</button><button className="btn-secondary !py-1.5 text-xs" onClick={() => c.setDel(x)}>Delete</button></div></div>))}</div>)}
    <Modal open={c.open} onClose={() => c.setOpen(false)} title={c.edit ? "Edit Class" : "Add Class"}>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
        <Field label="Class name"><input name="name" required defaultValue={c.edit?.name} className="input" placeholder="B.Tech CSE 3A" /></Field>
        <Field label="Department"><input name="department" defaultValue={c.edit?.department} className="input" /></Field>
        <Field label="Year"><select name="year" defaultValue={c.edit?.year} className="input">{["1st Year", "2nd Year", "3rd Year", "4th Year"].map(d => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Section"><select name="section" defaultValue={c.edit?.section || "A"} className="input"><option>A</option><option>B</option><option>C</option></select></Field>
        <Field label="Room"><input name="room" defaultValue={c.edit?.room} className="input" /></Field>
        <Field label="Class teacher"><input name="class_teacher" defaultValue={c.edit?.class_teacher} className="input" /></Field>
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button><button className="btn-primary">Save</button></div>
      </form>
    </Modal>
    <Confirm open={!!c.del} onClose={() => c.setDel(null)} onYes={() => c.doDelete(c.del.id)} title="Delete class" msg={`Delete ${c.del?.name}?`} />
  </Shell>);
}
