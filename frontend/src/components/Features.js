import React from "react";
import {
  Award,
  BarChart2,
  Bell,
  Briefcase,
  CheckCircle2,
  Cpu,
  FileText,
  Layers,
  PlusCircle,
  Search,
  Send,
  User,
  Users,
} from "lucide-react";

/* ─── Feature data ─────────────────────────────────────────── */

const forJobSeekers = [
  {
    icon: Briefcase,
    title: "Find your perfect job",
    description:
      "AI-matched roles across Pakistan, UAE, Saudi Arabia, Qatar & the Gulf based on verified capabilities.",
  },
  {
    icon: FileText,
    title: "CV optimization with AI",
    description:
      "Upload your CV for real-time ATS scoring, keyword alignment for Gulf employers, and actionable fixes.",
  },
  {
    icon: User,
    title: "Verified skill profile",
    description:
      "Showcase experience, assessments, and verified credentials so employers find and contact you directly.",
  },
  {
    icon: Cpu,
    title: "Practice mock interviews",
    description:
      "Run realistic AI-powered mock interviews with instant feedback on clarity, structure, and technical depth.",
  },
  {
    icon: BarChart2,
    title: "Track interview analytics",
    description:
      "Review detailed performance scorecards, speech clarity ratings, and personalized improvement roadmaps.",
  },
  {
    icon: Award,
    title: "Career milestones and badges",
    description:
      "Showcase verified achievements and track your progress from initial application to final offer.",
  },
  {
    icon: Bell,
    title: "Job alerts and invitations",
    description:
      "Receive targeted alerts when matching roles open, and receive direct interview invites from verified teams.",
  },
];

const forOrganizations = [
  {
    icon: PlusCircle,
    title: "Post and distribute jobs",
    description:
      "Publish job posts reaching thousands of qualified software engineers, designers, and domain specialists.",
  },
  {
    icon: Search,
    title: "Semantic candidate search",
    description:
      "Query candidate vectors using natural language and skill requirements without rigid keyword filters.",
  },
  {
    icon: Send,
    title: "Direct interview invites",
    description:
      "Invite pre-screened talent into automated video or live interview rooms with single-click scheduling.",
  },
  {
    icon: Cpu,
    title: "Automated AI screening",
    description:
      "Standardize initial candidate evaluations with unbiased AI question sets and comprehensive reports.",
  },
  {
    icon: Layers,
    title: "Pipeline and team ATS",
    description:
      "Collaborative kanban pipelines, team scoring rubrics, and automated status transitions in one view.",
  },
  {
    icon: CheckCircle2,
    title: "Offer and onboarding tracking",
    description:
      "Track candidate acceptances, timestamp milestones, and build high-retention regional talent networks.",
  },
];

/* ─── Mini illustration: AI Job Matching ───────────────────────────────── */

const JobMatchIllustration = () => {
  const matches = [
    { pct: 95, label: "Senior React engineer", color: "bg-brand" },
    { pct: 87, label: "Full-stack developer", color: "bg-brand/70" },
    { pct: 82, label: "Frontend engineer", color: "bg-brand/50" },
  ];

  return (
    <div className="mt-5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-4 space-y-3">
      {/* header row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-ink">AI match score</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-500">Today · Gulf region</span>
      </div>

      {matches.map(({ pct, label, color }) => (
        <div key={pct} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-ink">{label}</span>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-brand-text">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-50/20 overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}

      {/* filler rows */}
      <div className="pt-1 space-y-2">
        {[62, 48].map((w) => (
          <div key={w} className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-50/20" style={{ width: `${w}%` }} />
            <div className="h-1.5 w-8 rounded-full bg-gray-100 dark:bg-gray-50/20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Mini illustration: Semantic Candidate Search ─────────────────────── */

const SemanticSearchIllustration = () => {
  const candidates = [
    { initials: "SA", color: "bg-brand", skills: ["React", "Node.js"], match: "96%" },
    { initials: "MK", color: "bg-brand",    skills: ["Python", "ML"],      match: "91%" },
    { initials: "FQ", color: "bg-gray-600",   skills: ["Go", "DevOps"],      match: "88%" },
  ];

  return (
    <div className="mt-5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-4 space-y-2.5">
      {/* search bar mock */}
      <div className="flex items-center gap-2 rounded-lg border border-line dark:border-gray-800 bg-gray-50/80 dark:bg-gray-50/10 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.8} />
        <span className="text-[11px] text-gray-500 dark:text-gray-500 truncate">
          Senior engineer, React, remote Gulf
        </span>
      </div>

      {/* candidate rows — 12px row padding */}
      {candidates.map(({ initials, color, skills, match }) => (
        <div
          key={initials}
          className="flex items-center gap-3 rounded-lg border border-line dark:border-gray-800 bg-surface dark:bg-gray-50/20 px-3 py-3"
        >
          {/* avatar */}
          <div
            className={`w-7 h-7 rounded-full ${color} flex items-center justify-center shrink-0`}
          >
            <span className="text-[9px] font-mono font-bold text-white">{initials}</span>
          </div>

          {/* skills */}
          <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-md border border-brand/30 bg-brand/10 dark:bg-brand/15 px-1.5 py-0.5 text-[9px] font-semibold text-brand-text"
              >
                {s}
              </span>
            ))}
          </div>

          {/* match badge */}
          <span className="text-[10px] font-mono tabular-nums font-semibold text-brand-text shrink-0">
            {match}
          </span>
        </div>
      ))}

      {/* filler row */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-50/20 shrink-0" />
        <div className="flex gap-1.5 flex-1">
          <div className="h-4 w-10 rounded-md bg-gray-100 dark:bg-gray-50/20" />
          <div className="h-4 w-14 rounded-md bg-gray-100 dark:bg-gray-50/20" />
        </div>
        <div className="h-3 w-6 rounded bg-gray-100 dark:bg-gray-50/20" />
      </div>
    </div>
  );
};

/* ─── Shared: small feature tile ───────────────────────────────────────── */

const SmallTile = ({ icon: Icon, title, description, accent = false }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 shadow-s5 p-5 hover:border-brand/30 transition-colors">
    <div
      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        accent
          ? "bg-brand/10 border border-brand/20 text-brand-text"
          : "bg-gray-100 dark:bg-gray-50/20 border border-line dark:border-gray-800 text-ink"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
    </div>
    <div>
      <div className="text-sm font-semibold text-ink mb-1">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
        {description}
      </div>
    </div>
  </div>
);

/* ─── Main component ────────────────────────────────────────────────────── */

const Features = () => {
  /* Split each array: index 0 is the "hero" tile, the rest go into the sub-grid */
  const seekerHero = forJobSeekers[0]; // "Find your perfect job" / AI match
  const seekerRest = forJobSeekers.slice(1);

  const orgHero = forOrganizations[1]; // "Semantic candidate search"
  const orgRest = [...forOrganizations.slice(0, 1), ...forOrganizations.slice(2)];

  return (
    <section id="features" className="py-20 sm:py-24 bg-surface dark:bg-gray-0 border-t border-line dark:border-gray-800">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
            Platform capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            Built for{" "}
            <span className="text-brand-text">job seekers</span>
            {" "}and{" "}
            <span className="text-brand-text">organizations</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From CV optimization to semantic candidate matching and AI mock interviews — engineered for Pakistan and the Gulf.
          </p>
        </div>

        {/* Two-column bento layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── For Job Seekers ── */}
          <div className="flex flex-col gap-4">

            {/* Column label */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-brand text-white flex items-center justify-center rounded-xl shadow-s5 shrink-0">
                <User className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">For job seekers</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-500">Everything you need to advance your career</div>
              </div>
            </div>

            {/* Hero tile — AI Job Matching */}
            <div className="rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 shadow-s5 p-5">
              {/* tile icon + title */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text shrink-0">
                  <seekerHero.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{seekerHero.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed mt-0.5">
                    {seekerHero.description}
                  </div>
                </div>
              </div>

              {/* Product illustration */}
              <JobMatchIllustration />
            </div>

            {/* Sub-grid: remaining seeker features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seekerRest.map((f, i) => (
                <SmallTile
                  key={i}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                  accent
                />
              ))}
            </div>
          </div>

          {/* ── For Organizations ── */}
          <div className="flex flex-col gap-4">

            {/* Column label */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-50/20 border border-line dark:border-gray-800 flex items-center justify-center rounded-xl shadow-s5 shrink-0">
                <Users className="h-4 w-4 text-ink" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">For organizations</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-500">Smarter recruitment pipelines without manual overhead</div>
              </div>
            </div>

            {/* Hero tile — Semantic Candidate Search */}
            <div className="rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 shadow-s5 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-50/20 border border-line dark:border-gray-800 flex items-center justify-center text-ink shrink-0">
                  <orgHero.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{orgHero.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed mt-0.5">
                    {orgHero.description}
                  </div>
                </div>
              </div>

              {/* Product illustration */}
              <SemanticSearchIllustration />
            </div>

            {/* Sub-grid: remaining org features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orgRest.map((f, i) => (
                <SmallTile
                  key={i}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;
