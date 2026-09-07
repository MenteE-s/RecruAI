import React from "react";

const CustomerSegments = () => {
  const segments = [
    {
      title: "Job Seekers",
      subtitle: "Students, Fresh Graduates & Professionals",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      benefits: [
        "Unlimited AI mock interviews",
        "Real-time feedback & scoring",
        "Job matching & one-click apply",
        "Track interview history & results",
        "Hired status tracking",
        "Invitations from organizations",
      ],
      painPoints: [
        "Expensive coaching services",
        "No structured practice",
        "Unclear interview performance",
      ],
      color: "blue",
    },
    {
      title: "Organizations",
      subtitle: "Startups, SMEs & Enterprises",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      benefits: [
        "Post unlimited job listings",
        "Search & filter candidates",
        "Send interview invitations",
        "AI-powered initial screening",
        "Candidate pipeline management",
        "Hire & onboard tracking",
      ],
      painPoints: [
        "Manual resume screening",
        "Time-consuming interviews",
        "Hiring bias",
      ],
      color: "gray",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-4">
            Who It's For
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for{" "}
            <span className="text-blue-600">Everyone</span>{" "}
            in the Hiring Process
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A complete ecosystem that serves both sides of the interview table
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`border ${
                segment.color === "blue" ? "border-blue-200" : "border-gray-200"
              } p-8`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 flex items-center justify-center ${
                    segment.color === "blue"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-white"
                  }`}
                >
                  {segment.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {segment.title}
                  </h3>
                  <p className="text-sm text-gray-600">{segment.subtitle}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  What You Get
                </h4>
                <ul className="space-y-2">
                  {segment.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Problems We Solve
                </h4>
                <ul className="space-y-2">
                  {segment.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-red-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerSegments;
