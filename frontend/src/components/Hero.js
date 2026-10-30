import React from "react";

// Names shown as text, not fake logo chips. Keeps the hero monochrome and
// avoids the low-contrast "ghosted UI" look the side rails had.
const trustedBy = [
  "Google",
  "Microsoft",
  "LUMS",
  "NUST",
  "Careem",
  "Daraz",
  "Systems Ltd",
  "STC",
];

const Hero = () => {
  return (
    <section className="relative bg-white pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
        {/* Key content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 border border-blue-100 rounded text-xs sm:text-sm font-medium text-blue-700 mb-8">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          Asia&apos;s Best AI Job Portal — Pakistan & Gulf
        </div>

        <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl sm:leading-tight lg:text-7xl font-bold text-gray-900 tracking-tight">
          Find Your Perfect Job
          <br />
          with <span className="text-blue-600">AI Matching</span>
        </h1>

        <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Pakistan&apos;s smartest job portal — now expanding across the Gulf
          (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain) & Asia. Discover
          jobs tailored to you, optimize your CV with AI, practice mock
          interviews, and get hired faster.
        </p>

        <div className="mt-9 sm:mt-12 flex flex-col sm:flex-row gap-4 justify-center">
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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
          <span className="font-semibold uppercase tracking-[0.14em] text-gray-500">
            Trusted by candidates from
          </span>
          {trustedBy.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          {["Pakistan", "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain"].map((c) => (
            <span key={c} className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700">
              {c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600 tracking-[0.12em] uppercase">
          Built for Pakistan — Expanding across the Gulf & Asia
        </p>

        <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">25K+</div>
            <div className="text-sm text-gray-600 mt-1">Jobs Listed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">40K+</div>
            <div className="text-sm text-gray-600 mt-1">CVs Optimized</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">500+</div>
            <div className="text-sm text-gray-600 mt-1">Companies Hiring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">7+</div>
            <div className="text-sm text-gray-600 mt-1">Countries Covered</div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
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
            30-day premium trial
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
