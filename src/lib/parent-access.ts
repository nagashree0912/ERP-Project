import type { DemoUser } from "@/lib/auth";

/* =========================================================
   GET PARENT RECORD
   ========================================================= */

export function getParentRecord(
  user: DemoUser | null | undefined,
  parents: any[] = []
) {
  if (!user) return null;

  const email = String(user.email || "")
    .trim()
    .toLowerCase();

  if (!email) return null;

  return (
    parents.find(
      (parent: any) =>
        String(parent?.email || "")
          .trim()
          .toLowerCase() === email
    ) || null
  );
}

/* =========================================================
   GET LINKED CHILD
   ========================================================= */

export function getLinkedChild(
  user: DemoUser | null | undefined,
  parents: any[] = [],
  students: any[] = []
) {
  if (!user) return null;

  const normalizedEmail = String(
    user.email || ""
  )
    .trim()
    .toLowerCase();

  /*
   * -------------------------------------------------------
   * 1. Find parent directly by logged-in email
   * -------------------------------------------------------
   */

  const parent = parents.find(
    (item: any) =>
      String(item?.email || "")
        .trim()
        .toLowerCase() === normalizedEmail
  );

  // Fallback for the required demo relationship if an older local store
  // does not yet contain the parent record/link.
  if (!parent && normalizedEmail === "roja123@campusflow.edu") {
    const demoStudent = students.find((student: any) => String(student?.id) === "S1");
    if (demoStudent) return demoStudent;
  }

  /*
   * -------------------------------------------------------
   * 2. If parent exists, use student_id
   * -------------------------------------------------------
   */

  if (parent) {
    const studentId =
      parent.student_id ??
      parent.studentId ??
      parent.child_id ??
      parent.childId;

    if (studentId) {
      const child = students.find(
        (student: any) =>
          String(student?.id) ===
          String(studentId)
      );

      if (child) {
        return child;
      }
    }

    /*
     * Alternative relationship:
     * student.parent_id = parent.id
     */

    if (parent.id) {
      const childByParentId =
        students.find(
          (student: any) =>
            String(student?.parent_id) ===
            String(parent.id)
        );

      if (childByParentId) {
        return childByParentId;
      }
    }
  }

  /*
   * -------------------------------------------------------
   * 3. Direct parent_email relationship
   * -------------------------------------------------------
   */

  if (normalizedEmail) {
    const childByParentEmail =
      students.find(
        (student: any) =>
          String(student?.parent_email || "")
            .trim()
            .toLowerCase() ===
          normalizedEmail
      );

    if (childByParentEmail) {
      return childByParentEmail;
    }
  }

  /*
   * -------------------------------------------------------
   * 4. Final explicit demo mapping
   *
   * Roja -> Nagashree / S1
   *
   * This is only a fallback for this demo account.
   * -------------------------------------------------------
   */

  if (
    normalizedEmail ===
    "roja123@campusflow.edu"
  ) {
    return (
      students.find(
        (student: any) =>
          String(student?.id) === "S1"
      ) || null
    );
  }

  return null;
}

/* =========================================================
   GET LINKED STUDENT ID
   ========================================================= */

export function getLinkedStudentId(
  user: DemoUser | null | undefined,
  parents: any[] = [],
  students: any[] = []
): string | null {
  const child = getLinkedChild(
    user,
    parents,
    students
  );

  if (!child) {
    return null;
  }

  return String(child.id);
}

/* =========================================================
   CHECK PARENT LINK
   ========================================================= */

export function isParentLinked(
  user: DemoUser | null | undefined,
  parents: any[] = [],
  students: any[] = []
): boolean {
  return Boolean(
    user &&
      user.role === "parent" &&
      getLinkedChild(
        user,
        parents,
        students
      )
  );
}