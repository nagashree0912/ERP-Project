
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

type AttendanceStatus = "Present" | "Absent";

type TeacherContext = {
  supabase: NonNullable<ReturnType<typeof createServerSupabase>>;
  teacherId: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isResponse(
  value: TeacherContext | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}

function normalizeRole(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function toStatus(
  fnPresent: boolean | null,
  anPresent: boolean | null
): AttendanceStatus {
  return fnPresent === true && anPresent === true ? "Present" : "Absent";
}

async function getTeacherContext(): Promise<
  TeacherContext | NextResponse
> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return jsonError("Database is not configured.", 503);
  }

  // Authenticate using the current Supabase session.
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  const userId = authData.user?.id;

  if (authError || !userId) {
    return jsonError("Authentication is required. Please log in again.", 401);
  }

  // profiles.id matches the authenticated Supabase user UUID.
  const { data: profile, error: profileError } = await supabase
    .schema("public")
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Teacher profile lookup failed:", profileError);
    return jsonError(
      "Unable to read your CampusFlow profile. Check the profile SELECT policy and server logs.",
      500
    );
  }

  if (!profile) {
    return jsonError(
      "No CampusFlow profile exists for this authenticated account. Ask the Principal to check your profile.",
      403
    );
  }

  if (profile.id !== userId) {
    return jsonError(
      "Your CampusFlow profile is not linked to your authenticated account.",
      403
    );
  }

  if (normalizeRole(profile.role) !== "teacher") {
    return jsonError(
      "This attendance feature is available only to teacher accounts.",
      403
    );
  }

  // IMPORTANT: teachers.id matches profiles.id.
  // Do not query the nonexistent teachers.profile_id column.
  const { data: teacher, error: teacherError } = await supabase
    .schema("public")
    .from("teachers")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (teacherError) {
    console.error("Teacher record lookup failed:", teacherError);
    return jsonError(
      "Unable to read your teacher record. Check the teachers SELECT policy and server logs.",
      500
    );
  }

  if (!teacher) {
    return jsonError(
      "Your teacher record is missing. Ask the Principal to link your existing teacher record to your account.",
      403
    );
  }

  return {
    supabase,
    teacherId: teacher.id,
  };
}

export async function GET(request: NextRequest) {
  const context = await getTeacherContext();

  if (isResponse(context)) return context;

  const { supabase, teacherId } = context;

  const classroomId = request.nextUrl.searchParams.get("classroomId");
  const date = request.nextUrl.searchParams.get("date");

  if (classroomId && !isUuid(classroomId)) {
    return jsonError("Invalid classroom ID.", 400);
  }

  if (date && !isValidDate(date)) {
    return jsonError("A valid attendance date is required.", 400);
  }

  // Requires the class_teacher_id assignment column described below.
  const { data: classrooms, error: classroomError } = await supabase
    .schema("public")
    .from("classes")
    .select("id, name")
    .eq("class_teacher_id", teacherId)
    .order("name");

  if (classroomError) {
    console.error("Teacher classroom lookup failed:", classroomError);
    return jsonError(
      "Unable to load assigned classrooms. Check the classroom assignment migration and classes SELECT policy.",
      500
    );
  }

  const assignedClassrooms = classrooms ?? [];

  // Initial request: return classrooms and attendance history.
  if (!classroomId) {
    if (assignedClassrooms.length === 0) {
      return NextResponse.json({
        classrooms: [],
        attendance: [],
      });
    }

    const classIds = assignedClassrooms.map((item) => item.id);

    // Existing student columns: class_id, name and roll_no.
    const { data: students, error: studentsError } = await supabase
      .schema("public")
      .from("students")
      .select("id, name, roll_no, class_id")
      .in("class_id", classIds);

    if (studentsError) {
      console.error("Teacher attendance roster lookup failed:", studentsError);
      return jsonError("Unable to load classroom students.", 500);
    }

    const roster = students ?? [];

    if (roster.length === 0) {
      return NextResponse.json({
        classrooms: assignedClassrooms,
        attendance: [],
      });
    }

    const studentIds = roster.map((student) => student.id);

    // Use the actual attendance columns.
    const { data: attendance, error: attendanceError } = await supabase
      .schema("public")
      .from("attendance")
      .select(
        "id, student_id, teacher_id, attendance_date, fn_present, an_present"
      )
      .in("student_id", studentIds)
      .order("attendance_date", { ascending: false });

    if (attendanceError) {
      console.error("Teacher attendance history lookup failed:", attendanceError);
      return jsonError("Unable to load attendance history.", 500);
    }

    const studentsById = new Map(
      roster.map((student) => [student.id, student])
    );

    const classesById = new Map(
      assignedClassrooms.map((classroom) => [
        classroom.id,
        classroom.name,
      ])
    );

    return NextResponse.json({
      classrooms: assignedClassrooms,
      attendance: (attendance ?? []).map((record) => {
        const student = studentsById.get(record.student_id);

        return {
          id: record.id,
          student_id: record.student_id,
          status: toStatus(record.fn_present, record.an_present),
          date: record.attendance_date,
          class_id: student?.class_id ?? "",
          student_name: student?.name ?? record.student_id,
          roll_number: student?.roll_no ?? null,
          class_name: student
            ? classesById.get(student.class_id) ?? null
            : null,
        };
      }),
    });
  }

  // Verify the classroom is assigned to this teacher.
  const classroom = assignedClassrooms.find(
    (item) => item.id === classroomId
  );

  if (!classroom) {
    return jsonError(
      "You are not assigned to this classroom.",
      403
    );
  }

  const { data: students, error: rosterError } = await supabase
    .schema("public")
    .from("students")
    .select("id, name, roll_no, class_id")
    .eq("class_id", classroomId)
    .order("name");

  if (rosterError) {
    console.error("Classroom roster lookup failed:", rosterError);
    return jsonError("Unable to load students for this classroom.", 500);
  }

  const roster = students ?? [];

  if (!date) {
    return NextResponse.json({
      classroom,
      students: roster.map((student) => ({
        id: student.id,
        full_name: student.name,
        roll_number: student.roll_no,
      })),
      attendance: [],
    });
  }

  if (roster.length === 0) {
    return NextResponse.json({
      classroom,
      students: [],
      attendance: [],
    });
  }

  const { data: attendance, error: attendanceError } = await supabase
    .schema("public")
    .from("attendance")
    .select(
      "id, student_id, teacher_id, attendance_date, fn_present, an_present"
    )
    .in(
      "student_id",
      roster.map((student) => student.id)
    )
    .eq("attendance_date", date);

  if (attendanceError) {
    console.error("Existing attendance lookup failed:", attendanceError);
    return jsonError("Unable to check existing attendance.", 500);
  }

  return NextResponse.json({
    classroom,
    students: roster.map((student) => ({
      id: student.id,
      full_name: student.name,
      roll_number: student.roll_no,
    })),
    attendance: (attendance ?? []).map((record) => ({
      id: record.id,
      student_id: record.student_id,
      status: toStatus(record.fn_present, record.an_present),
      date: record.attendance_date,
      class_id: classroomId,
    })),
  });
}

export async function POST(request: NextRequest) {
  const context = await getTeacherContext();

  if (isResponse(context)) return context;

  const { supabase, teacherId } = context;

  let body: {
    classroomId?: string;
    date?: string;
    mode?: "create" | "update";
    records?: { student_id: string; status: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Invalid request body.", 400);
  }

  if (
    !body.classroomId ||
    !isUuid(body.classroomId) ||
    !body.date ||
    !isValidDate(body.date)
  ) {
    return jsonError("Classroom and a valid date are required.", 400);
  }

  if (body.mode !== "create" && body.mode !== "update") {
    return jsonError("Attendance mode must be create or update.", 400);
  }

  if (
    !Array.isArray(body.records) ||
    body.records.length === 0 ||
    body.records.some(
      (record) =>
        !record ||
        !isUuid(record.student_id) ||
        !["Present", "Absent"].includes(record.status)
    )
  ) {
    return jsonError(
      "Attendance must contain students with a Present or Absent status.",
      400
    );
  }

  const submittedIds = body.records.map((record) => record.student_id);

  if (new Set(submittedIds).size !== submittedIds.length) {
    return jsonError("Duplicate student IDs were submitted.", 400);
  }

  // Verify assignment on every write; never trust the client alone.
  const { data: classroom, error: classroomError } = await supabase
    .schema("public")
    .from("classes")
    .select("id")
    .eq("id", body.classroomId)
    .eq("class_teacher_id", teacherId)
    .maybeSingle();

  if (classroomError) {
    console.error("Attendance classroom authorization failed:", classroomError);
    return jsonError("Unable to verify classroom assignment.", 500);
  }

  if (!classroom) {
    return jsonError(
      "You are not assigned to this classroom.",
      403
    );
  }

  const { data: students, error: studentsError } = await supabase
    .schema("public")
    .from("students")
    .select("id")
    .eq("class_id", body.classroomId);

  if (studentsError) {
    console.error("Attendance student validation failed:", studentsError);
    return jsonError("Unable to verify classroom students.", 500);
  }

  const classroomStudentIds = new Set(
    (students ?? []).map((student) => student.id)
  );

  if (
    classroomStudentIds.size === 0 ||
    submittedIds.length !== classroomStudentIds.size ||
    submittedIds.some((id) => !classroomStudentIds.has(id))
  ) {
    return jsonError(
      "Submit attendance for every student in the selected classroom only.",
      400
    );
  }

  const { data: existing, error: existingError } = await supabase
    .schema("public")
    .from("attendance")
    .select(
      "id, student_id, teacher_id, attendance_date, fn_present, an_present"
    )
    .in("student_id", submittedIds)
    .eq("attendance_date", body.date);

  if (existingError) {
    console.error("Attendance duplicate check failed:", existingError);
    return jsonError("Unable to check existing attendance.", 500);
  }

  const existingByStudent = new Map(
    (existing ?? []).map((record) => [record.student_id, record])
  );

  if (body.mode === "create" && existingByStudent.size > 0) {
    return jsonError(
      "Attendance has already been recorded for this classroom and date. Choose Update Attendance.",
      409
    );
  }

  if (body.mode === "update" && existingByStudent.size === 0) {
    return jsonError(
      "No saved attendance was found to update. Save attendance first.",
      404
    );
  }

  // Persist to existing schema columns. A single Present/Absent choice
  // represents both FN and AN sessions in this UI.
  for (const record of body.records) {
    const present = record.status === "Present";
    const saved = existingByStudent.get(record.student_id);

    if (saved) {
      if (body.mode !== "update") continue;

      const { error: updateError } = await supabase
        .schema("public")
        .from("attendance")
        .update({
          fn_present: present,
          an_present: present,
          teacher_id: teacherId,
        })
        .eq("id", saved.id)
        .eq("teacher_id", teacherId);

      if (updateError) {
        console.error("Attendance update failed:", updateError);
        return jsonError(
          "Unable to update attendance. Check the attendance UPDATE policy and server logs.",
          500
        );
      }
    } else {
      const { error: insertError } = await supabase
        .schema("public")
        .from("attendance")
        .insert({
          student_id: record.student_id,
          teacher_id: teacherId,
          attendance_date: body.date,
          fn_present: present,
          an_present: present,
        });

      if (insertError) {
        console.error("Attendance insert failed:", insertError);
        return jsonError(
          "Unable to save attendance. Check the attendance INSERT policy and server logs.",
          500
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    mode: body.mode,
    message:
      body.mode === "update"
        ? "Attendance updated successfully."
        : "Attendance saved successfully.",
  });
}
