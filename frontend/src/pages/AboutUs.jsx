import React from "react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About MenteE
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
              Pioneering AI innovation in recruitment and professional
              development since 2020.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            To democratize access to fair, efficient, and intelligent
            recruitment processes through cutting-edge AI technology, empowering
            both job seekers and employers to achieve their goals in the modern
            workplace.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              10,000+
            </div>
            <div className="text-gray-600">Successful Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
            <div className="text-gray-600">Partner Companies</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">95%</div>
            <div className="text-gray-600">User Satisfaction</div>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                Founded in 2020, MenteE emerged from a simple observation:
                traditional recruitment processes were inefficient, biased, and
                time-consuming for everyone involved. Our founders, a team of AI
                researchers and HR professionals, saw an opportunity to
                revolutionize the industry.
              </p>
              <p>
                What started as a research project quickly evolved into RecruAI,
                a comprehensive platform that uses advanced machine learning
                algorithms to streamline the entire recruitment lifecycle. From
                initial screening to final interviews, our AI-powered tools
                ensure fair, accurate, and efficient hiring decisions.
              </p>
              <p>
                Today, MenteE serves thousands of job seekers and hundreds of
                companies worldwide, helping bridge the gap between talent and
                opportunity in an increasingly competitive job market.
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">
              Key Milestones
            </h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">2020</div>
                  <div className="text-gray-600">
                    MenteE founded with initial AI research
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">2021</div>
                  <div className="text-gray-600">
                    RecruAI platform launched with core features
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">2022</div>
                  <div className="text-gray-600">
                    Expanded to 100+ enterprise clients
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">2023</div>
                  <div className="text-gray-600">
                    AI interview analysis feature released
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-gray-900">2025</div>
                  <div className="text-gray-600">
                    Global expansion and advanced analytics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Values
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Fairness
              </h4>
              <p className="text-gray-600">
                Committed to unbiased, equitable recruitment processes for all
                candidates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Innovation
              </h4>
              <p className="text-gray-600">
                Pushing the boundaries of AI technology to improve recruitment
                outcomes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Accessibility
              </h4>
              <p className="text-gray-600">
                Making advanced recruitment tools accessible to businesses of
                all sizes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Security
              </h4>
              <p className="text-gray-600">
                Protecting user data with enterprise-grade security and privacy
                measures.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Leadership Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">JD</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900">Jane Doe</h4>
              <p className="text-indigo-600 font-medium">CEO & Co-Founder</p>
              <p className="text-gray-600 mt-2">
                Former AI researcher at Stanford with 10+ years in machine
                learning.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">JS</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                John Smith
              </h4>
              <p className="text-indigo-600 font-medium">CTO & Co-Founder</p>
              <p className="text-gray-600 mt-2">
                Ex-Google engineer specializing in natural language processing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">SA</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Sarah Anderson
              </h4>
              <p className="text-indigo-600 font-medium">Head of Product</p>
              <p className="text-gray-600 mt-2">
                Former product lead at LinkedIn with expertise in HR tech.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join Our Mission
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're always looking for talented individuals who share our passion
            for revolutionizing recruitment. Whether you're an AI engineer, HR
            professional, or business development expert, we'd love to hear from
            you.
          </p>
          <a
            href="mailto:careers@mentee.ai"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            View Career Opportunities
            <svg
              className="ml-2 -mr-1 w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
