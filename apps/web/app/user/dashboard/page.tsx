"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.replace("/user/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">User Dashboard</h1>
      <p className="mt-2 text-slate-600">Protected route for authenticated users.</p>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="mt-6 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {isLoading ? "Signing out..." : "Sign Out"}
      </button>
    </main>
  );
}
