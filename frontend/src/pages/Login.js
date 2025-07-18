import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showBetaMessage, setShowBetaMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call for beta
    setTimeout(() => {
      setIsLoading(false);
      setShowBetaMessage(true);
      
      // Reset form after showing message
      setTimeout(() => {
        setShowBetaMessage(false);
        setFormData({
          email: '',
          password: '',
          rememberMe: false
        });
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-accent-600 p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">M</span>
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">
              MenteE RecruAI
            </h1>
            <p className="text-xl text-primary-100">
              AI-powered interview preparation that helps you land your dream job.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-primary-100">Practice with AI interviewers</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-primary-100">Get personalized feedback</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-primary-100">Track your progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {!showBetaMessage ? (
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                  <span className="text-2xl font-display font-bold text-secondary-900">MenteE</span>
                </div>
              </div>

              {/* Beta Notice */}
              <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-8">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="font-semibold text-accent-700">Beta Coming Soon!</p>
                    <p className="text-sm text-accent-600">We're currently in development. Join our waitlist to get early access.</p>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-secondary-900 mb-2">
                  Ready to get started?
                </h2>
                <p className="text-secondary-600">
                  Sign up for our beta waitlist and be the first to experience RecruAI
                </p>
              </div>

              {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Email address
                        </label>
                        <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="Enter your email"
                        required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Full Name
                        </label>
                        <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="Enter your full name"
                        required
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-secondary-600">Notify me about updates</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.open('https://forms.gle/WfroWeDqDcNCYF9s5', '_blank')}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Join Beta Waitlist
                      </button>
                      </form>

                      <div className="text-center mt-8">
                      <p className="text-secondary-600">
                        Want to learn more?{' '}
                        <Link 
                        to="/recruai" 
                        className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                        >
                        Explore RecruAI
                        </Link>
                      </p>
                      </div>

                      {/* Beta Benefits */}
              <div className="mt-8 p-6 bg-secondary-50 rounded-xl">
                <h4 className="font-semibold text-secondary-900 mb-3">Beta Benefits:</h4>
                <div className="space-y-2 text-sm text-secondary-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-primary-600">✓</span>
                    <span>Free access during beta period</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary-600">✓</span>
                    <span>50% lifetime discount when we launch</span>
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
            </div>
          ) : (
            /* Success Message */
            <div className="text-center py-8 animate-fade-in-up">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Welcome to the waitlist! 🎉
              </h3>
              <p className="text-secondary-600 mb-6">
                Thank you for joining our beta program. You'll be among the first to know when RecruAI launches!
              </p>
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-700">
                  📧 Check your email for confirmation and updates<br/>
                  🚀 We'll notify you as soon as beta access is available
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  to="/recruai"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Learn More About RecruAI
                </Link>
                <Link 
                  to="/"
                  className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Homepage
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;