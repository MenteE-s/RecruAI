import React, { useState } from 'react';

const WaitlistModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create Google Form URL with pre-filled data
    const googleFormUrl = `https://docs.google.com/forms/d/e/1FAIpQLSd-MhKeIqR0mPaTGRY_LcQPsZh6aQAgXAzxoPsBybAA_Fw_kw/viewform?usp=pp_url&entry.YOUR_NAME_FIELD=${encodeURIComponent(name)}&entry.YOUR_EMAIL_FIELD=${encodeURIComponent(email)}&entry.YOUR_ROLE_FIELD=${encodeURIComponent(role)}&entry.YOUR_COMPANY_FIELD=${encodeURIComponent(company)}`;
    
    // Open Google Form in new tab
    window.open(googleFormUrl, '_blank');
    
    setIsSubmitted(true);
    
    // Close modal after 2 seconds
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setEmail('');
      setName('');
      setRole('');
      setCompany('');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">Join the Beta Waitlist</h2>
              <p className="text-secondary-600">Be among the first to experience AI-powered interview preparation</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Current Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Your current company"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Join Waitlist
              </button>
            </form>

            {/* Benefits */}
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <p className="text-sm font-medium text-secondary-700 mb-3">Beta Benefits:</p>
              <div className="space-y-2 text-sm text-secondary-600">
                <div className="flex items-center space-x-2">
                  <span className="text-primary-600">✓</span>
                  <span>50% lifetime discount</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-primary-600">✓</span>
                  <span>Early access to all features</span>
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
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">Welcome to the waitlist!</h3>
            <p className="text-secondary-600">
              You'll be notified as soon as we launch. Thank you for joining us!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;