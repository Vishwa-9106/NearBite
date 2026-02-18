"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type RestaurantPayload = {
  restaurant: {
    phone: string;
    owner_name: string | null;
    name: string | null;
    status: "draft" | "pending" | "approved" | "rejected";
    address: string | null;
    fssai_number: string | null;
    photo_url: string | null;
  };
  isProfileComplete: boolean;
  isLocationSet: boolean;
};

export default function RestaurantDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<RestaurantPayload | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/restaurants/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session expired.");
        }
        return (await res.json()) as RestaurantPayload;
      })
      .then((payload) => {
        if (payload.restaurant.status === "pending" || payload.restaurant.status === "rejected") {
          router.replace("/application/status");
          return;
        }

        if (
          payload.restaurant.status !== "approved" ||
          !payload.isProfileComplete ||
          !payload.isLocationSet
        ) {
          router.replace("/onboarding");
          return;
        }

        setData(payload);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

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
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-700/80">NearBite Restaurant</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {data?.restaurant.name ?? "Restaurant dashboard"}
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              Approved and live. Order, menu, and realtime board modules connect here next.
            </p>
          </div>
          <button
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">Status</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">Approved</p>
          </article>
          <article className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">Owner</p>
            <p className="mt-2 text-sm text-slate-800">{data?.restaurant.owner_name ?? "--"}</p>
          </article>
          <article className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">Phone</p>
            <p className="mt-2 text-sm text-slate-800">{data?.restaurant.phone ?? "--"}</p>
          </article>
          <article className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">FSSAI</p>
            <p className="mt-2 text-sm text-slate-800">{data?.restaurant.fssai_number ?? "Document uploaded"}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Store profile summary</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">Address</p>
              <p className="mt-2 text-sm text-slate-700">{data?.restaurant.address ?? "Not available"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-orange-700/80">Verification photo</p>
              {data?.restaurant.photo_url ? (
                <a
                  href={data.restaurant.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-orange-700 underline"
                >
                  View uploaded document
                </a>
              ) : (
                <p className="mt-2 text-sm text-slate-700">No document URL saved.</p>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
