import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import SignedInAccountBar from "../layout/SignedInAccountBar";

const RecruAINavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(
    typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true"
  );

  useEffect(() => {
    let mounted = true;
    async function verify() {
      try {
        const { verifyTokenWithServer } = await import("../../utils/auth");
        const user = await verifyTokenWithServer();
        if (!mounted) return;
        const ok = !!user;
        setSignedIn(ok);
        try {
          if (ok) localStorage.setItem("isAuthenticated", "true");
          else localStorage.removeItem("isAuthenticated");
        } catch {}
      } catch {
        if (mounted) {
          setSignedIn(localStorage.getItem("isAuthenticated") === "true");
        }
      }
    }
    verify();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 border-b border-line bg-surface/95 backdrop-blur-[6px] ${scrolled ? "shadow-s5" : ""}`}>
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="t-min inline-flex items-center gap-2 shrink-0">
            <img src="/mentee-logo.png" alt="RecruAI" width={28} height={28} className="h-7 w-7" />
            <span className="text-base font-bold tracking-tight text-ink">RecruAI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 whitespace-nowrap">
            <a href="/#features" className="t-min inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text">
              Features
            </a>
            <a href="/#how-it-works" className="t-min inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text">
              How it works
            </a>
            <a href="/#pricing" className="t-min inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text">
              Pricing
            </a>
            <a href="/#testimonials" className="t-min inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text">
              Testimonials
            </a>
            <Link to="/in/jobs" className="t-min inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text">
              Browse jobs
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {!signedIn ? (
              <>
                <Link
                  to="/signin"
                  className="rounded-xl border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 whitespace-nowrap shadow-s5"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5 whitespace-nowrap"
                >
                  Get started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/feed"
                  className="rounded-xl border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 whitespace-nowrap shadow-s5"
                >
                  Dashboard
                </Link>
                <SignedInAccountBar compact onSignedOut={() => setSignedIn(false)} />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-ink hover:bg-gray-100 dark:text-gray-500 dark:hover:text-ink dark:hover:bg-gray-25 transition-colors"
          >
            {isOpen ? (
              <X className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-line bg-surface shadow-pop">
          <div className="px-4 py-3 space-y-1">
            <a href="/#features" className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ink dark:text-gray-600 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ink dark:text-gray-600 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors">
              How it works
            </a>
            <a href="/#pricing" className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ink dark:text-gray-600 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors">
              Pricing
            </a>
            <a href="/#testimonials" className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ink dark:text-gray-600 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors">
              Testimonials
            </a>
            <Link to="/in/jobs" className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-ink dark:text-gray-600 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors">
              Browse jobs
            </Link>
          </div>
          <div className="border-t border-line px-4 py-3">
            {!signedIn ? (
              <div className="space-y-2">
                <Link to="/signin" className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-center text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5">
                  Sign in
                </Link>
                <Link to="/register" className="block w-full rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5">
                  Get started
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/feed" className="block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-center text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5">
                  Dashboard
                </Link>
                <div className="flex justify-center"><SignedInAccountBar compact onSignedOut={() => setSignedIn(false)} /></div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default RecruAINavbar;
