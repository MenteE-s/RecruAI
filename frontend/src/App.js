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
// Dashboard Pages
import DashboardSwitcher from "./pages/DashboardSwitcher";
import SettingsSwitcher from "./pages/SettingsSwitcher";
import Profile from "./pages/individual/Profile";
import UpcomingInterviews from "./pages/individual/UpcomingInterviews";
import InterviewHistory from "./pages/individual/InterviewHistory";
import SavedJobs from "./pages/individual/SavedJobs";
import Analytics from "./pages/individual/Analytics";
import ResumeBuilder from "./pages/individual/ResumeBuilder";
import JobAlerts from "./pages/individual/JobAlerts";
import CareerCoaching from "./pages/individual/CareerCoaching";

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

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardSwitcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/upcoming"
            element={
              <ProtectedRoute>
                <UpcomingInterviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/history"
            element={
              <ProtectedRoute>
                <InterviewHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/saved"
            element={
              <ProtectedRoute>
                <SavedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/builder"
            element={
              <ProtectedRoute>
                <ResumeBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/alerts"
            element={
              <ProtectedRoute>
                <JobAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coaching"
            element={
              <ProtectedRoute>
                <CareerCoaching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsSwitcher />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
