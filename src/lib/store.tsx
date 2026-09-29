"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { seed } from "./data";
import type { DemoUser } from "./auth";

/* =========================================================
   DATABASE
   ========================================================= */

/*
 * We intentionally use flexible array types here.
 *
 * Your current data.ts and types/index.ts contain different
 * required fields. Using any[] in the local demo store prevents
 * those incompatible seed/type errors from breaking the app.
 *
 * Supabase remains responsible for authentication.
 * Passwords are NOT stored here.
 */

export interface DB {
  students: any[];
  teachers: any[];
  parents: any[];
  classes: any[];
  subjects: any[];
  attendance: any[];
  marks: any[];
  exams: any[];
  assignments: any[];
  materials: any[];
  notices: any[];
  leaves: any[];
  fees: any[];
  notifications: any[];
  complaints: any[];
  requests: any[];
}

/* =========================================================
   STORE TYPES
   ========================================================= */

export interface Store extends DB {
  add<K extends keyof DB>(
    table: K,
    row: any
  ): void;

  update<K extends keyof DB>(
    table: K,
    id: string,
    patch: any
  ): void;

  remove<K extends keyof DB>(
    table: K,
    id: string
  ): void;

  markNotifsRead(): void;

  reset(): void;

  toast(message: string): void;

  toasts: {
    id: number;
    msg: string;
  }[];

  getParentRecord(
    email?: string | null
  ): any | null;

  getParentStudent(
    email?: string | null
  ): any | null;

  getParentStudentId(
    email?: string | null
  ): string | null;

  isParentLinked(
    email?: string | null
  ): boolean;
}

/* =========================================================
   CONTEXT
   ========================================================= */

const Ctx =
  createContext<Store | null>(null);

export function useStore(): Store {
  const context =
    useContext(Ctx);

  if (!context) {
    throw new Error(
      "useStore must be used inside StoreProvider"
    );
  }

  return context;
}

/* =========================================================
   LOCAL STORAGE KEY
   ========================================================= */

const KEY =
  "campusflow_db_v7";

/* =========================================================
   EMPTY DATABASE
   ========================================================= */

function emptyDB(): DB {
  return {
    students: [],
    teachers: [],
    parents: [],
    classes: [],
    subjects: [],
    attendance: [],
    marks: [],
    exams: [],
    assignments: [],
    materials: [],
    notices: [],
    leaves: [],
    fees: [],
    notifications: [],
    complaints: [],
    requests: [],
  };
}

/* =========================================================
   NORMALIZE SEED
   ========================================================= */

function normalizeDB(
  value: any
): DB {
  const source =
    value || {};

  return {
    students:
      Array.isArray(
        source.students
      )
        ? source.students
        : [],

    teachers:
      Array.isArray(
        source.teachers
      )
        ? source.teachers
        : [],

    parents:
      Array.isArray(
        source.parents
      )
        ? source.parents
        : [],

    classes:
      Array.isArray(
        source.classes
      )
        ? source.classes
        : [],

    subjects:
      Array.isArray(
        source.subjects
      )
        ? source.subjects
        : [],

    attendance:
      Array.isArray(
        source.attendance
      )
        ? source.attendance
        : [],

    marks:
      Array.isArray(
        source.marks
      )
        ? source.marks
        : [],

    exams:
      Array.isArray(
        source.exams
      )
        ? source.exams
        : [],

    assignments:
      Array.isArray(
        source.assignments
      )
        ? source.assignments
        : [],

    materials:
      Array.isArray(
        source.materials
      )
        ? source.materials
        : [],

    notices:
      Array.isArray(
        source.notices
      )
        ? source.notices
        : [],

    leaves:
      Array.isArray(
        source.leaves
      )
        ? source.leaves
        : [],

    fees:
      Array.isArray(
        source.fees
      )
        ? source.fees
        : [],

    notifications:
      Array.isArray(
        source.notifications
      )
        ? source.notifications
        : [],

    complaints:
      Array.isArray(
        source.complaints
      )
        ? source.complaints
        : [],

    requests:
      Array.isArray(
        source.requests
      )
        ? source.requests
        : [],
  };
}

/* =========================================================
   LOAD DATABASE
   ========================================================= */

function repairParentChildLink(db: DB): DB {
  const next = normalizeDB(db);
  const parentEmail = "roja123@campusflow.edu";
  const studentId = "S1";

  const student = next.students.find((item: any) => String(item?.id) === studentId);
  if (!student) return next;

  const parentIndex = next.parents.findIndex((item: any) =>
    String(item?.email || "").trim().toLowerCase() === parentEmail
  );

  if (parentIndex === -1) {
    next.parents.push({
      id: "P1",
      full_name: "Dareddy.Roja",
      email: parentEmail,
      student_id: studentId,
      phone: "9052732998",
      relationship: "Mother",
      status: "Active",
    });
    return next;
  }

  const parent = next.parents[parentIndex];
  const linkedId = parent?.student_id ?? parent?.studentId ?? parent?.child_id ?? parent?.childId ?? parent?.linkedStudentId ?? parent?.linked_student_id;

  if (String(linkedId || "") !== studentId) {
    next.parents[parentIndex] = { ...parent, student_id: studentId };
  }

  return next;
}

function loadDB(): DB {
  if (typeof window === "undefined") return emptyDB();

  // ── Wipe ALL old versioned keys so stale data never survives ──
  const OLD_KEYS = ["campusflow_db_v1", "campusflow_db_v2", "campusflow_db_v3", "campusflow_db_v4", "campusflow_db_v5", "campusflow_db_v6"];
  OLD_KEYS.forEach((k) => {
    try { localStorage.removeItem(k); } catch (_) { /* ignore */ }
  });

  try {
    const saved = localStorage.getItem(KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      const repaired = repairParentChildLink(parsed);
      localStorage.setItem(KEY, JSON.stringify(repaired));
      return repaired;
    }
  } catch (error) {
    console.error("CampusFlow local database load error:", error);
  }

  // No saved data → seed fresh
  try {
    const seeded = repairParentChildLink(seed());
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  } catch (error) {
    console.error("CampusFlow seed error:", error);
    return emptyDB();
  }
}

/* =========================================================
   FIND PARENT
========================================================= */

function findParent(
  parents: any[],
  email?: string | null
): any | null {
  if (
    !email ||
    !Array.isArray(parents)
  ) {
    return null;
  }

  const cleanEmail =
    String(email)
      .trim()
      .toLowerCase();

  if (!cleanEmail) {
    return null;
  }

  return (
    parents.find(
      (parent: any) =>
        String(
          parent?.email || ""
        )
          .trim()
          .toLowerCase() ===
        cleanEmail
    ) || null
  );
}

/* =========================================================
   FIND LINKED STUDENT
========================================================= */

function findParentStudent(
  parents: any[],
  students: any[],
  email?: string | null
): any | null {
  if (
    !email ||
    !Array.isArray(parents) ||
    !Array.isArray(students)
  ) {
    return null;
  }

  const parent =
    findParent(
      parents,
      email
    );

  // Explicit demo relationship required by the current project.
  // This is a fallback only when the stored parent record is missing.
  if (!parent && String(email).trim().toLowerCase() === "roja123@campusflow.edu") {
    const demoStudent = students.find((item: any) => String(item?.id) === "S1");
    if (demoStudent) return demoStudent;
  }

  if (!parent) {
    return null;
  }

  /*
   * Support all possible names used
   * in the existing project.
   */

  const studentId =
    parent.student_id ??
    parent.studentId ??
    parent.child_id ??
    parent.childId ??
    parent.linkedStudentId ??
    parent.linked_student_id;

  if (studentId) {
    const student =
      students.find(
        (item: any) =>
          String(
            item?.id
          ) ===
          String(
            studentId
          )
      );

    if (student) {
      return student;
    }
  }

  /*
   * Parent ID relationship.
   */

  if (parent.id) {
    const student =
      students.find(
        (item: any) =>
          String(
            item?.parent_id
          ) ===
          String(
            parent.id
          )
      );

    if (student) {
      return student;
    }
  }

  /*
   * Parent email relationship.
   */

  const cleanEmail =
    String(email)
      .trim()
      .toLowerCase();

  const studentByEmail =
    students.find(
      (item: any) =>
        String(
          item?.parent_email ||
            ""
        )
          .trim()
          .toLowerCase() ===
        cleanEmail
    );

  if (studentByEmail) {
    return studentByEmail;
  }

  return null;
}

/* =========================================================
   PROVIDER
========================================================= */

export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    db,
    setDb,
  ] = useState<DB | null>(
    null
  );

  const [
    toasts,
    setToasts,
  ] = useState<
    {
      id: number;
      msg: string;
    }[]
  >([]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const loaded =
      loadDB();

    // Keep the existing seed data only on first initialization.
    // User-created records are never overwritten on login/remount.
    const next = normalizeDB(loaded);
    setDb(next);

  }, []);

  /* =======================================================
     SAVE DATABASE
  ======================================================= */

  useEffect(() => {
    if (!db) {
      return;
    }

    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(db)
      );
    } catch (error) {
      console.error(
        "CampusFlow local database save error:",
        error
      );
    }
  }, [db]);

  /* =======================================================
     TOAST
  ======================================================= */

  function toast(
    message: string
  ) {
    const id =
      Date.now() +
      Math.random();

    setToasts(
      (current) => [
        ...current,
        {
          id,
          msg: message,
        },
      ]
    );

    window.setTimeout(
      () => {
        setToasts(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                id
            )
        );
      },
      2800
    );
  }

  /* =======================================================
     STORE API
  ======================================================= */

  const api =
    useMemo<Store | null>(
      () => {
        if (!db) {
          return null;
        }

        return {
          ...db,

          toasts,

          toast,

          /* =================================================
             ADD
          ================================================= */

          add: (
            table,
            row
          ) => {
            setDb(
              (current) => {
                if (!current) {
                  return current;
                }

                const existing =
                  Array.isArray(
                    current[
                      table
                    ] as any
                  )
                    ? (current[
                        table
                      ] as any)
                    : [];

                return {
                  ...current,
                  [table]: [
                    ...existing,
                    row,
                  ],
                };
              }
            );

            toast(
              "Record added successfully"
            );
          },

          /* =================================================
             UPDATE
          ================================================= */

          update: (
            table,
            id,
            patch
          ) => {
            setDb(
              (current) => {
                if (!current) {
                  return current;
                }

                const existing =
                  Array.isArray(
                    current[
                      table
                    ] as any
                  )
                    ? (current[
                        table
                      ] as any)
                    : [];

                return {
                  ...current,

                  [table]:
                    existing.map(
                      (
                        item: any
                      ) =>
                        String(
                          item?.id
                        ) ===
                        String(
                          id
                        )
                          ? {
                              ...item,
                              ...patch,
                            }
                          : item
                    ),
                };
              }
            );

            toast(
              "Changes saved"
            );
          },

          /* =================================================
             REMOVE
          ================================================= */

          remove: (
            table,
            id
          ) => {
            setDb(
              (current) => {
                if (!current) {
                  return current;
                }

                const existing =
                  Array.isArray(
                    current[
                      table
                    ] as any
                  )
                    ? (current[
                        table
                      ] as any)
                    : [];

                return {
                  ...current,

                  [table]:
                    existing.filter(
                      (
                        item: any
                      ) =>
                        String(
                          item?.id
                        ) !==
                        String(
                          id
                        )
                    ),
                };
              }
            );

            toast(
              "Record deleted"
            );
          },

          /* =================================================
             MARK NOTIFICATIONS READ
          ================================================= */

          markNotifsRead:
            () => {
              setDb(
                (current) => {
                  if (!current) {
                    return current;
                  }

                  return {
                    ...current,

                    notifications:
                      current.notifications.map(
                        (
                          notification: any
                        ) => ({
                          ...notification,
                          read: true,
                        })
                      ),
                  };
                }
              );
            },

          /* =================================================
             RESET
          ================================================= */

          reset: () => {
            let fresh: DB;

            try {
              fresh =
                normalizeDB(
                  seed()
                );
            } catch {
              fresh =
                emptyDB();
            }

            // Reset intentionally restores the project's seed data.
            // Normal login/navigation never calls reset().

            setDb(
              fresh
            );

            toast(
              "Demo data reset"
            );
          },

          /* =================================================
             PARENT RECORD
          ================================================= */

          getParentRecord:
            (
              email
            ) => {
              return findParent(
                db.parents,
                email
              );
            },

          /* =================================================
             PARENT STUDENT
          ================================================= */

          getParentStudent:
            (
              email
            ) => {
              return findParentStudent(
                db.parents,
                db.students,
                email
              );
            },

          /* =================================================
             PARENT STUDENT ID
          ================================================= */

          getParentStudentId:
            (
              email
            ) => {
              const student =
                findParentStudent(
                  db.parents,
                  db.students,
                  email
                );

              return student
                ? String(
                    student.id
                  )
                : null;
            },

          /* =================================================
             PARENT LINK CHECK
          ================================================= */

          isParentLinked:
            (
              email
            ) => {
              return Boolean(
                findParentStudent(
                  db.parents,
                  db.students,
                  email
                )
              );
            },
        };
      },
      [
        db,
        toasts,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (!api) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading CampusFlow…
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider
      value={api}
    >
      {children}
    </Ctx.Provider>
  );
}