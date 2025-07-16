import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MenteENavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-secondary-200 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}

          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-20 h-20 flex items-center justify-center">
                <img 
                  src="logos/MenteER.png" 
                  // src="logos/ms-icon-310x310.png" 
                  alt="MenteE Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-xl font-display font-bold text-secondary-900">MenteE</div>
                <div className="text-xs text-secondary-500 hidden sm:block">AI-Powered Career Growth</div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <a 
                href="#products" 
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Products
              </a>
              <a 
                href="#solutions" 
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Solutions
              </a>
              <a 
                href="#blog" 
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Blog
              </a>
              <a 
                href="#about" 
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                About
              </a>
              <a 
                href="#careers" 
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Careers
              </a>
              <a 
                href="#contact" 
                className="text-secondary-700 hover:text-primary-600 font-medium transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link 
              to="/recruai" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Explore RecruAI
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-700 hover:text-primary-600 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg border-t border-secondary-200">
            <a href="#products" className="block px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium">
              Products
            </a>
            <a href="#solutions" className="block px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium">
              Solutions
            </a>
            <a href="#blog" className="block px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium">
              Blog
            </a>
            <a href="#about" className="block px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium">
              About
            </a>
            <a href="#careers" className="block px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium">
              Careers
            </a>
            <a href="#contact" className="block px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium">
              Contact
            </a>
            <div className="pt-4 border-t border-secondary-200">
              <Link 
                to="/recruai"
                className="block px-3 py-2 bg-primary-600 text-white rounded-lg font-medium text-center mx-3"
              >
                Explore RecruAI
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MenteENavbar;