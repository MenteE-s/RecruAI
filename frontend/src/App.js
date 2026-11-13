// src/App.js — route-level code splitting with a shared branded fallback.
// (A bare spinner per route was tried and reverted for feeling slow; the
// Suspense fallback below reuses the standard MenteeLoader instead.)
import React, { Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { ToastProvider, useToast } from "./components/ui/ToastContext";
import { ThemeProvider } from "./components/theme/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireOrganization from "./components/RequireOrganization";
import PageManagerLayout from "./components/page/PageManagerLayout";
import { AppShell, CenterBar } from "./components/layout/AppShell";
import { OrgAppShell } from "./components/layout/OrgAppShell";
import { verifyTokenWithServer, getBackendUrl, getAuthHeaders, getSafeNextPath, orgPath } from "./utils/auth";
import MenteeLoader from "./components/ui/MenteeLoader";
import socketService from "./utils/socket";

// Public Pages
const RecruAILanding = React.lazy(() => import("./pages/RecruAILanding"));
const Register = React.lazy(() => import("./pages/Register"));
const SignIn = React.lazy(() => import("./pages/SignIn"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const AcceptInvite = React.lazy(() => import("./pages/AcceptInvite"));
const ContactUs = React.lazy(() => import("./pages/ContactUs"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const Blog = React.lazy(() => import("./pages/Blog"));
const Careers = React.lazy(() => import("./pages/Careers"));
const SystemStatus = React.lazy(() => import("./pages/SystemStatus"));
const Community = React.lazy(() => import("./pages/Community"));
const CookiesPolicy = React.lazy(() => import("./pages/CookiesPolicy"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const PublicProfileBySlug = React.lazy(() => import("./pages/PublicProfileBySlug"));
// Dashboard Pages
const DashboardSwitcher = React.lazy(() => import("./pages/DashboardSwitcher"));
const SettingsSwitcher = React.lazy(() => import("./pages/SettingsSwitcher"));
const Profile = React.lazy(() => import("./pages/individual/Profile"));
const Jobs = React.lazy(() => import("./pages/individual/Jobs"));
const Analytics = React.lazy(() => import("./pages/individual/Analytics"));
const ResumeBuilder = React.lazy(() => import("./pages/individual/ResumeBuilder"));
const JobAlerts = React.lazy(() => import("./pages/individual/JobAlerts"));
// Career coaching lives at /in/coaching/* (Cvai* pages above), backed by the
// mentorship/quiz/project/interview APIs — not a separate mockup page.
const CvaiOverview = React.lazy(() => import("./pages/cvai/CvaiOverview"));
const CvaiSkills = React.lazy(() => import("./pages/cvai/CvaiSkills"));
const CvaiQuizzes = React.lazy(() => import("./pages/cvai/CvaiQuizzes"));
const CvaiProjects = React.lazy(() => import("./pages/cvai/CvaiProjects"));
const CvaiPlan = React.lazy(() => import("./pages/cvai/CvaiPlan"));
const CvaiInterviews = React.lazy(() => import("./pages/cvai/CvaiInterviews"));
const CvaiAuthoring = React.lazy(() => import("./pages/cvai/CvaiAuthoring"));
const JobDetails = React.lazy(() => import("./pages/individual/JobDetails"));
const MyNetwork = React.lazy(() => import("./pages/individual/MyNetwork"));
const Interviews = React.lazy(() => import("./pages/individual/Interviews"));
const PracticeDashboard = React.lazy(() => import("./pages/individual/PracticeDashboard"));
const PracticeRoom = React.lazy(() => import("./pages/individual/PracticeRoom"));
const IndividualAIAgents = React.lazy(() => import("./pages/individual/AIAgents"));
const ShareableProfiles = React.lazy(() => import("./pages/individual/ShareableProfiles"));
// Organization Pages
const OrganizationProfile = React.lazy(() => import("./pages/organization/Profile"));
const Billing = React.lazy(() => import("./pages/organization/Billing"));
const BrowseOrganizations = React.lazy(() => import("./pages/organization/BrowseOrganizations"));
const HirePeople = React.lazy(() => import("./pages/organization/HirePeople"));
const TeamMembers = React.lazy(() => import("./pages/organization/TeamMembers"));
const UserProfile = React.lazy(() => import("./pages/organization/UserProfile"));
const JobPosts = React.lazy(() => import("./pages/organization/JobPosts"));
const JobPostDetails = React.lazy(() => import("./pages/organization/JobPostDetails"));
const Candidates = React.lazy(() => import("./pages/organization/Candidates"));
const InterviewManagement = React.lazy(() => import("./pages/organization/InterviewManagement"));
const InterviewAnalysis = React.lazy(() => import("./pages/InterviewAnalysis"));
const Pipeline = React.lazy(() => import("./pages/organization/Pipeline"));
const OrganizationAnalytics = React.lazy(() => import("./pages/organization/OrganizationAnalytics"));
const Reports = React.lazy(() => import("./pages/organization/Reports"));
const Integrations = React.lazy(() => import("./pages/organization/Integrations"));
const Insights = React.lazy(() => import("./pages/organization/Insights"));
const AIAgents = React.lazy(() => import("./pages/organization/AIAgents"));
const CandidateAnalysis = React.lazy(() => import("./pages/organization/CandidateAnalysis"));
const InterviewRoom = React.lazy(() => import("./pages/InterviewRoom"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const InterviewDetail = React.lazy(() => import("./pages/individual/InterviewDetail"));

// Page Manager — the company-side back office for an individual account.
// PageManagerLayout owns the chrome + sidebar; the existing /organization/*
// pages render bare inside it (see DashboardLayout).
const CreatePage = React.lazy(() => import("./pages/page/CreatePage"));
const PageOverview = React.lazy(() => import("./pages/page/Overview"));
const PageProfileEditor = React.lazy(() => import("./pages/page/PageProfile"));
const PageVisibility = React.lazy(() => import("./pages/page/Visibility"));
const PageSettings = React.lazy(() => import("./pages/page/Settings"));

function RoleAwareWorkspaceRoute({ org, individual, fallback = null }) {
  const [role, setRole] = useState(
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null
  );
  const [loading, setLoading] = useState(!role);

  useEffect(() => {
    let cancelled = false;
    if (role) return undefined;
    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!cancelled) setRole(user?.role || localStorage.getItem("authRole") || null);
      } catch {
        if (!cancelled) setRole(localStorage.getItem("authRole") || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (loading) return fallback;
  if (role === "organization") return org;
  return individual;
}


function InterviewAnalysisRedirect() {
  const { interviewId } = useParams();
  return <Navigate to={`/in/interviews/${interviewId}/analysis`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("main").forEach((el) => el.scrollTo(0, 0))
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
    const controller = new AbortController();
    if (!orgId) return undefined;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/organizations/${orgId}`, {
          credentials: "include",
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("not found");
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (data?.slug) setSlug(data.slug);
        else setFailed(true);
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [orgId]);

  if (failed) return <Navigate to="/org/jobs" replace />;
  if (slug) return <Navigate to={orgPath({ slug, id: orgId })} replace />;
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
        if (user?.organization_id) setSlug(String(user.organization_id))
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true))
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
        socketService.connect();
        if (user.organization_id) socketService.joinOrg(user.organization_id);
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
      navigate(getSafeNextPath(location.search) || "/feed", { replace: true });
    }
  }, [navigate, location.pathname, location.search]);

  return null;
}

function RateLimitNotifier() {
  const { showToast } = useToast();
  useEffect(() => {
    const handler = (event) => {
      const seconds = Number(event.detail?.retryAfter) || 60;
      const wait = seconds < 60 ? `${seconds}s` : `${Math.ceil(seconds / 60)} min`;
      showToast({
        message: `Too many requests. Please wait ${wait} and try again.`,
        type: "error",
        position: "side",
        duration: 5000,
      });
    };
    window.addEventListener("recruai:rate-limited", handler);
    return () => window.removeEventListener("recruai:rate-limited", handler);
  }, [showToast]);
  return null;
}

function AuthExpiryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const handler = () => {
      const path = `${location.pathname}${location.search}`;
      if (["/signin", "/register", "/accept-invite", "/"].includes(location.pathname)) {
        return;
      }
      navigate(`/signin?next=${encodeURIComponent(path)}`, { replace: true });
    };
    window.addEventListener("recruai:auth-expired", handler);
    return () => window.removeEventListener("recruai:auth-expired", handler);
  }, [navigate, location.pathname, location.search]);
  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <ThemeProvider>
          <AuthVerifier />
          <AuthExpiryRedirect />
          <RateLimitNotifier />
          <ScrollToTop />
          <Suspense
            fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <MenteeLoader size={48} />
              </div>
            }
          >
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RecruAILanding />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
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
          {/* One interviews surface: legacy sub-routes land on the index tabs. */}
          <Route path="/in/interviews/upcoming" element={<Navigate to="/in/interviews" replace />} />
          <Route path="/in/interviews/history" element={<Navigate to="/in/interviews?tab=history" replace />} />
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
          <Route
            path="/in/coaching/authoring"
            element={
              <ProtectedRoute>
                <CvaiAuthoring />
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
                <RoleAwareWorkspaceRoute
                  org={<Navigate to="/org/billing" replace />}
                  individual={<Billing audience="individual" />}
                  fallback={<div className="min-h-[40vh] flex items-center justify-center"><MenteeLoader size={48} /></div>}
                />
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
                <RequireOrganization>
                  <InterviewManagement />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/browse"
            element={
              <ProtectedRoute>
                <RoleAwareWorkspaceRoute
                  org={<RequireOrganization><BrowseOrganizations audience="organization" /></RequireOrganization>}
                  individual={<BrowseOrganizations audience="individual" />}
                  fallback={<div className="min-h-[40vh] flex items-center justify-center"><MenteeLoader size={48} /></div>}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/hire"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <HirePeople />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/pipeline"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <Pipeline />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/reports"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <Reports />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/integrations"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <Integrations />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/insights"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <Insights />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/team"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <TeamMembers />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/user/:userId"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <UserProfile />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/candidate-analysis"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <CandidateAnalysis />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/candidate-analysis/:userId"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <CandidateAnalysis />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/jobs"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <JobPosts />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/jobs/:id"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <JobPostDetails />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/ai-agents"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <AIAgents />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/candidates"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <Candidates />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/billing"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <Billing />
                </RequireOrganization>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/analytics"
            element={
              <ProtectedRoute>
                <RequireOrganization>
                  <OrganizationAnalytics />
                </RequireOrganization>
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
                <RoleAwareWorkspaceRoute
                  org={
                    <RequireOrganization>
                      <OrgAppShell title="Organization">
                        <OrganizationProfile embedded />
                      </OrgAppShell>
                    </RequireOrganization>
                  }
                  individual={
                    <AppShell>
                      <CenterBar title="Organization" backTo="/org/browse" backLabel="Back to organizations" />
                      <OrganizationProfile embedded backTo="/org/browse" backLabel="Back to organizations" />
                    </AppShell>
                  }
                  fallback={<div className="min-h-[40vh] flex items-center justify-center"><MenteeLoader size={48} /></div>}
                />
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
                <PageManagerLayout>
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
                <PageManagerLayout>
                  <Candidates />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/interviews"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <InterviewManagement />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/pipeline"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <Pipeline />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/analytics"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <OrganizationAnalytics />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/agents"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <AIAgents />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/team"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <TeamMembers />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/page/billing"
            element={
              <ProtectedRoute>
                <PageManagerLayout>
                  <Billing />
                </PageManagerLayout>
              </ProtectedRoute>
            }
          />
          {/* Public profile by slug. LAST of the /in routes: every static /in/*
              segment above wins, so a slug can never shadow a real page. */}
          <Route path="/in/:slug" element={<PublicProfileBySlug />} />
          {/* Public profile by slug — kept last so static routes win. */}
          <Route path="/:slug" element={<PublicProfileBySlug />} />
          {/* 404 Route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ThemeProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
