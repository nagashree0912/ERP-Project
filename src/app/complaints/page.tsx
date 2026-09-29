"use client";

import React, { useMemo, useState } from "react";
import {
  MessageSquareWarning,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  GraduationCap,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  FileSpreadsheet,
  Star,
  Lock,
  ArrowRight,
  Info,
  Layers,
} from "lucide-react";
import { Shell } from "@/components/shell2";
import { Badge, statusTone } from "@/components/ui";
import { Modal, Empty, Field } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Complaint } from "@/types";

const CATEGORIES = [
  "All",
  "Academics",
  "Infrastructure",
  "Faculty",
  "Transport",
  "Canteen & Hygiene",
  "Discipline",
  "Fee & Billing",
  "Other",
] as const;

const STATUSES = ["All", "Under Review", "In Progress", "Resolved", "Closed"] as const;

export default function ComplaintsPage() {
  const store = useStore();
  const { user } = useAuth();

  const role = user?.role || "parent";
  const isParent = role === "parent";
  const isPrincipal = role === "principal";

  const child = isParent ? store.getParentStudent(user?.email) : null;
  const parentRecord = isParent ? store.getParentRecord(user?.email) : null;

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Expanders
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>("CMP1");
  const [replyComplaint, setReplyComplaint] = useState<Complaint | null>(null);

  // Form states for new complaint
  const [formData, setFormData] = useState({
    category: "Infrastructure" as Complaint["category"],
    priority: "Normal" as Complaint["priority"],
    subject: "",
    description: "",
    is_anonymous: false,
    parent_phone: parentRecord?.phone || "9052732998",
  });

  // Reply form states for Principal
  const [replyData, setReplyData] = useState({
    status: "Resolved" as Complaint["status"],
    principal_response: "",
    action_taken: "",
  });

  // Complaints list based on role
  const allComplaints: Complaint[] = useMemo(() => {
    const list = (store.complaints || []) as Complaint[];
    if (isParent) {
      const email = String(user?.email || "").trim().toLowerCase();
      return list.filter(
        (c) =>
          String(c.parent_email || "").trim().toLowerCase() === email ||
          (child && String(c.student_id) === String(child.id)) ||
          email.includes("roja")
      );
    }
    return list;
  }, [store.complaints, isParent, user?.email, child]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter((c) => {
      if (selectedCategory !== "All" && c.category !== selectedCategory) return false;
      if (selectedStatus !== "All" && c.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTracking = (c.tracking_no || "").toLowerCase().includes(q);
        const matchSubject = (c.subject || "").toLowerCase().includes(q);
        const matchDesc = (c.description || "").toLowerCase().includes(q);
        const matchParent = (c.parent_name || "").toLowerCase().includes(q);
        const matchStudent = (c.student_name || "").toLowerCase().includes(q);
        if (!matchTracking && !matchSubject && !matchDesc && !matchParent && !matchStudent) {
          return false;
        }
      }
      return true;
    });
  }, [allComplaints, selectedCategory, selectedStatus, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = allComplaints.length;
    const underReview = allComplaints.filter((c) => c.status === "Under Review").length;
    const inProgress = allComplaints.filter((c) => c.status === "In Progress").length;
    const resolved = allComplaints.filter((c) => c.status === "Resolved").length;
    return { total, underReview, inProgress, resolved };
  }, [allComplaints]);

  // Submit Complaint Handler
  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      store.toast("Please fill in the subject and description");
      return;
    }

    const randomNo = Math.floor(100 + Math.random() * 900);
    const tracking_no = `CMP-2026-${randomNo}`;

    const newComplaint: Complaint = {
      id: `CMP_${Date.now()}`,
      tracking_no,
      parent_id: parentRecord?.id || "P1",
      parent_name: formData.is_anonymous ? "Confidential Parent" : (parentRecord?.full_name || user?.full_name || "Dareddy.Roja"),
      parent_email: user?.email || "roja123@campusflow.edu",
      parent_phone: formData.parent_phone,
      student_id: child?.id || "S1",
      student_name: child?.full_name || "Dareddy.Nagashree",
      student_class: child ? `${child.department} - ${child.year} (Sec ${child.section || "A"})` : "CSE - 3rd Year (Sec A)",
      category: formData.category,
      priority: formData.priority,
      subject: formData.subject,
      description: formData.description,
      to_authority: "Principal",
      status: "Under Review",
      created_at: new Date().toISOString().slice(0, 10),
      principal_response: "",
      responded_at: "",
      responded_by: "",
      action_taken: "",
      is_anonymous: formData.is_anonymous,
    };

    store.add("complaints", newComplaint);
    store.toast(`Complaint ${tracking_no} submitted directly to Principal`);
    setShowAddModal(false);
    setExpandedId(newComplaint.id);

    // Reset form
    setFormData({
      category: "Infrastructure",
      priority: "Normal",
      subject: "",
      description: "",
      is_anonymous: false,
      parent_phone: parentRecord?.phone || "9052732998",
    });
  };

  // Submit Principal Reply Handler
  const handlePrincipalReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyComplaint) return;

    store.update("complaints", replyComplaint.id, {
      status: replyData.status,
      principal_response: replyData.principal_response,
      action_taken: replyData.action_taken,
      responded_at: new Date().toISOString().slice(0, 10),
      responded_by: user?.full_name || "Dr. Nagashree (Principal)",
    });

    store.toast(`Response saved for ${replyComplaint.tracking_no}`);
    setReplyComplaint(null);
  };

  // Satisfaction rating
  const handleRateSatisfaction = (complaintId: string, rating: number) => {
    store.update("complaints", complaintId, { satisfaction_rating: rating });
    store.toast(`Thank you for rating! (${rating} / 5 stars)`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Tracking No", "Date", "Parent Name", "Student", "Category", "Priority", "Subject", "Status", "Principal Response", "Action Taken"];
    const rows = filteredComplaints.map((c) => [
      c.tracking_no,
      c.created_at,
      c.parent_name,
      c.student_name,
      c.category,
      c.priority,
      `"${(c.subject || "").replace(/"/g, '""')}"`,
      c.status,
      `"${(c.principal_response || "").replace(/"/g, '""')}"`,
      `"${(c.action_taken || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Parent_Complaints_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    store.toast("Complaints report exported successfully");
  };

  // Category tone styling helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Academics":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case "Infrastructure":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "Faculty":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "Transport":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
      case "Canteen & Hygiene":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
      case "Discipline":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
      case "Fee & Billing":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  // Priority badge styling
  const getPriorityBadge = (priority: Complaint["priority"]) => {
    if (priority === "Urgent") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-extrabold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span> Urgent
        </span>
      );
    }
    if (priority === "High") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
          High
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Normal
      </span>
    );
  };

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* Header section */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>{isParent ? "Parent Portal" : "Principal Desk"}</span>
              <span>•</span>
              <span className="text-indigo-600 font-bold dark:text-indigo-400">
                {isParent ? "Direct Grievance Desk" : "Parent Grievances Management"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
                <MessageSquareWarning size={22} />
              </span>
              {isParent ? "Complaint Box to Principal" : "Parent Complaints & Grievance Box"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {isParent
                ? "Submit direct feedback or complaints to the Principal. All grievances are monitored and resolved on high priority."
                : "Review parent submissions, dispatch facility / academic actions, and reply directly to parents."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isPrincipal && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <FileSpreadsheet size={15} /> Export CSV
              </button>
            )}

            {isParent && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:brightness-110"
              >
                <Plus size={18} /> New Complaint to Principal
              </button>
            )}
          </div>
        </div>

        {/* Direct Channel Assurance Banner for Parents */}
        {isParent && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/50 to-rose-50/40 p-4 sm:p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-rose-950/10">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                <ShieldAlert size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                    Direct Confidential Channel to the Principal
                  </h3>
                  <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                    Encrypted & Monitored
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Complaints submitted in this box go directly to{" "}
                  <strong className="text-slate-800 dark:text-white">Dr. Nagashree (Principal)</strong>. You will receive an official response and timeline of action taken directly on this portal.
                </p>
                {child && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <GraduationCap size={14} className="text-indigo-600" />
                    <span>Linked Student: <strong className="text-slate-700 dark:text-slate-200">{child.full_name}</strong> ({child.department} • {child.year} • Sec {child.section || "A"})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Total Grievances</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Layers size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-white">{stats.total}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Direct Principal Desk</p>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Under Review</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Clock3 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-300">{stats.underReview}</p>
            <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400">Awaiting review</p>
          </div>

          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/40 p-4 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">In Progress</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <AlertTriangle size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-blue-700 dark:text-blue-300">{stats.inProgress}</p>
            <p className="mt-0.5 text-[11px] text-blue-600/80 dark:text-blue-400">Action being taken</p>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Resolved</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{stats.resolved}</p>
            <p className="mt-0.5 text-[11px] text-emerald-600/80 dark:text-emerald-400">With action notes</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracking no, subject, keywords..."
                className="input w-full pl-9 text-xs"
              />
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter size={13} /> Status:
              </span>
              {STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedStatus === st
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 mr-1">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition border ${
                  selectedCategory === cat
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Listing */}
        {filteredComplaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <MessageSquareWarning size={32} />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-800 dark:text-white">No complaints found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {isParent
                ? "You have not submitted any complaints under the selected criteria."
                : "No parent complaints match the active filters."}
            </p>
            {isParent && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary mx-auto mt-4 text-xs"
              >
                + Submit a Complaint to Principal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((c) => {
              const isExpanded = expandedId === c.id;

              return (
                <div
                  key={c.id}
                  className={`card transition overflow-hidden border ${
                    c.priority === "Urgent" && c.status !== "Resolved"
                      ? "border-rose-300/80 shadow-rose-100/50 dark:border-rose-900/50"
                      : "border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  {/* Card Main Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="cursor-pointer p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <MessageSquareWarning size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              #{c.tracking_no}
                            </span>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(
                                c.category
                              )}`}
                            >
                              {c.category}
                            </span>
                            {getPriorityBadge(c.priority)}
                            {c.is_anonymous && (
                              <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <Lock size={10} /> Confidential
                              </span>
                            )}
                          </div>

                          <h3 className="mt-1.5 text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                            {c.subject}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Filed: <strong className="text-slate-700 dark:text-slate-300">{c.created_at}</strong></span>
                            <span>Addressed to: <strong className="text-slate-700 dark:text-slate-300">{c.to_authority}</strong></span>
                            {!isParent && (
                              <span>
                                Parent: <strong className="text-slate-700 dark:text-slate-300">{c.parent_name}</strong> (Student: {c.student_name})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status + Action button */}
                      <div className="flex items-center gap-3 self-center sm:self-start">
                        <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
                      {/* Description Block */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Grievance Description</p>
                        <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                          {c.description}
                        </p>
                      </div>

                      {/* Timeline Stepper */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Progress Status Timeline</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-bold">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-extrabold">1. Submitted</p>
                              <p className="text-[10px] font-normal text-emerald-600">{c.created_at}</p>
                            </div>
                          </div>

                          <div
                            className={`rounded-xl border p-2.5 flex items-center gap-2 ${
                              c.status === "Under Review" || c.status === "In Progress" || c.status === "Resolved"
                                ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                                : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-800"
                            }`}
                          >
                            <Clock3 size={16} className={c.status === "Under Review" ? "text-amber-500 animate-spin" : "text-emerald-600"} />
                            <div>
                              <p className="font-extrabold">2. Under Review</p>
                              <p className="text-[10px] font-normal">Principal Office</p>
                            </div>
                          </div>

                          <div
                            className={`rounded-xl border p-2.5 flex items-center gap-2 ${
                              c.status === "In Progress" || c.status === "Resolved"
                                ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                                : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-800"
                            }`}
                          >
                            <AlertTriangle size={16} className={c.status === "In Progress" ? "text-blue-600" : "text-slate-400"} />
                            <div>
                              <p className="font-extrabold">3. Action in Progress</p>
                              <p className="text-[10px] font-normal">Department Action</p>
                            </div>
                          </div>

                          <div
                            className={`rounded-xl border p-2.5 flex items-center gap-2 ${
                              c.status === "Resolved"
                                ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                                : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-800"
                            }`}
                          >
                            <CheckCircle2 size={16} className={c.status === "Resolved" ? "text-emerald-600" : "text-slate-300"} />
                            <div>
                              <p className="font-extrabold">4. Resolved</p>
                              <p className="text-[10px] font-normal">{c.responded_at || "Pending resolution"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Principal Official Response Box */}
                      {c.principal_response ? (
                        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-white p-4 sm:p-5 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white font-extrabold shadow-sm">
                              P
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    {c.responded_by || "Dr. Nagashree (Principal)"}
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                      Official Resolution
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500">{c.responded_at}</p>
                                </div>
                              </div>

                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                                &ldquo;{c.principal_response}&rdquo;
                              </p>

                              {c.action_taken && (
                                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 size={14} />
                                  <span>Action Dispatched: {c.action_taken}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Satisfaction Rating for Parents */}
                          {isParent && c.status === "Resolved" && (
                            <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                Was this grievance resolved to your satisfaction?
                              </span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRateSatisfaction(c.id, star)}
                                    className="text-amber-400 hover:scale-125 transition"
                                  >
                                    <Star
                                      size={18}
                                      className={
                                        (c.satisfaction_rating || 0) >= star
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-300 dark:text-slate-600"
                                      }
                                    />
                                  </button>
                                ))}
                                {c.satisfaction_rating && (
                                  <span className="ml-2 text-xs font-extrabold text-amber-600">
                                    {c.satisfaction_rating} / 5
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <Clock3 size={15} /> Your complaint is queued on the Principal&apos;s priority grievance desk. An official response will be posted here.
                          </span>
                        </div>
                      )}

                      {/* Principal Quick Action Toolbar */}
                      {isPrincipal && (
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => {
                              setReplyComplaint(c);
                              setReplyData({
                                status: c.status,
                                principal_response: c.principal_response || "",
                                action_taken: c.action_taken || "",
                              });
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                          >
                            <MessageCircle size={14} /> Update Status & Reply to Parent
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: New Complaint (For Parent) */}
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Submit Complaint to Principal"
        >
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 text-amber-600" />
              <span>
                Addressed directly to <strong>Dr. Nagashree (Principal)</strong>. Please provide specific details to help us investigate and resolve promptly.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="Infrastructure">Infrastructure & Labs</option>
                  <option value="Academics">Academics & Teaching</option>
                  <option value="Faculty">Faculty & Staff</option>
                  <option value="Transport">Transport / Bus Facility</option>
                  <option value="Canteen & Hygiene">Canteen & Hygiene</option>
                  <option value="Discipline">Safety & Discipline</option>
                  <option value="Fee & Billing">Fee & Accounts</option>
                  <option value="Other">Other / General</option>
                </select>
              </Field>

              <Field label="Priority Level">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="input font-bold"
                  required
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High (Needs Attention)</option>
                  <option value="Urgent">Urgent / Critical</option>
                </select>
              </Field>
            </div>

            <Field label="Subject / Grievance Headline">
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Issue with laboratory computers or transport route timing"
                className="input"
              />
            </Field>

            <Field label="Detailed Description / Grievance">
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe the issue in detail, including specific dates, room/bus numbers, or any relevant context..."
                className="input"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Contact Phone for Follow-up">
                <input
                  type="text"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="e.g., 9052732998"
                  className="input"
                />
              </Field>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Keep Confidential</p>
                    <p className="text-[10px] text-slate-400">Keep identity masked from staff</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-1.5"
              >
                <Send size={14} /> Submit to Principal
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Principal Reply / Update */}
        <Modal
          open={!!replyComplaint}
          onClose={() => setReplyComplaint(null)}
          title={`Principal Resolution Desk • ${replyComplaint?.tracking_no}`}
        >
          {replyComplaint && (
            <form onSubmit={handlePrincipalReply} className="space-y-4">
              <div className="rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
                <p className="font-bold text-slate-800 dark:text-white">{replyComplaint.subject}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{replyComplaint.description}</p>
                <div className="mt-2 text-[11px] text-slate-400">
                  Parent: {replyComplaint.parent_name} • Student: {replyComplaint.student_name}
                </div>
              </div>

              <Field label="Status">
                <select
                  value={replyData.status}
                  onChange={(e) => setReplyData({ ...replyData, status: e.target.value as any })}
                  className="input font-bold"
                  required
                >
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress (Action Initiated)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                  <option value="Closed">Closed / Dismissed</option>
                </select>
              </Field>

              <Field label="Official Principal Response (Visible to Parent)">
                <textarea
                  rows={3}
                  required
                  value={replyData.principal_response}
                  onChange={(e) => setReplyData({ ...replyData, principal_response: e.target.value })}
                  placeholder="Explain resolution, instructions given to department, or investigation outcome..."
                  className="input"
                />
              </Field>

              <Field label="Action Dispatched / Taken">
                <input
                  type="text"
                  value={replyData.action_taken}
                  onChange={(e) => setReplyData({ ...replyData, action_taken: e.target.value })}
                  placeholder="e.g. Maintenance team repaired AC units on Sep 22nd"
                  className="input"
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReplyComplaint(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save & Notify Parent
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
