import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/ui/ToastContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      const res = await fetch("/api/auth/register", {
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
        <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-green-600 to-teal-500 text-white">
          <h3 className="text-3xl font-bold mb-4">Create your account</h3>
          <p className="text-sm opacity-90">
            Join RecruAI and start posting jobs, screening candidates with AI,
            and collaborating with your team.
          </p>
          <div className="mt-6">
            <ul className="space-y-2 text-sm">
              <li>• Unlimited job posts (trial)</li>
              <li>• AI-powered candidate scoring</li>
              <li>• Advanced analytics and reporting</li>
            </ul>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="bg-white p-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/signin")}
              className="text-sm text-gray-500 hover:underline"
              type="button"
            >
              ← Back
            </button>
            <Link
              to="/signin"
              className="text-sm text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <h2 className="text-2xl font-bold mb-2">Create an account</h2>
          <div className="flex items-center gap-3 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRole("individual")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                role === "individual"
                  ? "bg-white text-green-700 shadow-sm border border-green-200"
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
                  ? "bg-white text-green-700 shadow-sm border border-green-200"
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
            {role === "organization" && (
              <label className="block mb-2">
                <span className="text-sm">Organization name</span>
                <input
                  className="mt-1 block w-full border px-3 py-2 rounded"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </label>
            )}
            <label className="block mb-2">
              <span className="text-sm">Name (optional)</span>
              <input
                className="mt-1 block w-full border px-3 py-2 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
