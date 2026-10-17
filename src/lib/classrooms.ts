export function getClassTeacherId(classroom: any, teachers: any[]): string {
  if (Object.prototype.hasOwnProperty.call(classroom, "class_teacher_id")) {
    return String(classroom.class_teacher_id || "");
  }

  const legacyId = classroom.teacher_id;
  if (legacyId && teachers.some(teacher => String(teacher.id) === String(legacyId))) {
    return String(legacyId);
  }

  const legacyName = String(classroom.class_teacher || "").trim().toLowerCase();
  return String(teachers.find(teacher => String(teacher.full_name || "").trim().toLowerCase() === legacyName)?.id || "");
}

export function getClassTeacherName(classroom: any, teachers: any[]): string {
  const teacherId = getClassTeacherId(classroom, teachers);
  return teachers.find(teacher => String(teacher.id) === teacherId)?.full_name
    || classroom.class_teacher
    || "Not assigned";
}
