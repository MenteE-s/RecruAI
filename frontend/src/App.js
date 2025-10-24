// src/App.js
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { ToastProvider } from "./components/ui/ToastContext";

// Public Pages
import RecruAILanding from "./pages/RecruAILanding";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import ProtectedRoute from "./components/ProtectedRoute";
// Dashboard Page (new)
import DashboardSwitcher from "./pages/DashboardSwitcher";

import { verifyTokenWithServer } from "./utils/auth";

function AuthVerifier() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!mounted) return;
        if (user) {
          // if user hits a public auth page (signin/register), redirect to dashboard
          // NOTE: we intentionally do NOT redirect from `/` so signed-in users can
          // still visit the landing page — the navbar will show Dashboard/Sign out.
          if (
            location.pathname === "/signin" ||
            location.pathname === "/register"
          ) {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, location]);

  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthVerifier />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RecruAILanding />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardSwitcher />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
