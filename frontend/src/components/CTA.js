import React from 'react';

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-accent-600/20"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
          Help us build the future of interviews
        </h2>
        <p className="text-xl text-primary-100 mb-12 max-w-3xl mx-auto">
          Join our beta program and help shape RecruAI. Your feedback will directly influence 
          our product development and you'll get exclusive early access.
        </p>
        
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
          {/* Job Seekers CTA */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex-1 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">👤 For Job Seekers</h3>
            <p className="text-primary-100 mb-6">Get beta access and 50% lifetime discount</p>
            <button 
              onClick={() => window.open('https://forms.gle/WfroWeDqDcNCYF9s5', '_blank')}
              className="w-full bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg mb-4"
            >
              Join Beta Waitlist
            </button>
            <div className="text-sm text-primary-200">
              🎁 Free during beta • 💎 Lifetime benefits • 📧 Launch notification
            </div>
          </div>

          {/* Organizations CTA */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex-1 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">🏢 For Organizations</h3>
            <p className="text-primary-100 mb-6">Shape our enterprise features</p>
            <button 
              onClick={() => window.open('mailto:support@menteee.com?subject=Enterprise Beta Interest', '_blank')}
              className="w-full bg-accent-500 text-white hover:bg-accent-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg mb-4"
            >
              Schedule Demo
            </button>
            <div className="text-sm text-primary-200">
              🚀 Free beta access • 🤝 Partner program • 💼 Custom solutions
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-primary-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>First 100 beta users get lifetime benefits</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>No credit card required for beta</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Direct influence on product features</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;