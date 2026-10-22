import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiMail } from "react-icons/fi";
import AuthLayout from "../components/auth/AuthLayout";
import { getBackendUrl } from "../utils/auth";

const inputCls =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Too many reset requests. Please wait a minute and try again."
            : data.error || "Could not send the reset code."
        );
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <FiCheckCircle className="h-6 w-6" />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight">
          Check your inbox
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
          If an account exists for{" "}
          <span className="font-semibold text-neutral-900">{email}</span>, we sent
          a 6-digit reset code. It expires in 10 minutes.
        </p>

        <button
          type="button"
          onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black"
        >
          Enter reset code <FiArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="mt-5 w-full text-center text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
        >
          Use a different email
        </button>

        <p className="mt-6 text-center text-xs leading-relaxed text-neutral-400">
          Still stuck?{" "}
          <Link to="/contact" className="underline underline-offset-2 hover:text-neutral-700">
            Contact support
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
        Account recovery
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Forgot your password?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        Enter the email on your account and we&apos;ll send a 6-digit reset code.
      </p>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="forgot-email" className={labelCls}>
            Email
          </label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              id="forgot-email"
              className={`${inputCls} pl-10`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <button
          className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Remembered it?{" "}
        <Link
          to="/signin"
          className="font-semibold text-neutral-900 underline underline-offset-4 hover:no-underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
