"use client";

import React, { useMemo, useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import { useAuth } from "@/lib/auth";

export default function NoticesPage() {
  const { user } = useAuth();
  const c = useCrud("notices");
  const [q, setQ] = useState("");
  const parent = user?.role === "parent";
  const editable = user?.role === "principal" || user?.role === "teacher";

  const rows = useMemo(() => {
    const all = c.rows as any[];
    return all.filter((n) => {
      const audience = String(n.audience || "").toLowerCase();
      if (parent && !(audience.includes("student") || audience.includes("parent") || audience.includes("everyone"))) return false;
      const text = `${n.title || ""} ${n.message || n.description || ""} ${n.audience || ""} ${n.date || ""}`.toLowerCase();
      return text.includes(q.toLowerCase());
    });
  }, [c.rows, parent, q]);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    c.save({ title: f.get("title"), message: f.get("message"), audience: f.get("audience"), priority: f.get("priority"), date: f.get("date") || new Date().toISOString().slice(0,10) });
  };

  return <Shell><PageHeader title="Notices" sub={parent ? "Student and parent announcements" : "Create and manage campus announcements"} actions={editable ? <button className="btn-primary" onClick={c.startAdd}>+ Create Notice</button> : undefined}/><div className="card mb-4 p-4"><SearchBar value={q} onChange={setQ} placeholder="Search notices…"/></div>{rows.length===0?<Empty title="No notices found"/>:<div className="grid gap-4 md:grid-cols-2">{rows.map((n:any)=><div key={n.id} className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{n.audience || "Campus"}</p><h3 className="mt-1 text-base font-extrabold">{n.title}</h3></div><Badge tone={statusTone(n.priority || "normal")}>{n.priority || "Normal"}</Badge></div><p className="mt-3 text-sm leading-6 text-slate-600">{n.message || n.description || ""}</p><div className="mt-4 flex items-center justify-between border-t pt-3"><p className="text-[10px] text-slate-400">{n.date || n.created_at || ""}</p>{editable && <div className="flex gap-3"><button className="text-xs font-bold text-slate-600" onClick={()=>c.startEdit(n)}>Edit</button><button className="text-xs font-bold text-rose-600" onClick={()=>c.setDel(n)}>Delete</button></div>}</div></div>)}</div>}<Modal open={c.open} onClose={()=>c.setOpen(false)} title={c.edit?"Edit Notice":"Create Notice"}><form onSubmit={save} className="grid gap-3"><Field label="Title"><input name="title" required defaultValue={c.edit?.title} className="input"/></Field><Field label="Message"><textarea name="message" required defaultValue={c.edit?.message || c.edit?.description} rows={4} className="input"/></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Audience"><select name="audience" defaultValue={c.edit?.audience || "Students"} className="input"><option>Students</option><option>Teachers</option><option>Parents</option><option>Everyone</option></select></Field><Field label="Priority"><select name="priority" defaultValue={c.edit?.priority || "Normal"} className="input"><option>Low</option><option>Normal</option><option>Medium</option><option>High</option></select></Field></div><Field label="Date"><input name="date" type="date" defaultValue={c.edit?.date || new Date().toISOString().slice(0,10)} className="input"/></Field><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>c.setOpen(false)}>Cancel</button><button className="btn-primary">Save Notice</button></div></form></Modal><Confirm open={!!c.del} onClose={()=>c.setDel(null)} onYes={()=>c.doDelete(c.del.id)} title="Delete notice" msg={`Delete ${c.del?.title}?`}/></Shell>;
}
