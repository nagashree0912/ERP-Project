"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Search,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  Users,
  UserRound,
  ClipboardCheck,
  Award,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  BookOpen,
  Wallet,
  FileBarChart,
  School,
  UserCheck,
  Megaphone,
  MessageSquareWarning,
  FileCheck,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

const principalNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classrooms", icon: School },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/parents", label: "Parents", icon: UserRound },
  { href: "/complaints", label: "Complaints Box", icon: MessageSquareWarning },
  { href: "/requests", label: "Parent Requests", icon: FileCheck },
  { href: "/exams", label: "Examinations", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/notices", label: "Notices", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/leaves", label: "Leave Applications Request", icon: FileText },
  { href: "/marks-modification-requests", label: "Marks Modification Requests", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings },
];

const teacherNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "My Classes", icon: School },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/marks", label: "Marks", icon: Award },
  { href: "/exams", label: "Examinations", icon: CalendarDays },
  { href: "/notices", label: "Notices", icon: Megaphone },
  { href: "/leaves", label: "Leave Requests", icon: FileText },
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

const parentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "My Child", icon: UserCheck },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/marks", label: "Marks", icon: Award },
  { href: "/complaints", label: "Complaint Box", icon: MessageSquareWarning },
  { href: "/requests", label: "Requests", icon: FileCheck },
  { href: "/exams", label: "Examinations", icon: CalendarDays },
  { href: "/notices", label: "Notices", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/marks", label: "Marks", icon: Award },
  { href: "/exams", label: "Examinations", icon: CalendarDays },
  { href: "/assignments", label: "Assignments", icon: FileText },
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/notices", label: "Notices", icon: Megaphone },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

function roleNav(role: string) {
  if (role === "principal") return principalNav;
  if (role === "teacher") return teacherNav;
  if (role === "parent") return parentNav;
  return studentNav;
}

function roleLabel(role: string) {
  if (role === "principal") return "Principal";
  if (role === "teacher") return "Teacher";
  if (role === "parent") return "Parent";
  return "Student";
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const store = useStore();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState("");

  const nav = useMemo(() => roleNav(user?.role || "student"), [user?.role]);
  const allowed = nav.some((item) => path === item.href || path.startsWith(`${item.href}/`));
  const child = user?.role === "parent" ? store.getParentStudent(user.email) : null;
  const notifications = store.notifications || [];
  const unread = notifications.filter((n: any) => !n.read).length;
  const displayName = user?.full_name || user?.email || "User";
  const initials = displayName.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "U";
  const role = roleLabel(user?.role || "student");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !allowed) router.replace("/dashboard");
  }, [allowed, loading, user, router]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="text-sm text-slate-500">Loading CampusFlow…</div></div>;
  }
  if (!user || !allowed) return null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[250px] transform transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="m-3 flex h-[calc(100%-24px)] flex-col overflow-hidden rounded-[24px] bg-[#0d234c] text-white shadow-2xl">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg"><GraduationCap size={25} /></div>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold tracking-tight">CampusFlow</p>
              <p className="text-[10px] text-white/55">{role} Portal</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={19} /></button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/35">Main Menu</p>
            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = path === item.href || path.startsWith(`${item.href}/`);
                return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition ${active ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-950/20" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><Icon size={17} /><span>{item.label}</span></Link>;
              })}
            </div>
          </nav>

          {user.role === "parent" && child && (
            <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">My Child</p>
              <p className="mt-1 truncate text-xs font-bold">{child.full_name}</p>
              <p className="truncate text-[10px] text-white/50">{child.roll_number || child.roll_no}</p>
            </div>
          )}

          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-400/25 text-xs font-bold">{initials}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{displayName}</p><p className="text-[10px] text-white/45">{role}</p></div>
              <button onClick={logout} title="Logout" className="text-white/45 hover:text-white"><LogOut size={17} /></button>
            </div>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
          <div className="card flex min-h-[62px] items-center gap-3 rounded-2xl border-white/80 bg-white/90 px-3 py-2.5 backdrop-blur-xl">
            <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <form onSubmit={submitSearch} className="hidden max-w-[380px] flex-1 sm:flex">
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><Search size={15} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" placeholder="Search students, teachers, notices…" /></div>
            </form>
            <div className="ml-auto flex items-center gap-1.5">
              <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">{theme === "dark" ? "☀️" : "☼"}</button>
              <div className="relative">
                <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShowNotifications((v) => !v)} aria-label="Notifications"><Bell size={19} />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white">{Math.min(unread, 9)}</span>}</button>
                {showNotifications && <div className="absolute right-0 mt-2 w-[310px] rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
                  <div className="flex items-center justify-between px-2 py-1.5"><p className="text-sm font-extrabold">Notifications</p><button className="text-[11px] font-bold text-indigo-600" onClick={() => { store.markNotifsRead(); setShowNotifications(false); }}>Mark all read</button></div>
                  {notifications.length === 0 ? <p className="p-4 text-xs text-slate-500">No notifications.</p> : <div className="max-h-72 overflow-auto">{notifications.slice(0, 8).map((n: any) => <div key={n.id} className="border-t px-2 py-3"><p className="text-xs font-bold">{n.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{n.message || n.body}</p></div>)}</div>}
                </div>}
              </div>
              <div className="hidden items-center gap-2 pl-2 sm:flex"><div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div><div><p className="text-xs font-extrabold">{displayName}</p><p className="text-[10px] text-slate-400">{role}</p></div></div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1450px] p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
