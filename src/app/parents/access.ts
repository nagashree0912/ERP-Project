import type { Parent, Student } from "@/types";

export function getParentRecord(
  parents: Parent[],
  email?: string | null
): Parent | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = email
    .trim()
    .toLowerCase();

  return (
    parents.find((parent: any) => {
      return (
        String(parent.email || "")
          .trim()
          .toLowerCase() === normalizedEmail
      );
    }) || null
  );
}

export function getLinkedChild(
  parents: Parent[],
  students: Student[],
  email?: string | null
): Student | null {
  const parent = getParentRecord(parents, email);

  if (!parent) {
    return null;
  }

  const p = parent as any;

  const studentId =
    p.student_id ||
    p.studentId ||
    p.child_id ||
    p.childId;

  if (studentId) {
    return (
      students.find(
        (student: any) =>
          student.id === studentId
      ) || null
    );
  }

  if (p.id) {
    const student = students.find(
      (student: any) =>
        student.parent_id === p.id
    );

    if (student) {
      return student;
    }
  }

  const student = students.find(
    (student: any) =>
      String(student.parent_email || "")
        .trim()
        .toLowerCase() ===
      String(email || "")
        .trim()
        .toLowerCase()
  );

  return student || null;
}

export function hasLinkedChild(
  parents: Parent[],
  students: Student[],
  email?: string | null
): boolean {
  return Boolean(
    getLinkedChild(
      parents,
      students,
      email
    )
  );
}