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
import ContactUs from "./pages/ContactUs";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import Blog from "./pages/Blog";
import SystemStatus from "./pages/SystemStatus";
import Community from "./pages/Community";
import CookiesPolicy from "./pages/CookiesPolicy";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
// Dashboard Pages
import DashboardSwitcher from "./pages/DashboardSwitcher";
import SettingsSwitcher from "./pages/SettingsSwitcher";
import Profile from "./pages/individual/Profile";
import UpcomingInterviews from "./pages/individual/UpcomingInterviews";
import InterviewHistory from "./pages/individual/InterviewHistory";
import SavedJobs from "./pages/individual/SavedJobs";
import AppliedJobs from "./pages/individual/AppliedJobs";
import BrowseJobs from "./pages/individual/BrowseJobs";
import Analytics from "./pages/individual/Analytics";
import ResumeBuilder from "./pages/individual/ResumeBuilder";
import JobAlerts from "./pages/individual/JobAlerts";
import CareerCoaching from "./pages/individual/CareerCoaching";
import JobDetails from "./pages/individual/JobDetails";
import PracticeDashboard from "./pages/individual/PracticeDashboard";
import PracticeRoom from "./pages/individual/PracticeRoom";
import IndividualAIAgents from "./pages/individual/AIAgents";
// Organization Pages
import OrganizationProfile from "./pages/organization/Profile";
import BrowseOrganizations from "./pages/organization/BrowseOrganizations";
import HirePeople from "./pages/organization/HirePeople";
import TeamMembers from "./pages/organization/TeamMembers";
import UserProfile from "./pages/organization/UserProfile";
import JobPosts from "./pages/organization/JobPosts";
import Candidates from "./pages/organization/Candidates";
import InterviewManagement from "./pages/organization/InterviewManagement";
import InterviewAnalysis from "./pages/InterviewAnalysis";
import Pipeline from "./pages/organization/Pipeline";
import OrganizationAnalytics from "./pages/organization/OrganizationAnalytics";
import Reports from "./pages/organization/Reports";
import Integrations from "./pages/organization/Integrations";
import Insights from "./pages/organization/Insights";
import AIAgents from "./pages/organization/AIAgents";
import InterviewRoom from "./pages/InterviewRoom";

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
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/status" element={<SystemStatus />} />
          <Route path="/community" element={<Community />} />
          <Route path="/cookies" element={<CookiesPolicy />} />

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
            path="/jobs"
            element={
              <ProtectedRoute>
                <BrowseJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetails />
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
            path="/jobs/applied"
            element={
              <ProtectedRoute>
                <AppliedJobs />
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
            path="/interview/:interviewId/analysis"
            element={
              <ProtectedRoute>
                <InterviewAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/interviews"
            element={
              <ProtectedRoute>
                <InterviewManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/profile"
            element={
              <ProtectedRoute>
                <OrganizationProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/browse"
            element={
              <ProtectedRoute>
                <BrowseOrganizations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/profile/:orgId"
            element={
              <ProtectedRoute>
                <OrganizationProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/hire"
            element={
              <ProtectedRoute>
                <HirePeople />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/pipeline"
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/integrations"
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/insights"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/team"
            element={
              <ProtectedRoute>
                <TeamMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/user/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/jobs"
            element={
              <ProtectedRoute>
                <JobPosts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/ai-agents"
            element={
              <ProtectedRoute>
                <AIAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/candidates"
            element={
              <ProtectedRoute>
                <Candidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/pipeline"
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/analytics"
            element={
              <ProtectedRoute>
                <OrganizationAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/integrations"
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/insights"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:interviewId"
            element={
              <ProtectedRoute>
                <InterviewRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews/:interviewId/analysis"
            element={
              <ProtectedRoute>
                <InterviewAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <PracticeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/:sessionId"
            element={
              <ProtectedRoute>
                <PracticeRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-agents"
            element={
              <ProtectedRoute>
                <IndividualAIAgents />
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
          {/* 404 Route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
