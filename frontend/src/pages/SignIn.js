import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiZap,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { useToast } from "../components/ui/ToastContext";
import { getBackendUrl } from "../utils/auth";

const HIGHLIGHTS = [
  { icon: FiTarget, title: "AI-matched jobs", text: "Roles tailored to your skills, not keywords." },
  { icon: FiZap, title: "Unlimited mock interviews", text: "Practice with instant AI feedback." },
  { icon: FiUsers, title: "Pipeline automation", text: "Applied → hired, fully tracked." },
];

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("individual");
  const navigate = useNavigate();
  const { showToast } = useToast();

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
      const res = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // do not send client-side role — server determines role from the user record
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Sign in failed";
        setError(msg);
        // show side toast for errors
        showToast({
          message: msg,
          type: "error",
          position: "side",
          duration: 3500,
        });
        setLoading(false);
        return;
      }
      // If the user selected a role in the UI that doesn't match the server role,
      // don't block sign-in — prefer the server-verified role. Show a warning
      // so the user knows which dashboard they'll land on.
      if (data.user && data.user.role && role && data.user.role !== role) {
        const msg = `Account role mismatch: this email is registered as '${data.user.role}'. Signing in as '${data.user.role}'.`;
        showToast({
          message: msg,
          type: "warning",
          position: "center",
          duration: 4500,
        });
        // override client role with server role
        setRole(data.user.role);
      }
      // store token, mark authenticated and redirect to dashboard
      // Store the access token for header-based auth
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      // mark auth for frontend-only checks (will be refreshed by /api/auth/me)
      localStorage.setItem("isAuthenticated", "true");
      // use server-verified role from response (do not trust the client-side role selector)
      if (data.user && data.user.role) {
        localStorage.setItem("authRole", data.user.role);
      }
      // show success toast
      showToast({
        message: "Signed in",
        type: "success",
        position: "side",
        duration: 2200,
      });
      // prefer SPA navigation but fall back to full reload if SPA route doesn't take
      navigate("/dashboard", { replace: true });
      if (typeof window !== "undefined") {
        // small delay: if SPA navigation didn't change the path (protected route may redirect),
        // force a hard navigation to help surface errors in the network tab.
        setTimeout(() => {
          if (window.location.pathname === "/signin") {
            // eslint-disable-next-line no-console
            console.warn(
              "SPA navigation to /dashboard didn't take effect — forcing full reload"
            );
            window.location.assign("/dashboard");
          }
        }, 600);
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
                Welcome back
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Sign in to RecruAI
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                New here?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-neutral-900 underline underline-offset-4 hover:no-underline"
                >
                  Create an account
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
                  <label
                    htmlFor="signin-email"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Email
                  </label>
                  <input
                    id="signin-email"
                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
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
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-11 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
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
                <button
                  className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Signing in…" : "Sign in"}
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
              Live — AI hiring platform
            </span>
            <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">
              Welcome back.
              <br />
              <span className="text-neutral-400">Pick up where you left off.</span>
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
