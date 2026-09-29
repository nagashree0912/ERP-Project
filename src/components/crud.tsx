"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/data";
export function useCrud(table: "students" | "teachers" | "parents" | "classes" | "subjects" | "exams" | "assignments" | "materials" | "notices" | "fees") {
  const s = useStore();
  const { user } = useAuth();
  // Role-based authorization: only Principal & Teacher may mutate records.
  // Students & Parents get read-only access (view, search, export).
  const can = user?.role === "principal" || user?.role === "teacher";
  const deny = () => s.toast("Not permitted: only Principal or Teacher can do this");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const startAdd = () => { if (!can) return deny(); setEdit(null); setOpen(true); };
  const startEdit = (r: any) => { if (!can) return deny(); setEdit(r); setOpen(true); };
  const doDelete = (id: string) => { if (!can) return deny(); s.remove(table, id); };
  const save = (row: any) => {
    if (!can) { setOpen(false); setEdit(null); return deny(); }
    if (edit) s.update(table, edit.id, row);
    else { const id = uid(table.slice(0, 3).toUpperCase()); s.add(table, { id, ...row }); }
    setOpen(false); setEdit(null);
  };
  return { rows: (s as any)[table] as any[], open, setOpen, edit, del, setDel, startAdd, startEdit, doDelete, save, can };
}

