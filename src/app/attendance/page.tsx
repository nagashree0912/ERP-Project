"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell2";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { SearchBar, Empty, Field, Modal } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

type Classroom = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  full_name: string;
  roll_number: string | null;
};

type AttendanceStatus = "Present" | "Absent";

type AttendanceRecord = {
  id: string;
  student_id: string;
  status: string;
  date: string;
  class_id: string;
  student_name?: string;
  roll_number?: string | null;
  class_name?: string | null;
};

function getToday(): string {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(options?.headers || {}),
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error ||
        result.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return result as T;
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const store = useStore();

  const isTeacher = user?.role?.toLowerCase() === "teacher";
  const isParent = user?.role?.toLowerCase() === "parent";

  const parentChild = isParent
    ? store.getParentStudent(user?.email)
    : null;

  const [search, setSearch] = useState("");
  const [teacherHistory, setTeacherHistory] = useState<AttendanceRecord[]>([]);

  const records: AttendanceRecord[] = useMemo(() => {
    if (isTeacher) return teacherHistory;

    if (isParent) {
      if (!parentChild) return [];

      return store.attendance
        .filter((record) => record.student_id === parentChild.id)
        .map((record) => ({
          id: record.id,
          student_id: record.student_id,
          status: record.status,
          date: record.date,
          class_id: "",
        }));
    }

    return store.attendance.map((record) => ({
      id: record.id,
      student_id: record.student_id,
      status: record.status,
      date: record.date,
      class_id: "",
    }));
  }, [
    isTeacher,
    isParent,
    parentChild,
    store.attendance,
    teacherHistory,
  ]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const storeStudent = store.students.find(
        (student) => student.id === record.student_id
      );

      const searchable = [
        storeStudent?.full_name,
        record.student_name,
        record.roll_number,
        record.student_id,
        record.class_name,
        record.status,
        record.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [records, search, store.students]);

  const presentCount = records.filter(
    (record) => record.status.toLowerCase() === "present"
  ).length;

  const absentCount = records.filter(
    (record) => record.status.toLowerCase() === "absent"
  ).length;

  const percentage = records.length
    ? Math.round((presentCount / records.length) * 100)
    : 0;

  if (isParent && !parentChild) {
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
          isTeacher
            ? `${records.length} attendance records`
            : isParent
              ? `${parentChild?.full_name} · ${parentChild?.roll_number}`
              : `${records.length} attendance records`
        }
      />

      {isTeacher && (
        <TeacherAttendancePanel onHistoryLoaded={setTeacherHistory} />
      )}

      {!isTeacher && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Attendance</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {percentage}%
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">Present</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {presentCount}
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">Absent</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {absentCount}
            </p>
          </div>
        </div>
      )}

      <div className="card mb-4 p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search attendance..."
        />
      </div>

      {filteredRecords.length === 0 ? (
        <Empty title="No attendance records found" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                {!isParent && <th>Student</th>}

                {isTeacher && (
                  <>
                    <th>Classroom</th>
                    <th>Roll Number</th>
                  </>
                )}

                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => {
                const storeStudent = store.students.find(
                  (student) => student.id === record.student_id
                );

                return (
                  <tr key={record.id}>
                    <td>{record.date}</td>

                    {!isParent && (
                      <td className="font-semibold">
                        {record.student_name ||
                          storeStudent?.full_name ||
                          record.student_id}
                      </td>
                    )}

                    {isTeacher && (
                      <>
                        <td>{record.class_name || record.class_id || "—"}</td>
                        <td>{record.roll_number || "—"}</td>
                      </>
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

function TeacherAttendancePanel({
  onHistoryLoaded,
}: {
  onHistoryLoaded: (records: AttendanceRecord[]) => void;
}) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [date, setDate] = useState(getToday);

  const [students, setStudents] = useState<Student[]>([]);
  const [savedRecords, setSavedRecords] = useState<AttendanceRecord[]>([]);

  const [statuses, setStatuses] = useState<
    Record<string, AttendanceStatus>
  >({});

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Tracks classroom/date pairs that have already been updated.
  // This lock persists across refreshes in the same browser.
  const [updatedKeys, setUpdatedKeys] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);

  const loadClassrooms = useCallback(async () => {
    setLoadingClassrooms(true);
    setError("");

    try {
      const result = await apiRequest<{
        classrooms: Classroom[];
        attendance: AttendanceRecord[];
      }>("/api/teacher-attendance");

      setClassrooms(result.classrooms ?? []);
      onHistoryLoaded(result.attendance ?? []);
    } catch (reason) {
      setError(
        errorMessage(reason, "Unable to load assigned classrooms.")
      );
    } finally {
      setLoadingClassrooms(false);
    }
  }, [onHistoryLoaded]);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);

  // Restore the one-update lock when the page loads.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        "campusflow-attendance-updated-once"
      );

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          setUpdatedKeys(parsed);
        }
      }
    } catch {
      // Continue if browser storage is unavailable.
    }
  }, []);

  const loadStudentsAndAttendance =
    useCallback(async (): Promise<boolean> => {
      if (!classroomId || !date) {
        setStudents([]);
        setSavedRecords([]);
        setStatuses({});
        setError("Select a classroom and date first.");
        return false;
      }

      setLoadingStudents(true);
      setError("");
      setMessage("");

      try {
        const query = new URLSearchParams({
          classroomId,
          date,
        });

        const result = await apiRequest<{
          classroom: Classroom;
          students: Student[];
          attendance: AttendanceRecord[];
        }>(`/api/teacher-attendance?${query.toString()}`);

        const loadedStudents = result.students ?? [];
        const loadedRecords = result.attendance ?? [];

        setStudents(loadedStudents);
        setSavedRecords(loadedRecords);

        const nextStatuses: Record<string, AttendanceStatus> = {};

        for (const student of loadedStudents) {
          const saved = loadedRecords.find(
            (record) => record.student_id === student.id
          );

          const normalizedStatus = saved?.status?.toLowerCase();

          nextStatuses[student.id] =
            normalizedStatus === "absent" ? "Absent" : "Present";
        }

        setStatuses(nextStatuses);

        if (loadedStudents.length === 0) {
          setMessage("No students were returned for this classroom.");
        }

        return true;
      } catch (reason) {
        setStudents([]);
        setSavedRecords([]);
        setStatuses({});

        setError(
          errorMessage(reason, "Unable to load students from the backend.")
        );

        return false;
      } finally {
        setLoadingStudents(false);
      }
    }, [classroomId, date]);

  useEffect(() => {
    void loadStudentsAndAttendance();
  }, [loadStudentsAndAttendance]);

  const updateLockKey = `${classroomId}:${date}`;
  const hasAlreadyUpdated = updatedKeys.includes(updateLockKey);
  const hasSavedAttendance = savedRecords.length > 0;

  const saveAttendance = async (mode: "create" | "update") => {
    if (!classroomId || !date) {
      setError("Select a classroom and date first.");
      return;
    }

    // Prevent a second update for this classroom and date.
    if (mode === "update" && hasAlreadyUpdated) {
      setUpdating(false);
      setConfirmUpdateOpen(false);

      setError(
        "Attendance for this classroom and date has already been updated once. Further updates are disabled."
      );

      return;
    }

    if (mode === "update" && !hasSavedAttendance) {
      setError("Save attendance before trying to update it.");
      return;
    }

    if (students.length === 0) {
      setError("There are no students to save attendance for.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest<{
        success: boolean;
        message?: string;
      }>("/api/teacher-attendance", {
        method: "POST",
        body: JSON.stringify({
          classroomId,
          date,
          mode,
          records: students.map((student) => ({
            student_id: student.id,
            status: statuses[student.id] || "Present",
          })),
        }),
      });

      // Record the update lock only after the backend request succeeds.
      if (mode === "update") {
        const nextKeys = Array.from(
          new Set([...updatedKeys, updateLockKey])
        );

        setUpdatedKeys(nextKeys);

        try {
          window.localStorage.setItem(
            "campusflow-attendance-updated-once",
            JSON.stringify(nextKeys)
          );
        } catch {
          // State still locks the current page if storage is unavailable.
        }
      }

      setMessage(
        result.message ||
          (mode === "update"
            ? "Attendance updated successfully. Further updates are disabled."
            : "Attendance saved successfully. You may update it once.")
      );

      setViewOpen(false);
      setConfirmUpdateOpen(false);

      // Exit edit mode immediately after a successful save/update.
      setUpdating(false);

      // Refresh data after saving. A failed refresh must not unlock editing.
      await loadStudentsAndAttendance();
      await loadClassrooms();
    } catch (reason) {
      setError(errorMessage(reason, "Unable to save attendance."));
    } finally {
      setSaving(false);
    }
  };

  const selectedClassroom = classrooms.find(
    (classroom) => classroom.id === classroomId
  );

  const present = students.filter(
    (student) => (statuses[student.id] || "Present") === "Present"
  ).length;

  const absent = students.length - present;

  const percentage = students.length
    ? Math.round((present / students.length) * 100)
    : 0;

  return (
    <section className="card mb-6 p-5">
      <h2 className="text-lg font-bold text-slate-800">
        Take Classroom Attendance
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Classrooms and student records are loaded from your backend.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Classroom *">
          <select
            required
            value={classroomId}
            onChange={(event) => {
              setClassroomId(event.target.value);
              setUpdating(false);
              setMessage("");
              setError("");
              setViewOpen(false);
              setConfirmUpdateOpen(false);
            }}
            disabled={loadingClassrooms || classrooms.length === 0}
            className="input"
          >
            <option value="">
              {loadingClassrooms
                ? "Loading classrooms..."
                : "Select a classroom"}
            </option>

            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Attendance date *">
          <input
            required
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setUpdating(false);
              setMessage("");
              setError("");
              setViewOpen(false);
              setConfirmUpdateOpen(false);
            }}
            className="input"
          />
        </Field>
      </div>

      {!loadingClassrooms && !error && classrooms.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          No classroom is assigned to your account. Ask the Principal to
          assign a classroom.
        </p>
      )}

      {loadingStudents && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Loading students and attendance from the backend...
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-emerald-700">
          {message}
        </p>
      )}

      {classroomId && !loadingStudents && students.length > 0 && (
        <>
          <h3 className="mb-3 mt-5 font-semibold text-slate-800">
            {selectedClassroom?.name} · {date}
          </h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total Students" value={students.length} />
            <SummaryCard label="Present" value={present} />
            <SummaryCard label="Absent" value={absent} />
            <SummaryCard label="Attendance" value={`${percentage}%`} />
          </div>

          {/* Show the editable table only before the first save,
              or while the one permitted update is in progress. */}
          {(!hasSavedAttendance || (updating && !hasAlreadyUpdated)) ? (
            <>
              {updating && (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Edit mode is enabled. You can update this attendance only
                  once. After saving the update, editing will be disabled.
                </p>
              )}

              <div className="table-wrap mt-5">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll Number</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="font-semibold">
                          {student.full_name}
                        </td>

                        <td>{student.roll_number || "—"}</td>

                        <td>
                          <select
                            aria-label={`Attendance status for ${student.full_name}`}
                            value={statuses[student.id] || "Present"}
                            onChange={(event) =>
                              setStatuses((current) => ({
                                ...current,
                                [student.id]: event.target
                                  .value as AttendanceStatus,
                              }))
                            }
                            className="input max-w-40"
                            disabled={saving || hasAlreadyUpdated}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="btn-primary mt-4"
                disabled={saving || hasAlreadyUpdated}
                onClick={() =>
                  updating
                    ? setConfirmUpdateOpen(true)
                    : void saveAttendance("create")
                }
              >
                {saving
                  ? "Saving..."
                  : updating
                    ? "Update Attendance"
                    : "Save Attendance"}
              </button>
            </>
          ) : (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {hasAlreadyUpdated
                ? "Attendance has been updated and saved. Further updates are disabled for this classroom and date."
                : "Attendance is saved. The editing table is hidden. You may update it once."}
            </p>
          )}
        </>
      )}

      {!loadingStudents &&
        classroomId &&
        students.length === 0 &&
        !error && (
          <p className="mt-4 text-sm text-slate-500">
            No students were returned for this classroom. Check the student
            records and their class assignments in Supabase.
          </p>
        )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={!classroomId || loadingStudents || saving}
          onClick={async () => {
            setError("");
            setMessage("");

            const loaded = await loadStudentsAndAttendance();

            if (loaded) {
              setUpdating(false);
              setViewOpen(true);
            }
          }}
        >
          {loadingStudents ? "Loading..." : "View Attendance"}
        </button>

        {/* This button is never displayed after the one allowed update. */}
        {hasSavedAttendance && !hasAlreadyUpdated && (
          <button
            type="button"
            className="btn-secondary"
            disabled={!classroomId || loadingStudents || saving}
            onClick={async () => {
              setError("");
              setMessage("");

              const loaded = await loadStudentsAndAttendance();

              if (loaded && !hasAlreadyUpdated) {
                setViewOpen(false);
                setUpdating(true);
              }
            }}
          >
            Update Attendance
          </button>
        )}
      </div>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Saved Attendance"
      >
        <p className="mb-3 text-sm text-slate-500">{date}</p>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const record = savedRecords.find(
                  (item) => item.student_id === student.id
                );

                return (
                  <tr key={student.id}>
                    <td>{student.full_name}</td>
                    <td>{student.roll_number || "—"}</td>
                    <td>{record?.status || "No saved record"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setViewOpen(false)}
          >
            Close
          </button>

          {hasSavedAttendance && !hasAlreadyUpdated && (
            <button
              type="button"
              className="btn-primary"
              disabled={loadingStudents || saving}
              onClick={async () => {
                const loaded = await loadStudentsAndAttendance();

                if (loaded && !hasAlreadyUpdated) {
                  setViewOpen(false);
                  setUpdating(true);
                }
              }}
            >
              Update Attendance
            </button>
          )}
        </div>
      </Modal>

      <Modal
        open={confirmUpdateOpen && !hasAlreadyUpdated}
        onClose={() => setConfirmUpdateOpen(false)}
        title="Confirm attendance update"
      >
        <p className="text-sm text-slate-700">
          Are you sure you want to update the existing attendance records for
          this classroom and date? You cannot update them again after this.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={saving}
            onClick={() => setConfirmUpdateOpen(false)}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary"
            disabled={saving || hasAlreadyUpdated}
            onClick={() => void saveAttendance("update")}
          >
            {saving ? "Updating..." : "Confirm Update"}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-indigo-600">{value}</p>
    </div>
  );
}