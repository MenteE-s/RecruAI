import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiMapPin } from "react-icons/fi";

const jobs = [
  {
    title: "Senior Software Engineer",
    company: "Systems Ltd",
    location: "Lahore, Pakistan",
    salary: "PKR 450K - 700K /mo",
    type: "Full-time",
    remote: "Hybrid",
    posted: "2 days ago",
    applicants: 124,
  },
  {
    title: "Product Manager",
    company: "Daraz",
    location: "Karachi, Pakistan",
    salary: "PKR 350K - 550K /mo",
    type: "Full-time",
    remote: "On-site",
    posted: "1 day ago",
    applicants: 89,
  },
  {
    title: "UX Designer",
    company: "Careem",
    location: "Dubai, UAE",
    salary: "AED 15K - 22K /mo",
    type: "Full-time",
    remote: "Hybrid",
    posted: "3 days ago",
    applicants: 156,
  },
  {
    title: "Data Scientist",
    company: "STC",
    location: "Riyadh, Saudi Arabia",
    salary: "SAR 18K - 25K /mo",
    type: "Full-time",
    remote: "On-site",
    posted: "5 hours ago",
    applicants: 67,
  },
  {
    title: "Frontend Developer",
    company: "Talabat",
    location: "Doha, Qatar",
    salary: "QAR 14K - 20K /mo",
    type: "Full-time",
    remote: "Remote",
    posted: "1 day ago",
    applicants: 203,
  },
  {
    title: "DevOps Engineer",
    company: "Meezan Bank",
    location: "Islamabad, Pakistan",
    salary: "PKR 400K - 600K /mo",
    type: "Full-time",
    remote: "Hybrid",
    posted: "4 days ago",
    applicants: 45,
  },
];

const FeaturedJobs = () => {
  return (
    <section className="py-20 sm:py-24 bg-surface dark:bg-gray-0 border-t border-line dark:border-gray-800">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
            Featured Opportunities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            Top Roles in <span className="text-brand-text">Pakistan &amp; the Gulf</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Curated openings across Lahore, Karachi, Islamabad, Dubai, Riyadh, and Doha matched directly to verified capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <Link
              key={index}
              to="/signin"
              className="block rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-s5 transition-colors hover:border-brand/40 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-25 border border-line flex items-center justify-center text-ink font-semibold text-sm shadow-s5">
                  {job.company.charAt(0)}
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                  <FiClock className="h-3 w-3" strokeWidth={1.8} />
                  {job.posted}
                </span>
              </div>

              <h3 className="text-base font-semibold text-ink mb-1 leading-snug transition-colors group-hover:text-brand-text">
                {job.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 mb-4">{job.company}</p>

              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-gray-100 dark:bg-gray-25 text-gray-600 dark:text-gray-600 text-[11px] px-2.5 py-0.5">
                  <FiMapPin className="h-3 w-3" strokeWidth={1.8} />
                  {job.location}
                </span>
                <span className="rounded-full border border-line bg-gray-100 dark:bg-gray-25 text-gray-600 dark:text-gray-600 text-[11px] px-2.5 py-0.5">
                  {job.type}
                </span>
                <span className="rounded-full bg-brand/10 border border-brand/20 text-brand-text text-[11px] px-2.5 py-0.5 font-semibold">
                  {job.remote}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line text-xs">
                <span className="font-semibold text-ink">
                  {job.salary}
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                  {job.applicants} applicants
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/in/jobs"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
          >
            View All Open Jobs
            <FiArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
