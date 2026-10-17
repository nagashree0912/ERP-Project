export type Role = "principal" | "teacher" | "student" | "parent";
export interface Profile { id: string; email: string; full_name: string; role: Role; phone?: string; avatar_url?: string; department?: string; }
export interface Student { id: string; student_code: string; full_name: string; email: string; phone: string; gender: string; dob: string; department: string; course: string; year: string; section: string; roll_number: string; address: string; parent_id?: string; class_id?: string; admission_date: string; status: string; avatar?: string; }
export interface Teacher { id: string; teacher_code: string; full_name: string; email: string; phone: string; department: string; subject: string; qualification: string; joining_date: string; status: string; avatar?: string; }
export interface Parent { id: string; full_name: string; email: string; phone: string; occupation?: string; address?: string; status: string; }
export interface ClassRoom { id: string; name: string; class_teacher_id?: string; department?: string; year?: string; section?: string; room?: string; class_teacher?: string; strength?: number; }
export interface Subject { id: string; name: string; code: string; department: string; credits: number; teacher?: string; }
export interface AttendanceRecord { id: string; date: string; class_id: string; subject: string; student_id: string; student_name: string; status: "Present"|"Absent"|"Late"|"Leave"; }
export interface Mark { id: string; student_id: string; student_name: string; class_id: string; subject: string; exam: string; internal: number; external: number; total: number; grade: string; status: string; }
export interface Exam { id: string; name: string; subject: string; class_id: string; date: string; start_time: string; end_time: string; room: string; max_marks: number; status: string; }
export interface Assignment { id: string; title: string; subject: string; class_id: string; description: string; deadline: string; max_marks: number; status: string; submissions?: number; }
export interface Material { id: string; title: string; subject: string; class_id: string; type: string; size: string; uploaded: string; downloads: number; }
export interface Notice { id: string; title: string; description: string; audience: string; priority: string; date: string; attachment?: string; }
export interface LeaveRequest { id: string; applicant: string; role: string; from_date: string; to_date: string; reason: string; status: "Pending"|"Approved"|"Rejected"; date: string; }
export interface FeeRecord { id: string; student_id: string; student_name: string; tuition: number; exam_fee: number; library: number; transport: number; total: number; paid: number; due: number; status: string; due_date: string; }
export interface NotificationItem { id: string; title: string; message: string; type: string; date: string; read: boolean; }
export interface Complaint {
  id: string;
  tracking_no: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone?: string;
  student_id: string;
  student_name: string;
  student_class?: string;
  category: "Academics" | "Infrastructure" | "Faculty" | "Transport" | "Canteen & Hygiene" | "Discipline" | "Fee & Billing" | "Other";
  priority: "Normal" | "High" | "Urgent";
  subject: string;
  description: string;
  to_authority: string;
  status: "Under Review" | "In Progress" | "Resolved" | "Closed";
  created_at: string;
  principal_response?: string;
  responded_at?: string;
  responded_by?: string;
  action_taken?: string;
  is_anonymous?: boolean;
  satisfaction_rating?: number;
}

export interface ParentRequest {
  id: string;
  tracking_no: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone?: string;
  student_id: string;
  student_name: string;
  student_class?: string;
  request_type: "Leave Application" | "Bonafide Certificate" | "PTM with Principal" | "Fee Installment" | "Bus Route Change" | "Duplicate Document" | "Other";
  subject: string;
  details: string;
  from_date?: string;
  to_date?: string;
  meeting_preferred_date?: string;
  meeting_time_slot?: string;
  purpose?: string;
  status: "Pending" | "Approved" | "Processing" | "Rejected";
  created_at: string;
  principal_remarks?: string;
  decided_at?: string;
  decided_by?: string;
  certificate_ready?: boolean;
}

export const gradeFor = (pct: number) => pct>=90?"A+":pct>=80?"A":pct>=70?"B+":pct>=60?"B":pct>=50?"C":"F";

export interface MarksModificationRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_code?: string;
  subject: string;
  exam: string;
  class_id?: string;
  class_name?: string;
  is_sample?: boolean;
  current_internal?: number;
  current_external?: number;
  current_marks: number;
  requested_internal: number;
  requested_external: number;
  requested_marks: number;
  teacher_name: string;
  teacher_email?: string;
  reason: string;
  submission_date: string;
  status: "Pending" | "Approved" | "Rejected";
  principal_remarks?: string;
  decided_at?: string;
  decided_by?: string;
}
