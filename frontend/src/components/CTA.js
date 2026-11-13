import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 sm:py-24 bg-brand-action text-white">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to find your next career leap?
          </h2>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Join the smart job portal connecting Pakistan and the Gulf. Optimize your CV, practice AI mock interviews, and land the role you deserve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {/* Job Seekers CTA */}
          <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-sm p-6 sm:p-8 flex flex-col justify-between shadow-s5">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">For job seekers</h3>
              <p className="text-xs sm:text-sm text-white/90 mb-6 leading-relaxed">
                Discover jobs in Pakistan and the Gulf, boost your ATS score, and practice mock interviews.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-white dark:bg-white px-6 py-2.5 text-sm font-semibold text-brand-text hover:bg-emerald-50 dark:hover:bg-emerald-50 shadow-s5 transition-colors mb-3"
              >
                Find jobs and optimize CV
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <p className="text-[11px] text-white/80 text-center">
                Free forever tier · No credit card required
              </p>
            </div>
          </div>

          {/* Organizations CTA */}
          <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-sm p-6 sm:p-8 flex flex-col justify-between shadow-s5">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">For organizations</h3>
              <p className="text-xs sm:text-sm text-white/90 mb-6 leading-relaxed">
                Publish jobs, access pgvector semantic search, and automate first-round candidate screenings.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-white/30 bg-white/15 dark:bg-white/15 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/25 dark:hover:bg-white/25 shadow-s5 transition-colors mb-3"
              >
                Contact for access
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <p className="text-[11px] text-white/80 text-center">
                30-day trial · Fast setup for hiring teams
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-white">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-white" strokeWidth={2.4} />
            Free tier always available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-white" strokeWidth={2.4} />
            30-day full access trial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-white" strokeWidth={2.4} />
            Enterprise data privacy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-white" strokeWidth={2.4} />
            24/7 support
          </span>
        </div>
      </div>
    </section>
  );
};

export default CTA;
