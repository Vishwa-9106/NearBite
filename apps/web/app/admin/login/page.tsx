"use client";

import { FormEvent, useState } from "react";
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
    // Ignore JSON parse issues and use fallback message.
  }

  return fallback;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          email: email.trim(),
          password
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Incorrect password. Please try again.");
        }

        throw new Error(await getApiErrorMessage(response, "Failed to log in."));
      }

      router.replace("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to log in.");
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
          <h1 className="text-3xl font-extrabold text-[#3f2a1f]">Admin Login</h1>
          <p className="mt-1 text-sm font-medium text-[#8d7a67]">
            Sign in with admin credentials
          </p>
        </header>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            required
            className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
          />

          <label className="sr-only" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
              className="admin-password-input w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 pr-12 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f5a3c]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 102.8 2.8" />
                  <path d="M9.9 4.2A10.7 10.7 0 0112 4c5 0 8.8 3.2 10 8-0.4 1.7-1.2 3.1-2.2 4.3" />
                  <path d="M6.2 6.2C4.7 7.5 3.6 9.4 3 12c1.2 4.8 5 8 10 8 1.8 0 3.4-0.4 4.8-1.2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
