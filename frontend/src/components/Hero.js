import React, { useState, useEffect } from 'react';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-16 bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            
            {/* Beta Badge */}
            {/* <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-sm font-medium text-primary-700 mb-8">
              🚀 Beta Coming Soon - RecruAI by MenteE
            </div> */}

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-display font-bold text-secondary-900 mb-6 leading-tight">
              Practice interviews.
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Get hired.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-secondary-600 mb-8 leading-relaxed">
              AI-powered interview practice that adapts to your role, experience level, 
              and target companies. Join our beta to get early access.
            </p>

            {/* Beta Stats */}
            <div className="flex gap-8 mb-10">
              <div>
                <div className="text-3xl font-bold text-primary-600">50+</div>
                <div className="text-sm text-secondary-600">Beta signups</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">5+</div>
                <div className="text-sm text-secondary-600">Partner companies</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">4.8★</div>
                <div className="text-sm text-secondary-600">Early feedback</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.open('https://forms.gle/WfroWeDqDcNCYF9s5', '_blank')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Join Beta Waitlist
              </button>
              <button className="bg-white border-2 border-secondary-300 hover:border-secondary-400 text-secondary-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all">
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 text-sm text-secondary-500">
              🎯 First 100 users get lifetime 50% discount • 📧 Launch notification • 💎 Beta access
            </div>
          </div>

          {/* Right Visual - Coming Soon Mockup */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="relative">
              {/* Coming Soon Interface Mockup */}
              <div className="bg-white rounded-2xl shadow-2xl border border-secondary-200 overflow-hidden">
                {/* Header */}
                <div className="bg-secondary-50 px-6 py-4 border-b border-secondary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm font-medium text-secondary-600">RecruAI - Coming Soon</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl font-bold text-white">R</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                    AI Interview Practice
                  </h3>
                  
                  <p className="text-secondary-600 mb-8">
                    Get ready for the future of interview preparation. 
                    Join our beta waitlist for early access.
                  </p>

                  {/* Features Preview */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-sm text-secondary-700">AI-powered mock interviews</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-sm text-secondary-700">Real-time feedback & coaching</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-sm text-secondary-700">Company-specific preparation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-sm text-secondary-700">Progress tracking & analytics</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-accent-50 rounded-lg">
                    <p className="text-sm text-accent-700 font-medium">
                      🚀 Beta launching Q2 2025
                    </p>
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

export default Hero;