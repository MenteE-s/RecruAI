import React from "react";

const CTA = () => {
  return (
    <section className="py-24 bg-blue-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Job?
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Join Pakistan&apos;s fastest-growing job portal — expanding across the Gulf & Asia.
            Optimize your CV, get matched, and get hired. Start free forever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Job Seekers CTA */}
          <div className="border border-white/20 p-8">
            <h3 className="text-xl font-bold text-white mb-2">For Job Seekers</h3>
            <p className="text-blue-100 text-sm mb-6">
              Find jobs in Pakistan & Gulf + optimize your CV with AI
            </p>
            <button className="w-full bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 text-sm font-medium transition-colors mb-4">
              Find Jobs & Optimize CV
            </button>
            <p className="text-xs text-blue-200">
              Free CV review • No credit card required
            </p>
          </div>

          {/* Organizations CTA */}
          <div className="border border-white/20 p-8">
            <h3 className="text-xl font-bold text-white mb-2">For Organizations</h3>
            <p className="text-blue-100 text-sm mb-6">
              Revolutionize your recruitment process
            </p>
            <button className="w-full bg-white/20 text-white hover:bg-white/30 px-6 py-3 text-sm font-medium transition-colors mb-4">
              Schedule Demo
            </button>
            <p className="text-xs text-blue-200">
              Free trial • Custom pricing available
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400"></span>
            Free forever plan available
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400"></span>
            14-day premium trial
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400"></span>
            24/7 customer support
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400"></span>
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
};

export default CTA;
