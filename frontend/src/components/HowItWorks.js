import React from "react";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-4">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            From{" "}
            <span className="text-blue-600">Practice</span>{" "}
            to{" "}
            <span className="text-blue-600">Hire</span>{" "}
            to{" "}
            <span className="text-blue-600">Onboard</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're practicing or hiring, RecruAI guides you every step of the way
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Job Seeker Flow */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Job Seeker Journey
            </h3>
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Create Profile",
                  desc: "Sign up and build your professional profile with experience, skills, and education",
                },
                {
                  step: "2",
                  title: "Practice Interviews",
                  desc: "Take unlimited AI mock interviews. Get real-time feedback and improve your scores",
                },
                {
                  step: "3",
                  title: "Browse & Apply",
                  desc: "Find matching jobs, apply with one click, and track all applications",
                },
                {
                  step: "4",
                  title: "Get Invited",
                  desc: "Organizations can find you and send interview invitations directly",
                },
                {
                  step: "5",
                  title: "Hired & Onboarded",
                  desc: "Get flagged as hired with details on who hired you and when",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organization Flow */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Organization Journey
            </h3>
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Post Jobs",
                  desc: "Create and publish job listings to reach thousands of qualified candidates",
                },
                {
                  step: "2",
                  title: "Search Candidates",
                  desc: "Browse profiles, filter by skills and experience to find perfect matches",
                },
                {
                  step: "3",
                  title: "Send Invitations",
                  desc: "Invite candidates directly through the platform for initial screening",
                },
                {
                  step: "4",
                  title: "AI Screening",
                  desc: "Automated AI evaluation before first human interview saves time",
                },
                {
                  step: "5",
                  title: "Hire & Onboard",
                  desc: "Flag candidates as hired, track status, and manage onboarding",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
