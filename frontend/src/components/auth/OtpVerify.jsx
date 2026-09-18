import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiMail, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { getBackendUrl } from "../../utils/auth";

const CODE_LEN = 6;
const RESEND_WAIT = 60;

/**
 * Shared 6-digit email-OTP step. Calls onVerified(response data).
 * Defaults to the registration/login verification endpoints; pass
 * verifyPath/requestPath + body builders for other flows (email change).
 */
export default function OtpVerify({
  email,
  displayEmail,
  headline = "Check your inbox",
  subline,
  onVerified,
  onBack,
  verifyPath = "/api/auth/otp/verify",
  requestPath = "/api/auth/otp/request",
  getVerifyBody = (code) => ({ email, code }),
  getRequestBody = () => ({ email }),
}) {
  const [digits, setDigits] = useState(Array(CODE_LEN).fill(""));
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setDigit = useCallback((i, v) => {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    setDigit(i, v);
    if (v && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, CODE_LEN);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: CODE_LEN }, (_, i) => text[i] || ""));
    inputs.current[Math.min(text.length, CODE_LEN - 1)]?.focus();
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (code.length !== CODE_LEN) {
      setError("Enter the 6-digit code.");
      return;
    }
    setError(null);
    setInfo(null);
    setVerifying(true);
    try {
      const res = await fetch(`${getBackendUrl()}${verifyPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(getVerifyBody(code)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      onVerified(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit once all six boxes are filled.
  useEffect(() => {
    if (digits.every((d) => d) && !verifying) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const res = await fetch(`${getBackendUrl()}${requestPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(getRequestBody()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not resend the code.");
        if (data.retry_after) setCooldown(data.retry_after);
        return;
      }
      setInfo("A fresh code is on its way.");
      setCooldown(RESEND_WAIT);
      setDigits(Array(CODE_LEN).fill(""));
      inputs.current[0]?.focus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white">
        <FiMail className="h-6 w-6" />
      </div>
      <h2 className="text-center text-2xl font-extrabold tracking-tight">{headline}</h2>
      <p className="mt-2 text-center text-sm text-neutral-500">
        {subline || (
          <>
            We sent a 6-digit code to <span className="font-semibold text-neutral-900">{displayEmail || email}</span>.
            It expires in 10 minutes.
          </>
        )}
      </p>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
          {info}
        </div>
      )}

      <form onSubmit={submit} className="mt-6">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              className="h-14 w-12 rounded-lg border border-gray-200 bg-gray-50 text-center text-xl font-extrabold text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
              value={d}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={verifying}
          className="mt-6 w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 underline underline-offset-4 hover:no-underline disabled:text-neutral-400 disabled:no-underline"
        >
          <FiRefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
