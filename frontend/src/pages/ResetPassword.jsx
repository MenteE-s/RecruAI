import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { getBackendUrl } from "../utils/auth";

const inputCls =
  "block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-gray-400 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500";

/* ── Stageshow illustration: ResetPassword right panel ──────────────────── */
function ResetPasswordIllustration() {
  return (
    <div className="my-6 space-y-3.5">
      {/* Window card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4.5 sm:p-5 shadow-2xl backdrop-blur-md">
        {/* Window chrome header */}
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-mono tracking-tight text-gray-500">recruai.app/reset-password</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Verified
          </span>
        </div>

        {/* Security preview card */}
        <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 border border-brand/30 text-xs font-bold text-brand-text">
                <ShieldCheck className="h-4 w-4 text-brand-text" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Session security</p>
                <p className="text-[11px] text-gray-500">All older sessions revoked</p>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-brand/30 bg-brand/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-text tabular-nums">
              Bcrypt · SHA-256
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={2} />
              <span>Rotated credentials</span>
            </span>
            <span className="font-mono text-[10px] text-gray-500">Instant sign-in ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") || "";
  });
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [invalidCode, setInvalidCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setInvalidCode(false);

    if (code.replace(/\D/g, "").length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, new_password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "invalid_reset_code") {
          setInvalidCode(true);
          setError(data.error || "Invalid or expired reset code.");
        } else if (res.status === 429) {
          setError("Too many attempts. Please wait a minute and try again.");
        } else {
          setError(data.error || "Could not reset the password.");
        }
        return;
      }
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setCode("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout preview={<ResetPasswordIllustration />}>
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-text shadow-s5">
          <CheckCircle2 className="h-4 w-4 text-brand-text" strokeWidth={2} />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-ink">
          Password reset
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
          Your password has been updated. For security, every older session has
          been signed out.
        </p>

        <Link
          to="/signin?reset=success"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span>Sign in with your new password</span>
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout preview={<ResetPasswordIllustration />}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
        Account recovery
      </p>
      <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Enter the code from your email and set a new password.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-300 shadow-s5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            {error}
            {invalidCode && (
              <Link
                to={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="mt-2 inline-block font-semibold text-brand-text underline underline-offset-2 hover:no-underline"
              >
                Request a new code
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-3.5">
        <div>
          <label htmlFor="reset-email" className={labelCls}>
            Email
          </label>
          <input
            id="reset-email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="reset-code" className={labelCls}>
            Reset code
          </label>
          <input
            id="reset-code"
            className={`${inputCls} text-center font-mono text-base tracking-[0.35em]`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            required
          />
        </div>

        <div>
          <label htmlFor="reset-password" className={labelCls}>
            New password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              className={`${inputCls} pr-11`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-ink hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            At least 8 characters, with uppercase, lowercase, and a number.
          </p>
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className={labelCls}>
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" strokeWidth={2} />
            <input
              id="reset-confirm-password"
              className={`${inputCls} pl-10`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              required
            />
          </div>
        </div>

        <button
          className="w-full rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          disabled={loading}
          type="submit"
        >
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Need a new code?{" "}
        <Link
          to={`/forgot-password?email=${encodeURIComponent(email)}`}
          className="font-semibold text-ink underline underline-offset-4 hover:no-underline"
        >
          Send another
        </Link>
      </p>
    </AuthLayout>
  );
}