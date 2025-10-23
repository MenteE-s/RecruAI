import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const update = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed");
        setLoading(false);
        return;
      }
      // store token and redirect
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      navigate("/", { replace: true });
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
          {error && <div className="text-red-600 mb-2">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 flex-1 border rounded px-3 py-2 hover:bg-gray-50"
            >
              {/* Google Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 533.5 544.3"
                className="w-5 h-5"
              >
                <path
                  fill="#4285f4"
                  d="M533.5 278.4c0-18.5-1.6-36.3-4.6-53.6H272v101.4h147.1c-6.3 34.2-25.5 63.1-54.4 82.5v68h87.8c51.3-47.2 81-116.8 81-198.3z"
                />
                <path
                  fill="#34a853"
                  d="M272 544.3c73.6 0 135.4-24.4 180.6-66.2l-87.8-68c-24.4 16.4-55.6 26.1-92.8 26.1-71 0-131.1-47.9-152.6-112.3H28.4v70.6C73.3 497.2 166.5 544.3 272 544.3z"
                />
                <path
                  fill="#fbbc04"
                  d="M119.4 325.8c-10.7-31.9-10.7-66.6 0-98.5V156.7H28.4c-40.6 80.9-40.6 176.8 0 257.7l91-88.6z"
                />
                <path
                  fill="#ea4335"
                  d="M272 109.6c39.8 0 75.6 13.7 103.8 40.6l77.9-77.9C407.6 24.9 345.8 0 272 0 166.5 0 73.3 47.2 28.4 118.8l91 70.8C140.9 157.5 201 109.6 272 109.6z"
                />
              </svg>
              <span className="text-sm">Continue with Google</span>
            </a>

            <a
              href="/api/auth/github"
              className="flex items-center justify-center gap-2 flex-1 border rounded px-3 py-2 hover:bg-gray-50"
            >
              {/* GitHub Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
              >
                <path
                  fill="currentColor"
                  d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.39-3.88-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.26 3.39.97.11-.76.41-1.26.74-1.55-2.55-.29-5.24-1.28-5.24-5.72 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.45.11-3.02 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.99 0 1.99.13 2.92.39 2.2-1.5 3.17-1.18 3.17-1.18.63 1.57.23 2.73.11 3.02.74.81 1.18 1.84 1.18 3.1 0 4.45-2.69 5.42-5.25 5.71.42.36.79 1.09.79 2.2 0 1.59-.01 2.88-.01 3.28 0 .3.21.66.8.55C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"
                />
              </svg>
              <span className="text-sm">Continue with GitHub</span>
            </a>
          </div>

          <div className="mb-4 text-center text-sm text-gray-500">
            or continue with email
          </div>

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
