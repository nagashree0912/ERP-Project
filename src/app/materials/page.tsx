"use client";
import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader } from "@/components/ui";
import { Modal, Confirm, Empty, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import { useStore } from "@/lib/store";
import { uploadFile, downloadFile } from "@/lib/supabase/storage";
export default function MaterialsPage() {
  const c = useCrud("materials");
  const s = useStore();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const file = f.get("file") as File | null;
    setBusy(true); setNote("");
    let url = ""; let path = "";
    if (file && file.size > 0) {
      const r = await uploadFile("materials", file);
      if (r.ok) { url = r.url || ""; path = r.path || ""; setNote("File uploaded to Supabase Storage."); }
      else setNote(r.error || "Storage unavailable — record saved without remote file.");
    }
    const fn = (file && file.size > 0 ? file.name : String(f.get("title")) || "document.pdf");
    c.save({ title: String(f.get("title")) || fn, subject: String(f.get("subject")), class_id: "C1", type: fn.split(".").pop()?.toUpperCase() || "PDF", size: file && file.size > 0 ? `${(file.size / 1048576).toFixed(1)} MB` : "1.2 MB", uploaded: "2026-09-23", downloads: 0, file_url: url, file_path: path });
    setBusy(false);
  };
  const onDownload = async (x: any) => {
    if (x.file_path) { const ok = await downloadFile("materials", x.file_path, x.title); if (ok) { s.update("materials", x.id, { downloads: (x.downloads || 0) + 1 }); return; } }
    s.update("materials", x.id, { downloads: (x.downloads || 0) + 1 });
    s.toast("Download started (demo file)");
  };
  return (<Shell><PageHeader title="Study Materials" sub="Upload & download resources" actions={<button className="btn-primary" onClick={c.startAdd}>+ Upload Material</button>} />
    {(c.rows as any[]).length === 0 ? <Empty title="No materials" /> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{(c.rows as any[]).map((x: any) => (
      <div key={x.id} className="card p-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-100 text-rose-700 font-extrabold">{x.type?.[0]}</div><div><p className="font-bold text-sm">{x.title}</p><p className="text-[11px] text-slate-500">{x.subject} · {x.size} · {x.downloads} downloads</p></div></div>
      <div className="mt-3 flex gap-2"><button className="btn-secondary !py-1.5 text-xs flex-1" onClick={() => onDownload(x)}>Download</button><button className="btn-secondary !py-1.5 text-xs" onClick={() => c.setDel(x)}>Delete</button></div></div>))}</div>}
    <Modal open={c.open} onClose={() => c.setOpen(false)} title="Upload Material">
      <form onSubmit={save} className="grid gap-3">
        <Field label="Title"><input name="title" required className="input" placeholder="Unit notes…" /></Field>
        <Field label="Subject"><select name="subject" className="input">{s.subjects.map(t => <option key={t.id}>{t.name}</option>)}</select></Field>
        <Field label="File (PDF, DOC, PPT, images — Supabase Storage when configured)"><input name="file" type="file" className="input" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" /></Field>
        {note && <p className="text-xs rounded-xl bg-indigo-50 border p-2.5">{note}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? "Uploading…" : "Upload"}</button></div>
      </form>
    </Modal>
    <Confirm open={!!c.del} onClose={() => c.setDel(null)} onYes={() => c.doDelete(c.del.id)} title="Delete" msg={`Delete ${c.del?.title}?`} />
  </Shell>);
}

