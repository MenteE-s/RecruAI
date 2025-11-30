import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/ui/ToastContext";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("individual");
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    const update = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
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
      const res = await fetch("/api/auth/login", {
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
      // With cookie-based auth the server sets an HttpOnly cookie. We keep
      // returning the token in the JSON for backward compatibility but do not
      // store it in localStorage.
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
      // debug helper: log server response
      // eslint-disable-next-line no-console
      console.log("login response", data);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
      {/* Background animated layers (matching Hero) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-6 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-accent-400/20 to-primary-400/20 bg-300% animate-gradient pointer-events-none"></div>
      <div
        className="absolute w-96 h-96 bg-gradient-radial from-primary-200/30 to-transparent rounded-full pointer-events-none transition-all duration-300 blur-3xl"
        style={{ left: mousePosition.x - 192, top: mousePosition.y - 192 }}
      ></div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 shadow-lg rounded overflow-hidden relative z-10">
        {/* Left panel - message */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-indigo-600 to-blue-500 text-white">
          <h3 className="text-3xl font-bold mb-4">Welcome back</h3>
          <p className="text-sm opacity-90">
            Sign in to access your RecruAI dashboard, manage candidates, and
            streamline hiring with AI-powered suggestions.
          </p>
          <div className="mt-6">
            <ul className="space-y-2 text-sm">
              <li>• Fast candidate screening</li>
              <li>• Smart job matching</li>
              <li>• Collaboration tools</li>
            </ul>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="bg-white p-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:underline"
              type="button"
            >
              ← Back
            </button>
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:underline"
            >
              Create account
            </Link>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign in</h2>
          <div className="flex items-center gap-3 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRole("individual")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                role === "individual"
                  ? "bg-white text-indigo-700 shadow-sm border border-indigo-200"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              👤 Individual
            </button>
            <button
              type="button"
              onClick={() => setRole("organization")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                role === "organization"
                  ? "bg-white text-indigo-700 shadow-sm border border-indigo-200"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              🏢 Organization
            </button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}

          <form onSubmit={submit}>
            <label className="block mb-2">
              <span className="text-sm">Email</span>
              <input
                className="mt-1 block w-full border px-3 py-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label className="block mb-4 relative">
              <span className="text-sm">Password</span>
              <input
                className="mt-1 block w-full border px-3 py-2 rounded pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // eye-off icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.039.164-2.04.468-2.985M6.11 6.11A9.955 9.955 0 0112 5c5.523 0 10 4.477 10 10 0 1.042-.161 2.04-.466 2.984M3 3l18 18"
                    />
                  </svg>
                ) : (
                  // eye icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </label>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
