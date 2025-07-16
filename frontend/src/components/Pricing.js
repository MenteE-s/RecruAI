import React, { useState, useEffect, useRef } from 'react';

const Pricing = () => {
  const [userType, setUserType] = useState('individual');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const individualPlans = [
    {
      name: "Beta Access",
      description: "Free during beta period",
      price: "Free",
      duration: "during beta",
      betaNote: "Limited to first 100 users",
      features: [
        "10 mock interviews during beta",
        "Basic AI feedback",
        "Progress tracking",
        "Community support",
        "🎁 50% discount when we launch",
        "🏆 Beta contributor badge"
      ],
      popular: true,
      cta: "Join Beta Waitlist",
      gradient: "from-success-400 to-primary-600",
      badge: "🎁 Free Beta"
    },
    {
      name: "Early Bird",
      description: "Post-launch pricing for beta users",
      price: "$15",
      duration: "month",
      originalPrice: "$30",
      betaNote: "50% off for beta users (first year)",
      features: [
        "Unlimited mock interviews",
        "Advanced AI feedback",
        "Industry-specific questions",
        "Performance analytics",
        "Priority support",
        "New features first"
      ],
      popular: false,
      cta: "Reserve Your Spot",
      gradient: "from-accent-500 to-primary-600",
      badge: "50% Off"
    },
    {
      name: "Full Price",
      description: "Regular pricing after launch",
      price: "$30",
      duration: "month",
      betaNote: "Standard pricing for new users",
      features: [
        "Unlimited mock interviews",
        "Advanced AI feedback",
        "Industry-specific questions",
        "Performance analytics",
        "Standard support",
        "All features"
      ],
      popular: false,
      cta: "Coming Soon",
      gradient: "from-secondary-400 to-secondary-600"
    }
  ];

  const organizationPlans = [
    {
      name: "Team Beta",
      description: "For small recruiting teams",
      price: "Free",
      duration: "during beta",
      betaNote: "Help us build the perfect solution",
      features: [
        "Up to 5 recruiter accounts",
        "Basic candidate screening",
        "Team dashboard",
        "Email support",
        "Beta feedback program",
        "🎁 50% off when we launch"
      ],
      popular: true,
      cta: "Join Beta Program",
      gradient: "from-success-400 to-primary-600",
      badge: "🚀 Beta Partner"
    },
    {
      name: "Professional",
      description: "Full-featured solution",
      price: "Custom",
      duration: "contact us",
      betaNote: "Launching Q3 2025",
      features: [
        "Unlimited recruiter accounts",
        "Advanced AI screening",
        "Custom integrations",
        "Dedicated support",
        "Custom training",
        "Priority features"
      ],
      popular: false,
      cta: "Schedule Demo",
      gradient: "from-accent-500 to-primary-600"
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

  const handleCTAClick = (plan) => {
    if (plan.cta.includes("Schedule Demo")) {
      window.open('mailto:support@menteee.com?subject=Enterprise Demo Request', '_blank');
    } else {
      window.open('https://forms.gle/WfroWeDqDcNCYF9s5', '_blank');
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="pricing" 
      className="py-20 bg-gradient-to-br from-secondary-50 via-white to-primary-50 relative overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-accent-100 border border-accent-200 rounded-full text-sm font-medium text-accent-700 mb-6">
            🎯 Beta Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            Early Bird <span className="text-primary-600">Pricing</span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Join our beta program and get exclusive pricing. Choose a plan that fits you best.
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-2 rounded-xl shadow-lg border border-secondary-200">
            <button
              onClick={() => setUserType('individual')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                userType === 'individual'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              👤 Job Seekers
            </button>
            <button
              onClick={() => setUserType('organization')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                userType === 'organization'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              🏢 Organizations
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {currentPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-primary-200 ring-4 ring-primary-100' 
                  : 'border-secondary-200'
              } ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg bg-gradient-to-r ${plan.gradient}`}>
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">{plan.name}</h3>
                  <p className="text-secondary-600 mb-6">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-secondary-900">{plan.price}</div>
                    <div className="text-lg text-primary-600 font-medium">{plan.duration}</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-secondary-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleCTAClick(plan)}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
                    plan.popular
                      ? `text-white bg-gradient-to-r ${plan.gradient} shadow-lg`
                      : 'text-primary-600 bg-primary-50 border-2 border-primary-200 hover:bg-primary-100'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              Questions about pricing?
            </h3>
            <p className="text-secondary-600 mb-6">
              We're here to help you choose the right plan for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.open('mailto:support@menteee.com', '_blank')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Contact Us
              </button>
              <button 
                onClick={() => window.open('https://forms.gle/NGJ3gu5MstTyLSib8', '_blank')}
                className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
