import { z } from "zod";
export const studentSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7).max(15),
  roll_number: z.string().min(2),
  department: z.string().min(2),
});
export const teacherSchema = z.object({
  full_name: z.string().min(2), email: z.string().email(),
  department: z.string().min(2), subject: z.string().min(2),
});
export const marksSchema = z.object({
  internal: z.number().min(0).max(20), external: z.number().min(0).max(80),
});
export const noticeSchema = z.object({
  title: z.string().min(3), description: z.string().min(5),
});
