import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import socketService from "../../utils/socket";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const RecruAINavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function verify() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          if (mounted) setSignedIn(false);
          return;
        }
        const { verifyTokenWithServer } = await import("../../utils/auth");
        const user = await verifyTokenWithServer();
        if (!mounted) return;
        setSignedIn(!!user);
      } catch (e) {
        if (mounted) setSignedIn(false);
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

  function handleSignOut() {
    (async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {}
      try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("authRole");
        socketService.disconnect();
      } catch (e) {}
      setSignedIn(false);
      navigate("/signin", { replace: true });
    })();
  }

  return (
    <nav className={`bg-white fixed w-full z-50 transition-all duration-300 ${scrolled ? "shadow-md" : "shadow-sm"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/mentee-logo.png" alt="MenteE" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">MenteE</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Testimonials
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!signedIn ? (
              <>
                <Link to="/signin" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 transition-colors">
                  Sign Out
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <a href="#features" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              Features
            </a>
            <a href="#how-it-works" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              How it Works
            </a>
            <a href="#pricing" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              Pricing
            </a>
            <a href="#testimonials" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              Testimonials
            </a>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            {!signedIn ? (
              <div className="space-y-2">
                <Link to="/signin" className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/dashboard" className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default RecruAINavbar;
