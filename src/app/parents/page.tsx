"use client";

import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Pager, usePager, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import { useStore } from "@/lib/store";
import { UserRound, Link2 } from "lucide-react";

export default function ParentsPage() {
  const c = useCrud("parents");
  const s = useStore();
  const [q, setQ] = useState("");
  const rows = (c.rows as any[]).filter(x => !q || `${x.full_name} ${x.email} ${x.phone}`.toLowerCase().includes(q.toLowerCase()));
  const { page, setPage, pages, slice } = usePager(rows);
  const save = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); c.save({ full_name: f.get("full_name"), email: f.get("email"), phone: f.get("phone"), occupation: f.get("occupation"), address: f.get("address"), student_id: f.get("student_id") || undefined, status: "Active" }); };

  return <Shell><PageHeader title="Parents" sub={`${rows.length} guardians`} actions={<button className="btn-primary" onClick={c.startAdd}>+ Add Parent</button>} /><div className="card mb-4 p-4"><SearchBar value={q} onChange={setQ} placeholder="Search parent or email…" /></div>{slice.length===0?<Empty title="No parents found"/>:<><div className="table-wrap"><table className="data"><thead><tr><th>Parent</th><th>Phone</th><th>Linked Child</th><th>Status</th><th>Actions</th></tr></thead><tbody>{slice.map((x:any)=>{const child=s.students.find((st:any)=>String(st.id)===String(x.student_id||x.studentId||x.child_id));return <tr key={x.id}><td><p className="font-semibold">{x.full_name}</p><p className="text-xs text-slate-500">{x.email}</p></td><td>{x.phone || "—"}</td><td>{child?<span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"><Link2 size={12}/>{child.full_name}</span>:<span className="text-xs font-semibold text-amber-600">No child linked</span>}</td><td><Badge tone={statusTone(x.status)}>{x.status || "Active"}</Badge></td><td><div className="flex gap-2"><button className="text-xs font-bold text-slate-600" onClick={()=>c.startEdit(x)}>Edit</button><button className="text-xs font-bold text-rose-600" onClick={()=>c.setDel(x)}>Delete</button></div></td></tr>})}</tbody></table></div><Pager page={page} pages={pages} onPage={setPage} total={rows.length}/></>}<Modal open={c.open} onClose={()=>c.setOpen(false)} title={c.edit?"Edit Parent":"Add Parent"}><form onSubmit={save} className="grid gap-3 sm:grid-cols-2"><Field label="Full name"><input name="full_name" required defaultValue={c.edit?.full_name} className="input"/></Field><Field label="Email"><input name="email" type="email" required defaultValue={c.edit?.email} className="input"/></Field><Field label="Phone"><input name="phone" defaultValue={c.edit?.phone} className="input"/></Field><Field label="Occupation"><input name="occupation" defaultValue={c.edit?.occupation} className="input"/></Field><div className="sm:col-span-2"><Field label="Link child"><select name="student_id" defaultValue={c.edit?.student_id || c.edit?.studentId || ""} className="input"><option value="">No child linked</option>{s.students.map((student:any)=><option key={student.id} value={student.id}>{student.full_name} · {student.roll_number || student.roll_no || student.id}</option>)}</select></Field><p className="mt-1 text-[10px] text-slate-400">A parent can view only the child selected here.</p></div><div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>c.setOpen(false)}>Cancel</button><button className="btn-primary">Save Parent</button></div></form></Modal><Confirm open={!!c.del} onClose={()=>c.setDel(null)} onYes={()=>c.doDelete(c.del.id)} title="Delete parent" msg={`Delete ${c.del?.full_name}?`}/></Shell>;
}
