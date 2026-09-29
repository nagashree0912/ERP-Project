"use client";
import { LayoutDashboard, Users, GraduationCap, UserSquare2, School, BookOpen, ClipboardCheck, CalendarDays, Award, FileText, Wallet, Bell, FileBarChart, Settings, Search, MessageSquareWarning, FileCheck } from "lucide-react";
export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/parents", label: "Parents", icon: UserSquare2 },
  { href: "/classes", label: "Classes", icon: School },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/marks", label: "Marks", icon: Award },
  { href: "/exams", label: "Examinations", icon: CalendarDays },
  { href: "/assignments", label: "Assignments", icon: FileText },
  { href: "/materials", label: "Materials", icon: BookOpen },
];
export const NAV2 = [
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/requests", label: "Requests", icon: FileCheck },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notices", label: "Notices", icon: Bell },
  { href: "/leaves", label: "Leaves", icon: FileText },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

