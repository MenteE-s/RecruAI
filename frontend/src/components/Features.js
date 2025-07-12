import React, { useState, useEffect, useRef } from 'react';

const Features = () => {
  const [visibleFeatures, setVisibleFeatures] = useState([]);
  const featuresRef = useRef([]);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      title: "Dual-Purpose Platform",
      description: "Unique solution serving both job seekers and organizations - the only platform you need for complete interview success.",
      gradient: "from-primary-500 to-accent-500",
      delay: "0s"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Realistic AI Simulations",
      description: "Proprietary AI models trained on diverse datasets provide the most realistic interview experience available.",
      gradient: "from-accent-500 to-primary-500",
      delay: "0.1s"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      title: "Affordable Pricing",
      description: "Starting at just $30/month with referral rewards - more accessible than traditional coaching or recruitment services.",
      gradient: "from-primary-600 to-success-500",
      delay: "0.2s"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      ),
      title: "Unbiased AI Screening",
      description: "Eliminate hiring bias with AI-driven candidate assessment that focuses purely on skills and competency.",
      gradient: "from-accent-600 to-primary-600",
      delay: "0.3s"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Real-Time Analytics",
      description: "Detailed performance tracking and instant feedback help users improve faster than traditional methods.",
      gradient: "from-success-500 to-accent-500",
      delay: "0.4s"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      title: "Organization Integration",
      description: "Seamlessly integrate with existing ATS systems and recruitment workflows for enterprise clients.",
      gradient: "from-primary-500 to-success-600",
      delay: "0.5s"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            setTimeout(() => {
              setVisibleFeatures(prev => [...prev, index]);
            }, index * 150);
          }
        });
      },
      { threshold: 0.1 }
    );

    featuresRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-white to-secondary-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary-200 to-accent-200 rounded-full opacity-20 animate-float blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-accent-200 to-primary-200 rounded-full opacity-15 animate-bounce-slow blur-xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-medium text-primary-600 mb-6 animate-fade-in-down">
            ✨ Powerful Features
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6 animate-fade-in-up">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              RecruAI
            </span>
            ?
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            The only platform that serves both job seekers and organizations with cutting-edge AI technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={el => featuresRef.current[index] = el}
              data-index={index}
              className={`group relative bg-white/70 backdrop-blur-sm border border-secondary-200 rounded-2xl p-8 transition-all duration-700 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 ${
                visibleFeatures.includes(index) 
                  ? 'animate-fade-in-up opacity-100' 
                  : 'opacity-0'
              }`}
              style={{animationDelay: feature.delay}}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
              
              {/* Icon */}
              <div className={`relative flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <div className="text-white group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-secondary-900 mb-4 group-hover:text-primary-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-secondary-600 leading-relaxed group-hover:text-secondary-700 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Hover Effect Arrow */}
              <div className="absolute bottom-6 right-6 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Particle Effect on Hover */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-0 w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping group-hover:animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="absolute top-4 right-8 w-1 h-1 bg-accent-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute bottom-6 left-12 w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;