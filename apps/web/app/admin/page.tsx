"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const summaryCards = [
  { label: "Total Users", value: "1,248" },
  { label: "Restaurants", value: "312" },
  { label: "Pending Reviews", value: "18" }
];

const recentActivity = [
  "New restaurant onboarded: Spice Route",
  "User report resolved for order #NB-9182",
  "Admin credentials updated successfully"
];

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.replace("/admin/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5efe5] px-6 py-8">
      <section className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-[#e4d8c7] bg-[#fffaf2] p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-2 shadow-sm">
              <img src="/assets/logo.jpg" alt="NearBite" className="h-14 w-14 rounded-xl object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#3f2a1f]">Admin Dashboard</h1>
              <p className="text-sm font-medium text-[#8d7a67]">Overview of NearBite operations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="rounded-2xl bg-[#8f5a3c] px-5 py-3 text-sm font-extrabold text-[#fffaf2] disabled:opacity-70"
          >
            {isLoading ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#8d7a67]">{card.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-[#3f2a1f]">{card.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] p-4 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-[#3f2a1f]">Recent Activity</h2>
            <ul className="mt-3 space-y-2">
              {recentActivity.map((activity) => (
                <li key={activity} className="rounded-xl bg-[#f5efe5] px-3 py-2 text-sm font-medium text-[#5b4538]">
                  {activity}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] p-4 shadow-sm">
            <h2 className="text-lg font-bold text-[#3f2a1f]">Quick Actions</h2>
            <div className="mt-3 space-y-2">
              <button type="button" className="w-full rounded-xl bg-[#8f5a3c] px-3 py-2 text-sm font-bold text-[#fffaf2]">
                Approve Restaurants
              </button>
              <button type="button" className="w-full rounded-xl bg-[#8f5a3c] px-3 py-2 text-sm font-bold text-[#fffaf2]">
                View Reports
              </button>
              <button type="button" className="w-full rounded-xl bg-[#8f5a3c] px-3 py-2 text-sm font-bold text-[#fffaf2]">
                Manage Users
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
