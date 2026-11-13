import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Zap,
  Globe2,
  ShieldCheck,
  ArrowRight,
  Target,
  Building2,
  Layers,
} from "lucide-react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const milestones = [
  { year: "2020", desc: "MenteE founded with core research into AI-driven recruitment matching" },
  { year: "2021", desc: "RecruAI platform launched with initial semantic candidate ranking" },
  { year: "2022", desc: "Expanded across Pakistan with 100+ partner organizations" },
  { year: "2023", desc: "Released automated AI interview simulations and ATS resume scoring" },
  { year: "2025", desc: "Crossed 25k+ interviews; expanded into UAE, Saudi Arabia, Qatar, and Bahrain" },
];

const values = [
  {
    icon: CheckCircle2,
    title: "Fairness and merit",
    desc: "Committed to unbiased, merit-based candidate ranking calibrated for regional talent dynamics.",
  },
  {
    icon: Zap,
    title: "Precision engineering",
    desc: "Advancing dense vector embeddings and pgvector semantic pipelines for instant, accurate matching.",
  },
  {
    icon: Globe2,
    title: "Regional accessibility",
    desc: "Empowering job seekers and organizations of every scale across Pakistan and the Gulf region.",
  },
  {
    icon: ShieldCheck,
    title: "Security and data trust",
    desc: "Protecting candidate privacy and recruiter proprietary records with rigorous encryption standards.",
  },
];

const team = [
  {
    name: "Adeel Sayyad",
    role: "Founder & CEO",
    initials: "AS",
    bio: "Pioneering AI systems and scalable architectures for emerging market recruitment and career growth.",
  },
  {
    name: "Fatima Raza",
    role: "Head of Talent & Operations",
    initials: "FR",
    bio: "Senior talent acquisition leader with 10+ years managing Pakistan and GCC hiring pipelines.",
  },
  {
    name: "Usman Tariq",
    role: "Lead Machine Learning Engineer",
    initials: "UT",
    bio: "Specializing in semantic vector search, NLP interview scoring, and ranking systems.",
  },
];

const stats = [
  { value: "25,000+", label: "Interviews completed", sub: "Live & practice sessions" },
  { value: "500+", label: "Partner organizations", sub: "Pakistan & GCC regions" },
  { value: "95%", label: "Candidate satisfaction", sub: "Post-interview feedback" },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-surface text-ink transition-colors">
      <RecruAINavbar />

      {/* Hero Section */}
      <section className="border-b border-line bg-surface py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-semibold text-brand-text mb-4">
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>About MenteE &amp; RecruAI</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
            Pioneering AI recruitment for{" "}
            <span className="text-brand-text">Pakistan &amp; the Gulf</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We build intelligent platforms that connect ambitious talent with forward-thinking organizations — fair, fast, and driven by verified skills.
          </p>
        </div>
      </section>

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Mission Statement */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-gray-100 dark:bg-gray-25 text-xs font-medium text-gray-600 dark:text-gray-500 mb-3">
            <Target className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
            <span>Our mission</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4">Democratizing objective hiring</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-3xl mx-auto leading-relaxed">
            To democratize access to intelligent, objective, and transparent recruitment. We replace manual friction with precision vector matching, ATS resume optimization, and realistic AI interview practice.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5 transition-colors hover:border-brand/40"
            >
              <div className="font-mono tabular-nums text-3xl sm:text-4xl font-bold text-brand-text mb-1 tracking-tight">
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

        {/* Story & Milestones + Faux UI Engine Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-16">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-gray-100 dark:bg-gray-25 text-xs font-medium text-gray-600 dark:text-gray-500 mb-3">
              <Layers className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
              <span>Our journey</span>
            </div>
            <h3 className="text-2xl font-bold text-ink mb-4">Built for real hiring friction</h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
              <p>
                Founded in 2020 by MenteE, RecruAI began with a straightforward observation: traditional hiring processes were slow, fragmented, and full of hidden biases that left exceptional candidates overlooked.
              </p>
              <p>
                We engineered RecruAI as a full-stack recruitment ecosystem — combining deep semantic matching, instant ATS resume diagnostics, and AI-powered practice simulations. Today, our platform bridges talent across Karachi, Lahore, Islamabad, and expanding hubs in Dubai, Riyadh, and Doha.
              </p>
              <p>
                Whether you are a job seeker preparing for your next breakthrough or an organization building a high-performing team, RecruAI provides the clarity and tools to succeed.
              </p>
            </div>

            {/* Stageshow Mini Engine Spec Card */}
            <div className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-s5">
              <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand" />
                  <span className="text-xs font-semibold text-ink">Semantic matching engine</span>
                </div>
                <span className="font-mono text-[11px] text-gray-500 dark:text-gray-500">all-MiniLM-L6-v2</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-25 border border-line">
                  <span className="text-gray-600 dark:text-gray-600">Vector dimension</span>
                  <span className="font-mono tabular-nums font-semibold text-ink">384-d dense</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-25 border border-line">
                  <span className="text-gray-600 dark:text-gray-600">Canonical skill taxonomy</span>
                  <span className="font-mono tabular-nums font-semibold text-ink">137 skills / 215 aliases</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-25 border border-line">
                  <span className="text-gray-600 dark:text-gray-600">Average search latency</span>
                  <span className="font-mono tabular-nums font-semibold text-brand-text">24ms (pgvector)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Card */}
          <div className="rounded-xl border border-line bg-surface p-6 sm:p-7 shadow-s5">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-line">
              <h4 className="text-base font-semibold text-ink">
                Company milestones
              </h4>
              <span className="font-mono text-xs text-brand-text font-medium">2020 — 2025</span>
            </div>
            <div className="space-y-5">
              {milestones.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-mono tabular-nums text-xs font-bold text-brand-text uppercase tracking-wider block mb-0.5">
                      {item.year}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-500 leading-normal">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
              Our core values
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-500 max-w-xl mx-auto">
              Principles that guide our engineering, algorithms, and partnerships.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5 transition-colors hover:border-brand/40"
              >
                <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4 text-brand-text">
                  <val.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h4 className="text-sm font-semibold text-ink mb-2">
                  {val.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership Team */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
              Leadership team
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-500 max-w-xl mx-auto">
              Engineers, researchers, and operators building MenteE's recruitment systems.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((person, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5 transition-colors hover:border-brand/40"
              >
                <div className="w-14 h-14 rounded-full border border-line bg-gray-100 dark:bg-gray-25 flex items-center justify-center mx-auto mb-4 font-mono font-bold text-base text-ink">
                  {person.initials}
                </div>
                <h4 className="text-base font-semibold text-ink">{person.name}</h4>
                <p className="text-xs font-semibold text-brand-text mb-2.5">{person.role}</p>
                <p className="text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-xl border border-line bg-surface p-8 sm:p-10 text-center shadow-s5">
          <h3 className="text-xl sm:text-2xl font-bold text-ink mb-3">
            Join our mission
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 mb-6 max-w-xl mx-auto leading-relaxed">
            Explore our open roles or connect with our team to help shape the next generation of AI-powered career systems.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5"
            >
              <span>View open roles</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
            <Link
              to="/contact"
              className="rounded-xl border border-line bg-surface px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
            >
              Contact us
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
