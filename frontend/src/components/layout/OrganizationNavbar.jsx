import React from "react";
import { Link } from "react-router-dom";
import SignOutButton from "../ui/SignOutButton";

export default function OrganizationNavbar({ isAuthenticated }) {
  const signedIn =
    isAuthenticated || localStorage.getItem("isAuthenticated") === "true";

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-lg text-blue-700">
              RecruAI
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!signedIn ? (
              <>
                <Link to="/signin" className="text-sm text-gray-600 hover:text-gray-900">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="ml-2 px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-800 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link to="/org/settings" className="text-sm text-gray-600 hover:text-gray-900">
                  Settings
                </Link>
                <span className="ml-2"><SignOutButton variant="solid" /></span>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
