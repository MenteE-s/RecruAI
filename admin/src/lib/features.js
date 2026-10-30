// Keep the admin override pickers in sync with backend/utils/subscription.py.
export const INDIVIDUAL_FEATURE_KEYS = [
  "profile_management",
  "job_search",
  "basic_matching",
  "cvai_skill_assessment",
  "cvai_quizzes",
  "cvai_projects",
  "cvai_mentorship",
  "cvai_mock_interview",
  "career_coaching",
  "practice_ai_agents",
];

export const ORGANIZATION_FEATURE_KEYS = [
  "profile_management",
  "job_posting",
  "basic_matching",
  "team_management",
  "ai_screening",
  "ai_interview_agents",
  "analytics",
  "reports",
];

export const ALL_FEATURE_KEYS = Array.from(
  new Set([...INDIVIDUAL_FEATURE_KEYS, ...ORGANIZATION_FEATURE_KEYS]),
);
