import React from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default function IndividualNavbar({ isAuthenticated }) {
  const navigate = useNavigate();
  const signedIn =
    isAuthenticated || localStorage.getItem("isAuthenticated") === "true";

  function signOut() {
    (async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        // ignore network errors
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authRole");
      navigate("/signin", { replace: true });
    })();
  }

  return (
    <nav className="w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center">
            {/* <Link to="/" className="font-bold text-lg text-primary-700">
              RecruAI
            </Link> */}
            {/* Top nav intentionally minimal - main navigation lives in the left sidebar */}
          </div>

          <div className="flex items-center gap-3">
            {!signedIn ? (
              <>
                <Link to="/signin" className="text-sm text-primary-700">
                  <i className="fa-solid fa-user"></i> Sign in
                </Link>
                <Link
                  to="/register"
                  className="ml-2 px-3 py-1 bg-primary-700 text-white rounded text-sm"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="text-sm text-secondary-700">
                  <i className="fa-solid fa-user"></i> Profile
                </Link>
                <button onClick={signOut} className="ml-2 text-sm text-red-600">
                  <i className="fa-solid fa-right-from-bracket"></i> Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
