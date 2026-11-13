import React from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { FiInstagram, FiLinkedin, FiTwitter } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="border-t border-line dark:border-gray-800 bg-surface dark:bg-gray-0 text-ink transition-colors">
      {/* Main Footer Columns */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand Info & Socials */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2.5 mb-3">
              <span className="text-lg font-bold text-ink tracking-tight">
                MenteE
              </span>
              <span className="h-4 w-px bg-line dark:bg-gray-800"></span>
              <span className="text-base font-semibold text-brand-text">
                RecruAI
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-600 leading-relaxed mb-4">
              AI-powered interviews, candidate matching, and career development for job seekers and organizations.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              A product by{" "}
              <a
                href="https://menteeai.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-text hover:underline"
              >
                MenteE Inc.
              </a>
            </p>
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-500">
              <a
                href="https://twitter.com/menteeaiorg"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-50/20 transition-colors shadow-s5"
                aria-label="Twitter"
              >
                <FiTwitter className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <a
                href="https://instagram.com/mentee.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-50/20 transition-colors shadow-s5"
                aria-label="Instagram"
              >
                <FiInstagram className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <a
                href="https://linkedin.com/company/menteeai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-50/20 transition-colors shadow-s5"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <a
                href="https://menteeai.org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-50/20 transition-colors shadow-s5"
                aria-label="Website"
              >
                <Globe className="h-4 w-4" strokeWidth={1.8} />
              </a>
            </div>
          </div>

          {/* Column 2: RecruAI Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink mb-3.5">
              RecruAI product
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="/#features"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/#pricing"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="/#testimonials"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Testimonials
                </a>
              </li>
              <li>
                <Link
                  to="/in/jobs"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Browse jobs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company & Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink mb-3.5">
              Company
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/about"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/community"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink mb-3.5">
              Legal and trust
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/privacy"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  Cookie policy
                </Link>
              </li>
              <li>
                <Link
                  to="/status"
                  className="t-min inline-flex items-center text-sm text-gray-600 hover:text-brand-text dark:text-gray-600 dark:hover:text-brand-text transition-colors"
                >
                  System status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-line dark:border-gray-800 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center sm:text-left">
              © <span className="font-mono tabular-nums">{new Date().getFullYear()}</span> <strong>MenteE Inc.</strong> RecruAI and all related products are trademarks of MenteE Inc.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/cookies"
                className="text-gray-500 hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text transition-colors"
              >
                Cookies
              </Link>
              <Link
                to="/status"
                className="text-gray-500 hover:text-brand-text dark:text-gray-500 dark:hover:text-brand-text transition-colors"
              >
                Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
