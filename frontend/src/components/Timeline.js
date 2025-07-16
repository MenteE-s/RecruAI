import React, { useState, useEffect, useRef } from 'react';

const Timeline = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const milestones = [
    {
      quarter: "Q1 2025",
      title: "Beta Development",
      status: "In Progress",
      description: "Building core AI interview features and gathering early feedback from advisors",
      progress: 65,
      icon: "🛠️",
      color: "primary"
    },
    {
      quarter: "Q2 2025",
      title: "Beta Launch",
      status: "Planned",
      description: "Limited beta release for first 100 users with core interview practice features",
      progress: 0,
      icon: "🚀",
      color: "accent"
    },
    {
      quarter: "Q3 2025",
      title: "Public Launch",
      status: "Planned",
      description: "Full public release with advanced AI features and subscription pricing",
      progress: 0,
      icon: "🌟",
      color: "success"
    },
    {
      quarter: "Q4 2025",
      title: "Enterprise Features",
      status: "Planned",
      description: "Organization dashboard, team features, and enterprise integrations",
      progress: 0,
      icon: "🏢",
      color: "secondary"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="roadmap"
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-secondary-50 via-white to-primary-25"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-medium text-primary-600 mb-6">
            🗓️ Development Roadmap
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            Our <span className="text-primary-600">Journey</span> Ahead
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Transparent timeline of our development milestones and launch plans
          </p>
        </div>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-accent-200 to-success-200"></div>
          
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex items-start space-x-8 transition-all duration-700 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Timeline Dot */}
                <div className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg ${
                  milestone.status === 'In Progress' 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse-glow' 
                    : milestone.status === 'Planned'
                    ? 'bg-gradient-to-r from-secondary-300 to-secondary-400'
                    : 'bg-gradient-to-r from-success-500 to-success-600'
                }`}>
                  <span className="text-white">{milestone.icon}</span>
                  
                  {/* Connecting Line to Content */}
                  <div className="absolute top-8 left-8 w-8 h-0.5 bg-secondary-200"></div>
                </div>
                
                {/* Content Card */}
                <div className="flex-1 bg-white rounded-2xl p-8 shadow-lg border border-secondary-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-secondary-900 mb-1">
                        {milestone.title}
                      </h3>
                      <p className="text-lg text-primary-600 font-medium">
                        {milestone.quarter}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      milestone.status === 'In Progress' 
                        ? 'bg-primary-100 text-primary-700' 
                        : milestone.status === 'Planned'
                        ? 'bg-secondary-100 text-secondary-700'
                        : 'bg-success-100 text-success-700'
                    }`}>
                      {milestone.status}
                    </span>
                  </div>
                  
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    {milestone.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {milestone.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600">Progress</span>
                        <span className="font-medium text-secondary-900">{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: isVisible ? `${milestone.progress}%` : '0%',
                            transitionDelay: `${index * 0.2 + 0.5}s`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {milestone.progress === 0 && (
                    <div className="text-sm text-secondary-500 italic">
                      Timeline subject to adjustment based on development progress
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto border border-secondary-100">
            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              Want to be part of our journey?
            </h3>
            <p className="text-secondary-600 mb-6">
              Join our beta program and help shape the future of AI-powered interviews
            </p>
            <button 
              onClick={() => window.open('https://forms.gle/NGJ3gu5MstTyLSib8', '_blank')}
              className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              Join Our Beta Program 🚀
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;