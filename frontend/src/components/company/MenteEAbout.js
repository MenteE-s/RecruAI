import React from 'react';

const MenteEAbout = () => {
  const stats = [
    { number: "2025", label: "Founded", icon: "🚀" },
    { number: "1+", label: "Products Live", icon: "💡" },
    { number: "10K+", label: "Users Served", icon: "👥" },
    { number: "95%", label: "Success Rate", icon: "📈" }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We push the boundaries of what's possible with AI to create transformative professional development solutions.",
      icon: "🔬",
      gradient: "from-primary-500 to-accent-500"
    },
    {
      title: "Human-Centered AI",
      description: "Our AI amplifies human potential rather than replacing it, focusing on empowerment and growth.",
      icon: "🤝",
      gradient: "from-accent-500 to-success-500"
    },
    {
      title: "Accessibility",
      description: "We believe everyone deserves access to world-class professional development, regardless of background.",
      icon: "🌍",
      gradient: "from-success-500 to-primary-500"
    },
    {
      title: "Continuous Learning",
      description: "We practice what we preach - constantly learning, iterating, and improving our solutions.",
      icon: "📚",
      gradient: "from-primary-600 to-accent-600"
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-medium text-primary-600 mb-6">
            🎯 About MenteE
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            Empowering Careers Through{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              AI Innovation
            </span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            MenteE is on a mission to democratize professional development through cutting-edge AI solutions. 
            We're building the future where everyone has access to personalized, scalable career growth tools.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-gradient-to-br from-secondary-50 to-primary-50 rounded-xl border border-secondary-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-display font-bold text-primary-600 mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-secondary-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl transform rotate-3"></div>
            <div className="relative bg-white p-8 rounded-3xl border border-secondary-200 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-secondary-900">Our Mission</h3>
              </div>
              <p className="text-secondary-600 leading-relaxed text-lg">
                To democratize access to world-class professional development by leveraging AI to create 
                personalized, scalable, and effective learning experiences that empower individuals to 
                achieve their career goals.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-100 to-success-100 rounded-3xl transform -rotate-3"></div>
            <div className="relative bg-white p-8 rounded-3xl border border-secondary-200 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-success-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🔮</span>
                </div>
                <h3 className="text-2xl font-bold text-secondary-900">Our Vision</h3>
              </div>
              <p className="text-secondary-600 leading-relaxed text-lg">
                A world where every professional has access to AI-powered tools that accelerate their 
                growth, where career development is personalized, efficient, and aligned with both 
                individual aspirations and market demands.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Our Core Values
            </h3>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              These principles guide everything we do, from product development to customer relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl border border-secondary-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${value.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{value.icon}</span>
                </div>
                <h4 className="text-xl font-bold text-secondary-900 mb-4">
                  {value.title}
                </h4>
                <p className="text-secondary-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Join Our Mission</h3>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              We're always looking for passionate individuals who want to shape the future of professional development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#careers"
                className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                View Open Positions
              </a>
              <a
                href="#contact"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                Get In Touch
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenteEAbout;