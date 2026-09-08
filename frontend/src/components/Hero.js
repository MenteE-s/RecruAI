import React from "react";

const leftLogos = [
  { n: "Google", i: "G", c: "bg-blue-50 text-blue-700 border-blue-100" },
  { n: "Microsoft", i: "M", c: "bg-gray-100 text-gray-700 border-gray-200" },
  { n: "Adobe", i: "A", c: "bg-red-50 text-red-700 border-red-100" },
  { n: "Systems Ltd", i: "S", c: "bg-green-50 text-green-700 border-green-100" },
  { n: "LUMS", i: "L", c: "bg-amber-50 text-amber-700 border-amber-100" },
  { n: "CV • ATS 91", i: "CV", c: "bg-white text-gray-700 border-gray-200" },
  { n: "Daraz", i: "D", c: "bg-orange-50 text-orange-700 border-orange-100" },
  { n: "FAST", i: "F", c: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { n: "Meta", i: "M", c: "bg-blue-50 text-blue-800 border-blue-100" },
  { n: "IBA Karachi", i: "IB", c: "bg-teal-50 text-teal-700 border-teal-100" },
  { n: "Netflix", i: "N", c: "bg-red-50 text-red-600 border-red-100" },
  { n: "NUST", i: "N", c: "bg-purple-50 text-purple-700 border-purple-100" },
];

const rightLogos = [
  { n: "Amazon", i: "a", c: "bg-amber-50 text-amber-800 border-amber-100" },
  { n: "Careem", i: "C", c: "bg-green-50 text-green-800 border-green-100" },
  { n: "STC", i: "S", c: "bg-blue-50 text-blue-800 border-blue-100" },
  { n: "LSE", i: "L", c: "bg-gray-100 text-gray-700 border-gray-200" },
  { n: "CV • Hired", i: "CV", c: "bg-white text-gray-700 border-gray-200" },
  { n: "Talabat", i: "T", c: "bg-orange-50 text-orange-800 border-orange-100" },
  { n: "Apple", i: "A", c: "bg-gray-100 text-gray-800 border-gray-200" },
  { n: "IBA", i: "IB", c: "bg-teal-50 text-teal-800 border-teal-100" },
  { n: "Meezan", i: "M", c: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { n: "Qatar Airways", i: "Q", c: "bg-purple-50 text-purple-800 border-purple-100" },
  { n: "Oracle", i: "O", c: "bg-red-50 text-red-700 border-red-100" },
  { n: "COMSATS", i: "C", c: "bg-indigo-50 text-indigo-800 border-indigo-100" },
];

const Hero = () => {
  return (
    <section className="relative bg-white pt-32 pb-32 lg:pt-40 lg:pb-40 overflow-hidden">
      {/* Left fading logo cloud */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 bottom-0 hidden lg:flex w-72 flex-col justify-center gap-4 pl-6 pr-10 select-none"
        style={{
          WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)",
          maskImage: "linear-gradient(to right, black 55%, transparent 100%)",
        }}
      >
        <div className="flex flex-col gap-4 blur-[0.6px] opacity-60 grayscale-[0.3]">
          {leftLogos.map((l, idx) => (
            <div
              key={l.n + idx}
              className={`flex items-center gap-3 border px-3 py-2 shadow-sm bg-white ${l.c}`}
              style={{
                opacity: idx < 2 || idx > 9 ? 0.45 : idx < 4 || idx > 7 ? 0.7 : 1,
                transform: `translateX(${idx % 2 === 0 ? "0" : "18px"}) rotate(-1deg)`,
              }}
            >
              <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-xs font-bold text-gray-800 shrink-0">
                {l.i}
              </span>
              <span className="text-sm font-medium truncate">{l.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right fading logo cloud */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 bottom-0 hidden lg:flex w-72 flex-col justify-center gap-4 pr-6 pl-10 select-none"
        style={{
          WebkitMaskImage: "linear-gradient(to left, black 55%, transparent 100%)",
          maskImage: "linear-gradient(to left, black 55%, transparent 100%)",
        }}
      >
        <div className="flex flex-col gap-4 blur-[0.6px] opacity-60 grayscale-[0.3]">
          {rightLogos.map((l, idx) => (
            <div
              key={l.n + idx}
              className={`flex items-center gap-3 border px-3 py-2 shadow-sm bg-white ${l.c}`}
              style={{
                opacity: idx < 2 || idx > 9 ? 0.45 : idx < 4 || idx > 7 ? 0.7 : 1,
                transform: `translateX(${idx % 2 === 0 ? "0" : "-18px"}) rotate(1deg)`,
              }}
            >
              <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-xs font-bold text-gray-800 shrink-0">
                {l.i}
              </span>
              <span className="text-sm font-medium truncate">{l.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* soft side fades */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white via-white/70 to-transparent hidden lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white via-white/70 to-transparent hidden lg:block" />

        <div className="relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 w-36 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.2em] font-semibold text-white/10 select-none pointer-events-none"
            style={{ WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)", maskImage: "linear-gradient(to right, black 55%, transparent 100%)", animation: "marquee-left 30s linear infinite" }}
          >
            {Array(3).fill(1).map((_, i) => (
              <span key={i} className="inline-block mx-4">
                GOOGLE · MICROSOFT · ADOBE · LUMS · FAST · NUST · NETFLIX · ORACLE · CAREEM · STC · DARAZ · COMSATS · SYSTEMS LTD · META · TALABAT · QATAR AIRWAYS · MEEZAN · APPLE · IBA KARACHI · LSE · CV OPTIMIZE · PAKISTAN · UAE · SAUDI · QATAR · KUWAIT · BAHRAIN · GULF · ASIA · HIRE FAST · AI MATCH · PERFECT JOB · RESUME BUILDER · CAREER COACHING · AI SCREENING · INTERVIEW ANALYSIS · PIPELINE · TEAM MANAGEMENT · BILLING · ONBOARDING · CANDIDATE ANALYSIS · AI AGENTS · SHARABLE PROFILES · JOB POSTS · BROWSE JOBS · SAVED JOBS · APPLIED JOBS · NOTIFICATIONS · ANALYTICS · RESUME BUILDER · JOB ALERTS · CAREER COACHING · BILLING · TESTIMONIALS · FEATURES · PRICING · HIRE PEOPLE · CANDIDATES · INTERVIEW MANAGEMENT · INTERVIEW ROOM · CANDIDATE ANALYSIS · INSIGHTS · INTEGRATIONS · REPORTS · TEAM MEMBERS · ORGANIZATION PROFILE · PUBLIC PROFILES · AI AGENTS · NOTIFICATIONS · SETTINGS · SIGN IN · REGISTER · BLOG · ABOUT US · COMMUNITY · CONTACT · CAREERS · COOKIES · TERMS · PRIVACY · SYSTEM STATUS · DEMO · SCHEDULE · APPLY · SAVE · FILTER · SEARCH · LOAD MORE · CLEAR · EDIT · DELETE · CANCEL · SUBMIT · SAVE · UPDATE · UPLOAD · REMOVE · VIEW · JOIN · PREPARE · START · NEXT · PREVIOUS · PAGE · LOADING · SUCCESS · ERROR · WARNING · INFO · BANNER · PROFILE · AVATAR · SKILLS · EXPERIENCE · EDUCATION · CERTIFICATIONS · AWARDS · PROJECTS · PUBLICATIONS · MEMBERSHIPS · LANGUAGES · REFERENCES · SOCIAL · VOLUNTEER · SPEAKING · CONFERENCES · LICENSES · HOBBIES · COURSES · PUBLICATIONS · REFERENCES · MEMBERSHIPS · SKILLS · AWARDS · PROJECTS · CERTIFICATIONS · EDUCATION · EXPERIENCE · SKILLS · PROFILE · AVATAR · BANNER · SOCIAL · RESUME · INTERVIEW · APPLICATION · CANDIDATE · RECRUITMENT · HIRING · ONBOARDING · PIPELINE · JOB · POST · ALERT · NOTIFICATION · AGENT · ANALYTICS · BILLING · TEAM · MEMBER · INVITE · EDIT · DELETE · REMOVE · CANCEL · SUBMIT · SAVE · UPDATE · UPLOAD · VIEW · JOIN · PREPARE · START · NEXT · PREVIOUS · PAGE · LOADING · SUCCESS · ERROR · WARNING · INFO · ACTIVE · INACTIVE · PUBLIC · PRIVATE · PRO · TRIAL · FREE · PREMIUM · MATCH · SCORE · EXPLANATION · SIMILARITY · RECOMMENDED · STAR · NEW · HOT · HOT · MATCH · EXCELLENT · GOOD · POSSIBLE · POOR · SCORE · SIMILARITY · SKILLS · MATCH · EXPLANATION · STAR · RECOMMENDED · NEW · HOT · PUBLIC · PRIVATE · PRO · TRIAL · FREE · PREMIUM · ACTIVE · INACTIVE · SUCCESS · ERROR · WARNING · INFO · LOADING · SUBMIT · CANCEL · DELETE · REMOVE · EDIT · SAVE · UPDATE · UPLOAD · VIEW · JOIN · PREPARE · START · NEXT · PREVIOUS · PAGE · LOADING · SUCCESS · ERROR · WARNING · INFO · ACTIVE · INACTIVE · PUBLIC · PRIVATE · PRO · TRIAL · FREE · PREMIUM · MATCH · SCORE · SIMILARITY · SKILLS · MATCH · EXPLANATION · STAR · RECOMMENDED · NEW · HOT · PUBLIC · PRIVATE · PRO · TRIAL · FREE · PREMIUM · ACTIVE · INACTIVE · SUCCESS · ERROR · WARNING · INFO · LOADING · SUBMIT · CANCEL · DELETE · REMOVE · EDIT · SAVE · UPDATE · UPLOAD · VIEW · JOIN · PREPARE · START · NEXT · PREVIOUS · PAGE · LOADING · SUCCESS · ERROR · WARNING · INFO · ACTIVE · INACTIVE · PUBLIC · PRIVATE · PRO · TRIAL · FREE · PREMIUM · MATCH · SCORE · SIMILARITY · SKILLS · MATCH · EXPLANATION · STAR · RECOMMENDED · NEW · HOT ·
              </span>
            ))}
          </div>
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 right-0 w-36 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.2em] font-semibold text-white/10 select-none pointer-events-none"
          style={{ WebkitMaskImage: "linear-gradient(to left, black 55%, transparent 100%)", maskImage: "linear-gradient(to left, black 55%, transparent 100%)", animation: "marquee-right 30s linear infinite" }}
        >
          {Array(3).fill(1).map((_, i) => (
            <span key={i} className="inline-block mx-4">
              APPLE · MICROSOFT · GOOGLE · ADOBE · NETFLIX · META · AMAZON · LUMS · FAST · NUST · ORACLE · APPLE · MICROSOFT · GOOGLE · ADOBE · NETFLIX · META · AMAZON · LUMS · FAST · NUST · ORACLE · SYSTEMS LTD · DARAZ · STC · CAREEM · MEEZAN · COMSATS · QATAR AIRWAYS · TALABAT · LSE · IBA · APPLE · MICROSOFT · GOOGLE · ADOBE · NETFLIX · META · AMAZON · LUMS · FAST · NUST · ORACLE · SYSTEMS LTD · DARAZ · STC · CAREEM · MEEZAN · COMSATS · QATAR AIRWAYS · TALABAT · LSE · IBA · CV OPTIMIZE · RESUME BUILDER · INTERVIEW COACHING · JOB ALERTS · AI SCREENING · CANDIDATE ANALYSIS · PIPELINE · TEAM MANAGEMENT · BILLING · NOTIFICATIONS · ANALYTICS · SETTINGS · SIGN IN · REGISTER · DEMO · BLOG · ABOUT US · CONTACT · CAREERS · PRIVACY · TERMS · COOKIES · COMMUNITY · SYSTEM STATUS · PRACTICE · AGEN T
            </span>
          ))}
        </div>

        {/* Key content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded text-sm font-medium text-blue-700 mb-8">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          Asia&apos;s Best AI Job Portal — Pakistan & Gulf Focused
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
          Find Your Perfect Job
          <br />
          with <span className="text-blue-600">AI Matching</span>
        </h1>

        <p className="mt-8 text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Pakistan&apos;s smartest job portal — now expanding across the Gulf
          (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain) & Asia. Discover
          jobs tailored to you, optimize your CV with AI, practice mock
          interviews, and get hired faster.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded transition-colors duration-200 shadow-lg shadow-blue-600/25"
          >
            Find My Perfect Job
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-10 py-4 bg-white hover:bg-gray-50 text-gray-700 text-lg font-semibold rounded border border-gray-300 transition-colors duration-200"
          >
            Optimize My CV
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
          {["Pakistan", "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain"].map((c) => (
            <span key={c} className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700">
              {c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500 tracking-wide uppercase">
          Built for Pakistan — Expanding across the Gulf & Asia
        </p>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">25K+</div>
            <div className="text-sm text-gray-500 mt-1">Jobs Listed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">40K+</div>
            <div className="text-sm text-gray-500 mt-1">CVs Optimized</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">500+</div>
            <div className="text-sm text-gray-500 mt-1">Companies Hiring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">7+</div>
            <div className="text-sm text-gray-500 mt-1">Countries Covered</div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Free forever plan
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            14-day premium trial
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
