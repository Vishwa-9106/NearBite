"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "../components/map-picker";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type MePayload = {
  user: {
    id: string;
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

export default function UserOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "";

  useEffect(() => {
    fetch(`${API_BASE_URL}/users/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session expired.");
        }
        return (await res.json()) as MePayload;
      })
      .then((payload) => {
        setName(payload.user.name ?? "");
        setEmail(payload.user.email ?? "");
        setAddress(payload.location?.address ?? "");
        setSelectedLat(payload.location?.lat ?? null);
        setSelectedLng(payload.location?.lng ?? null);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const handleMapSelect = useCallback((lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  }, []);

  async function resolveAddress(lat: number, lng: number) {
    const response = await fetch(
      `${API_BASE_URL}/maps/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      { credentials: "include" }
    );

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { address?: string };
    if (payload.address) {
      setAddress(payload.address);
    }
  }

  function detectCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation is unavailable in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLat(lat);
        setSelectedLng(lng);
        await resolveAddress(lat, lng);
      },
      (error) => {
        setStatus(error.message || "Unable to detect location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function completeOnboarding() {
    if (!name.trim()) {
      setStatus("Name is required.");
      return;
    }
    if (selectedLat === null || selectedLng === null) {
      setStatus("Please select your location.");
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const profileResponse = await fetch(`${API_BASE_URL}/users/me/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined
        })
      });
      if (!profileResponse.ok) {
        const payload = await profileResponse.json();
        throw new Error(payload?.message ?? "Failed to save profile.");
      }

      const locationResponse = await fetch(`${API_BASE_URL}/users/me/location`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: selectedLat,
          lng: selectedLng,
          address: address.trim() || undefined
        })
      });
      if (!locationResponse.ok) {
        const payload = await locationResponse.json();
        throw new Error(payload?.message ?? "Failed to save location.");
      }

      router.push("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to complete onboarding.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="space-y-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700/80">NearBite User</p>
            <h1 className="text-3xl font-semibold text-slate-950">Finish your profile</h1>
            <p className="text-sm text-slate-700">
              Set your name and your location so restaurant distance and ETA stay accurate.
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-teal-100 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-200 transition focus:ring"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-200 transition focus:ring"
                placeholder="Email (optional)"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-teal-100 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Your location</h2>
            <div className="mt-4 space-y-3">
              {mapsApiKey ? (
                <MapPicker
                  apiKey={mapsApiKey}
                  mapId={mapsMapId || undefined}
                  initialLat={selectedLat ?? undefined}
                  initialLng={selectedLng ?? undefined}
                  onSelect={handleMapSelect}
                />
              ) : (
                <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                  Missing maps API key in frontend env.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm text-slate-700"
                  onClick={detectCurrentLocation}
                >
                  Detect location
                </button>
                <button
                  className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm text-slate-700"
                  onClick={async () => {
                    if (selectedLat !== null && selectedLng !== null) {
                      await resolveAddress(selectedLat, selectedLng);
                    }
                  }}
                >
                  Fill address from map pin
                </button>
              </div>

              <textarea
                className="h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-200 transition focus:ring"
                placeholder="Address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
          </article>
        </div>

        <footer className="rounded-2xl border border-teal-100 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">Your profile must be completed once. You can edit it later.</p>
            <button
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
              disabled={isSaving}
              onClick={completeOnboarding}
            >
              {isSaving ? "Saving..." : "Continue to dashboard"}
            </button>
          </div>
          {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
        </footer>
      </section>
    </main>
  );
}
