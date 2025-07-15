import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const MenteEHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20 pb-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-accent-400/20 to-primary-400/20 bg-300% animate-gradient"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center w-full">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-full text-sm font-medium text-primary-600 mb-6">
                <span className="relative">🚀 Empowering Careers Through AI Innovation</span>
              </div>
              
              <h1 className="text-6xl tracking-tight font-display font-bold text-secondary-900 sm:text-7xl md:text-8xl lg:text-7xl xl:text-8xl">
                <span className="block animate-fade-in-up">Welcome to</span>
                <span className="block bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700 bg-clip-text text-transparent animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  MenteE
                </span>
                <span className="block animate-fade-in-up text-4xl md:text-5xl text-secondary-600 font-medium mt-4" style={{animationDelay: '0.4s'}}>
                  AI-Powered Professional Development
                </span>
              </h1>
              
              <p className="mt-8 text-2xl text-secondary-600 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                We're building the future of professional development with cutting-edge AI solutions. 
                Our first product, <strong className="text-primary-600">RecruAI</strong>, is revolutionizing interview preparation and recruitment.
              </p>
            </div>

            <div className="mt-10 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                <Link 
                  to="/recruai"
                  className="group relative bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-primary-500/25 animate-pulse-glow overflow-hidden text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  <span className="relative flex items-center justify-center">
                    Explore RecruAI
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Link>
                
                <a 
                  href="#about"
                  className="group bg-white/80 backdrop-blur-sm hover:bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 border-2 border-primary-200 hover:border-primary-400 hover:shadow-lg text-center"
                >
                  <span className="flex items-center justify-center">
                    Learn More
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-16 lg:mt-0 lg:col-span-6 relative">
            <div className="relative animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl"></div>
                <div className="relative text-center">
                  <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl mx-auto mb-6 animate-pulse-glow">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-secondary-900 mb-4">Our Mission</h3>
                  <p className="text-secondary-600 mb-6">
                    Democratizing access to professional development through AI-powered solutions that scale personalized learning and growth.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="animate-scale-in" style={{animationDelay: '1s'}}>
                      <div className="text-2xl font-bold text-primary-600">1</div>
                      <div className="text-xs text-secondary-600">Product Live</div>
                    </div>
                    <div className="animate-scale-in" style={{animationDelay: '1.2s'}}>
                      <div className="text-2xl font-bold text-accent-600">5+</div>
                      <div className="text-xs text-secondary-600">In Pipeline</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenteEHero;