import React, { useState, useEffect, useRef } from 'react';

const Pricing = () => {
  const [userType, setUserType] = useState('individual');
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const sectionRef = useRef(null);

  const individualPlans = [
    {
      name: "Free Forever",
      description: "Perfect for getting started with RecruAI",
      price: 0,
      duration: "forever",
      originalPrice: null,
      features: [
        "3 mock interviews per month",
        "Basic AI feedback",
        "Progress tracking",
        "Mobile app access",
        "Community support"
      ],
      popular: false,
      cta: "Start Free Forever",
      gradient: "from-success-400 to-primary-600",
      badge: "🆓 Always Free"
    },
    {
      name: "Individual Pro",
      description: "For serious job seekers + 14-day free trial",
      price: 30,
      duration: "month",
      originalPrice: 50,
      features: [
        "Unlimited mock interviews",
        "Advanced AI feedback",
        "Industry-specific questions",
        "Performance analytics",
        "Video interview practice",
        "Resume optimization tips",
        "💰 Earn $3 per successful referral",
        "🎯 Earn up to $30 back monthly",
        "Priority support"
      ],
      popular: true,
      cta: "Start 14-Day Free Trial",
      gradient: "from-accent-500 to-primary-600",
      badge: "🔥 Most Popular"
    }
  ];

  const organizationPlans = [
    {
      name: "Startup",
      description: "For small teams and startups",
      price: 30,
      duration: "recruiter/month",
      originalPrice: 45,
      features: [
        "Up to 3 recruiters",
        "AI candidate screening",
        "Basic analytics dashboard",
        "Email support",
        "Standard integrations",
        "14-day free trial"
      ],
      popular: false,
      cta: "Start Free Trial",
      gradient: "from-success-400 to-primary-500",
      badge: "🚀 Growing Teams"
    },
    {
      name: "Professional",
      description: "For growing organizations",
      price: 25,
      duration: "recruiter/month",
      originalPrice: 40,
      features: [
        "Up to 10 recruiters",
        "Advanced AI screening",
        "Custom question banks",
        "Detailed analytics",
        "ATS integration",
        "Priority support",
        "Team collaboration tools",
        "Free onboarding & training"
      ],
      popular: true,
      cta: "Schedule Demo",
      gradient: "from-primary-500 to-accent-600",
      badge: "⭐ Best Value"
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      price: "Custom",
      duration: "pricing",
      originalPrice: null,
      features: [
        "Unlimited recruiters",
        "White-label solution",
        "Custom AI models",
        "Advanced integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom training & support"
      ],
      popular: false,
      cta: "Schedule Demo",
      gradient: "from-accent-600 to-primary-700",
      badge: "💎 Enterprise"
    }
  ];

  const currentPlans = userType === 'individual' ? individualPlans : organizationPlans;

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
      ref={sectionRef}
      id="pricing" 
      className="py-20 bg-gradient-to-br from-secondary-50 via-white to-primary-50 relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-primary-300 to-accent-300 rounded-full opacity-10 animate-float blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-accent-300 to-primary-300 rounded-full opacity-10 animate-bounce-slow blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-200 to-accent-200 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200 rounded-full text-sm font-medium text-primary-700 mb-6 animate-shimmer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <span className="relative">💰 Simple & Transparent Pricing</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-bold text-secondary-900 mb-6">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700 bg-clip-text text-transparent animate-gradient bg-300%">
              Success Plan
            </span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* User Type Toggle */}
        <div className={`flex justify-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
          <div className="relative bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-xl border border-secondary-200">
            <div className="relative flex">
              <button
                onClick={() => setUserType('individual')}
                className={`relative px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-500 ${
                  userType === 'individual'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-105'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                }`}
              >
                <span className="relative z-10">👤 Job Seekers</span>
                {userType === 'individual' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl animate-pulse opacity-30"></div>
                )}
              </button>
              <button
                onClick={() => setUserType('organization')}
                className={`relative px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-500 ${
                  userType === 'organization'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-105'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                }`}
              >
                <span className="relative z-10">🏢 Organizations</span>
                {userType === 'organization' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl animate-pulse opacity-30"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {currentPlans.map((plan, index) => (
            <div
              key={`${userType}-${index}`}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
              className={`group relative transition-all duration-700 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              } ${
                plan.popular
                  ? 'lg:scale-110 lg:-translate-y-4'
                  : 'hover:scale-105 hover:-translate-y-2'
              }`}
              style={{animationDelay: `${index * 0.1 + 0.4}s`}}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-accent-500 to-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce-slow">
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Card */}
              <div className={`relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 transition-all duration-500 overflow-hidden ${
                plan.popular
                  ? 'border-primary-300 shadow-primary-500/20'
                  : 'border-secondary-200 hover:border-primary-200'
              } ${
                activeCard === index ? 'shadow-3xl border-primary-400' : ''
              }`}>
                
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Animated Border */}
                <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
                  plan.popular ? 'bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 p-[2px] animate-gradient bg-300%' : ''
                }`}>
                  {plan.popular && <div className="bg-white rounded-3xl h-full w-full"></div>}
                </div>

                <div className="relative z-10">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className="text-sm font-medium text-secondary-500 mb-2">{plan.badge}</div>
                    <h3 className="text-2xl font-bold text-secondary-900 mb-2">{plan.name}</h3>
                    <p className="text-secondary-600">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      {plan.originalPrice && (
                        <span className="text-lg text-secondary-400 line-through mr-2">
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span className="text-5xl font-bold text-secondary-900">
                        {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                      </span>
                      <span className="text-xl text-secondary-600 ml-2">
                        /{plan.duration}
                      </span>
                    </div>
                    {plan.originalPrice && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                          Save ${plan.originalPrice - plan.price}/month
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 mb-8 relative overflow-hidden group/btn ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-white hover:bg-primary-50 text-primary-600 border-2 border-primary-600 hover:border-primary-700'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                    <span className="relative flex items-center justify-center">
                      {plan.cta}
                      <svg className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li 
                        key={featureIndex} 
                        className={`flex items-start transition-all duration-300 ${
                          activeCard === index ? 'transform translate-x-2' : ''
                        }`}
                        style={{transitionDelay: `${featureIndex * 50}ms`}}
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-success-400 to-success-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-secondary-700 group-hover:text-secondary-800 transition-colors">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hover Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-2 h-2 bg-gradient-to-r ${plan.gradient} rounded-full opacity-0 group-hover:opacity-60 transition-all duration-1000`}
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + i * 10}%`,
                        animationDelay: `${i * 200}ms`,
                        animation: activeCard === index ? 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Text */}
        <div className={`mt-16 text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay: '0.8s'}}>
          <p className="text-secondary-600 mb-6">
            Start with our forever free trial. Upgrade anytime for unlimited AI interviews.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-secondary-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
              Cancel anytime
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
              30-day money back
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
              24/7 support
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;