import React from "react";

const jobs = [
  {
    title: "Senior Software Engineer",
    company: "Google",
    location: "Mountain View, CA",
    salary: "$180K - $250K",
    type: "Full-time",
    remote: "Hybrid",
    posted: "2 days ago",
    applicants: 124,
  },
  {
    title: "Product Manager",
    company: "Microsoft",
    location: "Seattle, WA",
    salary: "$150K - $200K",
    type: "Full-time",
    remote: "Remote",
    posted: "1 day ago",
    applicants: 89,
  },
  {
    title: "UX Designer",
    company: "Apple",
    location: "Cupertino, CA",
    salary: "$140K - $190K",
    type: "Full-time",
    remote: "On-site",
    posted: "3 days ago",
    applicants: 156,
  },
  {
    title: "Data Scientist",
    company: "Amazon",
    location: "Seattle, WA",
    salary: "$160K - $220K",
    type: "Full-time",
    remote: "Hybrid",
    posted: "5 hours ago",
    applicants: 67,
  },
  {
    title: "Frontend Developer",
    company: "Meta",
    location: "Menlo Park, CA",
    salary: "$145K - $205K",
    type: "Full-time",
    remote: "Remote",
    posted: "1 day ago",
    applicants: 203,
  },
  {
    title: "DevOps Engineer",
    company: "Netflix",
    location: "Los Gatos, CA",
    salary: "$170K - $240K",
    type: "Full-time",
    remote: "Hybrid",
    posted: "4 days ago",
    applicants: 45,
  },
];

const FeaturedJobs = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-4">
            Featured Jobs
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Top{" "}
            <span className="text-blue-600">Opportunities</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover roles at leading companies actively hiring through RecruAI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm">
                  {job.company.charAt(0)}
                </div>
                <span className="text-xs text-gray-500">{job.posted}</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{job.company}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1">
                  {job.location}
                </span>
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1">
                  {job.type}
                </span>
                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1">
                  {job.remote}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-900">
                  {job.salary}
                </span>
                <span className="text-xs text-gray-500">
                  {job.applicants} applicants
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 px-6 py-3 text-sm font-medium transition-colors">
            View All Jobs
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
