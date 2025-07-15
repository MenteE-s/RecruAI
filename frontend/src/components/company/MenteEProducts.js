import React from 'react';
import { Link } from 'react-router-dom';

const MenteEProducts = () => {
  const products = [
    {
      name: "RecruAI",
      status: "Live",
      description: "AI-powered interview preparation and recruitment platform",
      features: ["Mock Interviews", "AI Feedback", "Recruitment Automation"],
      gradient: "from-primary-500 to-accent-500",
      link: "/recruai",
      badge: "🚀 Available Now"
    },
    {
      name: "SkillAI",
      status: "Coming Soon",
      description: "Personalized skill assessment and learning path recommendations",
      features: ["Skill Assessment", "Learning Paths", "Progress Tracking"],
      gradient: "from-accent-500 to-success-500",
      link: "#",
      badge: "🔮 Q2 2025"
    },
    {
      name: "CareerAI",
      status: "In Development",
      description: "AI career coach for professional growth and transitions",
      features: ["Career Planning", "Industry Insights", "Network Building"],
      gradient: "from-success-500 to-primary-500",
      link: "#",
      badge: "⭐ Q3 2025"
    }
  ];

  return (
    <section id="products" className="py-20 bg-gradient-to-b from-white to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-medium text-primary-600 mb-6">
            🛠️ Our Product Ecosystem
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            Transforming Professional Development with{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              AI Solutions
            </span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Each product in our ecosystem is designed to address specific challenges in professional growth and career development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl p-8 shadow-lg border border-secondary-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                product.status === 'Live' ? 'hover:border-primary-300' : 'hover:border-secondary-300'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute -top-4 left-6">
                <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                  product.status === 'Live' 
                    ? 'bg-gradient-to-r from-success-500 to-primary-600 text-white animate-pulse' 
                    : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {product.badge}
                </div>
              </div>

              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
              
              <div className="relative z-10 mt-4">
                {/* Product Icon */}
                <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-r ${product.gradient} rounded-xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl text-white font-bold">
                    {product.name.slice(0, 2)}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-secondary-900 mb-3 text-center">
                  {product.name}
                </h3>
                <p className="text-secondary-600 mb-6 text-center leading-relaxed">
                  {product.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-success-400 to-success-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-secondary-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {product.status === 'Live' ? (
                  <Link
                    to={product.link}
                    className={`block w-full py-3 px-6 rounded-xl text-center font-semibold transition-all duration-300 bg-gradient-to-r ${product.gradient} text-white hover:shadow-lg transform hover:scale-105`}
                  >
                    Explore {product.name}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full py-3 px-6 rounded-xl text-center font-semibold bg-secondary-100 text-secondary-500 cursor-not-allowed"
                  >
                    {product.status}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenteEProducts;