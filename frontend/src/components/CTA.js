import React from 'react';

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full animate-bounce-slow blur-xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Transform Your Interview Success?
          </h2>
          <p className="text-xl md:text-2xl text-primary-100 max-w-4xl mx-auto mb-12 leading-relaxed">
            Join thousands of professionals who have mastered their interview skills with RecruAI. 
            Start free forever or try our premium features with a 14-day trial.
          </p>
          
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
            {/* Job Seekers CTA */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex-1 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">👤 For Job Seekers</h3>
              <p className="text-primary-100 mb-6">Start practicing with AI interviews today</p>
              <button className="w-full bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg mb-4">
                Start Free Forever
              </button>
              <div className="text-sm text-primary-200">
                💰 Earn $3 per referral • No credit card required
              </div>
            </div>

            {/* Organizations CTA */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex-1 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">🏢 For Organizations</h3>
              <p className="text-primary-100 mb-6">Revolutionize your recruitment process</p>
              <button className="w-full bg-accent-500 text-white hover:bg-accent-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg mb-4">
                Schedule Demo
              </button>
              <div className="text-sm text-primary-200">
                🚀 Free trial • Custom pricing available
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-primary-200">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></div>
              Free forever plan available
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></div>
              14-day premium trial
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></div>
              24/7 customer support
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></div>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;