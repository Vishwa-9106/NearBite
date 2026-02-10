"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { getFirebaseAuth } from "../../../lib/firebase-auth";

type Step = "PHONE" | "OTP" | "PROFILE";
const OTP_LENGTH = 6;
const TEST_OTP = "123456";
const FIREBASE_PHONE_AUTH_ENABLED = process.env.NEXT_PUBLIC_FIREBASE_PHONE_AUTH_ENABLED === "true";

export default function UserLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("PHONE");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const resetToPhoneStep = () => {
    setStep("PHONE");
    setOtpSent(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setUsername("");
    setEmail("");
    setError("");
  };

  const ensureRecaptcha = () => {
    if (typeof window === "undefined") {
      throw new Error("Unsupported environment");
    }

    if (recaptchaRef.current) {
      return recaptchaRef.current;
    }

    const auth = getFirebaseAuth();
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible"
    });
    return recaptchaRef.current;
  };

  const moveToOtpStep = () => {
    setOtpSent(true);
    setStep("OTP");
  };

  const handleGetOtp = async () => {
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (!FIREBASE_PHONE_AUTH_ENABLED) {
        moveToOtpStep();
        return;
      }

      const auth = getFirebaseAuth();
      const verifier = ensureRecaptcha();
      confirmationResultRef.current = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, verifier);
      moveToOtpStep();
    } catch (sendError) {
      const errorCode =
        typeof sendError === "object" && sendError && "code" in sendError
          ? String((sendError as { code?: unknown }).code)
          : "";

      if (errorCode === "auth/billing-not-enabled") {
        moveToOtpStep();
        return;
      }

      setError(sendError instanceof Error ? sendError.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const updateOtpDigit = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, "").slice(0, 1);
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
      const phone = `+91${phoneNumber}`;
      const existsResponse = await fetch(`/api/user/exists?phone=${encodeURIComponent(phone)}`);
      if (!existsResponse.ok) {
        throw new Error("Failed to check user.");
      }

      const existsData = (await existsResponse.json()) as { exists: boolean };
      if (existsData.exists) {
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
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${phoneNumber}`,
          username: username.trim(),
          email: email.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create user.");
      }

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
              We sent a code to +91 {phoneNumber}
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
                  +91
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
                {loading ? "Sending..." : "Get OTP"}
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
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-[#e4d8c7] bg-[#fffaf2] px-4 py-3 text-base font-medium text-[#3f2a1f] placeholder:text-[#b8a998] focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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

        <div id="recaptcha-container" />

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
          <span className={`h-2.5 rounded-full ${step === "PHONE" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "OTP" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
          <span className={`h-2.5 rounded-full ${step === "PROFILE" ? "w-6 bg-[#8f5a3c]" : "w-2.5 bg-[#d9cbb8]"}`} />
        </div>
      </section>
    </main>
  );
}
