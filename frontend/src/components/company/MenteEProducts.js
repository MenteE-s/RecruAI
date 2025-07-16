import React from 'react';
import { Link } from 'react-router-dom';

const MenteEProducts = () => {
  const products = [
    {
      name: "RecruAI",
      status: "Beta Coming Soon",
      description: "AI-powered interview preparation and practice platform",
      features: ["Mock AI Interviews", "Real-time Feedback", "Progress Tracking", "Company-specific Prep"],
      stats: { waitlist: "100+", features: "15+", launch: "Q2 2025" },
      link: "/recruai",
      gradient: "from-primary-500 to-accent-500",
      icon: "🎯"
    },
    {
      name: "SkillAI",
      status: "Coming Q3 2025",
      description: "Personalized skill assessment and learning recommendations",
      features: ["Skill Gap Analysis", "Learning Paths", "Industry Benchmarks", "Progress Tracking"],
      stats: { planned: "Q3 2025", skills: "100+", industries: "10+" },
      link: "#waitlist",
      gradient: "from-accent-500 to-success-500",
      icon: "📈"
    },
    {
      name: "CareerAI",
      status: "Coming 2026",
      description: "AI career coach for strategic professional growth",
      features: ["Career Planning", "Market Insights", "Network Building", "Growth Tracking"],
      stats: { planned: "2026", research: "Active", concept: "Early" },
      link: "#waitlist",
      gradient: "from-success-500 to-primary-500",
      icon: "🚀"
    }
  ];

  return (
    <section id="products" className="py-20 bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            Our AI-powered products
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Each product is designed to solve specific challenges in professional development, 
            from landing your first job to advancing your career.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg border border-secondary-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl">{product.icon}</div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === 'Available' 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {product.status}
                </div>
              </div>

              {/* Product Info */}
              <h3 className="text-2xl font-bold text-secondary-900 mb-3">
                {product.name}
              </h3>
              <p className="text-secondary-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {product.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    <span className="text-secondary-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-secondary-50 rounded-xl">
                {Object.entries(product.stats).map(([key, value], statIndex) => (
                  <div key={statIndex} className="text-center">
                    <div className="text-lg font-bold text-primary-600">{value}</div>
                    <div className="text-xs text-secondary-500 capitalize">{key}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {product.status === 'Available' ? (
                <Link
                  to={product.link}
                  className={`block w-full py-3 px-6 rounded-xl text-center font-semibold transition-all duration-300 bg-gradient-to-r ${product.gradient} text-white hover:shadow-lg transform hover:scale-105`}
                >
                  Try {product.name}
                </Link>
              ) : (
                <button className="block w-full py-3 px-6 rounded-xl text-center font-semibold bg-secondary-100 text-secondary-500 cursor-not-allowed">
                  Join Waitlist
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold text-secondary-900 mb-4">
            Ready to accelerate your career?
          </h3>
          <p className="text-xl text-secondary-600 mb-8">
            Join thousands of professionals who have transformed their careers with our AI platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/recruai"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold transition-all"
            >
              Start with RecruAI
            </Link>
            <button className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-8 py-4 rounded-xl font-semibold transition-all">
              Schedule a demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenteEProducts;