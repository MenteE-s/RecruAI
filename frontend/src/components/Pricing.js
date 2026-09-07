import React, { useState } from "react";

const Pricing = () => {
  const [userType, setUserType] = useState("individual");

  const individualPlans = [
    {
      name: "Free Forever",
      description: "Perfect for getting started with RecruAI",
      price: 0,
      duration: "forever",
      features: [
        "3 mock interviews per month",
        "Basic AI feedback",
        "Progress tracking",
        "Mobile app access",
        "Community support",
      ],
      popular: false,
      cta: "Start Free",
    },
    {
      name: "Individual Pro",
      description: "For serious job seekers",
      price: 30,
      duration: "month",
      features: [
        "Unlimited mock interviews",
        "Advanced AI feedback",
        "Industry-specific questions",
        "Performance analytics",
        "Video interview practice",
        "Resume optimization tips",
        "Earn $3 per successful referral",
        "Priority support",
      ],
      popular: true,
      cta: "Start 14-Day Free Trial",
    },
  ];

  const organizationPlans = [
    {
      name: "Startup",
      description: "For small teams and startups",
      price: 30,
      duration: "recruiter/month",
      features: [
        "Up to 3 recruiters",
        "AI candidate screening",
        "Basic analytics dashboard",
        "Email support",
        "Standard integrations",
        "14-day free trial",
      ],
      popular: false,
      cta: "Start Free Trial",
    },
    {
      name: "Professional",
      description: "For growing organizations",
      price: 25,
      duration: "recruiter/month",
      features: [
        "Up to 10 recruiters",
        "Advanced AI screening",
        "Custom question banks",
        "Detailed analytics",
        "ATS integration",
        "Priority support",
        "Team collaboration tools",
        "Free onboarding & training",
      ],
      popular: true,
      cta: "Schedule Demo",
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      price: "Custom",
      duration: "pricing",
      features: [
        "Unlimited recruiters",
        "White-label solution",
        "Custom AI models",
        "Advanced integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom training & support",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ];

  const currentPlans = userType === "individual" ? individualPlans : organizationPlans;

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-4">
            Simple & Transparent
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your{" "}
            <span className="text-blue-600">Success Plan</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white border border-gray-200 p-1 flex">
            <button
              onClick={() => setUserType("individual")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                userType === "individual"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Job Seekers
            </button>
            <button
              onClick={() => setUserType("organization")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                userType === "organization"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Organizations
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className={`grid gap-6 max-w-5xl mx-auto ${
          currentPlans.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
        }`}>
          {currentPlans.map((plan, index) => (
            <div
              key={`${userType}-${index}`}
              className={`bg-white border p-6 ${
                plan.popular
                  ? "border-blue-600 shadow-lg"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.popular && (
                <div className="inline-block bg-blue-600 text-white text-xs font-medium px-2 py-1 mb-4">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

              <div className="mb-6">
                <div className="flex items-baseline">
                  {typeof plan.price === "number" ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">/{plan.duration}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  )}
                </div>
              </div>

              <button
                className={`w-full py-3 px-4 text-sm font-medium transition-colors mb-6 ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
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
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Start with our forever free plan. Upgrade anytime for unlimited AI interviews.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500"></span>
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500"></span>
              30-day money back
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500"></span>
              24/7 support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
