import React from "react";

const Hero = () => {
  return (
    <section className="relative bg-white pt-24 pb-20 lg:pt-32 lg:pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
          Master Your
          <br />
          Interview Skills
          <br />
          with{" "}
          <span className="text-blue-600">RecruAI</span>
        </h1>

        <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          <span className="font-semibold text-gray-900">For Job Seekers:</span>{" "}
          Realistic mock interviews with instant AI feedback.
          <br />
          <span className="font-semibold text-gray-900">For Organizations:</span>{" "}
          Automated, unbiased candidate screening.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg transition-colors duration-200">
            Start Free Forever
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <button className="inline-flex items-center justify-center px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 text-base font-semibold rounded-lg border border-gray-300 transition-colors duration-200">
            Schedule Demo
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Free forever plan
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            14-day premium trial
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No credit card required
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
