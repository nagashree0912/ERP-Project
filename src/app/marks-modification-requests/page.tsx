"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock3,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  Loader2,
  School,
  Search,
} from "lucide-react";
import { Shell } from "@/components/shell2";
import { Badge, statusTone } from "@/components/ui";
import { Modal, Field, Empty, ErrorBox } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { MarksModificationRequest } from "@/types";

type FilterType = "All" | "Pending" | "Approved" | "Rejected";

// Realistic sample requests for demonstration and development purposes
const SAMPLE_STORAGE_KEY = "campusflow_sample_marks_modifications_v1";

const INITIAL_SAMPLE_REQUESTS: MarksModificationRequest[] = [
  {
    id: "MMR-2026-001",
    student_id: "S1",
    student_name: "Dareddy.Nagashree",
    student_code: "CS24471A4611",
    class_name: "CSE - 3rd Year (Sec A)",
    subject: "Data Structures",
    exam: "Mid Semester",
    current_marks: 68,
    current_internal: 14,
    current_external: 54,
    requested_marks: 76,
    requested_internal: 18,
    requested_external: 58,
    teacher_name: "Dr. Priya Rao",
    teacher_email: "priya.rao@campusflow.edu",
    reason: "Totaling discrepancy in Section B (Question 4b). 8 marks were inadvertently omitted during score tabulation.",
    submission_date: "2026-10-15",
    status: "Pending",
    is_sample: true,
  },
  {
    id: "MMR-2026-002",
    student_id: "S2",
    student_name: "Ananya Sharma",
    student_code: "EC25582B104",
    class_name: "ECE - 2nd Year (Sec B)",
    subject: "Digital Signal Processing",
    exam: "Unit Test",
    current_marks: 44,
    current_internal: 10,
    current_external: 34,
    requested_marks: 58,
    requested_internal: 16,
    requested_external: 42,
    teacher_name: "Prof. Raj Kumar",
    teacher_email: "raj.kumar@campusflow.edu",
    reason: "Laboratory practical assignment marks and viva component were updated following verified hardware demo evaluation.",
    submission_date: "2026-10-14",
    status: "Pending",
    is_sample: true,
  },
  {
    id: "MMR-2026-003",
    student_id: "S3",
    student_name: "Rahul Verma",
    student_code: "ME24361A028",
    class_name: "ME - 3rd Year (Sec A)",
    subject: "Thermodynamics",
    exam: "Mid Semester",
    current_marks: 36,
    current_internal: 8,
    current_external: 28,
    requested_marks: 42,
    requested_internal: 12,
    requested_external: 30,
    teacher_name: "Dr. Vikram Malhotra",
    teacher_email: "vikram.malhotra@campusflow.edu",
    reason: "Re-evaluation of final numerical derivation in Question 2 verified against revised institutional grading rubric.",
    submission_date: "2026-10-16",
    status: "Pending",
    is_sample: true,
  },
  {
    id: "MMR-2026-004",
    student_id: "S4",
    student_name: "Arjun Kumar",
    student_code: "CS24471A4612",
    class_name: "CSE - 3rd Year (Sec A)",
    subject: "Database Management Systems",
    exam: "Unit Test",
    current_marks: 72,
    current_internal: 16,
    current_external: 56,
    requested_marks: 84,
    requested_internal: 19,
    requested_external: 65,
    teacher_name: "Dr. Priya Rao",
    teacher_email: "priya.rao@campusflow.edu",
    reason: "Bonus marks sanctioned for publishing a peer-reviewed research paper under department R&D sponsorship.",
    submission_date: "2026-10-10",
    status: "Approved",
    decided_at: "2026-10-11T14:30:00Z",
    decided_by: "Dr. Nagashree (Principal)",
    principal_remarks: "Approved in accordance with R&D student publication incentive guidelines.",
    is_sample: true,
  },
  {
    id: "MMR-2026-005",
    student_id: "S5",
    student_name: "Sneha Patel",
    student_code: "CE23211A019",
    class_name: "Civil - 4th Year (Sec A)",
    subject: "Structural Engineering",
    exam: "Final",
    current_marks: 55,
    current_internal: 15,
    current_external: 40,
    requested_marks: 75,
    requested_internal: 20,
    requested_external: 55,
    teacher_name: "Prof. Ramesh Gupta",
    teacher_email: "ramesh.gupta@campusflow.edu",
    reason: "Student submitted medical certificate requesting re-weightage of missed mid-semester continuous assessment.",
    submission_date: "2026-10-08",
    status: "Rejected",
    decided_at: "2026-10-09T11:15:00Z",
    decided_by: "Dr. Nagashree (Principal)",
    principal_remarks: "Re-weightage request submitted past the 14-day limit stipulated in Academic Regulations 2024.",
    is_sample: true,
  },
  {
    id: "MMR-2026-006",
    student_id: "S6",
    student_name: "Pooja Iyer",
    student_code: "EC25582B115",
    class_name: "ECE - 2nd Year (Sec B)",
    subject: "Microprocessors",
    exam: "Mid Semester",
    current_marks: 80,
    current_internal: 18,
    current_external: 62,
    requested_marks: 90,
    requested_internal: 20,
    requested_external: 70,
    teacher_name: "Dr. Ananya Sharma",
    teacher_email: "ananya.sharma@campusflow.edu",
    reason: "Correction of re-evaluated assembly code simulation assignment verified in system lab.",
    submission_date: "2026-10-05",
    status: "Approved",
    decided_at: "2026-10-06T16:00:00Z",
    decided_by: "Dr. Nagashree (Principal)",
    principal_remarks: "Verified with lab evaluator. Approved.",
    is_sample: true,
  },
];

export default function MarksModificationRequestsPage() {
  const store = useStore();
  const { user } = useAuth();

  const [filter, setFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");
  const [sampleRequests, setSampleRequests] = useState<MarksModificationRequest[]>(INITIAL_SAMPLE_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<MarksModificationRequest | null>(null);
  const [actionType, setActionType] = useState<"Approve" | "Reject" | null>(null);
  const [principalRemarks, setPrincipalRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPrincipal = user?.role === "principal";

  // Load sample records from localStorage if previously updated
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(SAMPLE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSampleRequests(parsed);
        }
      }
    } catch (_) {
      // fallback to initial
    }
  }, []);

  // Save sample records on modification
  const saveSampleRequests = (updated: MarksModificationRequest[]) => {
    setSampleRequests(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SAMPLE_STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
    }
  };

  // Combine sample requests with any real requests from database
  const allRequests: MarksModificationRequest[] = useMemo(() => {
    const realRequests = (store.marks_modification_requests || []) as MarksModificationRequest[];
    // Real requests come first, followed by development sample requests
    return [...realRequests, ...sampleRequests];
  }, [store.marks_modification_requests, sampleRequests]);

  const counts = useMemo(() => {
    return {
      all: allRequests.length,
      pending: allRequests.filter((r) => r.status === "Pending").length,
      approved: allRequests.filter((r) => r.status === "Approved").length,
      rejected: allRequests.filter((r) => r.status === "Rejected").length,
    };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (filter !== "All" && r.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = String(r.student_name || "").toLowerCase().includes(q);
        const matchesId =
          String(r.student_id || "").toLowerCase().includes(q) ||
          String(r.student_code || "").toLowerCase().includes(q);
        const matchesSubject = String(r.subject || "").toLowerCase().includes(q);
        const matchesTeacher = String(r.teacher_name || "").toLowerCase().includes(q);
        const matchesClass = String(r.class_name || "").toLowerCase().includes(q);
        const matchesReason = String(r.reason || "").toLowerCase().includes(q);
        return matchesName || matchesId || matchesSubject || matchesTeacher || matchesClass || matchesReason;
      }
      return true;
    });
  }, [allRequests, filter, search]);

  const handleOpenActionConfirm = (request: MarksModificationRequest, action: "Approve" | "Reject") => {
    setErrorMessage(null);
    if (!isPrincipal) {
      setErrorMessage("Unauthorized: Only an authorized Principal can approve or reject requests.");
      store.toast("Unauthorized: Only an authorized Principal can approve or reject requests.");
      return;
    }
    setSelectedRequest(request);
    setActionType(action);
    setPrincipalRemarks(
      action === "Approve" ? "Approved after administrative verification." : "Rejected after review."
    );
  };

  const handleCloseConfirm = () => {
    setSelectedRequest(null);
    setActionType(null);
    setPrincipalRemarks("");
    setErrorMessage(null);
  };

  const handleProcessAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (!isPrincipal) {
      setErrorMessage("Access denied. Only the Principal has authorization to modify marks.");
      store.toast("Access denied: Principal authorization required.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      const decider = user?.full_name || user?.email || "Dr. Nagashree (Principal)";

      if (selectedRequest.is_sample) {
        // Handle Sample Demo Record (does NOT overwrite or corrupt genuine student database)
        const updatedSamples = sampleRequests.map((item) => {
          if (item.id === selectedRequest.id) {
            return {
              ...item,
              status: actionType === "Approve" ? ("Approved" as const) : ("Rejected" as const),
              decided_at: now,
              decided_by: decider,
              principal_remarks: principalRemarks.trim(),
            };
          }
          return item;
        });

        saveSampleRequests(updatedSamples);

        if (actionType === "Approve") {
          store.toast(
            `Request ${selectedRequest.id} approved. Status updated for ${selectedRequest.student_name}.`
          );
        } else {
          store.toast(
            `Request ${selectedRequest.id} rejected. Student marks remain unchanged.`
          );
        }
      } else {
        // Handle Real Database Request
        if (actionType === "Approve") {
          store.update("marks_modification_requests", selectedRequest.id, {
            status: "Approved",
            decided_at: now,
            decided_by: decider,
            principal_remarks: principalRemarks.trim(),
          });

          // Business rules for student marks
          const requestedTotal = Number(selectedRequest.requested_marks);
          const internal = Number(selectedRequest.requested_internal ?? 0);
          const external = Number(selectedRequest.requested_external ?? (requestedTotal - internal));
          const total = internal + external;
          const grade =
            total >= 90 ? "A+" : total >= 80 ? "A" : total >= 70 ? "B+" : total >= 60 ? "B" : total >= 50 ? "C" : "F";
          const status = total >= 40 ? "Pass" : "Fail";

          const existingMark = (store.marks || []).find(
            (m: any) =>
              String(m.student_id) === String(selectedRequest.student_id) &&
              String(m.subject).toLowerCase() === String(selectedRequest.subject).toLowerCase() &&
              (!selectedRequest.exam || String(m.exam).toLowerCase() === String(selectedRequest.exam).toLowerCase())
          );

          if (existingMark) {
            store.update("marks", existingMark.id, {
              internal,
              external,
              total,
              grade,
              status,
            });
          }

          store.toast(
            `Request approved successfully. Marks for ${selectedRequest.student_name} have been updated.`
          );
        } else {
          // Reject action - do NOT modify student's marks
          store.update("marks_modification_requests", selectedRequest.id, {
            status: "Rejected",
            decided_at: now,
            decided_by: decider,
            principal_remarks: principalRemarks.trim(),
          });

          store.toast(
            `Request rejected. Student marks for ${selectedRequest.student_name} remain unchanged.`
          );
        }
      }

      handleCloseConfirm();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to process marks modification request.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Restrict access to Principal only
  if (!isPrincipal) {
    return (
      <Shell>
        <div className="card mx-auto max-w-xl p-8 text-center mt-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-500">
            The Marks Modification Requests module is exclusively accessible to the Head of Institution (Principal).
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>Principal Portal</span>
              <span>•</span>
              <span>Academic Integrity</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Marks Moderation</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <FileSpreadsheet size={22} />
              </span>
              Marks Modification Requests
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review and act on mark adjustment requests submitted by teaching faculty. Evaluate justifications and approve or reject requested score changes.
            </p>
          </div>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="animate-fadeUp">
            <ErrorBox msg={errorMessage} />
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requests</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <FileSpreadsheet size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{counts.all}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Faculty submissions</p>
          </div>

          <div className="card p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Clock3 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-300">{counts.pending}</p>
            <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400/80">Awaiting Principal action</p>
          </div>

          <div className="card p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{counts.approved}</p>
            <p className="mt-0.5 text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Marks updated in records</p>
          </div>

          <div className="card p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Rejected</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                <XCircle size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-rose-700 dark:text-rose-300">{counts.rejected}</p>
            <p className="mt-0.5 text-[11px] text-rose-600/80 dark:text-rose-400/80">Marks kept unchanged</p>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(["All", "Pending", "Approved", "Rejected"] as FilterType[]).map((tab) => {
              const active = filter === tab;
              const count =
                tab === "All"
                  ? counts.all
                  : tab === "Pending"
                  ? counts.pending
                  : tab === "Approved"
                  ? counts.approved
                  : counts.rejected;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-72 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, ID, subject, teacher…"
              className="input pl-9 text-xs w-full"
            />
          </div>
        </div>

        {/* List of Requests or Empty State */}
        {filteredRequests.length === 0 ? (
          <Empty
            title={counts.all === 0 ? "No Marks Modification Requests" : "No Matching Requests"}
            sub={
              counts.all === 0
                ? "There are currently no marks modification requests submitted by teachers in the database."
                : "No modification requests match your selected filter or search keyword."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRequests.map((req) => {
              const isPending = req.status === "Pending";
              const isApproved = req.status === "Approved";
              const isRejected = req.status === "Rejected";
              const diff = Number(req.requested_marks) - Number(req.current_marks);

              return (
                <article
                  key={req.id}
                  className={`card p-5 sm:p-6 transition border ${
                    isPending
                      ? "border-amber-200/80 dark:border-amber-900/40 shadow-sm"
                      : isApproved
                      ? "border-emerald-200/60 dark:border-emerald-900/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Top Bar: Request ID + Subject + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {req.id}
                        </span>
                        {req.is_sample && (
                          <span className="rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-semibold">
                            Sample Record
                          </span>
                        )}
                        {req.exam && (
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {req.exam}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {req.subject}
                        </span>
                      </div>

                      <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        {req.student_name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Student ID: <strong className="text-slate-700 dark:text-slate-300">{req.student_id}</strong>
                          {req.student_code && req.student_code !== req.student_id && ` (${req.student_code})`}
                        </span>
                        {req.class_name && (
                          <span className="flex items-center gap-1">
                            <School size={12} className="text-slate-400" />
                            {req.class_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge tone={statusTone(req.status)}>{req.status}</Badge>
                  </div>

                  {/* Marks Comparison Card */}
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Marks</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-700 dark:text-slate-300">
                        {req.current_marks} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Int: {req.current_internal ?? "—"} · Ext: {req.current_external ?? "—"}
                      </p>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Requested Marks
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                          {req.requested_marks} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </p>
                        <span
                          className={`text-xs font-bold ${
                            diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-slate-500"
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Int: {req.requested_internal ?? "—"} · Ext: {req.requested_external ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Reason & Submitter Details */}
                  <div className="mt-3.5 space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Teacher Justification:
                      </span>
                      <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        <User size={13} className="text-slate-400" />
                        Teacher: <strong className="text-slate-800 dark:text-slate-200">{req.teacher_name}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        Submitted: {req.submission_date}
                      </span>
                    </div>

                    {/* Decision Log if decided */}
                    {req.decided_at && (
                      <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2.5 text-[11px] text-slate-500 border border-slate-100 dark:border-slate-800">
                        <p>
                          <strong>Decision:</strong> {req.status} on {req.decided_at.slice(0, 10)} by{" "}
                          {req.decided_by || "Principal"}
                        </p>
                        {req.principal_remarks && (
                          <p className="mt-0.5 italic text-slate-600 dark:text-slate-400">
                            &ldquo;{req.principal_remarks}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Approve / Reject Actions (Only for Principal on Pending requests) */}
                  {isPending && isPrincipal && (
                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenActionConfirm(req, "Approve")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition"
                      >
                        <Check size={14} /> Approve Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenActionConfirm(req, "Reject")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 transition"
                      >
                        <X size={14} /> Reject Request
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal for Approve / Reject */}
        <Modal
          open={!!selectedRequest && !!actionType}
          onClose={handleCloseConfirm}
          title={actionType === "Approve" ? "Confirm Marks Modification Approval" : "Confirm Request Rejection"}
        >
          {selectedRequest && actionType && (
            <div className="space-y-4">
              <div
                className={`rounded-2xl p-4 border ${
                  actionType === "Approve"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {actionType === "Approve" ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                  <span>
                    {actionType === "Approve"
                      ? "Approve and Update Student Marks"
                      : "Reject Modification Request"}
                  </span>
                </div>
                <p className="mt-1 text-xs opacity-90 leading-relaxed">
                  {actionType === "Approve"
                    ? `Are you sure you want to approve request ${selectedRequest.id} for ${selectedRequest.student_name}? This action will approve the modification in ${selectedRequest.subject} from ${selectedRequest.current_marks} to ${selectedRequest.requested_marks}.`
                    : `Are you sure you want to reject request ${selectedRequest.id} for ${selectedRequest.student_name}? The student's recorded marks in ${selectedRequest.subject} will NOT be modified and will remain at ${selectedRequest.current_marks}.`}
                </p>
              </div>

              {/* Summary table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Request ID:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.id}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Student:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.student_name} ({selectedRequest.student_id})
                  </span>
                </div>
                {selectedRequest.class_name && (
                  <div className="flex justify-between text-slate-500">
                    <span>Class / Section:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedRequest.class_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Subject:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.subject} ({selectedRequest.exam})
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Current Marks:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedRequest.current_marks} / 100 (Int: {selectedRequest.current_internal ?? "—"}, Ext: {selectedRequest.current_external ?? "—"})
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Requested Marks:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedRequest.requested_marks} / 100 (Int: {selectedRequest.requested_internal ?? "—"}, Ext: {selectedRequest.requested_external ?? "—"})
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Submitted By:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedRequest.teacher_name} on {selectedRequest.submission_date}
                  </span>
                </div>
              </div>

              <Field label="Principal Remarks & Order">
                <textarea
                  rows={2}
                  className="input text-xs"
                  value={principalRemarks}
                  onChange={(e) => setPrincipalRemarks(e.target.value)}
                  placeholder="Enter administrative remarks for the official record..."
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={handleCloseConfirm}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessAction}
                  disabled={isProcessing}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                    actionType === "Approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm {actionType}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
