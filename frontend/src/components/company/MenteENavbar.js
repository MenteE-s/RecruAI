import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MenteENavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="text-2xl font-display font-bold text-primary-600">
                  MenteE
                </div>
                <div className="text-sm text-secondary-500 hidden sm:block">
                  AI-Powered Professional Development
                </div>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#products" className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                Products
              </a>
              <a href="#about" className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                About
              </a>
              <a href="#careers" className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                Careers
              </a>
              <a href="#contact" className="text-secondary-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button className="text-secondary-700 hover:text-primary-600 px-4 py-2 text-sm font-medium transition-colors">
                Sign In
              </button>
              <Link 
                to="/recruai" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Try RecruAI
              </Link>
            </div>
          </div>

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

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            <a href="#products" className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium">
              Products
            </a>
            <a href="#about" className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium">
              About
            </a>
            <a href="#careers" className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium">
              Careers
            </a>
            <a href="#contact" className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium">
              Contact
            </a>
            <div className="pt-4 pb-3 border-t border-secondary-200">
              <button className="text-secondary-700 hover:text-primary-600 block px-3 py-2 text-base font-medium">
                Sign In
              </button>
              <Link 
                to="/recruai"
                className="bg-primary-600 hover:bg-primary-700 text-white block px-3 py-2 rounded-lg text-base font-medium mt-2 w-full text-center"
              >
                Try RecruAI
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MenteENavbar;