"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "PHONE" | "OTP" | "PROFILE";
const OTP_LENGTH = 6;
const TEST_OTP = "123456";
const COUNTRY_CODE = "+91";
const MOBILE_DIGITS = 10;

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

export default function UserLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const normalizedPhone = `${COUNTRY_CODE}${phoneNumber}`;

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, MOBILE_DIGITS));
    setError("");
  };

  const resetToPhoneStep = () => {
    setStep("PHONE");
    setOtp(Array(OTP_LENGTH).fill(""));
    setName("");
    setEmail("");
    setError("");
  };

  const moveToOtpStep = () => {
    setStep("OTP");
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  const handleGetOtp = async () => {
    if (phoneNumber.length !== MOBILE_DIGITS) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      moveToOtpStep();
    } finally {
      setLoading(false);
    }
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

  const startSession = async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "Failed to start session."));
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
      const existsResponse = await fetch(`/api/user/exists?phone=${encodeURIComponent(normalizedPhone)}`, {
        cache: "no-store"
      });

      if (!existsResponse.ok) {
        throw new Error(await getApiErrorMessage(existsResponse, "Failed to check user."));
      }

      const existsData = (await existsResponse.json()) as { exists: boolean };
      if (existsData.exists) {
        await startSession();
        router.push("/user/dashboard");
        return;
      }

      setStep("PROFILE");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const createUserAndContinue = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    const trimmedEmail = email.trim();

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: trimmedName,
          email: trimmedEmail || undefined
        })
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create user."));
      }

      await startSession();
      router.push("/user/dashboard");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to continue.");
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
          <h1 className="text-3xl font-extrabold text-[#3f2a1f]">Welcome to NearBite</h1>
          {step === "PHONE" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">
              Enter your mobile number to continue
            </p>
          )}
          {step === "OTP" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">
              Enter the OTP sent to {COUNTRY_CODE} {phoneNumber}
            </p>
          )}
          {step === "PROFILE" && (
            <p className="mt-1 text-sm font-medium text-[#8d7a67]">
              Complete your profile to continue
            </p>
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

          {step === "PROFILE" && (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
              />

              <button
                type="button"
                onClick={createUserAndContinue}
                disabled={loading}
                className="w-full rounded-2xl bg-[#8f5a3c] py-4 text-base font-extrabold text-[#fffaf2] disabled:opacity-70"
              >
                {loading ? "Please wait..." : "Continue"}
              </button>
            </>
          )}

          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        </form>

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
          <span className={`h-2.5 rounded-full ${step === "PHONE" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "OTP" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "PROFILE" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
        </div>
      </section>
    </main>
  );
}
