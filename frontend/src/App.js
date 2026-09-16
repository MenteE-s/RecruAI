// src/App.js — code-split + deduped routes for fast initial load.
import React, { Suspense, lazy, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import "./App.css";
import { ToastProvider } from "./components/ui/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Eager only for the tiny shell. Every page below is a separate chunk so the
// first paint downloads ~1 route instead of all 40+ pages.
const RecruAILanding = lazy(() => import("./pages/RecruAILanding"));
const Register = lazy(() => import("./pages/Register"));
const SignIn = lazy(() => import("./pages/SignIn"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const Community = lazy(() => import("./pages/Community"));
const CookiesPolicy = lazy(() => import("./pages/CookiesPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const DashboardSwitcher = lazy(() => import("./pages/DashboardSwitcher"));
const SettingsSwitcher = lazy(() => import("./pages/SettingsSwitcher"));
const Profile = lazy(() => import("./pages/individual/Profile"));
const UpcomingInterviews = lazy(() => import("./pages/individual/UpcomingInterviews"));
const InterviewHistory = lazy(() => import("./pages/individual/InterviewHistory"));
const SavedJobs = lazy(() => import("./pages/individual/SavedJobs"));
const AppliedJobs = lazy(() => import("./pages/individual/AppliedJobs"));
const Analytics = lazy(() => import("./pages/individual/Analytics"));
const ResumeBuilder = lazy(() => import("./pages/individual/ResumeBuilder"));
const JobAlerts = lazy(() => import("./pages/individual/JobAlerts"));
const CareerCoaching = lazy(() => import("./pages/individual/CareerCoaching"));
const JobDetails = lazy(() => import("./pages/individual/JobDetails"));
const MyNetwork = lazy(() => import("./pages/individual/MyNetwork"));
const PracticeDashboard = lazy(() => import("./pages/individual/PracticeDashboard"));
const PracticeRoom = lazy(() => import("./pages/individual/PracticeRoom"));
const IndividualAIAgents = lazy(() => import("./pages/individual/AIAgents"));
const ShareableProfiles = lazy(() => import("./pages/individual/ShareableProfiles"));
const OrganizationProfile = lazy(() => import("./pages/organization/Profile"));
const Billing = lazy(() => import("./pages/organization/Billing"));
const BrowseOrganizations = lazy(() => import("./pages/organization/BrowseOrganizations"));
const HirePeople = lazy(() => import("./pages/organization/HirePeople"));
const TeamMembers = lazy(() => import("./pages/organization/TeamMembers"));
const UserProfile = lazy(() => import("./pages/organization/UserProfile"));
const JobPosts = lazy(() => import("./pages/organization/JobPosts"));
const JobPostDetails = lazy(() => import("./pages/organization/JobPostDetails"));
const Candidates = lazy(() => import("./pages/organization/Candidates"));
const InterviewManagement = lazy(() => import("./pages/organization/InterviewManagement"));
const InterviewAnalysis = lazy(() => import("./pages/InterviewAnalysis"));
const Pipeline = lazy(() => import("./pages/organization/Pipeline"));
const OrganizationAnalytics = lazy(() => import("./pages/organization/OrganizationAnalytics"));
const Reports = lazy(() => import("./pages/organization/Reports"));
const Integrations = lazy(() => import("./pages/organization/Integrations"));
const Insights = lazy(() => import("./pages/organization/Insights"));
const AIAgents = lazy(() => import("./pages/organization/AIAgents"));
const CandidateAnalysis = lazy(() => import("./pages/organization/CandidateAnalysis"));
const InterviewRoom = lazy(() => import("./pages/InterviewRoom"));
const Notifications = lazy(() => import("./pages/Notifications"));
const InterviewDetail = lazy(() => import("./pages/individual/InterviewDetail"));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-blue-600 rounded-full" />
    </div>
  );
}

function InterviewAnalysisRedirect() {
  const { interviewId } = useParams();
  return <Navigate to={`/interviews/${interviewId}/analysis`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("main").forEach((el) => el.scrollTo(0, 0));
  }, [pathname]);
  return null;
}

function AuthVerifier() {
  const navigate = useNavigate();
  const location = useLocation();
  const didInit = useRef(false);

  // One network verify per page load (cached 90s + single-flight in auth.js).
  // Previously this ran on EVERY location change -> GET /api/auth/me waterfall.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    let mounted = true;
    (async () => {
      try {
        const { verifyTokenWithServer } = await import("./utils/auth");
        const socketService = (await import("./utils/socket")).default;
        const user = await verifyTokenWithServer();
        if (!mounted || !user) return;
        const token = localStorage.getItem("access_token");
        if (token) {
          socketService.connect(token);
          if (user.organization_id) socketService.joinOrg(user.organization_id);
        }
      } catch {
        // ignore — pages handle their own auth via ProtectedRoute
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cheap client-side redirect, no network: only when we already know auth state.
  useEffect(() => {
    if (
      (location.pathname === "/signin" || location.pathname === "/register") &&
      localStorage.getItem("isAuthenticated") === "true"
    ) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthVerifier />
        <ScrollToTop />
        <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RecruAILanding />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
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
            path="/network"
            element={
              <ProtectedRoute>
                <MyNetwork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
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
          <Route path="/jobs" element={<Navigate to="/dashboard" replace />} />
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
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:interviewId/analysis"
            element={
              <ProtectedRoute>
                <InterviewAnalysisRedirect />
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
            path="/organization/candidate-analysis"
            element={
              <ProtectedRoute>
                <CandidateAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/candidate-analysis/:userId"
            element={
              <ProtectedRoute>
                <CandidateAnalysis />
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
            path="/organization/jobs/:id"
            element={
              <ProtectedRoute>
                <JobPostDetails />
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
            path="/organization/billing"
            element={
              <ProtectedRoute>
                <Billing />
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
            path="/interviews/:interviewId"
            element={
              <ProtectedRoute>
                <InterviewDetail />
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
            path="/shareable-profiles"
            element={
              <ProtectedRoute>
                <ShareableProfiles />
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
          {/* Public profile by slug — kept last so static routes win. */}
          <Route path="/:slug" element={<PublicProfile />} />
          {/* 404 Route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </ToastProvider>
    </Router>
  );
}

export default App;
