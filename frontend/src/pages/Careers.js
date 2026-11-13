import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Compass,
  Heart,
  Mail,
  MapPin,
  TrendingUp,
  Clock,
} from "lucide-react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const openings = [
  {
    id: "eng-01",
    title: "Senior full-stack engineer",
    department: "Engineering",
    location: "Remote",
    region: "Pakistan / GCC",
    type: "Full-time",
    description:
      "Build scalable candidate and recruiter experiences. Work with React, Python/Flask, and pgvector semantic matching pipelines.",
    tags: ["React", "Python / Flask", "PostgreSQL", "pgvector"],
  },
  {
    id: "eng-02",
    title: "AI & machine learning engineer",
    department: "Engineering",
    location: "Remote",
    region: "Pakistan / GCC",
    type: "Full-time",
    description:
      "Develop and fine-tune language models for realistic interview simulations, candidate evaluation, and automated feedback.",
    tags: ["NLP", "PyTorch", "HuggingFace", "Embeddings"],
  },
  {
    id: "des-01",
    title: "Senior product designer",
    department: "Design",
    location: "Remote",
    region: "Worldwide",
    type: "Full-time",
    description:
      "Craft intuitive workflows for job seekers and recruiters. Shape the visual language, typography, and interaction craft of RecruAI.",
    tags: ["Design systems", "Figma", "UI craft", "Prototypes"],
  },
  {
    id: "mkt-01",
    title: "Growth marketing manager",
    department: "Marketing",
    location: "Remote",
    region: "Pakistan / GCC",
    type: "Full-time",
    description:
      "Drive candidate acquisition and organization engagement across Pakistan and the Gulf region.",
    tags: ["B2B SaaS", "Acquisition", "Lifecycle", "Analytics"],
  },
  {
    id: "ops-01",
    title: "Customer success lead",
    department: "Operations",
    location: "Remote",
    region: "Pakistan / GCC",
    type: "Full-time",
    description:
      "Onboard partner organizations, manage hiring workflows, and ensure teams maximize value from RecruAI.",
    tags: ["Talent acquisition", "ATS workflows", "Client onboarding"],
  },
];

const values = [
  {
    icon: Compass,
    title: "Innovation first",
    description:
      "We push boundaries in AI and recruitment technology. Every team member directly shapes how hiring happens in emerging markets.",
  },
  {
    icon: MapPin,
    title: "Remote-first culture",
    description:
      "Work from anywhere in Pakistan, the Gulf, or worldwide. We focus on impact, craft, and outcomes rather than hours at a desk.",
  },
  {
    icon: Heart,
    title: "Meaningful impact",
    description:
      "Your work helps thousands of candidates land life-changing roles and helps companies build fairer, faster hiring pipelines.",
  },
  {
    icon: TrendingUp,
    title: "Continuous growth",
    description:
      "We invest heavily in learning, professional development, and giving team members room to do the best work of their careers.",
  },
];

const teamStats = [
  { label: "Active openings", value: "5", sub: "Engineering & growth" },
  { label: "Team distribution", value: "100%", sub: "Remote-first setup" },
  { label: "Time zones supported", value: "PKT / GST", sub: "Pakistan & GCC" },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-surface text-ink transition-colors">
      <RecruAINavbar />

      {/* Hero */}
      <section className="border-b border-line bg-surface py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-semibold text-brand-text mb-4">
            <Briefcase className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>Join our team</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
            Build the future of{" "}
            <span className="text-brand-text">AI recruitment</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We are on a mission to transform how companies hire and how professionals prepare for their next career leap. Join us in building thoughtful AI tools.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#openings"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5"
            >
              <span>View open positions</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
            <a
              href="mailto:careers@menteeai.org"
              className="rounded-xl border border-line bg-surface px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
            >
              General inquiry
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Team Highlights Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {teamStats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5 transition-colors hover:border-brand/40"
            >
              <div className="font-mono tabular-nums text-3xl font-bold text-brand-text mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-ink mb-0.5">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {stat.sub}
              </div>
            </div>
          ))}
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
              Why work at <span className="text-brand-text">MenteE</span>?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
              We are building platforms that solve real problems for real people. Here is what anchors our culture.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((val, index) => (
              <div
                key={index}
                className="rounded-xl border border-line bg-surface p-6 shadow-s5 transition-colors hover:border-brand/40"
              >
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text mb-4">
                  <val.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">
                  {val.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section id="openings" className="mb-16 border-t border-line pt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-gray-100 dark:bg-gray-25 text-xs font-medium text-gray-600 dark:text-gray-500 mb-2">
                <Briefcase className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
                <span>Careers</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                Open positions
              </h2>
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-500">
              Showing <span className="font-mono tabular-nums font-semibold text-ink">{openings.length}</span> active openings
            </div>
          </div>

          <div className="space-y-4">
            {openings.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-line bg-surface p-6 shadow-s5 transition-colors hover:border-brand/40"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[11px] text-gray-500 uppercase tracking-wider">
                        {job.id}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-xs font-semibold text-brand-text">
                        <Briefcase className="h-3 w-3" strokeWidth={1.8} />
                        {job.department}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-ink mb-2">
                      {job.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-500 mb-4 leading-relaxed max-w-3xl">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-gray-100 dark:bg-gray-25 text-gray-600 dark:text-gray-600 px-2.5 py-1 text-xs font-medium">
                        <MapPin className="h-3 w-3 text-brand-text" strokeWidth={1.8} />
                        <span>{job.location} ({job.region})</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-gray-100 dark:bg-gray-25 text-gray-600 dark:text-gray-600 px-2.5 py-1 text-xs font-medium">
                        <Clock className="h-3 w-3" strokeWidth={1.8} />
                        <span>{job.type}</span>
                      </span>
                      {job.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-mono rounded-lg border border-line bg-surface px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 lg:pt-0 shrink-0">
                    <Link
                      to="/signin"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5 w-full sm:w-auto"
                    >
                      <span>Apply now</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-line bg-surface p-8 sm:p-10 text-center shadow-s5">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4 text-brand-text">
            <Mail className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-3">
            Don't see your role?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 mb-6 max-w-xl mx-auto leading-relaxed">
            We are always interested in connecting with talented engineers, designers, and domain specialists. Send us your resume and tell us what you would love to build.
          </p>
          <a
            href="mailto:careers@menteeai.org"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5"
          >
            <span>Send your resume</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;
