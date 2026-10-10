import { getBackendUrl, getAuthHeaders } from "./auth";

/**
 * CVAI API client.
 *
 * One place that knows how to talk to the CVAI endpoints, so a page never
 * hand-builds a URL or forgets the auth header. Every function resolves to
 * { ok, status, data } rather than throwing: a lapsed subscription is a normal
 * outcome here, not an exception, and the pages show it as a lock rather than a
 * blank screen.
 */

async function request(method, path, body) {
  const options = { method, headers: getAuthHeaders() };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(`${getBackendUrl()}${path}`, options);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: String(err) } };
  }
}

const get = (path) => request("GET", path);
const post = (path, body) => request("POST", path, body ?? {});
const patch = (path, body) => request("PATCH", path, body ?? {});

export const cvai = {
  // --- skills ------------------------------------------------------------
  levels: () => get("/api/skills/levels"),
  taxonomy: (q = "") => get(`/api/skills/taxonomy${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  startAssessment: (skillSlug) => post("/api/skills/assessments", { skill_slug: skillSlug }),
  submitAssessment: (id, answers) => post(`/api/skills/assessments/${id}/submit`, { answers }),
  assessmentHistory: () => get("/api/skills/assessments"),

  // --- quizzes -----------------------------------------------------------
  quizzes: () => get("/api/quizzes"),
  quiz: (slug) => get(`/api/quizzes/${slug}`),
  startQuiz: (slug) => post(`/api/quizzes/${slug}/attempts`),
  submitQuiz: (id, answers) => post(`/api/quizzes/attempts/${id}/submit`, { answers }),
  quizAttempts: () => get("/api/quizzes/attempts"),

  // --- guided projects ---------------------------------------------------
  projects: () => get("/api/guided-projects"),
  project: (slug) => get(`/api/guided-projects/${slug}`),
  startProject: (slug) => post(`/api/guided-projects/${slug}/attempts`),
  saveProject: (id, body) => patch(`/api/guided-projects/attempts/${id}`, body),
  submitProject: (id, submission) =>
    post(`/api/guided-projects/attempts/${id}/submit`, { submission }),
  retryProjectReview: (id) => post(`/api/guided-projects/attempts/${id}/review`),
  projectAttempts: () => get("/api/guided-projects/attempts"),
  projectAttempt: (slug) => get(`/api/guided-projects/${slug}/attempts`),
  projectAttemptById: (id) => get(`/api/guided-projects/attempts/${id}`),

  // --- mock interviews ---------------------------------------------------
  interviewMeta: () => get("/api/mock-interviews/meta"),
  interviews: () => get("/api/mock-interviews"),
  interview: (id) => get(`/api/mock-interviews/${id}`),
  startInterview: (body) => post("/api/mock-interviews", body),
  answerInterview: (id, answer) => post(`/api/mock-interviews/${id}/answer`, { answer }),
  interviewFeedback: (id) => post(`/api/mock-interviews/${id}/feedback`),
  abandonInterview: (id) => post(`/api/mock-interviews/${id}/abandon`),

  // --- mentorship --------------------------------------------------------
  planOptions: () => get("/api/mentorship/plans/options"),
  plans: () => get("/api/mentorship/plans"),
  createPlan: (body) => post("/api/mentorship/plans", body),
  plan: (id) => get(`/api/mentorship/plans/${id}`),
  planProgress: (id) => get(`/api/mentorship/plans/${id}/progress`),
  setStep: (planId, stepId, status) =>
    patch(`/api/mentorship/plans/${planId}/steps/${stepId}`, { status }),
  suggestions: () => get("/api/mentorship/suggestions"),
  overallProgress: () => get("/api/mentorship/progress"),
};

// --- presentation ---------------------------------------------------------

/** A 403 is the shape of "you are not subscribed", which the pages show as a lock. */
export function isLocked(result) {
  return result?.status === 403;
}

/**
 * A 503 from a reviewer is not an error the learner caused. The backend keeps
 * their work and charges nothing, so the UI says so plainly rather than showing a
 * failure that invites them to try again immediately.
 */
export function isReviewerDown(result) {
  return result?.status === 503 && result?.data?.review_status === "unavailable";
}

export function messageOf(result, fallback = "Something went wrong.") {
  return result?.data?.message || result?.data?.error || fallback;
}

export const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "Expert"];

export function levelTone(level) {
  switch (level) {
    case "Expert":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Advanced":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Intermediate":
      return "bg-green-50 text-green-700 border-green-200";
    case "Beginner":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

/**
 * How strong a piece of evidence is, in the learner's own terms.
 *
 * A verified assessment is the only thing that earns the badge. Quizzes and
 * built projects are real work but prove less, and the UI says so rather than
 * dressing all three up the same.
 */
export function evidenceLabel(skill) {
  if (!skill) return "";
  if (skill.verified) return "Verified";
  switch (skill.evidence_source) {
    case "assessment":
      return "Assessed";
    case "quiz":
      return "Quiz";
    case "project":
      return "Project";
    case "self_declared":
      return "Self-declared";
    default:
      return "";
  }
}

export const VERDICT_TONE = {
  on_track: "text-green-700 bg-green-50 border-green-200",
  ahead: "text-green-700 bg-green-50 border-green-200",
  behind: "text-amber-700 bg-amber-50 border-amber-200",
  off_track: "text-red-700 bg-red-50 border-red-200",
  not_started: "text-gray-600 bg-gray-50 border-gray-200",
  completed: "text-green-700 bg-green-50 border-green-200",
};

export const VERDICT_LABEL = {
  on_track: "On track",
  ahead: "Ahead of schedule",
  behind: "Behind schedule",
  off_track: "Well behind",
  not_started: "Not started",
  completed: "Completed",
};

export const PRIORITY_TONE = {
  urgent: "border-red-300 bg-red-50",
  high: "border-amber-300 bg-amber-50",
  normal: "border-gray-200 bg-white",
  low: "border-gray-200 bg-white",
};

export function percent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Letter grade for a score, so a number is not the only signal. */
export function grade(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  if (n >= 60) return "D";
  return "E";
}
