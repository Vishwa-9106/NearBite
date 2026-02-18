"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.trim().length > 0 && !isLoading,
    [email, password, isLoading]
  );

  async function handleLogin() {
    setStatus(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.message ?? "Admin login failed.");
      }

      await response.json();
      router.push("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Admin login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-slate-100 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-700/80">NearBite Admin</p>
          <h1 className="text-3xl font-semibold text-slate-950">Secure admin login</h1>
          <p className="text-sm text-slate-700">Review restaurant applications and publish decisions.</p>
        </header>

        <div className="space-y-4 rounded-2xl border border-indigo-100 bg-white/90 p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-indigo-700/80">Email</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-200 transition focus:ring"
              placeholder="Enter Your Admin Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-indigo-700/80">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-200 transition focus:ring"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!canSubmit}
            onClick={handleLogin}
          >
            Sign in
          </button>
          {status ? <p className="text-xs text-slate-700">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}
