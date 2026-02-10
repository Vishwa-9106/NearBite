"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { restaurantBasicDetailsSchema, restaurantLocationSchema } from "../../../lib/restaurant-schemas";

type Step = "PHONE" | "OTP" | "DETAILS" | "VERIFY";

type ApiErrorPayload = {
  error?: string;
};

const COUNTRY_CODE = "+91";
const MOBILE_DIGITS = 10;
const OTP_LENGTH = 6;
const TEST_OTP = "123456";

const STEP_NUMBER_BY_STEP: Record<Step, number> = {
  PHONE: 1,
  OTP: 2,
  DETAILS: 3,
  VERIFY: 4
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

export default function RestaurantLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [fssaiLicense, setFssaiLicense] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedPhone = `${COUNTRY_CODE}${phoneNumber}`;
  const currentStepNumber = STEP_NUMBER_BY_STEP[step];

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, MOBILE_DIGITS));
    setError("");
  };

  const updateOtpDigit = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, "").slice(0, 1);
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    setError("");

    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const resetToPhoneStep = () => {
    setStep("PHONE");
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
  };

  const startSession = async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "restaurant" })
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "Failed to start session."));
    }
  };

  const handleGetOtp = async () => {
    if (phoneNumber.length !== MOBILE_DIGITS) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setStep("OTP");
      setOtp(Array(OTP_LENGTH).fill(""));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (enteredOtp !== TEST_OTP) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const existsResponse = await fetch(`/api/restaurant/exists?phone=${encodeURIComponent(normalizedPhone)}`, {
        cache: "no-store"
      });

      if (!existsResponse.ok) {
        throw new Error(await getApiErrorMessage(existsResponse, "Failed to check restaurant."));
      }

      const existsData = (await existsResponse.json()) as { exists: boolean };
      if (existsData.exists) {
        await startSession();
        router.replace("/restaurant/dashboard");
        return;
      }

      setStep("DETAILS");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const moveToVerifyStep = () => {
    try {
      restaurantBasicDetailsSchema.parse({
        restaurantName,
        ownerName
      });

      setStep("VERIFY");
      setError("");
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        setError(validationError.issues[0]?.message ?? "Please enter required details.");
        return;
      }

      setError("Please enter required details.");
    }
  };

  const handleSubmitOnboarding = async () => {
    try {
      restaurantLocationSchema.parse({ googleMapsLink });
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        setError(validationError.issues[0]?.message ?? "Enter a valid Google Maps link.");
        return;
      }

      setError("Enter a valid Google Maps link.");
      return;
    }

    if (!fssaiLicense) {
      setError("FSSAI license file is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("phone", normalizedPhone);
      formData.set("restaurantName", restaurantName.trim());
      formData.set("ownerName", ownerName.trim());
      formData.set("googleMapsLink", googleMapsLink.trim());
      formData.set("fssaiLicense", fssaiLicense);

      const response = await fetch("/api/restaurant/create", {
        method: "POST",
        body: formData
      });

      if (response.status === 409) {
        await startSession();
        router.replace("/restaurant/dashboard");
        return;
      }

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create restaurant account."));
      }

      await startSession();
      router.replace("/restaurant/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete onboarding.");
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
          <h1 className="text-3xl font-extrabold text-[#3f2a1f]">Restaurant Partner</h1>
          <p className="mt-1 text-sm font-medium text-[#8d7a67]">Step {currentStepNumber} of 4 (Step 1 to Step 4)</p>
          {step === "PHONE" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">
              Enter restaurant owner mobile number to get OTP
            </p>
          )}
          {step === "OTP" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">
              Enter the OTP sent to {COUNTRY_CODE} {phoneNumber}
            </p>
          )}
          {step === "DETAILS" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">Add basic restaurant details</p>
          )}
          {step === "VERIFY" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">Upload FSSAI and business location</p>
          )}
        </header>

        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          {step === "PHONE" && (
            <>
              <div className="flex items-center gap-2">
                <div className="rounded-2xl border border-[#e4d8c7] bg-[#efe5d6] px-4 py-3 text-sm font-bold text-[#3f2a1f]">
                  {COUNTRY_CODE}
                </div>
                <label className="sr-only" htmlFor="phone">
                  Mobile number
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleGetOtp}
                disabled={loading}
                className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
              >
                {loading ? "Please wait..." : "Get OTP"}
              </button>
            </>
          )}

          {step === "OTP" && (
            <>
              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={`otp-${index}`}
                    ref={(element) => {
                      otpInputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event.key)}
                    className="h-12 w-10 rounded-xl border border-[#e4d8c7] bg-[#fffaf2] text-center text-lg font-bold text-[#3f2a1f] focus:outline-none"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={verifyOtp}
                disabled={loading}
                className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <p className="text-xs font-medium text-[#8d7a67]">Use OTP: {TEST_OTP}</p>

              <button
                type="button"
                onClick={resetToPhoneStep}
                className="text-sm font-semibold text-[#8f5a3c]"
              >
                Change number
              </button>
            </>
          )}

          {step === "DETAILS" && (
            <>
              <input
                type="text"
                placeholder="Hotel / Restaurant Name"
                value={restaurantName}
                onChange={(event) => {
                  setRestaurantName(event.target.value);
                  setError("");
                }}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Owner Name"
                value={ownerName}
                onChange={(event) => {
                  setOwnerName(event.target.value);
                  setError("");
                }}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
              />

              <button
                type="button"
                onClick={moveToVerifyStep}
                disabled={loading}
                className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
              >
                Next
              </button>
            </>
          )}

          {step === "VERIFY" && (
            <>
              <label className="block text-left text-sm font-semibold text-[#3f2a1f]" htmlFor="fssai-file">
                FSSAI License (PDF/Image)
              </label>
              <input
                id="fssai-file"
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => {
                  setFssaiLicense(event.target.files?.[0] ?? null);
                  setError("");
                }}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-sm font-medium text-[#3f2a1f] file:mr-3 file:rounded-lg file:border-0 file:bg-[#efe5d6] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#3f2a1f] focus:outline-none"
              />
              <input
                type="url"
                placeholder="Google Maps hotel location link"
                value={googleMapsLink}
                onChange={(event) => {
                  setGoogleMapsLink(event.target.value);
                  setError("");
                }}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={loading}
                className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
              >
                {loading ? "Please wait..." : "Verify & Submit"}
              </button>
            </>
          )}

          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        </form>

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
          <span className={`h-2.5 rounded-full ${step === "PHONE" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "OTP" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "DETAILS" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "VERIFY" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
        </div>
      </section>
    </main>
  );
}
