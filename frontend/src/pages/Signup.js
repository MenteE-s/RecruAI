import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    company: '',
    experience: '',
    interests: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        interests: checked 
          ? [...prev.interests, value]
          : prev.interests.filter(interest => interest !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Just show success after delay - no external form
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
    }, 1500);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      company: '',
      experience: '',
      interests: []
    });
    setShowSuccess(false);
  };

  const handleGoogleForm = () => {
    window.open('https://forms.gle/NGJ3gu5MstTyLSib8', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        
        {/* Header with close option */}
        <div className="sticky top-0 bg-white border-b border-secondary-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">Join Beta Waitlist</h2>
              <p className="text-sm text-secondary-600">Be first to experience RecruAI</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 pb-8">
          {!showSuccess ? (
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Beta Benefits Banner */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 mb-8 mt-6">
                <h3 className="font-bold text-secondary-900 mb-4">🎁 Exclusive Beta Benefits</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-primary-600">✓</span>
                    <span>Free access during entire beta</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary-600">✓</span>
                    <span>50% lifetime discount</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary-600">✓</span>
                    <span>Priority customer support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary-600">✓</span>
                    <span>Influence product development</span>
                  </div>
                </div>
              </div>

              {/* Main CTA for Google Form */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                  Ready to join the waitlist?
                </h3>
                <p className="text-secondary-600 mb-6">
                  Fill out our quick form to secure your spot in the beta program
                </p>
                
                <button
                  onClick={handleGoogleForm}
                  className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 mb-6"
                >
                  🚀 Join Beta Waitlist
                </button>

                <div className="text-sm text-secondary-500">
                  Opens in a new tab • Takes less than 2 minutes
                </div>
              </div>

              {/* Alternative: Preview Form */}
              <div className="border-t border-secondary-200 pt-8">
                <h4 className="text-lg font-semibold text-secondary-900 mb-4 text-center">
                  Or preview what we'll ask:
                </h4>
                
                <form className="space-y-6 opacity-60 pointer-events-none">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-lg bg-secondary-50"
                        placeholder="Your full name"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-lg bg-secondary-50"
                        placeholder="your@email.com"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Current Role
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-lg bg-secondary-50"
                        placeholder="e.g., Software Engineer"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-lg bg-secondary-50"
                        placeholder="Current company"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      disabled
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg bg-secondary-50"
                    >
                      <option value="">Select your experience level</option>
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (6-10 years)</option>
                      <option value="lead">Lead/Principal (10+ years)</option>
                      <option value="executive">Executive/C-Level</option>
                    </select>
                  </div>
                </form>

                <div className="text-center mt-6">
                  <p className="text-sm text-secondary-500 mb-4">
                    This is just a preview. Click the button above to access the real form.
                  </p>
                  
                  <button
                    onClick={handleGoogleForm}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Go to Waitlist Form
                  </button>
                </div>
              </div>

              {/* Security & Privacy */}
              <div className="mt-8 text-center text-xs text-secondary-500 border-t border-secondary-200 pt-6">
                <p>🔒 Your information is secure and will only be used to notify you about RecruAI updates.</p>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-12 animate-fade-in-up">
              <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-3xl font-bold text-secondary-900 mb-4">
                Welcome to the future! 🎉
              </h3>
              
              <p className="text-xl text-secondary-600 mb-8">
                Thank you for your interest! Don't forget to fill out our waitlist form.
              </p>

              <div className="bg-primary-50 rounded-xl p-6 mb-8">
                <h4 className="font-semibold text-primary-900 mb-3">Next Steps:</h4>
                <div className="space-y-2 text-sm text-primary-700">
                  <div className="flex items-center space-x-2">
                    <span>📝</span>
                    <span>Complete the waitlist form (opens in new tab)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📧</span>
                    <span>Get confirmation email</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🚀</span>
                    <span>Beta access notification (Coming Q2 2025)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <button 
                  onClick={handleGoogleForm}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  📝 Fill Waitlist Form
                </button>
                <Link 
                  to="/recruai"
                  className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-8 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Learn More
                </Link>
              </div>

              <button 
                onClick={() => navigate('/')}
                className="text-secondary-600 hover:text-primary-600 px-8 py-3 font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;