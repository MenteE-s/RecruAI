import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import AuthLayout from "../components/auth/AuthLayout";
import { getBackendUrl } from "../utils/auth";

const inputCls =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500";

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
      <AuthLayout>
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <FiCheckCircle className="h-6 w-6" />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight">
          Password reset
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
          Your password has been updated. For security, every older session has
          been signed out.
        </p>

        <Link
          to="/signin?reset=success"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black"
        >
          Sign in with your new password <FiArrowRight className="h-4 w-4" />
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
        Account recovery
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        Enter the code from your email and set a new password.
      </p>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
          {invalidCode && (
            <Link
              to={`/forgot-password?email=${encodeURIComponent(email)}`}
              className="mt-1 block font-semibold underline underline-offset-2"
            >
              Request a new code
            </Link>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
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
            className={`${inputCls} tracking-[0.35em]`}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            At least 8 characters, with uppercase, lowercase, and a number.
          </p>
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className={labelCls}>
            Confirm new password
          </label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
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
          className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Need a new code?{" "}
        <Link
          to={`/forgot-password?email=${encodeURIComponent(email)}`}
          className="font-semibold text-neutral-900 underline underline-offset-4 hover:no-underline"
        >
          Send another
        </Link>
      </p>
    </AuthLayout>
  );
}
