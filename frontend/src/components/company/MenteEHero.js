import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MenteEHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden ">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob " ></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
        <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          
          {/* Beta Badge */}
          {/* <div className="inline-flex items-center px-4 py-2 bg-accent-100 border border-accent-200 rounded-full text-sm font-medium text-accent-700 mb-8">
            🚀 Coming Soon - Join the Beta Waitlist
          </div> */}

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-secondary-900 mb-8 leading-tight">
            AI that transforms
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              professional growth
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-secondary-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            From interview preparation to skill development and career coaching, 
            our AI-powered platform helps professionals at every stage of their journey.
          </p>

          {/* Early Adopter Stats */}
          <div className="flex flex-col sm:flex-row gap-12 justify-center mb-16 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-secondary-600">Beta applicants</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-secondary-600">Industry experts</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10+</div>
              <div className="text-secondary-600">Partner companies</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <button
              onClick={() => window.open('https://forms.gle/WfroWeDqDcNCYF9s5', '_blank')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Join Beta Waitlist
            </button>
            <a 
              href="#products"
              className="bg-white border-2 border-secondary-300 hover:border-secondary-400 text-secondary-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all"
            >
              Learn More
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="text-secondary-500 space-y-2">
            <p className="text-lg font-medium">✨ Be among the first 100 beta users</p>
            <p className="text-sm">📧 Get notified when we launch • 🎁 Early access benefits • 💎 Lifetime discount</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenteEHero;