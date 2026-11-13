import React from "react";
import { FiBriefcase, FiCheck, FiUser, FiX } from "react-icons/fi";

const segments = [
  {
    title: "Job Seekers",
    subtitle: "Students, Graduates & Experienced Professionals in Pakistan & Gulf",
    icon: FiUser,
    iconIsBrand: true,
    benefits: [
      "Find your perfect job with AI semantic matching",
      "CV optimization with ATS scoring and rewrite recommendations",
      "Curated roles across Karachi, Lahore, Islamabad, Dubai, Riyadh & Doha",
      "Unlimited AI mock interviews with instant voice and text evaluation",
      "Targeted feedback across technical depth, clarity, and structure",
      "One-click applications and direct interview invitations",
    ],
    painPoints: [
      "Expensive private career coaching with generic advice",
      "No structured technical or behavioral interview practice",
      "Unclear why applications get dropped by automated ATS filters",
    ],
  },
  {
    title: "Organizations",
    subtitle: "Startups, Growth Scale-ups & Enterprise Hiring Teams",
    icon: FiBriefcase,
    iconIsBrand: false,
    benefits: [
      "Publish jobs across Pakistan and Gulf talent networks",
      "Search and rank candidates using pgvector semantic similarity",
      "Send automated screening invites with custom question banks",
      "Comprehensive AI screening summaries before human rounds",
      "Collaborative ATS pipeline with team review rubrics",
      "Transparent hire and onboarding tracking",
    ],
    painPoints: [
      "Hundreds of hours spent on manual resume screening",
      "Repetitive first-round screening calls with unqualified candidates",
      "Subjective evaluation criteria and hiring bias across teams",
    ],
  },
];

const CustomerSegments = () => {
  return (
    <section className="py-20 sm:py-24 bg-surface dark:bg-gray-0 border-t border-line dark:border-gray-800">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
            Tailored Experiences
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            Built for{" "}
            <span className="text-brand-text">Everyone</span>{" "}
            in the Hiring Journey
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A cohesive platform designed to align candidate ambition with recruiter precision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-s5 transition-colors hover:border-brand/40"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-s5 shrink-0 ${
                    segment.iconIsBrand
                      ? "bg-brand text-white"
                      : "border border-line bg-gray-100 dark:bg-gray-25 text-ink"
                  }`}
                >
                  <segment.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">
                    {segment.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 leading-snug">
                    {segment.subtitle}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-ink mb-3 uppercase tracking-wider">
                  What You Get
                </h4>
                <ul className="space-y-2.5">
                  {segment.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
                        <FiCheck className="h-3 w-3 text-brand-text" strokeWidth={2.4} />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-line">
                <h4 className="text-xs font-semibold text-ink mb-3 uppercase tracking-wider">
                  Problems We Solve
                </h4>
                <ul className="space-y-2.5">
                  {segment.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <FiX className="h-3 w-3 text-red-500" strokeWidth={2.4} />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                        {pain}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerSegments;
