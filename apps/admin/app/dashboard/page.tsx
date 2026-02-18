"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type AdminMeResponse = {
  userId: string;
  role: "user" | "restaurant" | "admin";
};

type ApplicationStatus = "pending" | "approved" | "rejected";

type RestaurantApplication = {
  id: string;
  owner_name: string | null;
  name: string | null;
  phone: string;
  fssai_number: string | null;
  photo_url: string | null;
  status: ApplicationStatus;
  review_reason: string | null;
  application_submitted_at: string | null;
  application_reviewed_at: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<AdminMeResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("pending");
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include"
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session expired.");
        }
        return (await res.json()) as AdminMeResponse;
      })
      .then((payload) => {
        if (payload.role !== "admin") {
          throw new Error("Invalid session role.");
        }
        setMe(payload);
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Session error.");
        router.push("/login");
      });
  }, [router]);

  useEffect(() => {
    if (!me) {
      return;
    }

    const query = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/applications${query}`, {
      credentials: "include"
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.message ?? "Failed to load applications.");
        }
        return (await res.json()) as { applications: RestaurantApplication[] };
      })
      .then((payload) => {
        setApplications(payload.applications);
        setStatus(null);
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Failed to load applications.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filter, me]);

  const counts = useMemo(() => {
    return applications.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [applications]);

  async function refreshList() {
    const query = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
    const response = await fetch(`${API_BASE_URL}/admin/applications${query}`, {
      credentials: "include"
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message ?? "Failed to refresh applications.");
    }
    const payload = (await response.json()) as { applications: RestaurantApplication[] };
    setApplications(payload.applications);
  }

  async function approve(restaurantId: string) {
    setActionLoadingId(restaurantId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/applications/${restaurantId}/approve`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Failed to approve application.");
      }

      await refreshList();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reject(restaurantId: string) {
    setActionLoadingId(restaurantId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/applications/${restaurantId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectReasons[restaurantId]?.trim() || undefined })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Failed to reject application.");
      }

      await refreshList();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Rejection failed.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } finally {
      router.push("/login");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-slate-100 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-700/80">NearBite Admin</p>
            <h1 className="text-3xl font-semibold text-slate-950">Restaurant review dashboard</h1>
            <p className="text-sm text-slate-700">Approve or reject applications. Pending stores should be reviewed within 24 hours.</p>
          </div>
          <button
            className="rounded-xl border border-indigo-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-indigo-700/80">Signed in</p>
            <p className="mt-2 text-sm text-slate-800">{me?.userId ?? "--"}</p>
          </article>
          <article className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-indigo-700/80">Pending</p>
            <p className="mt-2 text-sm font-semibold text-amber-700">{counts.pending}</p>
          </article>
          <article className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-indigo-700/80">Approved</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">{counts.approved}</p>
          </article>
          <article className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-indigo-700/80">Rejected</p>
            <p className="mt-2 text-sm font-semibold text-rose-700">{counts.rejected}</p>
          </article>
        </div>

        <section className="rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["pending", "approved", "rejected", "all"] as const).map((value) => (
                <button
                  key={value}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    filter === value
                      ? "bg-indigo-600 text-white"
                      : "border border-indigo-100 bg-white text-slate-700"
                  }`}
                  onClick={() => setFilter(value)}
                >
                  {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="rounded-lg border border-indigo-100 bg-white px-3 py-1.5 text-xs text-slate-700"
              onClick={async () => {
                try {
                  setLoading(true);
                  await refreshList();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Refresh failed.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Refresh
            </button>
          </div>

          {status ? <p className="mt-3 text-sm text-rose-700">{status}</p> : null}

          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-slate-700">Loading applications...</p> : null}

            {!loading && applications.length === 0 ? (
              <p className="text-sm text-slate-700">No applications found for this filter.</p>
            ) : null}

            {applications.map((app) => (
              <article key={app.id} className="rounded-xl border border-indigo-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{app.name ?? "Unnamed restaurant"}</p>
                    <p className="text-xs text-slate-700">Owner: {app.owner_name ?? "--"}</p>
                    <p className="text-xs text-slate-700">Phone: {app.phone}</p>
                    <p className="text-xs text-slate-700">FSSAI: {app.fssai_number ?? "Not provided"}</p>
                    <p className="text-xs text-slate-700">Address: {app.address ?? "Not provided"}</p>
                    {app.photo_url ? (
                      <a
                        href={app.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-700 underline"
                      >
                        View document
                      </a>
                    ) : null}
                    {typeof app.lat === "number" && typeof app.lng === "number" ? (
                      <p className="text-xs text-slate-600">
                        Coordinates: {app.lat.toFixed(5)}, {app.lng.toFixed(5)}
                      </p>
                    ) : null}
                    {app.application_submitted_at ? (
                      <p className="text-xs text-slate-600">
                        Submitted: {new Date(app.application_submitted_at).toLocaleString()}
                      </p>
                    ) : null}
                    {app.application_reviewed_at ? (
                      <p className="text-xs text-slate-600">
                        Reviewed: {new Date(app.application_reviewed_at).toLocaleString()}
                      </p>
                    ) : null}
                    {app.review_reason ? (
                      <p className="text-xs text-rose-700">Reason: {app.review_reason}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      app.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : app.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {app.status === "pending" ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 transition focus:ring"
                      placeholder="Optional reason for rejection"
                      value={rejectReasons[app.id] ?? ""}
                      onChange={(event) =>
                        setRejectReasons((current) => ({
                          ...current,
                          [app.id]: event.target.value
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        disabled={actionLoadingId === app.id}
                        onClick={() => approve(app.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        disabled={actionLoadingId === app.id}
                        onClick={() => reject(app.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
