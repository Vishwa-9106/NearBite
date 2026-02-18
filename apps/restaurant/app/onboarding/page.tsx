"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "../components/map-picker";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const MAX_DOC_SIZE_BYTES = 5 * 1024 * 1024;

type RestaurantMePayload = {
  restaurant: {
    id: string;
    owner_name: string | null;
    name: string | null;
    phone: string;
    fssai_number: string | null;
    photo_url: string | null;
    status: "draft" | "pending" | "approved" | "rejected";
    review_reason: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
  isProfileComplete: boolean;
  isLocationSet: boolean;
};

export default function RestaurantOnboardingPage() {
  const router = useRouter();
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "";

  const [ownerName, setOwnerName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      ownerName.trim() &&
        hotelName.trim() &&
        (fssaiNumber.trim() || photoUrl.trim() || documentFile) &&
        selectedLat !== null &&
        selectedLng !== null &&
        !isSaving
    );
  }, [address, documentFile, fssaiNumber, hotelName, isSaving, ownerName, photoUrl, selectedLat, selectedLng]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/restaurants/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session expired.");
        }
        return (await res.json()) as RestaurantMePayload;
      })
      .then((payload) => {
        if (payload.restaurant.status === "pending") {
          router.replace("/application/status");
          return;
        }

        if (
          payload.restaurant.status === "approved" &&
          payload.isProfileComplete &&
          payload.isLocationSet
        ) {
          router.replace("/dashboard");
          return;
        }

        setOwnerName(payload.restaurant.owner_name ?? "");
        setHotelName(payload.restaurant.name ?? "");
        setFssaiNumber(payload.restaurant.fssai_number ?? "");
        setPhotoUrl(payload.restaurant.photo_url ?? "");
        setSelectedLat(payload.restaurant.lat ?? null);
        setSelectedLng(payload.restaurant.lng ?? null);
        setAddress(payload.restaurant.address ?? "");

        if (payload.restaurant.status === "rejected") {
          setStatus(
            payload.restaurant.review_reason
              ? `Previous application was rejected: ${payload.restaurant.review_reason}`
              : "Previous application was rejected. Update details and submit again."
          );
        }
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

  async function uploadDocumentAndGetUrl() {
    if (!documentFile) {
      return photoUrl.trim() || undefined;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", documentFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/restaurants/me/document`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const payload = (await uploadResponse.json().catch(() => null)) as
        | { message?: string; url?: string }
        | null;

      if (!uploadResponse.ok || !payload?.url) {
        throw new Error(payload?.message ?? "Failed to upload document.");
      }

      const uploadedUrl = payload.url;
      setPhotoUrl(uploadedUrl);
      return uploadedUrl;
    } finally {
      setIsUploadingDoc(false);
    }
  }

  async function saveAndSubmitApplication() {
    if (!canSubmit || selectedLat === null || selectedLng === null) {
      setStatus("Fill all required details before submitting.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const finalPhotoUrl = await uploadDocumentAndGetUrl();

      const profileResponse = await fetch(`${API_BASE_URL}/restaurants/me/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          hotelName: hotelName.trim(),
          fssaiNumber: fssaiNumber.trim() || undefined,
          photoUrl: finalPhotoUrl || undefined
        })
      });

      if (!profileResponse.ok) {
        const payload = await profileResponse.json();
        throw new Error(payload?.message ?? "Failed to save restaurant details.");
      }

      const locationResponse = await fetch(`${API_BASE_URL}/restaurants/me/location`, {
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
        throw new Error(payload?.message ?? "Failed to save restaurant location.");
      }

      const submitResponse = await fetch(`${API_BASE_URL}/restaurants/me/application/submit`, {
        method: "POST",
        credentials: "include"
      });

      if (!submitResponse.ok) {
        const payload = await submitResponse.json();
        throw new Error(payload?.message ?? "Failed to submit application.");
      }

      router.push("/application/status");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not submit application.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="space-y-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-700/80">NearBite Restaurant</p>
            <h1 className="text-3xl font-semibold text-slate-950">Restaurant onboarding</h1>
            <p className="max-w-2xl text-sm text-slate-700">
              Add owner details, restaurant location, and FSSAI or verification document. After submit,
              your application is reviewed within 24 hours.
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Business details</h2>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:ring"
                placeholder="Owner full name"
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:ring"
                placeholder="Restaurant / hotel name"
                value={hotelName}
                onChange={(event) => setHotelName(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:ring"
                placeholder="FSSAI number (optional if uploading doc)"
                value={fssaiNumber}
                onChange={(event) => setFssaiNumber(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:ring"
                placeholder="Document photo URL (optional)"
                value={photoUrl}
                onChange={(event) => setPhotoUrl(event.target.value)}
              />
              <label className="block rounded-xl border border-dashed border-orange-200 bg-orange-50/70 px-4 py-3 text-sm text-slate-700">
                <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-orange-700/80">
                  Upload document photo (jpg/png/pdf, max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-xs text-slate-600"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) {
                      setDocumentFile(null);
                      return;
                    }
                    if (file.size > MAX_DOC_SIZE_BYTES) {
                      setStatus("Document must be 5MB or smaller.");
                      event.currentTarget.value = "";
                      return;
                    }
                    setDocumentFile(file);
                    setStatus(null);
                  }}
                />
                {documentFile ? (
                  <p className="mt-2 text-xs text-slate-600">Selected: {documentFile.name}</p>
                ) : null}
              </label>
            </div>
          </article>

          <article className="rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Restaurant location</h2>
            <p className="mt-1 text-xs text-slate-600">
              Set this carefully. Customers use it for routing and pickup.
            </p>
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
                  Missing maps API key in frontend environment.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700"
                  onClick={detectCurrentLocation}
                >
                  Detect current location
                </button>
                <button
                  className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700"
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
                className="h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:ring"
                placeholder="Restaurant address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
          </article>
        </div>

        <footer className="rounded-2xl border border-orange-100 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              Submit now to start the 24-hour review. You can edit and resubmit if rejected.
            </p>
            <button
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSubmit || isUploadingDoc}
              onClick={saveAndSubmitApplication}
            >
              {isSaving ? "Submitting..." : isUploadingDoc ? "Uploading..." : "Submit application"}
            </button>
          </div>
          {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
        </footer>
      </section>
    </main>
  );
}
