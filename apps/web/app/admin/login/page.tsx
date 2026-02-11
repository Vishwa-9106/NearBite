"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApiErrorPayload = {
  error?: string;
};

async function getApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Ignore JSON parsing errors and return fallback.
  }

  return fallback;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", email: trimmedEmail, password })
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to sign in."));
      }

      router.push("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5efe5] px-6">
      <section className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-3xl bg-white p-2 shadow-sm">
            <img
              src="/assets/logo.jpg"
              alt="NearBite"
              className="h-28 w-28 rounded-2xl object-contain"
            />
          </div>
        </div>

        <header className="mb-5">
          <h1 className="text-3xl font-extrabold text-[#3f2a1f]">Admin Sign In</h1>
          <p className="mt-1 text-sm font-medium text-[#8d7a67]">
            Enter your admin email and password
          </p>
        </header>

        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        </form>
      </section>
    </main>
  );
}
