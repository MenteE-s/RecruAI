import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { getBackendUrl } from "../utils/auth";

const inputCls =
  "block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-gray-400 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500";

/* ── Stageshow illustration: ForgotPassword right panel ─────────────────── */
function ForgotPasswordIllustration() {
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
          <span className="text-[11px] font-mono tracking-tight text-gray-500">recruai.app/recovery</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Secure
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
                <p className="truncate text-xs font-bold text-white">Encrypted account recovery</p>
                <p className="text-[11px] text-gray-500">Zero credential leak protocol</p>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-brand/30 bg-brand/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-text tabular-nums">
              OTP 6-digit
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={2} />
              <span>Token expiry <strong className="font-mono text-white tabular-nums">10 minutes</strong></span>
            </span>
            <span className="font-mono text-[10px] text-gray-500">All sessions revoked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <AuthLayout preview={<ForgotPasswordIllustration />}>
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-text shadow-s5">
          <CheckCircle2 className="h-4 w-4 text-brand-text" strokeWidth={2} />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-ink">
          Check your inbox
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
          If an account exists for{" "}
          <span className="font-semibold text-ink">{email}</span>, we sent
          a 6-digit reset code. It expires in 10 minutes.
        </p>

        <button
          type="button"
          onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span>Enter reset code</span>
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-line bg-surface py-2.5 text-sm font-medium text-ink shadow-s5 transition hover:bg-gray-100 dark:hover:bg-gray-25 focus:outline-none"
        >
          Use a different email
        </button>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
          Still stuck?{" "}
          <Link to="/contact" className="underline underline-offset-2 hover:text-ink">
            Contact support
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout preview={<ForgotPasswordIllustration />}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
        Account recovery
      </p>
      <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
        Forgot your password?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Enter the email on your account and we&apos;ll send a 6-digit reset code.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-300 shadow-s5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" strokeWidth={2} />
          <div className="flex-1">{error}</div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-3.5">
        <div>
          <label htmlFor="forgot-email" className={labelCls}>
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" strokeWidth={2} />
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
          className="w-full rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          disabled={loading}
          type="submit"
        >
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link
          to="/signin"
          className="font-semibold text-ink underline underline-offset-4 hover:no-underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}