import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mail, RefreshCw, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
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
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-text shadow-s5">
        <Mail className="h-5 w-5 text-brand-text" strokeWidth={2} />
      </div>
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {headline}
      </h2>
      <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
        {subline || (
          <>
            We sent a 6-digit code to <span className="font-semibold text-ink">{displayEmail || email}</span>.
            It expires in 10 minutes.
          </>
        )}
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-300 shadow-s5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" strokeWidth={2} />
          <div className="flex-1">{error}</div>
        </div>
      )}
      {info && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 shadow-s5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" strokeWidth={2} />
          <div className="flex-1">{info}</div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6">
        <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-line bg-surface text-center font-mono text-xl sm:text-2xl font-bold text-ink outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5"
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
          className="mt-6 w-full rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {verifying ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-medium text-gray-500 hover:text-ink transition-colors focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} /> <span>Back</span>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 font-semibold text-ink underline underline-offset-4 hover:no-underline disabled:text-gray-500 disabled:no-underline transition-colors focus:outline-none"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} strokeWidth={2} />
          <span>
            {cooldown > 0 ? (
              <>
                Resend in <strong className="font-mono tabular-nums">{cooldown}s</strong>
              </>
            ) : (
              "Resend code"
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
