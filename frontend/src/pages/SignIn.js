import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Zap,
  Target,
  Users,
  CheckCircle2,
  Briefcase,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../components/ui/ToastContext";
import { getBackendUrl, getSafeNextPath, setAuthSession } from "../utils/auth";
import OtpVerify from "../components/auth/OtpVerify";
import AuthLayout from "../components/auth/AuthLayout";

const inputCls =
  "block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-gray-400 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5";

const HIGHLIGHTS = [
  { icon: Target, title: "AI-matched jobs", text: "Roles tailored to your skills, not keywords." },
  { icon: Zap, title: "Unlimited mock interviews", text: "Practice with instant AI feedback." },
  { icon: Users, title: "Pipeline automation", text: "Applied → hired, fully tracked." },
];

/* ── Stageshow illustration: SignIn right panel ─────────────────────────── */
function SignInIllustration() {
  return (
    <div className="my-6 space-y-3.5">
      {/* Welcome-back notification card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4.5 shadow-2xl backdrop-blur-md">
        {/* Card header row */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 border border-brand/30 text-xs font-bold text-brand-underline">
            FA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white">Welcome back, Fatima</p>
            <p className="text-[11px] text-slate-400">RecruAI · Just now</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-underline">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            New
          </span>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-white/10" />

        {/* Match highlight */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Briefcase className="h-4 w-4 text-brand-underline shrink-0" strokeWidth={2} />
            <span>3 new job matches since your last login</span>
          </div>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-underline" strokeWidth={2} />
        </div>
      </div>

      {/* Activity feed card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Recent activity
        </p>
        <div className="space-y-2">
          {/* Row 1 — applied */}
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
              A
            </div>
            <div className="flex flex-1 items-center justify-between min-w-0">
              <p className="truncate text-xs font-medium text-slate-200">Applied — Senior Dev, Karachi</p>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-400 tabular-nums">2d</span>
            </div>
          </div>
          {/* Row 2 — interview */}
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-[10px] font-bold text-brand-underline">
              M
            </div>
            <div className="flex flex-1 items-center justify-between min-w-0">
              <p className="truncate text-xs font-medium text-slate-200">Interview scheduled · Fri 10:00 AM</p>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-400 tabular-nums">5d</span>
            </div>
          </div>
        </div>
      </div>

      {/* ATS score strip */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <BarChart3 className="h-4 w-4 text-brand-underline shrink-0" strokeWidth={2} />
          <span>ATS resume score</span>
        </div>
        <span className="font-mono text-sm font-extrabold tabular-nums text-white">
          91<span className="ml-0.5 text-xs font-medium text-slate-400">/100</span>
        </span>
      </div>
    </div>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpEmail, setOtpEmail] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const nextPath = getSafeNextPath();

  // Verify stored token with the server on mount. If valid, redirect to dashboard.
  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const { verifyTokenWithServer } = await import("../utils/auth");
        if (!mounted) return;
        const user = await verifyTokenWithServer();
        if (user) {
          navigate(nextPath || "/feed", { replace: true });
        }
      } catch (e) {
        // ignore
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [navigate, nextPath]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "success") {
      showToast({
        message: "Password reset — sign in with your new password",
        type: "success",
        position: "side",
        duration: 4000,
      });
    }
  }, [showToast]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // do not send client-side role — server determines role from the user record
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Unverified account: move to the OTP step (a fresh code was sent).
        if (res.status === 403 && data.code === "email_not_verified") {
          setOtpEmail(data.email || email);
          showToast({
            message: data.code_resent
              ? "Account not verified — we sent you a fresh code"
              : "Account not verified — enter your code or resend it",
            type: "warning",
            position: "side",
            duration: 4000,
          });
          setLoading(false);
          return;
        }
        const msg = data.error || "Sign in failed";
        setError(msg);
        showToast({
          message: msg,
          type: "error",
          position: "side",
          duration: 3500,
        });
        setLoading(false);
        return;
      }
      // Keep the access token in memory only; the refresh cookie is HttpOnly.
      setAuthSession(data.access_token, data.user);
      showToast({
        message: "Signed in",
        type: "success",
        position: "side",
        duration: 2200,
      });
      // prefer SPA navigation but fall back to full reload if SPA route doesn't take
      navigate(nextPath || "/feed", { replace: true });
      if (typeof window !== "undefined") {
        setTimeout(() => {
          if (window.location.pathname === "/signin") {
            window.location.assign(nextPath || "/feed");
          }
        }, 600);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleVerified(data) {
    setAuthSession(data.access_token, data.user);
    showToast({ message: "Email verified — signed in", type: "success", position: "side", duration: 2400 });
    navigate(nextPath || "/feed", { replace: true });
  }

  return (
    <AuthLayout
      backTo="/"
      backLabel="Back"
      panelEyebrow="Live — AI hiring platform"
      panelTitle={
        <>
          Welcome back.
          <br />
          <span className="text-slate-400">Pick up where you left off.</span>
        </>
      }
      highlights={HIGHLIGHTS}
      preview={<SignInIllustration />}
    >
      {otpEmail ? (
        <OtpVerify email={otpEmail} onVerified={handleVerified} onBack={() => setOtpEmail(null)} />
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            Welcome back
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
            Sign in to RecruAI
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            New here?{" "}
            <Link
              to="/register"
              className="font-semibold text-brand-text underline underline-offset-4 hover:no-underline"
            >
              Create an account
            </Link>
          </p>

          {/* Error banner — status red, never mud */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-300 shadow-s5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" strokeWidth={2} />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form — 8–12px clearance between fields and button */}
          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <div>
              <label
                htmlFor="signin-email"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Email
              </label>
              <input
                id="signin-email"
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
              <label
                htmlFor="signin-password"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signin-password"
                  className={`${inputCls} pr-11`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
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
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-gray-500 underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Primary action — descriptive label */}
            <button
              className="w-full rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in…" : "Sign in to RecruAI"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-2 hover:text-ink">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      )}
    </AuthLayout>
  );
}
