"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type UserPayload = {
  user: {
    phone: string;
    name: string | null;
    email: string | null;
  };
  location: {
    lat: number;
    lng: number;
    address: string | null;
  } | null;
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<UserPayload | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/users/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session expired.");
        }
        return (await res.json()) as UserPayload & { isProfileComplete: boolean };
      })
      .then((payload) => {
        if (!payload.isProfileComplete) {
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
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700/80">NearBite User</p>
            <h1 className="text-3xl font-semibold text-slate-950">
              Welcome{data?.user.name ? `, ${data.user.name}` : ""}
            </h1>
            <p className="text-sm text-slate-700">Dashboard foundation is ready for menu, cart, and live order tracking.</p>
          </div>
          <button
            className="rounded-xl border border-teal-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-teal-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-teal-700/80">Phone</p>
            <p className="mt-2 text-sm text-slate-800">{data?.user.phone ?? "--"}</p>
          </article>
          <article className="rounded-2xl border border-teal-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-teal-700/80">Email</p>
            <p className="mt-2 text-sm text-slate-800">{data?.user.email ?? "Not added"}</p>
          </article>
          <article className="rounded-2xl border border-teal-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-teal-700/80">Your location</p>
            <p className="mt-2 text-sm text-slate-800">{data?.location?.address ?? "Not set"}</p>
          </article>
        </div>

        <section className="rounded-2xl border border-teal-100 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Next modules queued</h2>
          <p className="mt-2 text-sm text-slate-700">
            Nearby restaurants by distance, category search, menu browsing, cart, checkout, and
            realtime order status will plug into this dashboard.
          </p>
        </section>
      </section>
    </main>
  );
}
