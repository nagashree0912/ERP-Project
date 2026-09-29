
"use client";

import React, { useMemo, useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { SearchBar, Empty } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function AttendancePage() {
  const s = useStore();
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const isParent = user?.role === "parent";

  const child = isParent
    ? s.getParentStudent(user?.email)
    : null;

  const records = useMemo(() => {
    if (isParent) {
      if (!child) return [];

      return s.attendance.filter(
        (record) => record.student_id === child.id
      );
    }

    return s.attendance;
  }, [s.attendance, isParent, child]);

  const filtered = records.filter((record) => {
    const student = s.students.find(
      (item) => item.id === record.student_id
    );

    const searchText = [
      student?.full_name,
      record.student_id,
      record.status,
      record.date,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(q.toLowerCase());
  });

  const present = records.filter(
    (record) => record.status.toLowerCase() === "present"
  ).length;

  const absent = records.filter(
    (record) => record.status.toLowerCase() === "absent"
  ).length;

  const percentage = records.length
    ? Math.round((present / records.length) * 100)
    : 0;

  if (isParent && !child) {
    return (
      <Shell>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">
            No Student Linked
          </h2>
          <p className="mt-2 text-slate-500">
            Your parent account is not linked to a student.
            Please contact the college administrator.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        title={isParent ? "My Child's Attendance" : "Attendance"}
        sub={
          isParent
            ? `${child?.full_name} · ${child?.roll_number}`
            : `${records.length} attendance records`
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Attendance</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {percentage}%
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-slate-500">Present</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {present}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-slate-500">Absent</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {absent}
          </p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search attendance..."
        />
      </div>

      {filtered.length === 0 ? (
        <Empty title="No attendance records found" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                {!isParent && <th>Student</th>}
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((record) => {
                const student = s.students.find(
                  (item) => item.id === record.student_id
                );

                return (
                  <tr key={record.id}>
                    <td>{record.date}</td>

                    {!isParent && (
                      <td className="font-semibold">
                        {student?.full_name || record.student_id}
                      </td>
                    )}

                    <td>
                      <Badge tone={statusTone(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}