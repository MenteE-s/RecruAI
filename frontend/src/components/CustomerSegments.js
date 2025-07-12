import React from 'react';

const CustomerSegments = () => {
  const segments = [
    {
      title: "Job Seekers",
      subtitle: "Students, Fresh Graduates & Professionals",
      icon: (
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      benefits: [
        "Realistic interview practice",
        "Instant AI feedback",
        "Confidence building",
        "Industry-specific preparation"
      ],
      currentAlternatives: [
        "YouTube videos and blogs",
        "Friends or mentors",
        "Expensive coaching services"
      ]
    },
    {
      title: "Organizations",
      subtitle: "Startups, SMEs & Enterprises",
      icon: (
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
      benefits: [
        "Automated candidate screening",
        "Unbiased AI assessment",
        "Time-saving recruitment",
        "Better hiring decisions"
      ],
      currentAlternatives: [
        "Manual interviews",
        "Traditional ATS systems",
        "External recruitment agencies"
      ]
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-primary-50 to-accent-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-secondary-900 sm:text-4xl">
            Built for <span className="text-primary-600">Everyone</span> in the Interview Process
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-secondary-600">
            Our dual-purpose platform serves both sides of the interview table
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {segments.map((segment, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 text-primary-600 rounded-full mb-4">
                  {segment.icon}
                </div>
                <h3 className="text-2xl font-bold text-secondary-900">{segment.title}</h3>
                <p className="text-lg text-secondary-600">{segment.subtitle}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-secondary-900 mb-3">What You Get:</h4>
                  <ul className="space-y-2">
                    {segment.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-success-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-secondary-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-secondary-900 mb-3">Current Alternatives:</h4>
                  <ul className="space-y-2">
                    {segment.currentAlternatives.map((alternative, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-secondary-600">{alternative}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerSegments;