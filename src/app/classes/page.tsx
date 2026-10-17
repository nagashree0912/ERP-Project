"use client";

import React, { useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader } from "@/components/ui";
import { SearchBar, Modal, Confirm, Empty, Field } from "@/components/ui2";
import { useCrud } from "@/components/crud";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { getClassTeacherId, getClassTeacherName } from "@/lib/classrooms";

export default function ClassesPage() {
  const c = useCrud("classes");
  const store = useStore();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [formError, setFormError] = useState("");
  const isPrincipal = user?.role === "principal";
  const teacher = store.teachers.find(item => String(item.email || "").toLowerCase() === String(user?.email || "").toLowerCase());
  const teacherId = teacher ? String(teacher.id) : "";
  const assignedClasses = isPrincipal
    ? store.classes
    : user?.role === "teacher" && teacherId
      ? store.classes.filter(item => getClassTeacherId(item, store.teachers) === teacherId)
      : [];
  const rows = assignedClasses.filter(item => {
    const teacherName = getClassTeacherName(item, store.teachers);
    return !q || `${item.name} ${teacherName}`.toLowerCase().includes(q.toLowerCase());
  });

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const classTeacherId = String(form.get("class_teacher_id") || "");
    const duplicate = store.classes.some(item =>
      String(item.id) !== String(c.edit?.id || "")
      && String(item.name || "").trim().toLowerCase() === name.toLowerCase()
    );

    if (!name) {
      setFormError("Class name is required.");
      return;
    }
    if (duplicate) {
      setFormError("A classroom with this class name already exists.");
      return;
    }
    if (!store.teachers.some(item => String(item.id) === classTeacherId)) {
      setFormError("Please select a registered teacher.");
      return;
    }

    setFormError("");
    const classId = c.save({ name, class_teacher_id: classTeacherId, teacher_id: null, class_teacher: null });
    if (!classId) return;
    store.classes.forEach(item => {
      if (String(item.id) !== classId && getClassTeacherId(item, store.teachers) === classTeacherId) {
        store.update("classes", item.id, { class_teacher_id: null, teacher_id: null, class_teacher: null });
      }
    });
  };

  const deleteClassroom = (id: string) => {
    if (store.students.some(student => String(student.class_id || "") === String(id))) {
      store.toast("This classroom cannot be deleted while students are assigned. Reassign the students first.");
      c.setDel(null);
      return;
    }
    c.doDelete(id);
  };

  if (!isPrincipal && user?.role !== "teacher") {
    return <Shell><div className="card p-10 text-center"><p className="text-sm text-slate-500">Classroom access is available to the Principal and assigned teachers.</p></div></Shell>;
  }

  return (
    <Shell>
      <PageHeader
        title={isPrincipal ? "Classrooms" : "My Classrooms"}
        sub={isPrincipal ? `${rows.length} classrooms` : `${rows.length} assigned classrooms`}
        actions={isPrincipal ? <button className="btn-primary" onClick={() => { setFormError(""); c.startAdd(); }}>+ Add Classroom</button> : undefined}
      />
      <div className="card p-4 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search class name or class teacher…" />
      </div>
      {rows.length === 0 ? (
        <Empty title={isPrincipal ? "No classrooms" : "No classrooms assigned"} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((classroom: any) => {
            const students = isPrincipal
              ? []
              : store.students.filter(student => String(student.class_id || "") === String(classroom.id));
            return (
              <div key={classroom.id} className="card p-5">
                <p className="font-extrabold">{classroom.name}</p>
                <p className="mt-2 text-sm text-slate-600">Class teacher: {getClassTeacherName(classroom, store.teachers)}</p>
                {!isPrincipal && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold text-slate-500">Students ({students.length})</p>
                    {students.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {students.map((student: any) => <li key={student.id}>{student.full_name} <span className="text-xs text-slate-400">({student.roll_number || student.roll_no || "No roll number"})</span></li>)}
                      </ul>
                    ) : <p className="mt-2 text-sm text-slate-400">No students assigned.</p>}
                  </div>
                )}
                {isPrincipal && (
                  <div className="mt-4 flex gap-2">
                    <button className="btn-secondary !py-1.5 text-xs flex-1" onClick={() => { setFormError(""); c.startEdit(classroom); }}>Edit</button>
                    <button className="btn-secondary !py-1.5 text-xs" onClick={() => c.setDel(classroom)}>Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isPrincipal && <>
        <Modal open={c.open} onClose={() => c.setOpen(false)} title={c.edit ? "Edit Classroom" : "Add Classroom"}>
          <form onSubmit={save} className="grid gap-3">
            <Field label="Class Name">
              <input name="name" required maxLength={120} defaultValue={c.edit?.name} className="input" placeholder="CSE - I Year" />
            </Field>
            <Field label="Class Teacher Name">
              <select name="class_teacher_id" required defaultValue={c.edit ? getClassTeacherId(c.edit, store.teachers) : ""} className="input">
                <option value="">Select a registered teacher</option>
                {store.teachers.map((item: any) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
              </select>
              {store.teachers.length === 0 && <p className="mt-1 text-xs text-amber-700">No registered teachers are available. Add a teacher first.</p>}
            </Field>
            {formError && <p role="alert" className="text-sm text-rose-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => c.setOpen(false)}>Cancel</button>
              <button className="btn-primary" disabled={store.teachers.length === 0}>Save Classroom</button>
            </div>
          </form>
        </Modal>
        <Confirm
          open={!!c.del}
          onClose={() => c.setDel(null)}
          onYes={() => deleteClassroom(c.del.id)}
          title="Delete classroom"
          msg={`Delete ${c.del?.name}? Classrooms with assigned students cannot be deleted.`}
        />
      </>}
    </Shell>
  );
}
