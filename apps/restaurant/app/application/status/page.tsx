"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type ApplicationPayload = {
  status: "draft" | "pending" | "approved" | "rejected";
  reason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

const statusText: Record<ApplicationPayload["status"], string> = {
  draft: "Draft details saved",
  pending: "Application under review",
  approved: "Application approved",
  rejected: "Application rejected"
};

export default function RestaurantApplicationStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<ApplicationPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/restaurants/me/application`, {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Session expired.");
        }

        const payload = (await response.json()) as ApplicationPayload;
        if (!isMounted) {
          return;
        }

        setData(payload);
        setMessage(null);

        if (payload.status === "approved") {
          router.replace("/dashboard");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setMessage(error instanceof Error ? error.message : "Unable to load application status.");
        router.replace("/login");
      }
    }

    loadStatus();
    const intervalId = setInterval(loadStatus, 20000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [router]);

  const helperMessage = useMemo(() => {
    if (!data) {
      return "Checking application status...";
    }

    if (data.status === "pending") {
      return "Your application review is in process and will be reviewed within 24 hours.";
    }

    if (data.status === "rejected") {
      return data.reason
        ? `Application declined: ${data.reason}`
        : "Application declined. Please update your details and resubmit.";
    }

    if (data.status === "approved") {
      return "Application approved. Redirecting to dashboard.";
    }

    return "Application draft is incomplete. Please finish onboarding and submit.";
  }, [data]);

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
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10">
        <article className="rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-700/80">NearBite Restaurant</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Application status</h1>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">Current status</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 capitalize">
              {data ? statusText[data.status] : "Loading"}
            </p>
            <p className="mt-2 text-sm text-slate-700">{helperMessage}</p>
            {data?.submittedAt ? (
              <p className="mt-2 text-xs text-slate-600">
                Submitted: {new Date(data.submittedAt).toLocaleString()}
              </p>
            ) : null}
            {data?.reviewedAt ? (
              <p className="mt-1 text-xs text-slate-600">
                Reviewed: {new Date(data.reviewedAt).toLocaleString()}
              </p>
            ) : null}
            {message ? <p className="mt-2 text-xs text-rose-700">{message}</p> : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {data?.status === "rejected" || data?.status === "draft" ? (
              <button
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => router.push("/onboarding")}
              >
                Update details and resubmit
              </button>
            ) : null}
            {data?.status === "approved" ? (
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </button>
            ) : null}
            <button
              className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
