// filepath: h:\Code\Startup\\RecruAI\frontend\src\components\Footer.js
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary-900 text-white">
      {/* Large Branding Section */}
      <div className="border-b border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-display font-bold text-white mb-4 tracking-wider">
              MenteE
            </h2>
            <p className="text-xl md:text-2xl text-secondary-300 max-w-2xl mx-auto">
              Empowering the future of recruitment through AI innovation
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-2xl font-display font-bold text-white">
                MenteE
              </h3>
              <div className="h-6 w-px bg-secondary-700"></div>
              <span className="text-xl font-semibold text-secondary-300">
                RecruAI
              </span>
            </div>
            <p className="text-secondary-300 mb-6">
              Empowering AI-powered interviews for job seekers and recruiters.
              Transforming interview preparation with realistic mock interviews
              and personalized feedback.
            </p>
            <p className="text-sm text-secondary-400 mb-4">
              A product by <strong className="text-primary-400">MenteE</strong>{" "}
              - Leading AI innovation in professional development and
              recruitment.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/mentee_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-white transition-colors"
                aria-label="Follow us on Twitter"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/mentee-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-white transition-colors"
                aria-label="Connect with us on LinkedIn"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://github.com/mentee-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-white transition-colors"
                aria-label="View our GitHub"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.39-3.88-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.26 3.39.97.11-.76.41-1.26.74-1.55-2.55-.29-5.24-1.28-5.24-5.72 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.45.11-3.02 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.99 0 1.99.13 2.92.39 2.2-1.5 3.17-1.18 3.17-1.18.63 1.57.23 2.73.11 3.02.74.81 1.18 1.84 1.18 3.1 0 4.45-2.69 5.42-5.25 5.71.42.36.79 1.09.79 2.2 0 1.59-.01 2.88-.01 3.28 0 .3.21.66.8.55C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              RecruAI Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Testimonials
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  About MenteE
                </Link>
              </li>
              <li>
                <a
                  href="#products"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Our Products
                </a>
              </li>
              <li>
                <a
                  href="mailto:careers@mentee.org"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/contact"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link
                  to="/status"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  System Status
                </Link>
              </li>
              <li>
                <Link
                  to="/community"
                  className="text-secondary-300 hover:text-white transition-colors"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-400 text-sm">
              © 2025 <strong>MenteE</strong>. RecruAI and all related products
              are trademarks of MenteE Inc. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to="/privacy"
                className="text-secondary-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-secondary-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="text-secondary-400 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
