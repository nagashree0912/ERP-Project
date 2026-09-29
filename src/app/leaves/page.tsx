"use client";

import React from "react";
import { ShieldCheck, XCircle, Clock3, FileText } from "lucide-react";
import { Shell } from "@/components/shell2";
import { Badge, statusTone } from "@/components/ui";
import { Empty, Modal, Field } from "@/components/ui2";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

type Filter = "All" | "Pending" | "Approved" | "Rejected";

function TeacherLeavesPage() {
  const store = useStore();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  const myRequests = React.useMemo(() => {
    if (!user) return [];
    const name = String(user.full_name || "").trim().toLowerCase();
    const email = String(user.email || "").trim().toLowerCase();

    return (store.leaves || []).filter((item: any) => {
      if (String(item.role || "").toLowerCase() !== "teacher") return false;
      const applicant = String(item.applicant || "").trim().toLowerCase();
      const applicantEmail = String(item.applicant_email || "").trim().toLowerCase();
      return applicant === name || applicant === email || applicantEmail === email;
    });
  }, [store.leaves, user]);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const form = new FormData(e.currentTarget);
    const fromDate = String(form.get("from_date") || "");
    const toDate = String(form.get("to_date") || "");
    const reason = String(form.get("reason") || "");

    store.add("leaves", {
      id: `L${Date.now()}`,
      applicant: user.full_name || user.email || "Teacher",
      applicant_email: user.email || "",
      role: "Teacher",
      from_date: fromDate,
      to_date: toDate,
      reason,
      status: "Pending",
      date: new Date().toISOString().slice(0, 10),
    });

    setOpen(false);
    e.currentTarget.reset();
  };

  return (
    <Shell>
      <div className="space-y-5 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold text-slate-400">
              Teacher Portal <span className="mx-1">•</span> Leave Requests
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Leave Requests
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Apply for leave and track your approval status
            </p>
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Apply Leave
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600">
              <Clock3 size={25} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold">No leave requests yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a leave request to the Principal for approval.
            </p>
            <button className="btn-primary mt-5" onClick={() => setOpen(true)}>
              + Apply Leave
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myRequests.map((item: any) => (
              <div key={item.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-extrabold">{item.applicant}</p>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">Applied {item.date}</p>
                <p className="mt-3 text-sm font-semibold">
                  {item.from_date} → {item.to_date}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Reason: {item.reason}
                </p>
                {item.status === "Pending" && (
                  <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Waiting for Principal approval
                  </p>
                )}
                {item.status === "Approved" && (
                  <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Leave approved by Principal
                  </p>
                )}
                {item.status === "Rejected" && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    Leave rejected by Principal
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title="Apply Leave">
          <form onSubmit={save} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <input name="from_date" type="date" required className="input" />
              </Field>
              <Field label="To">
                <input name="to_date" type="date" required className="input" />
              </Field>
            </div>
            <Field label="Reason">
              <textarea
                name="reason"
                required
                className="input"
                rows={3}
                placeholder="Enter the reason for leave"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Send to Principal</button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}

function PrincipalLeaveRequestsPage() {
  const store = useStore();
  const { user } = useAuth();
  const [filter, setFilter] = React.useState<Filter>("All");

  const requests = React.useMemo(
    () =>
      (store.leaves || []).filter(
        (request: any) => String(request.role || "").toLowerCase() === "teacher"
      ),
    [store.leaves]
  );

  const pending = requests.filter((request: any) => request.status === "Pending").length;
  const approved = requests.filter((request: any) => request.status === "Approved").length;
  const rejected = requests.filter((request: any) => request.status === "Rejected").length;

  const filteredRequests = requests.filter((request: any) =>
    filter === "All" ? true : request.status === filter
  );

  const decide = (id: string, status: "Approved" | "Rejected") => {
    if (user?.role !== "principal") return;
    store.update("leaves", id, {
      status,
      decided_at: new Date().toISOString(),
      decided_by: user.full_name || user.email || "Principal",
    });
  };

  return (
    <Shell>
      <div className="space-y-5 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold text-slate-400">
              Principal Portal <span className="mx-1">•</span> Review <span className="mx-1">•</span> Approve <span className="mx-1">•</span> Manage
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Leave Requests
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review teacher leave requests and approve or reject them
            </p>
          </div>
          <div className="hidden rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 sm:block">
            Principal approval required
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          {(["All", "Pending", "Approved", "Rejected"] as Filter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === item
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Clock3 size={15} /> Pending
            </div>
            <p className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-300">{pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <ShieldCheck size={15} /> Approved
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">{approved}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5 dark:border-rose-900/30 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              <XCircle size={15} /> Rejected
            </div>
            <p className="mt-2 text-3xl font-extrabold text-rose-700 dark:text-rose-300">{rejected}</p>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="card p-10">
            <Empty title="No leave requests" sub="New teacher leave requests will appear here." />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredRequests.map((request: any) => {
              const isPending = request.status === "Pending";
              return (
                <article key={request.id} className="card p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {request.applicant}
                        </h2>
                        <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Teacher · Applied {request.date}
                      </p>
                    </div>
                    <FileText size={20} className="text-slate-300" />
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Leave period
                    </p>
                    <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                      {request.from_date} → {request.to_date}
                    </p>
                  </div>

                  <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Reason:</span> {request.reason}
                  </p>

                  {request.decided_at && (
                    <p className="mt-3 text-xs text-slate-400">
                      Decided on {String(request.decided_at).replace("T", " ").slice(0, 16)}
                    </p>
                  )}

                  {isPending && user?.role === "principal" && (
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => decide(request.id, "Approved")}
                        className="btn-primary flex-1 !py-2 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(request.id, "Rejected")}
                        className="btn-secondary flex-1 !py-2 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}

export default function LeavesPage() {
  const { user } = useAuth();

  // Only teachers and principals have access to Leave Requests.
  // Students and parents are redirected by Shell because the route is not in their navigation.
  if (user?.role === "principal") return <PrincipalLeaveRequestsPage />;
  if (user?.role === "teacher") return <TeacherLeavesPage />;
  return null;
}
