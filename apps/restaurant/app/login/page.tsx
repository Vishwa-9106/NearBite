"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signOut,
  signInWithCredential,
  signInWithPhoneNumber
} from "firebase/auth";
import { getFirebaseAuth } from "../../lib/firebase-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_LENGTH = 6;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_BACKOFF_SECONDS = 120;

type SessionResponsePayload = {
  message?: string;
  nextStep?: "restaurant_onboarding" | "restaurant_application_status" | "restaurant_dashboard";
};

function normalizeIndianPhone(input: string) {
  let digits = input.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  return digits;
}

function getOtpErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "Failed to send OTP.";
  }

  const code = String((error as { code: unknown }).code);
  if (code === "auth/invalid-phone-number") {
    return "Invalid mobile number. Enter a valid 10-digit Indian number.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait and try again.";
  }
  if (code === "auth/captcha-check-failed" || code === "auth/invalid-app-credential") {
    return "Could not start OTP right now. Please try again.";
  }
  if (code === "auth/operation-not-allowed") {
    return "OTP service is currently unavailable. Please try again later.";
  }

  return error instanceof Error ? error.message : "Failed to send OTP.";
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

function isSessionExpiredError(error: unknown) {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : "";
  return (
    code === "auth/code-expired" ||
    code === "auth/session-expired" ||
    message.includes("SESSION_EXPIRED")
  );
}

function isTooManyAttemptsError(error: unknown) {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : "";
  return code === "auth/too-many-requests" || message.includes("TOO_MANY_ATTEMPTS_TRY_LATER");
}

function isRecaptchaCredentialError(error: unknown) {
  const code = getErrorCode(error);
  return code === "auth/captcha-check-failed" || code === "auth/invalid-app-credential";
}

function getVerifyErrorMessage(error: unknown) {
  const code = getErrorCode(error);
  if (isSessionExpiredError(error)) {
    return "OTP expired. Please resend and enter the latest OTP.";
  }
  if (code === "auth/invalid-verification-code") {
    return "Incorrect OTP. Please enter the latest OTP.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait and try again.";
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Request timed out. Please try again.";
  }
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Network error. Please check connection and try again.";
  }
  return error instanceof Error ? error.message : "OTP verification failed.";
}

function emptyOtpDigits() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function RestaurantLoginPage() {
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const otpRequestInFlightRef = useRef(false);
  const otpVerifyInFlightRef = useRef(false);
  const latestOtpRequestIdRef = useRef(0);

  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(emptyOtpDigits());
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const isPhoneLocked = Boolean(verificationId);
  const canSend = useMemo(
    () => INDIAN_PHONE_REGEX.test(phoneDigits) && !isLoading,
    [phoneDigits, isLoading]
  );
  const canVerify = useMemo(
    () => Boolean(verificationId) && otpDigits.every((digit) => digit.length === 1) && !isLoading,
    [verificationId, otpDigits, isLoading]
  );

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setResendSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [resendSecondsLeft]);

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  async function createBackendSession(idToken: string) {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ idToken, role: "restaurant" })
    });

    const payload = await safeJson<SessionResponsePayload>(response);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to create session.");
    }

    return payload ?? {};
  }

  async function ensureRecaptcha() {
    if (recaptchaRef.current) {
      return recaptchaRef.current;
    }

    if (!recaptchaContainerRef.current) {
      throw new Error("Verification widget not ready. Please retry.");
    }

    const auth = getFirebaseAuth();
    recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
      size: "invisible",
      callback: () => undefined,
      "expired-callback": () => {
        resetRecaptcha();
      }
    });

    await recaptchaRef.current.render();
    return recaptchaRef.current;
  }

  function resetRecaptcha() {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
  }

  function resetOtpInputs() {
    setOtpDigits(emptyOtpDigits());
    window.setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 0);
  }

  async function sendOtpWithRecaptcha(phoneE164: string) {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const auth = getFirebaseAuth();
        if (attempt > 0) {
          resetRecaptcha();
        }
        const verifier = await ensureRecaptcha();
        return await signInWithPhoneNumber(auth, phoneE164, verifier);
      } catch (error) {
        lastError = error;
        if (!isRecaptchaCredentialError(error)) {
          throw error;
        }
      }
    }

    throw lastError ?? new Error("Failed to start OTP verification.");
  }

  async function requestOtp(mode: "send" | "resend") {
    if (otpRequestInFlightRef.current) {
      return;
    }

    const normalizedPhone = normalizeIndianPhone(phoneDigits);
    if (!INDIAN_PHONE_REGEX.test(normalizedPhone)) {
      setStatus("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    otpRequestInFlightRef.current = true;
    const requestId = latestOtpRequestIdRef.current + 1;
    latestOtpRequestIdRef.current = requestId;
    setStatus(null);
    setIsLoading(true);

    try {
      const otpCheckResponse = await fetch(`${API_BASE_URL}/auth/otp/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "restaurant",
          phone: `+91${normalizedPhone}`
        })
      });

      if (otpCheckResponse.status === 429) {
        const payload = (await otpCheckResponse.json().catch(() => null)) as
          | { message?: string; retryAfterSeconds?: number }
          | null;
        setResendSecondsLeft(payload?.retryAfterSeconds ?? OTP_BACKOFF_SECONDS);
        throw new Error(payload?.message ?? "Please wait before requesting OTP again.");
      }

      if (!otpCheckResponse.ok) {
        const payload = (await otpCheckResponse.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? "Unable to send OTP right now.");
      }

      const result = await sendOtpWithRecaptcha(`+91${normalizedPhone}`);

      if (latestOtpRequestIdRef.current !== requestId) {
        return;
      }

      setVerificationId(result.verificationId);
      resetOtpInputs();
      setResendSecondsLeft(OTP_COOLDOWN_SECONDS);
      setStatus(mode === "send" ? "OTP sent. Enter the code to continue." : "OTP sent again.");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("OTP send failed", error);
      const code = getErrorCode(error);
      if (isRecaptchaCredentialError(error)) {
        resetRecaptcha();
      }
      if (isTooManyAttemptsError(error)) {
        setResendSecondsLeft((current) => (current > 0 ? current : OTP_BACKOFF_SECONDS));
      }
      setStatus(getOtpErrorMessage(error));
    } finally {
      otpRequestInFlightRef.current = false;
      setIsLoading(false);
    }
  }

  async function handleSendOtp() {
    await requestOtp("send");
  }

  async function handleResendOtp() {
    if (!verificationId || resendSecondsLeft > 0 || isLoading) {
      return;
    }
    await requestOtp("resend");
  }

  function handleChangeNumber() {
    void signOut(getFirebaseAuth()).catch(() => undefined);
    latestOtpRequestIdRef.current += 1;
    setVerificationId(null);
    setStatus(null);
    setResendSecondsLeft(0);
    setOtpDigits(emptyOtpDigits());
    window.setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 0);
  }

  function handleOtpDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, key: string) {
    if (key === "Enter") {
      if (canVerify) {
        void handleVerifyOtp();
      }
      return;
    }

    if (key !== "Backspace") {
      return;
    }

    if (otpDigits[index]) {
      setOtpDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    if (index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      setOtpDigits((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
    }
  }

  function handleOtpPaste(text: string) {
    const pastedDigits = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    if (pastedDigits.length === 0) {
      return;
    }

    setOtpDigits((current) => {
      const next = [...current];
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = pastedDigits[i] ?? "";
      }
      return next;
    });

    const focusIndex = Math.min(pastedDigits.length, OTP_LENGTH - 1);
    otpInputRefs.current[focusIndex]?.focus();
  }

  async function handleVerifyOtp() {
    if (!verificationId || otpVerifyInFlightRef.current) {
      return;
    }

    const otpCode = otpDigits.join("");
    if (otpCode.length !== OTP_LENGTH) {
      setStatus("Enter the complete OTP.");
      return;
    }

    otpVerifyInFlightRef.current = true;
    setStatus("Verifying OTP...");
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      const normalizedPhone = normalizeIndianPhone(phoneDigits);
      const expectedPhone = `+91${normalizedPhone}`;

      let idToken: string;

      // Retry session creation without consuming OTP again when Firebase user is already verified.
      if (auth.currentUser?.phoneNumber === expectedPhone) {
        idToken = await auth.currentUser.getIdToken(true);
      } else {
        const phoneCredential = PhoneAuthProvider.credential(verificationId, otpCode);
        const credentialResult = await signInWithCredential(auth, phoneCredential);
        idToken = await credentialResult.user.getIdToken(true);
      }

      setStatus("Signing you in...");
      const payload = await createBackendSession(idToken);

      if (payload.nextStep === "restaurant_onboarding") {
        router.replace("/onboarding");
      } else if (payload.nextStep === "restaurant_application_status") {
        router.replace("/application/status");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("OTP verify failed", error);
      if (isTooManyAttemptsError(error)) {
        setResendSecondsLeft((current) => (current > 0 ? current : OTP_BACKOFF_SECONDS));
      }
      if (isSessionExpiredError(error)) {
        setResendSecondsLeft(0);
        resetOtpInputs();
      }
      setStatus(getVerifyErrorMessage(error));
    } finally {
      otpVerifyInFlightRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-700/80">NearBite Restaurant</p>
          <h1 className="text-3xl font-semibold text-slate-950">Phone OTP sign in</h1>
          <p className="text-sm text-slate-700">
            Manage applications and live pickup orders from one secure panel.
          </p>
        </header>

        <div className="space-y-4 rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-orange-700/80">Phone number</label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white ring-orange-200 transition focus-within:ring">
              <span className="inline-flex items-center border-r border-slate-200 px-3 text-sm font-medium text-slate-700">
                +91
              </span>
              <input
                ref={phoneInputRef}
                className={`w-full px-4 py-3 text-sm text-slate-900 outline-none ${
                  isPhoneLocked ? "bg-slate-50 text-slate-500" : ""
                }`}
                placeholder="9876543210"
                inputMode="numeric"
                maxLength={10}
                disabled={isPhoneLocked}
                value={phoneDigits}
                onChange={(event) => setPhoneDigits(normalizeIndianPhone(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !verificationId && canSend) {
                    event.preventDefault();
                    void handleSendOtp();
                  }
                }}
              />
            </div>
            <p className="text-xs text-slate-600">Enter 10-digit mobile number.</p>

            {!verificationId ? (
              <button
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!canSend || resendSecondsLeft > 0}
                onClick={handleSendOtp}
              >
                {resendSecondsLeft > 0 ? `Send OTP in ${resendSecondsLeft}s` : "Send OTP"}
              </button>
            ) : (
              <button
                className="w-full rounded-xl border border-orange-200 bg-white py-3 text-sm font-semibold text-orange-700 disabled:opacity-50"
                disabled={isLoading}
                onClick={handleChangeNumber}
              >
                Change Number
              </button>
            )}
          </div>

          {verificationId ? (
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-orange-700/80">OTP code</label>
              <div
                className="grid grid-cols-6 gap-2"
                onPaste={(event) => {
                  event.preventDefault();
                  handleOtpPaste(event.clipboardData.getData("text"));
                }}
              >
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputRefs.current[index] = element;
                    }}
                    className="h-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 outline-none ring-orange-200 transition focus:ring"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event.key)}
                  />
                ))}
              </div>

              <button
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!canVerify}
                onClick={handleVerifyOtp}
              >
                Verify & Continue
              </button>

              <button
                className="w-full rounded-xl border border-orange-200 bg-white py-3 text-sm font-semibold text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || resendSecondsLeft > 0}
                onClick={handleResendOtp}
              >
                {resendSecondsLeft > 0 ? `Resend OTP in ${resendSecondsLeft}s` : "Resend OTP"}
              </button>
            </div>
          ) : null}

          {status ? <p className="text-xs text-slate-700">{status}</p> : null}
          <div ref={recaptchaContainerRef} id="recaptcha-container" className="h-0 overflow-hidden" />
        </div>
      </section>
    </main>
  );
}
