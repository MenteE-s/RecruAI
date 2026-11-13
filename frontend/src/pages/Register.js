import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Gift,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "../components/ui/ToastContext";
import { getBackendUrl, setAuthSession } from "../utils/auth";
import OtpVerify from "../components/auth/OtpVerify";
import AuthLayout from "../components/auth/AuthLayout";

const HIGHLIGHTS = [
  { icon: FileText, title: "ATS-optimized CVs", text: "Rewrites that pass screening filters." },
  { icon: BarChart3, title: "AI screening & matching", text: "Find signal in every application." },
  { icon: Gift, title: "Referral rewards", text: "Earn rewards for every successful invite." },
];

const inputCls =
  "block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-gray-400 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500";

/* ── Stageshow illustration: Register right panel ───────────────────────── */
function RegisterIllustration() {
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
          <span className="text-[11px] font-mono tracking-tight text-slate-400">recruai.app/register</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-underline">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Live
          </span>
        </div>

        {/* Miniature card */}
        <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 border border-brand/30 text-xs font-bold text-brand-underline">
                AA
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Full Stack Engineer</p>
                <p className="text-[11px] text-slate-400">Profile ready for 1-click apply</p>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-brand/30 bg-brand/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-underline tabular-nums">
              96% match
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              React 18
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              TypeScript
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              PostgreSQL
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              Tailwind
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-underline" strokeWidth={2} />
              <span>ATS score <strong className="font-mono text-white tabular-nums">94/100</strong></span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">Instant verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Prefill referral email from ?ref= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralEmail(decodeURIComponent(ref));
      setShowReferral(true);
    }
  }, []);

  // Verify stored token with the server on mount. If valid, redirect to dashboard.
  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const { verifyTokenWithServer } = await import("../utils/auth");
        if (!mounted) return;
        const user = await verifyTokenWithServer();
        if (user) {
          navigate("/feed", { replace: true });
        }
      } catch (e) {
        // ignore
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Individual signup only. Company pages are created later from inside
        // the account (see CreatePage), never here.
        body: JSON.stringify({
          email,
          name,
          password,
          referral_email: referralEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Registration failed";
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
      // Email-first flow: verify the OTP, then we sign in.
      if (data.verification_required) {
        if (data.otp_error) {
          showToast({ message: data.otp_error, type: "warning", position: "side", duration: 4000 });
        } else {
          showToast({ message: "Account created — check your inbox for the code", type: "success", position: "side", duration: 3000 });
        }
        setOtpStep(true);
        setLoading(false);
        return;
      }
      // registration success — if backend returned token, sign in immediately
      if (data.access_token) {
        setAuthSession(data.access_token, data.user);
        showToast({
          message: "Account created — signed in",
          type: "success",
          position: "side",
          duration: 2400,
        });
        navigate("/feed", { replace: true });
      } else {
        // otherwise go to sign-in page so user can authenticate
        showToast({
          message: "Registration complete — please sign in",
          type: "success",
          position: "side",
          duration: 2400,
        });
        navigate("/signin", { replace: true });
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const handleVerified = (data) => {
    setAuthSession(data.access_token, data.user);
    showToast({ message: "Email verified — welcome!", type: "success", position: "side", duration: 2400 });
    navigate("/feed", { replace: true });
  };

  return (
    <AuthLayout
      backTo="/"
      backLabel="Back"
      panelEyebrow="Free forever plan available"
      panelTitle={
        <>
          Get hired faster.
          <br />
          <span className="text-slate-400">Hire smarter.</span>
        </>
      }
      highlights={HIGHLIGHTS}
      preview={<RegisterIllustration />}
    >
      {otpStep ? (
        <OtpVerify email={email} onVerified={handleVerified} onBack={() => setOtpStep(false)} />
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            Free forever plan · No credit card required
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Already have one?{" "}
            <Link
              to="/signin"
              className="font-semibold text-brand-text underline underline-offset-4 hover:no-underline"
            >
              Sign in
            </Link>
          </p>
          <div className="mt-3.5 rounded-xl border border-line bg-gray-50 p-3.5 text-[13px] leading-relaxed text-gray-600 dark:bg-gray-25 dark:text-gray-500 shadow-s5">
            One account for you. Running a company? After you sign up you can
            open a company page from inside your account and post jobs as an admin.
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-300 shadow-s5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" strokeWidth={2} />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <div>
              <label htmlFor="register-name" className={labelCls}>
                Full name
              </label>
              <input
                id="register-name"
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Ada Ahmed"
              />
            </div>
            <div>
              <label htmlFor="register-email" className={labelCls}>
                Email
              </label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className={labelCls}>
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
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
            </div>

            {/* Optional referral */}
            <div className="rounded-xl border border-line bg-surface shadow-s5 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowReferral((s) => !s)}
                aria-expanded={showReferral}
                className="flex w-full items-center justify-between p-3.5 text-sm font-semibold text-gray-600 transition-colors hover:text-ink dark:text-gray-600 dark:hover:text-ink focus:outline-none"
              >
                <span className="inline-flex items-center gap-2">
                  <Gift className="h-4 w-4 text-brand-text" strokeWidth={2} />
                  <span>Have a referral email?</span>
                </span>
                {showReferral ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" strokeWidth={2} />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" strokeWidth={2} />
                )}
              </button>
              {showReferral && (
                <div className="border-t border-line p-3.5 pt-3">
                  <input
                    className={inputCls}
                    value={referralEmail}
                    onChange={(e) => setReferralEmail(e.target.value)}
                    placeholder="e.g. friend@example.com"
                    type="email"
                  />
                </div>
              )}
            </div>

            <button
              className="w-full rounded-xl border border-brand bg-brand py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              disabled={loading}
              type="submit"
            >
              {loading ? "Creating…" : "Create account"}
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
