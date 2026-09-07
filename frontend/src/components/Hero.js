import React from "react";

const Hero = () => {
  return (
    <section className="relative bg-white pt-24 pb-20 lg:pt-32 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-sm font-medium text-blue-700 mb-6">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Coming Soon
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Master Your
              <br />
              Interview Skills
              <br />
              with{" "}
              <span className="text-blue-600">RecruAI</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              <span className="font-semibold text-gray-900">For Job Seekers:</span>{" "}
              Realistic mock interviews with instant AI feedback.
              <br />
              <span className="font-semibold text-gray-900">For Organizations:</span>{" "}
              Automated, unbiased candidate screening.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
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

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-500">
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

          {/* Right Content - Hero Card */}
          <div className="mt-16 lg:mt-0 lg:col-span-6">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">RecruAI Coach</h3>
                  <p className="text-sm text-gray-500">AI-Powered Interview Prep</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Interviewer</p>
                    <p className="text-sm text-gray-600 mt-1">"Tell me about yourself and why you're interested in this role."</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">95%</div>
                  <div className="text-xs text-gray-500 mt-1">Success Rate</div>
                </div>
                <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">10K+</div>
                  <div className="text-xs text-gray-500 mt-1">Users</div>
                </div>
                <div className="text-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">500+</div>
                  <div className="text-xs text-gray-500 mt-1">Companies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
