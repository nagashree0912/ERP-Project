"use client";
import React, { useState } from "react";
import { Search, X, ChevronLeft, ChevronRight, Inbox, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
export function SearchBar({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (<div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
  <input className="input pl-9 pr-8" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  {value && <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={15} /></button>}</div>);
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span><div className="mt-1">{children}</div></label>;
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
    <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-lg card overflow-hidden animate-fadeUp max-h-[92vh] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800"><h3 className="font-bold">{title}</h3>
      <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></div>
      <div className="p-5 overflow-y-auto">{children}</div></div></div>);
}
export function Confirm({ open, onClose, onYes, title, msg }: { open: boolean; onClose: () => void; onYes: () => void; title: string; msg: string }) {
  return (<Modal open={open} onClose={onClose} title={title}><p className="text-sm text-slate-600 dark:text-slate-300">{msg}</p>
    <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Cancel</button>
    <button className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700" onClick={() => { onYes(); onClose(); }}>Delete</button></div></Modal>);
}
export function Empty({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (<div className="card p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-slate-800"><Inbox size={22} /></div>
    <p className="mt-3 font-bold">{title}</p>{sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}{action && <div className="mt-4 flex justify-center">{action}</div>}</div>);
}
export function ErrorBox({ msg }: { msg: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-700"><AlertCircle size={16} />{msg}</div>;
}
export function Pager({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total: number }) {
  if (pages <= 1) return <p className="text-xs text-slate-500 px-1 py-2">{total} record(s)</p>;
  return (<div className="flex items-center justify-between px-1 py-3"><p className="text-xs text-slate-500">Page {page} of {pages} · {total} records</p>
    <div className="flex gap-1"><button className="btn-secondary !px-2.5 !py-1.5" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={15} /></button>
    <button className="btn-secondary !px-2.5 !py-1.5" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight size={15} /></button></div></div>);
}
export function usePager<T>(rows: T[], per = 8) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / per));
  const safe = Math.min(page, pages);
  return { page: safe, setPage, pages, slice: rows.slice((safe - 1) * per, safe * per) };
}
export function Toaster() {
  const { toasts } = useStore();
  return (<div className="fixed bottom-4 right-4 z-[60] space-y-2">{toasts.map(t => <div key={t.id} className="animate-fadeUp rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2.5 shadow-soft">✓ {t.msg}</div>)}</div>);
}
