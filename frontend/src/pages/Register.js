import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiGift,
  FiFileText,
  FiBarChart2,
} from "react-icons/fi";
import { useToast } from "../components/ui/ToastContext";
import { getBackendUrl } from "../utils/auth";

const HIGHLIGHTS = [
  { icon: FiFileText, title: "ATS-optimized CVs", text: "Rewrites that pass screening filters." },
  { icon: FiBarChart2, title: "AI screening & matching", text: "Find signal in every application." },
  { icon: FiGift, title: "Referral rewards", text: "Earn $3 per successful referral." },
];

const inputCls =
  "block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500";

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
          navigate("/dashboard", { replace: true });
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
        // include role and optional organization name for organizations
        body: JSON.stringify({
          email,
          name,
          password,
          role,
          organization_name:
            role === "organization" ? organizationName : undefined,
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
      // registration success — if backend returned token, sign in immediately
      if (data.access_token) {
        // Store the access token for header-based auth
        localStorage.setItem("access_token", data.access_token);
        // server set cookie; set local flags and role (server-verified)
        localStorage.setItem("isAuthenticated", "true");
        if (data.user && data.user.role) {
          localStorage.setItem("authRole", data.user.role);
        } else {
          localStorage.setItem("authRole", role);
        }
        showToast({
          message: "Account created — signed in",
          type: "success",
          position: "side",
          duration: 2400,
        });
        navigate("/dashboard", { replace: true });
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

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left — form column */}
        <div className="flex flex-col px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
              type="button"
            >
              <FiArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-sm font-extrabold tracking-tight">
              RecruAI <span className="font-medium text-neutral-400">by MenteE</span>
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                Free forever plan · No credit card required
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Already have one?{" "}
                <Link
                  to="/signin"
                  className="font-semibold text-neutral-900 underline underline-offset-4 hover:no-underline"
                >
                  Sign in
                </Link>
              </p>

              {/* Role selector */}
              <div className="mt-8 grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1.5">
                {[
                  { id: "individual", label: "Job seeker", icon: FiUser },
                  { id: "organization", label: "Organization", icon: FiBriefcase },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    aria-pressed={role === id}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      role === id
                        ? "bg-neutral-900 text-white shadow"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
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
                {role === "organization" && (
                  <div>
                    <label htmlFor="register-org" className={labelCls}>
                      Organization name
                    </label>
                    <input
                      id="register-org"
                      className={inputCls}
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      autoComplete="organization"
                      placeholder="Acme Pvt. Ltd."
                      required
                    />
                  </div>
                )}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional referral */}
                <div className="rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowReferral((s) => !s)}
                    aria-expanded={showReferral}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiGift className="w-4 h-4" /> Have a referral email?
                    </span>
                    <span className="text-neutral-400">{showReferral ? "−" : "+"}</span>
                  </button>
                  {showReferral && (
                    <div className="border-t border-gray-100 px-3.5 py-3">
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
                  className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Creating…" : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-relaxed text-neutral-400">
                By continuing you agree to our{" "}
                <Link to="/terms" className="underline underline-offset-2 hover:text-neutral-700">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline underline-offset-2 hover:text-neutral-700">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Right — brand panel */}
        <div className="relative hidden overflow-hidden bg-neutral-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.14), transparent 45%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.08), transparent 40%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Free forever plan available
            </span>
            <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">
              Get hired faster.
              <br />
              <span className="text-neutral-400">Hire smarter.</span>
            </h2>
          </div>

          <div className="relative space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">{text}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t border-white/10 pt-6 text-xs text-neutral-400">
              <FiCheck className="h-4 w-4 text-emerald-400" />
              Built for Pakistan — expanding across the Gulf &amp; beyond
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
