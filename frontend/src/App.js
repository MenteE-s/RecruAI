// src/App.js — eager imports: one bundle, instant client-side navigation.
// (Route-level code-splitting was tried and reverted: per-route chunks put a
// loading spinner on every first page visit, which felt much slower.)
import React, { useEffect, useRef, useState } from "react";
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

// Public Pages
import RecruAILanding from "./pages/RecruAILanding";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import ContactUs from "./pages/ContactUs";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import SystemStatus from "./pages/SystemStatus";
import Community from "./pages/Community";
import CookiesPolicy from "./pages/CookiesPolicy";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import SearchResults from "./pages/SearchResults";
import PublicProfileBySlug from "./pages/PublicProfileBySlug";
// Dashboard Pages
import DashboardSwitcher from "./pages/DashboardSwitcher";
import SettingsSwitcher from "./pages/SettingsSwitcher";
import Profile from "./pages/individual/Profile";
import UpcomingInterviews from "./pages/individual/UpcomingInterviews";
import InterviewHistory from "./pages/individual/InterviewHistory";
import Jobs from "./pages/individual/Jobs";
import Analytics from "./pages/individual/Analytics";
import ResumeBuilder from "./pages/individual/ResumeBuilder";
import JobAlerts from "./pages/individual/JobAlerts";
// CareerCoaching.jsx was the old hardcoded coaching mockup (a fictional coach,
// fabricated session counts). Its route now serves the real product; the file is
// kept only until the sidebar removal decides nothing still wants it.
import CvaiOverview from "./pages/cvai/CvaiOverview";
import CvaiSkills from "./pages/cvai/CvaiSkills";
import CvaiQuizzes from "./pages/cvai/CvaiQuizzes";
import CvaiProjects from "./pages/cvai/CvaiProjects";
import CvaiPlan from "./pages/cvai/CvaiPlan";
import CvaiInterviews from "./pages/cvai/CvaiInterviews";
import JobDetails from "./pages/individual/JobDetails";
import MyNetwork from "./pages/individual/MyNetwork";
import Interviews from "./pages/individual/Interviews";
import PracticeDashboard from "./pages/individual/PracticeDashboard";
import PracticeRoom from "./pages/individual/PracticeRoom";
import IndividualAIAgents from "./pages/individual/AIAgents";
import ShareableProfiles from "./pages/individual/ShareableProfiles";
// Organization Pages
import OrganizationProfile from "./pages/organization/Profile";
import Billing from "./pages/organization/Billing";
import BrowseOrganizations from "./pages/organization/BrowseOrganizations";
import HirePeople from "./pages/organization/HirePeople";
import TeamMembers from "./pages/organization/TeamMembers";
import UserProfile from "./pages/organization/UserProfile";
import JobPosts from "./pages/organization/JobPosts";
import JobPostDetails from "./pages/organization/JobPostDetails";
import Candidates from "./pages/organization/Candidates";
import InterviewManagement from "./pages/organization/InterviewManagement";
import InterviewAnalysis from "./pages/InterviewAnalysis";
import Pipeline from "./pages/organization/Pipeline";
import OrganizationAnalytics from "./pages/organization/OrganizationAnalytics";
import Reports from "./pages/organization/Reports";
import Integrations from "./pages/organization/Integrations";
import Insights from "./pages/organization/Insights";
import AIAgents from "./pages/organization/AIAgents";
import CandidateAnalysis from "./pages/organization/CandidateAnalysis";
import InterviewRoom from "./pages/InterviewRoom";
import Notifications from "./pages/Notifications";
import InterviewDetail from "./pages/individual/InterviewDetail";

// Page Manager — the company-side back office for an individual account.
// PageManagerLayout owns the chrome + sidebar; the existing /organization/*
// pages render bare inside it (see DashboardLayout).
import PageManagerLayout from "./components/page/PageManagerLayout";
import CreatePage from "./pages/page/CreatePage";
import PageOverview from "./pages/page/Overview";
import PageProfileEditor from "./pages/page/PageProfile";
import PageVisibility from "./pages/page/Visibility";
import PageSettings from "./pages/page/Settings";

import { verifyTokenWithServer } from "./utils/auth";
import { getBackendUrl, getAuthHeaders } from "./utils/auth";
import MenteeLoader from "./components/ui/MenteeLoader";
import socketService from "./utils/socket";

function InterviewAnalysisRedirect() {
  const { interviewId } = useParams();
  return <Navigate to={`/in/interviews/${interviewId}/analysis`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("main").forEach((el) => el.scrollTo(0, 0));
  }, [pathname]);
  return null;
}

/**
 * Old-URL redirects for the /organization/* -> /org/* slug rename.
 *
 * Bookmarks, emails and shared interview links already in circulation point at
 * /organization/*. Rather than break them, swap the prefix and keep the rest of
 * the path (including params) intact.
 *
 * Must be declared ABOVE the /:slug public-profile catch-all, otherwise
 * "/organization/team" would be captured as a profile slug.
 */
function LegacyOrgRedirect() {
  const location = useLocation();
  const rest = location.pathname.slice("/organization".length);
  return <Navigate to={`/org${rest}${location.search}`} replace />;
}

/**
 * Root -> /in/* redirects for the personal-side move.
 *
 * Kept as wildcards so nested paths survive: /jobs/saved -> /in/jobs/saved,
 * /resume/builder -> /in/resume/builder. Params and the query string are
 * preserved so shared application links keep resolving.
 */
function LegacyPersonalRedirect({ prefix }) {
  const location = useLocation();
  const rest = location.pathname.slice(prefix.length);
  return <Navigate to={`/in${prefix}${rest}${location.search}`} replace />;
}

/**
 * /org/profile/:id -> /org/<slug>
 *
 * The old URL embedded a database id. Resolving it needs a fetch, so this
 * shows a spinner rather than pretending it can redirect synchronously.
 */
function LegacyOrgIdRedirect() {
  const { orgId } = useParams();
  const [slug, setSlug] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!orgId) return;
    fetch(`${getBackendUrl()}/api/organizations/${orgId}`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.slug) setSlug(d.slug);
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [orgId]);

  if (slug) return <Navigate to={`/org/${slug}`} replace />;
  if (failed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-sm text-gray-600">That company page could not be found.</p>
      </div>
    );
  }
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <MenteeLoader size={48} />
    </div>
  );
}

/** /org/profile -> the slug of the caller's own company page. */
function LegacyOwnOrgRedirect() {
  const [slug, setSlug] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    verifyTokenWithServer({ forceRefresh: true })
      .then((user) => {
        if (cancelled) return;
        if (user?.organization_id) setSlug(String(user.organization_id));
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, []);

  const [ownSlug, setOwnSlug] = useState(null);
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`${getBackendUrl()}/api/organizations/${slug}`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.slug) setOwnSlug(d.slug); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug]);

  if (ownSlug) return <Navigate to={`/org/${ownSlug}`} replace />;
  if (failed) return <Navigate to="/feed" replace />;
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <MenteeLoader size={48} />
    </div>
  );
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
      navigate("/feed", { replace: true });
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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RecruAILanding />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />
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
            path="/feed"
            element={
              <ProtectedRoute>
                <DashboardSwitcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/network"
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
            path="/in/interviews"
            element={
              <ProtectedRoute>
                <Interviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/interviews/upcoming"
            element={
              <ProtectedRoute>
                <UpcomingInterviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/interviews/history"
            element={
              <ProtectedRoute>
                <InterviewHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route path="/in/jobs/saved" element={<Navigate to="/in/jobs" replace />} />
          <Route path="/in/jobs/applied" element={<Navigate to="/in/jobs?tab=applied" replace />} />
          {/* Title slug, e.g. /in/jobs/software-engineer. The backend also
              accepts a numeric id on this path, so existing links keep working
              with no redirect hop. Declared after the static segments above. */}
          <Route
            path="/in/jobs/:slug"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/resume/builder"
            element={
              <ProtectedRoute>
                <ResumeBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/jobs/alerts"
            element={
              <ProtectedRoute>
                <JobAlerts />
              </ProtectedRoute>
            }
          />
          {/* Career Coaching: a separate page per capability, not tabs inside a
              dashboard. They are different kinds of work — measure, be tested,
              build, follow — so each gets its own page and its own URL.
              Mock interviews will join this list when C3 lands. */}
          <Route
            path="/in/coaching"
            element={
              <ProtectedRoute>
                <CvaiOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/coaching/skills"
            element={
              <ProtectedRoute>
                <CvaiSkills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/coaching/quizzes"
            element={
              <ProtectedRoute>
                <CvaiQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/coaching/projects"
            element={
              <ProtectedRoute>
                <CvaiProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/coaching/plan"
            element={
              <ProtectedRoute>
                <CvaiPlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/coaching/interviews"
            element={
              <ProtectedRoute>
                <CvaiInterviews />
              </ProtectedRoute>
            }
          />
          {/* Old CVAI paths, so any link already in circulation still lands
              somewhere real rather than 404ing. */}
          <Route path="/in/cvai/*" element={<Navigate to="/in/coaching" replace />} />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/interview/:interviewId/analysis"
            element={
              <ProtectedRoute>
                <InterviewAnalysisRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/interviews"
            element={
              <ProtectedRoute>
                <InterviewManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/browse"
            element={
              <ProtectedRoute>
                <BrowseOrganizations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/hire"
            element={
              <ProtectedRoute>
                <HirePeople />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/pipeline"
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/integrations"
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/insights"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/team"
            element={
              <ProtectedRoute>
                <TeamMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/user/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/candidate-analysis"
            element={
              <ProtectedRoute>
                <CandidateAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/candidate-analysis/:userId"
            element={
              <ProtectedRoute>
                <CandidateAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/jobs"
            element={
              <ProtectedRoute>
                <JobPosts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/jobs/:id"
            element={
              <ProtectedRoute>
                <JobPostDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/ai-agents"
            element={
              <ProtectedRoute>
                <AIAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/candidates"
            element={
              <ProtectedRoute>
                <Candidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/analytics"
            element={
              <ProtectedRoute>
                <OrganizationAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/interview/:interviewId"
            element={
              <ProtectedRoute>
                <InterviewRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/interviews/analysis"
            element={<Navigate to="/in/analytics" replace />}
          />
          <Route
            path="/in/interviews/:interviewId/analysis"
            element={
              <ProtectedRoute>
                <InterviewAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/interviews/:interviewId"
            element={
              <ProtectedRoute>
                <InterviewDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/practice"
            element={
              <ProtectedRoute>
                <PracticeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/practice/:sessionId"
            element={
              <ProtectedRoute>
                <PracticeRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/ai-agents"
            element={
              <ProtectedRoute>
                <IndividualAIAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/in/shareable-profiles"
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
          {/* Backwards compatibility for the /individual-ish root -> /in/*
              move. These are one-segment paths that used to live at the root. */}
          <Route path="/profile" element={<Navigate to="/in/profile" replace />} />
          <Route path="/jobs/*" element={<LegacyPersonalRedirect prefix="/jobs" />} />
          <Route path="/network" element={<Navigate to="/in/network" replace />} />
          <Route path="/analytics" element={<Navigate to="/in/analytics" replace />} />
          <Route path="/coaching" element={<Navigate to="/in/coaching" replace />} />
          {/* Legacy unprefixed CVAI paths, kept so old links still land somewhere sane. */}
          <Route path="/cvai/*" element={<Navigate to="/in/coaching" replace />} />
          <Route path="/resume/*" element={<LegacyPersonalRedirect prefix="/resume" />} />
          <Route path="/practice/*" element={<LegacyPersonalRedirect prefix="/practice" />} />
          <Route path="/ai-agents" element={<Navigate to="/in/ai-agents" replace />} />
          <Route path="/shareable-profiles" element={<Navigate to="/in/shareable-profiles" replace />} />
          <Route path="/interviews/*" element={<LegacyPersonalRedirect prefix="/interviews" />} />
          <Route path="/interview/*" element={<LegacyPersonalRedirect prefix="/interview" />} />

          {/* /dashboard -> /feed rename. */}
          <Route path="/dashboard" element={<Navigate to="/feed" replace />} />

          {/* Company pages by slug: /org/<slug>. Declared AFTER every static
              /org/* segment so a slug can never shadow a real page. */}
          <Route
            path="/org/:slug"
            element={
              <ProtectedRoute>
                <OrganizationProfile />
              </ProtectedRoute>
            }
          />
          {/* Old company-page URLs -> the slug. */}
          <Route path="/org/profile" element={<LegacyOwnOrgRedirect />} />
          <Route path="/org/profile/:orgId" element={<LegacyOrgIdRedirect />} />

          {/* Backwards compatibility for the /organization/* -> /org/* rename.
              Above /:slug so it isn't swallowed as a profile slug. */}
          <Route path="/organization/*" element={<LegacyOrgRedirect />} />
          {/* Page Manager. Must stay ABOVE the /:slug catch-all. */}
          <Route
            path="/page"
            element={
              <ProtectedRoute>
                <PageOverview />
              </ProtectedRoute>
            }
          />
          {/* Its own screen, not a dialog — must be declared before /page/* 
              style paths are matched. */}
          <Route
            path="/page/create"
            element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/profile"
            element={
              <ProtectedRoute>
                <PageProfileEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/visibility"
            element={
              <ProtectedRoute>
                <PageVisibility />
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/settings"
            element={
              <ProtectedRoute>
                <PageSettings />
              </ProtectedRoute>
            }
          />
          {/* Reused org pages, now with the page-manager sidebar around them.
              Deliberately NOT redirecting /organization/* — existing bookmarks
              and emails keep working. */}
          <Route
            path="/page/posts"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Job posts" subtitle="Every role you've published.">
                  <JobPosts />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/posts/:id"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <JobPostDetails />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/candidates"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Candidates" subtitle="People you can hire.">
                  <Candidates />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/interviews"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Interviews" subtitle="Scheduled and completed sessions.">
                  <InterviewManagement />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/pipeline"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Pipeline" subtitle="Applications from applied to hired.">
                  <Pipeline />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/analytics"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Analytics" subtitle="How your hiring is performing.">
                  <OrganizationAnalytics />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/agents"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="AI agents" subtitle="Automations for your hiring process.">
                  <AIAgents />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/team"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Team members" subtitle="Who can administer this page.">
                  <TeamMembers />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/billing"
            element={
              <ProtectedRoute>
                <PageManagerLayout title="Billing" subtitle="Payment methods and invoices.">
                  <Billing />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          {/* Public profile by slug. LAST of the /in routes: every static /in/*
              segment above wins, so a slug can never shadow a real page. */}
          <Route path="/in/:slug" element={<PublicProfileBySlug />} />
          {/* Public profile by slug — kept last so static routes win. */}
          <Route path="/:slug" element={<PublicProfile />} />
          {/* 404 Route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
