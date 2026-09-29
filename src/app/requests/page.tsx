"use client";

import React, { useMemo, useState } from "react";
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  Award,
  Users,
  FileText,
  Bus,
  Wallet,
  Printer,
  Download,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Send,
  Building,
  Check,
  Layers,
  ArrowRight,
  School,
  AlertCircle,
  Info,
} from "lucide-react";
import { Shell } from "@/components/shell2";
import { Badge, statusTone } from "@/components/ui";
import { Modal, Empty, Field } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { ParentRequest } from "@/types";

const REQUEST_TYPES = [
  "All",
  "Leave Application",
  "Bonafide Certificate",
  "PTM with Principal",
  "Fee Installment",
  "Bus Route Change",
  "Duplicate Document",
  "Other",
] as const;

const STATUSES = ["All", "Pending", "Approved", "Processing", "Rejected"] as const;

export default function RequestsPage() {
  const store = useStore();
  const { user } = useAuth();

  const role = user?.role || "parent";
  const isParent = role === "parent";
  const isPrincipal = role === "principal";

  const child = isParent ? store.getParentStudent(user?.email) : null;
  const parentRecord = isParent ? store.getParentRecord(user?.email) : null;

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>("REQ1");
  const [actionRequest, setActionRequest] = useState<ParentRequest | null>(null);
  const [certificateModal, setCertificateModal] = useState<ParentRequest | null>(null);
  const [meetingPassModal, setMeetingPassModal] = useState<ParentRequest | null>(null);

  // Form states for new request
  const [formData, setFormData] = useState({
    request_type: "Leave Application" as ParentRequest["request_type"],
    subject: "",
    details: "",
    from_date: "",
    to_date: "",
    meeting_preferred_date: "",
    meeting_time_slot: "03:30 PM - 04:00 PM",
    purpose: "",
    parent_phone: parentRecord?.phone || "9052732998",
  });

  // Principal decision state
  const [decisionData, setDecisionData] = useState({
    status: "Approved" as ParentRequest["status"],
    principal_remarks: "",
    certificate_ready: true,
  });

  // All requests
  const allRequests: ParentRequest[] = useMemo(() => {
    const list = (store.requests || []) as ParentRequest[];
    if (isParent) {
      const email = String(user?.email || "").trim().toLowerCase();
      return list.filter(
        (r) =>
          String(r.parent_email || "").trim().toLowerCase() === email ||
          (child && String(r.student_id) === String(child.id)) ||
          email.includes("roja")
      );
    }
    return list;
  }, [store.requests, isParent, user?.email, child]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (selectedType !== "All" && r.request_type !== selectedType) return false;
      if (selectedStatus !== "All" && r.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTracking = (r.tracking_no || "").toLowerCase().includes(q);
        const matchSubject = (r.subject || "").toLowerCase().includes(q);
        const matchDetails = (r.details || "").toLowerCase().includes(q);
        const matchParent = (r.parent_name || "").toLowerCase().includes(q);
        const matchStudent = (r.student_name || "").toLowerCase().includes(q);
        if (!matchTracking && !matchSubject && !matchDetails && !matchParent && !matchStudent) {
          return false;
        }
      }
      return true;
    });
  }, [allRequests, selectedType, selectedStatus, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = allRequests.length;
    const pending = allRequests.filter((r) => r.status === "Pending").length;
    const approved = allRequests.filter((r) => r.status === "Approved").length;
    const processing = allRequests.filter((r) => r.status === "Processing").length;
    return { total, pending, approved, processing };
  }, [allRequests]);

  // Submit new request
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.details.trim()) {
      store.toast("Please fill in the subject and request details");
      return;
    }

    const randomNo = Math.floor(100 + Math.random() * 900);
    const tracking_no = `REQ-2026-${randomNo}`;

    const newReq: ParentRequest = {
      id: `REQ_${Date.now()}`,
      tracking_no,
      parent_id: parentRecord?.id || "P1",
      parent_name: parentRecord?.full_name || user?.full_name || "Dareddy.Roja",
      parent_email: user?.email || "roja123@campusflow.edu",
      parent_phone: formData.parent_phone,
      student_id: child?.id || "S1",
      student_name: child?.full_name || "Dareddy.Nagashree",
      student_class: child ? `${child.department} - ${child.year} (Sec ${child.section || "A"})` : "CSE - 3rd Year (Sec A)",
      request_type: formData.request_type,
      subject: formData.subject,
      details: formData.details,
      from_date: formData.from_date || undefined,
      to_date: formData.to_date || undefined,
      meeting_preferred_date: formData.meeting_preferred_date || undefined,
      meeting_time_slot: formData.meeting_time_slot || undefined,
      purpose: formData.purpose || undefined,
      status: "Pending",
      created_at: new Date().toISOString().slice(0, 10),
      principal_remarks: "Under review by Principal Office",
    };

    store.add("requests", newReq);
    store.toast(`Request ${tracking_no} submitted successfully`);
    setShowAddModal(false);
    setExpandedId(newReq.id);

    // Reset form
    setFormData({
      request_type: "Leave Application",
      subject: "",
      details: "",
      from_date: "",
      to_date: "",
      meeting_preferred_date: "",
      meeting_time_slot: "03:30 PM - 04:00 PM",
      purpose: "",
      parent_phone: parentRecord?.phone || "9052732998",
    });
  };

  // Submit Principal Decision
  const handlePrincipalDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionRequest) return;

    store.update("requests", actionRequest.id, {
      status: decisionData.status,
      principal_remarks: decisionData.principal_remarks || (decisionData.status === "Approved" ? "Approved by Principal" : "Rejected"),
      decided_at: new Date().toISOString().slice(0, 10),
      decided_by: user?.full_name || "Dr. Nagashree (Principal)",
      certificate_ready: actionRequest.request_type === "Bonafide Certificate" ? decisionData.status === "Approved" : false,
    });

    store.toast(`Request ${actionRequest.tracking_no} updated to ${decisionData.status}`);
    setActionRequest(null);
  };

  // Type styling helper
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "Leave Application":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "Bonafide Certificate":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "PTM with Principal":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
      case "Fee Installment":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "Bus Route Change":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  // Type Icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Leave Application":
        return <Calendar size={18} />;
      case "Bonafide Certificate":
        return <Award size={18} />;
      case "PTM with Principal":
        return <Users size={18} />;
      case "Fee Installment":
        return <Wallet size={18} />;
      case "Bus Route Change":
        return <Bus size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Tracking No", "Date", "Parent Name", "Student", "Request Type", "Subject", "Status", "Principal Remarks"];
    const rows = filteredRequests.map((r) => [
      r.tracking_no,
      r.created_at,
      r.parent_name,
      r.student_name,
      r.request_type,
      `"${(r.subject || "").replace(/"/g, '""')}"`,
      r.status,
      `"${(r.principal_remarks || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Parent_Requests_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    store.toast("Requests exported successfully");
  };

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>{isParent ? "Parent Portal" : "Principal Desk"}</span>
              <span>•</span>
              <span className="text-indigo-600 font-bold dark:text-indigo-400">
                {isParent ? "Applications & Requests" : "Parent Applications & Approval Desk"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20">
                <FileCheck size={22} />
              </span>
              {isParent ? "Parent Requests & Applications" : "Parent Applications & Service Requests"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {isParent
                ? "Submit formal requests for child leaves, bonafide certificates, PTM appointments with the Principal, and fee adjustments."
                : "Review and approve parent requests, schedule PTM meetings, and authorize student certificates."}
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
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:brightness-110"
              >
                <Plus size={18} /> New Request
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Total Requests</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Layers size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-white">{stats.total}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Parent Submissions</p>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Pending Review</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Clock3 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-300">{stats.pending}</p>
            <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400">Awaiting Principal</p>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Approved</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{stats.approved}</p>
            <p className="mt-0.5 text-[11px] text-emerald-600/80 dark:text-emerald-400">Granted & Ready</p>
          </div>

          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/40 p-4 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">In Processing</p>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <Clock size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-blue-700 dark:text-blue-300">{stats.processing}</p>
            <p className="mt-0.5 text-[11px] text-blue-600/80 dark:text-blue-400">Under verification</p>
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
                placeholder="Search tracking no, request title, student..."
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

          {/* Request Type Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 mr-1">Request Type:</span>
            {REQUEST_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition border ${
                  selectedType === type
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <FileCheck size={32} />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-800 dark:text-white">No requests found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {isParent
                ? "You have not created any requests matching the selected criteria."
                : "No parent requests match the active filter."}
            </p>
            {isParent && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary mx-auto mt-4 text-xs"
              >
                + Submit a New Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((r) => {
              const isExpanded = expandedId === r.id;

              return (
                <div
                  key={r.id}
                  className="card transition overflow-hidden border border-slate-200/80 dark:border-slate-800"
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="cursor-pointer p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getTypeIcon(r.request_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              #{r.tracking_no}
                            </span>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getTypeBadgeClass(
                                r.request_type
                              )}`}
                            >
                              {r.request_type}
                            </span>
                            {r.from_date && r.to_date && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                📅 {r.from_date} → {r.to_date}
                              </span>
                            )}
                            {r.meeting_preferred_date && (
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                🕒 {r.meeting_preferred_date} ({r.meeting_time_slot || "Slot"})
                              </span>
                            )}
                          </div>

                          <h3 className="mt-1.5 text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                            {r.subject}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Applied: <strong className="text-slate-700 dark:text-slate-300">{r.created_at}</strong></span>
                            {!isParent && (
                              <span>
                                Parent: <strong className="text-slate-700 dark:text-slate-300">{r.parent_name}</strong> (Student: {r.student_name})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-center sm:self-start">
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Box */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
                      {/* Details Box */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Application Details</p>
                        <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                          {r.details}
                        </p>
                      </div>

                      {/* Specific metadata chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Student Info</p>
                          <p className="mt-1 text-xs font-extrabold text-slate-800 dark:text-slate-200">{r.student_name}</p>
                          <p className="text-[11px] text-slate-500">{r.student_class || "CSE 3rd Year - Sec A"}</p>
                        </div>

                        {r.purpose && (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Stated Purpose</p>
                            <p className="mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">{r.purpose}</p>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Contact / Email</p>
                          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{r.parent_phone || "9052732998"}</p>
                          <p className="text-[11px] text-slate-400 truncate">{r.parent_email}</p>
                        </div>
                      </div>

                      {/* Principal Remarks & Action Card */}
                      <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-800 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Principal&apos;s Review &amp; Order
                            </p>
                            <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {r.principal_remarks || "Request is queued for administrative evaluation."}
                            </p>
                            {r.decided_at && (
                              <p className="mt-1 text-xs text-slate-400">
                                Reviewed on {r.decided_at} by {r.decided_by || "Principal Office"}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons for Parent (e.g. Download Bonafide or View Meeting Pass) */}
                          <div className="flex flex-wrap items-center gap-2">
                            {r.request_type === "Bonafide Certificate" && r.status === "Approved" && (
                              <button
                                onClick={() => setCertificateModal(r)}
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
                              >
                                <Award size={15} /> View & Print Bonafide Certificate
                              </button>
                            )}

                            {r.request_type === "PTM with Principal" && r.status === "Approved" && (
                              <button
                                onClick={() => setMeetingPassModal(r)}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                              >
                                <Users size={15} /> View Appointment Pass
                              </button>
                            )}

                            {/* Principal Review Action */}
                            {isPrincipal && (
                              <button
                                onClick={() => {
                                  setActionRequest(r);
                                  setDecisionData({
                                    status: r.status === "Pending" ? "Approved" : r.status,
                                    principal_remarks: r.principal_remarks || "",
                                    certificate_ready: true,
                                  });
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                              >
                                Review & Decide Request
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: New Request Form */}
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Submit New Parent Request"
        >
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <Field label="Select Request Type">
              <select
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value as any })}
                className="input font-bold"
                required
              >
                <option value="Leave Application">Leave Application for Child</option>
                <option value="Bonafide Certificate">Bonafide / Study Certificate</option>
                <option value="PTM with Principal">Parent-Teacher Meeting (PTM with Principal)</option>
                <option value="Fee Installment">Fee Concession / Installment Request</option>
                <option value="Bus Route Change">Transport / Bus Route Change</option>
                <option value="Duplicate Document">Duplicate ID / Hall Ticket Request</option>
                <option value="Other">Other Formal Application</option>
              </select>
            </Field>

            {/* Dynamic fields based on request type */}
            {formData.request_type === "Leave Application" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="From Date">
                  <input
                    type="date"
                    required
                    value={formData.from_date}
                    onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="To Date">
                  <input
                    type="date"
                    required
                    value={formData.to_date}
                    onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
            )}

            {formData.request_type === "PTM with Principal" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preferred Date">
                  <input
                    type="date"
                    required
                    value={formData.meeting_preferred_date}
                    onChange={(e) => setFormData({ ...formData, meeting_preferred_date: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Preferred Time Slot">
                  <select
                    value={formData.meeting_time_slot}
                    onChange={(e) => setFormData({ ...formData, meeting_time_slot: e.target.value })}
                    className="input"
                  >
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM (Morning)</option>
                    <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM (Afternoon)</option>
                    <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM (Evening)</option>
                  </select>
                </Field>
              </div>
            )}

            {formData.request_type === "Bonafide Certificate" && (
              <Field label="Purpose for Certificate">
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select Certificate Purpose</option>
                  <option value="State / National Merit Scholarship">State / National Merit Scholarship</option>
                  <option value="Passport / Visa Application">Passport / Visa Application</option>
                  <option value="Education Bank Loan">Education Bank Loan</option>
                  <option value="Bus / Railway Concession Pass">Bus / Railway Concession Pass</option>
                  <option value="Internship & Industry Verification">Internship & Industry Verification</option>
                  <option value="Other Official Purpose">Other Official Purpose</option>
                </select>
              </Field>
            )}

            <Field label="Subject / Purpose Summary">
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Leave for family function / Scholarship Certificate Request"
                className="input"
              />
            </Field>

            <Field label="Detailed Reason / Explanation">
              <textarea
                required
                rows={3}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Please provide complete details supporting your request..."
                className="input"
              />
            </Field>

            <Field label="Parent Contact Phone">
              <input
                type="text"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="9052732998"
                className="input"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center gap-1.5">
                <Send size={14} /> Submit Request
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Principal Action / Decision */}
        <Modal
          open={!!actionRequest}
          onClose={() => setActionRequest(null)}
          title={`Review Request • ${actionRequest?.tracking_no}`}
        >
          {actionRequest && (
            <form onSubmit={handlePrincipalDecision} className="space-y-4">
              <div className="rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
                <p className="font-bold text-slate-800 dark:text-white">
                  {actionRequest.request_type}: {actionRequest.subject}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{actionRequest.details}</p>
                <div className="mt-2 text-[11px] text-slate-400">
                  Student: {actionRequest.student_name} ({actionRequest.student_class}) • Parent: {actionRequest.parent_name}
                </div>
              </div>

              <Field label="Decision Status">
                <select
                  value={decisionData.status}
                  onChange={(e) => setDecisionData({ ...decisionData, status: e.target.value as any })}
                  className="input font-bold"
                  required
                >
                  <option value="Approved">Approve Request</option>
                  <option value="Processing">Mark as In Processing / Verification</option>
                  <option value="Rejected">Reject Request</option>
                </select>
              </Field>

              <Field label="Principal Remarks & Order (Sent to Parent)">
                <textarea
                  rows={3}
                  value={decisionData.principal_remarks}
                  onChange={(e) => setDecisionData({ ...decisionData, principal_remarks: e.target.value })}
                  placeholder="e.g., Approved. Meeting confirmed at 3:30 PM / Bonafide certificate granted."
                  className="input"
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActionRequest(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Decision
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: Digital Bonafide Certificate Viewer & Print */}
        <Modal
          open={!!certificateModal}
          onClose={() => setCertificateModal(null)}
          title="Official Bonafide Certificate"
        >
          {certificateModal && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-indigo-600/30 bg-gradient-to-b from-white to-indigo-50/30 p-6 sm:p-8 text-slate-900 shadow-lg relative overflow-hidden">
                {/* Header with College Seal */}
                <div className="text-center border-b-2 border-indigo-900/20 pb-4">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white font-black text-xl mb-2 shadow-md">
                    CF
                  </div>
                  <h2 className="text-lg font-black tracking-wider uppercase text-indigo-950">
                    CampusFlow Institute of Engineering & Technology
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Approved by AICTE • Affiliated to State Technological University • ISO 9001:2015
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 mt-1">OFFICE OF THE PRINCIPAL</p>
                </div>

                {/* Certificate Title */}
                <div className="text-center my-5">
                  <span className="inline-block border-b-2 border-slate-900 pb-1 font-serif text-lg font-bold uppercase tracking-widest text-slate-900">
                    Bonafide Certificate
                  </span>
                  <p className="mt-1 text-[11px] font-mono text-slate-500">Ref No: {certificateModal.tracking_no}/CERT/2026</p>
                </div>

                {/* Certificate Body */}
                <div className="space-y-3 font-serif text-sm leading-relaxed text-slate-800 text-justify">
                  <p>
                    This is to certify that <strong>{certificateModal.student_name}</strong>, daughter of{" "}
                    <strong>{certificateModal.parent_name}</strong>, is a bonafide student of this institution, currently enrolled in the{" "}
                    <strong>Computer Science and Engineering (CSE)</strong> department in <strong>3rd Year (Semester 5)</strong> for the academic year 2026–2027.
                  </p>
                  <p>
                    During her tenure with the college, her conduct and character have been found to be exemplary. This certificate is issued upon the parent&apos;s request for the purpose of{" "}
                    <strong className="underline underline-offset-2">{certificateModal.purpose || certificateModal.subject}</strong>.
                  </p>
                </div>

                {/* Seal & Signatures */}
                <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 items-end">
                  <div>
                    <div className="inline-block rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-center">
                      <p className="text-[9px] font-extrabold uppercase text-emerald-800">Digitally Verified Seal</p>
                      <p className="text-[8px] text-emerald-600">Date: {certificateModal.decided_at || certificateModal.created_at}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-serif italic font-extrabold text-indigo-900 text-base">Dr. Nagashree M.</p>
                    <p className="text-xs font-bold text-slate-800">Principal & Head of Institution</p>
                    <p className="text-[10px] text-slate-500">CampusFlow Institute of Technology</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCertificateModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: PTM Meeting Pass */}
        <Modal
          open={!!meetingPassModal}
          onClose={() => setMeetingPassModal(null)}
          title="Parent-Teacher Meeting Appointment Pass"
        >
          {meetingPassModal && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 text-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                  <div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                      Confirmed Appointment
                    </span>
                    <h3 className="mt-1 font-extrabold text-lg text-slate-900">Meeting with the Principal</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-600">#{meetingPassModal.tracking_no}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Date & Slot</p>
                    <p className="mt-1 font-extrabold text-sm text-slate-900">
                      {meetingPassModal.meeting_preferred_date || "Oct 04, 2026"}
                    </p>
                    <p className="text-indigo-600 font-bold">{meetingPassModal.meeting_time_slot || "03:30 PM - 04:00 PM"}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Venue / Room</p>
                    <p className="mt-1 font-extrabold text-sm text-slate-900">Principal&apos;s Executive Chamber</p>
                    <p className="text-slate-500">Administrative Block, Ground Floor</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white p-3 border border-indigo-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Discussion Agenda</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-700">{meetingPassModal.subject}</p>
                </div>

                <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-600 shrink-0" />
                  <span>Please present this digital pass at the Reception desk upon arrival.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMeetingPassModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Printer size={15} /> Print Pass
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
