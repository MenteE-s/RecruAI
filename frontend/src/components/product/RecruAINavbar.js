import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const RecruAINavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function verify() {
      try {
        // quick local flag check then server verify for accuracy
        const cached =
          typeof window !== "undefined" &&
          localStorage.getItem("isAuthenticated") === "true";
        if (cached && mounted) setSignedIn(true);
        const { verifyTokenWithServer } = await import("../../utils/auth");
        const user = await verifyTokenWithServer();
        if (!mounted) return;
        setSignedIn(!!user);
      } catch (e) {
        if (mounted) setSignedIn(false);
      }
    }
    verify();
    return () => {
      mounted = false;
    };
  }, []);

  function handleSignOut() {
    (async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        // ignore
      }
      try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("authRole");
      } catch (e) {}
      setSignedIn(false);
      navigate("/signin", { replace: true });
    })();
  }

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Breadcrumb Style Branding */}
                <Link
                  to="/"
                  className="text-lg font-display font-bold text-accent-600 hover:text-secondary-500 transition-colors"
                >
                  MenteE
                </Link>
                <span className="text-secondary-400">/</span>
                <div className="text-2xl font-display font-bold text-primary-600">
                  RecruAI
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href="#features"
                className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Testimonials
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {!signedIn ? (
                <>
                  <Link
                    to="/signin"
                    className="text-secondary-700 hover:text-primary-600 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Start Free Trial
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="text-secondary-700 hover:text-primary-600 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-secondary-700 hover:text-primary-600 px-4 py-2 text-sm font-medium"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-700 hover:text-primary-600 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Breadcrumb Style Branding */}
                <Link
                  to="/"
                  className="text-lg font-display font-bold text-secondary-500 hover:text-primary-600 transition-colors"
                ></Link>
                <span className="text-secondary-400">/</span>
                <div className="text-2xl font-display font-bold text-primary-600">
                  RecruAI
                </div>
              </div>
            </div>
          </div>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            <a
              href="#features"
              className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
            >
              Testimonials
            </a>
            <div className="pt-4 pb-3 border-t border-secondary-200">
              {!signedIn ? (
                <>
                  <Link
                    to="/signin"
                    className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 hover:bg-primary-700 text-white block px-3 py-2 rounded-lg text-base font-medium mt-2 w-full"
                  >
                    Start Free Trial
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default RecruAINavbar;
