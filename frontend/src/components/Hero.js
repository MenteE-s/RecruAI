import React, { useEffect, useState } from "react";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20 pb-16 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-accent-400/20 to-primary-400/20 bg-300% animate-gradient"></div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full opacity-20 animate-float blur-sm"></div>
        <div
          className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-accent-400 to-primary-600 rounded-lg opacity-15 animate-float transform rotate-45"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full opacity-25 animate-bounce-slow"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-r from-accent-300 to-primary-400 rounded-full opacity-10 animate-ping-slow"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg opacity-30 animate-spin-slow"></div>
      </div>

      {/* Mouse Follow Glow */}
      <div
        className="absolute w-96 h-96 bg-gradient-radial from-primary-200/30 to-transparent rounded-full pointer-events-none transition-all duration-300 blur-3xl"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      ></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center mt-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center w-full">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <div
              className={`transition-all duration-1000 ${
                isVisible ? "animate-fade-in-up" : "opacity-0"
              }`}
            >
              {/* Brand Hierarchy Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-full text-sm font-medium text-primary-600 mb-6">
                <span className="relative">
                  🚀 <strong></strong> presents <strong>RecruAI</strong> -
                  Coming Soon
                </span>
              </div>

              {/* Product Title with Brand Hierarchy */}
              <h1 className="text-4xl tracking-tight font-display font-bold text-secondary-900 sm:text-7xl md:text-8xl lg:text-7xl xl:text-7xl">
                {/* <span className="block animate-fade-in-up text-2xl md:text-3xl text-secondary-600 font-medium mb-3">
                  by 
                </span> */}
                <span className="block animate-fade-in-up">Master Your</span>
                <span
                  className="block bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700 bg-clip-text text-transparent animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  Interview Skills
                </span>
                <span
                  className="block animate-fade-in-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  with{" "}
                  <span className="bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                    RecruAI
                  </span>
                </span>
              </h1>

              <p
                className="mt-8 text-1xl text-secondary-600 leading-relaxed animate-fade-in-up"
                style={{ animationDelay: "0.6s" }}
              >
                <strong className="text-primary-600">For Job Seekers:</strong>{" "}
                Realistic mock interviews with instant AI feedback.
                <br />
                <strong className="text-accent-600">
                  For Organizations:
                </strong>{" "}
                Automated, unbiased candidate screening.
              </p>
            </div>

            <div
              className="mt-10 animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                <button className="group relative bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-primary-500/25 animate-pulse-glow overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  <span className="relative flex items-center justify-center">
                    Start Free Forever
                    <svg
                      className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>

                <button className="group bg-white/80 backdrop-blur-sm hover:bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 border-2 border-primary-200 hover:border-primary-400 hover:shadow-lg">
                  <span className="flex items-center justify-center">
                    <svg
                      className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Schedule Demo
                  </span>
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-8 text-sm text-secondary-500">
                <div
                  className="flex items-center animate-fade-in-up"
                  style={{ animationDelay: "1s" }}
                >
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
                  Free forever plan
                </div>
                <div
                  className="flex items-center animate-fade-in-up"
                  style={{ animationDelay: "1.2s" }}
                >
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
                  14-day premium trial
                </div>
                <div
                  className="flex items-center animate-fade-in-up"
                  style={{ animationDelay: "1.4s" }}
                >
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
                  No credit card required
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 lg:mt-0 lg:col-span-6 relative">
            <div
              className="relative animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              {/* Main Hero Card */}
              <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl"></div>
                <div className="relative">
                  {/* AI Avatar */}
                  <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl mx-auto mb-6 animate-pulse-glow">
                    <svg
                      className="w-12 h-12 text-white animate-bounce-slow"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  {/* Typing Animation */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                      RecruAI Coach
                    </h3>
                    <p className="text-sm text-secondary-600 mb-4">
                      Powered by{" "}
                    </p>
                    <div className="bg-secondary-100 rounded-lg p-4 mb-4">
                      <p className="text-secondary-700 font-medium">
                        "Tell me about yourself..."
                      </p>
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div
                        className="animate-scale-in"
                        style={{ animationDelay: "1s" }}
                      >
                        <div className="text-2xl font-bold text-primary-600">
                          95%
                        </div>
                        <div className="text-xs text-secondary-600">
                          Success Rate
                        </div>
                      </div>
                      <div
                        className="animate-scale-in"
                        style={{ animationDelay: "1.2s" }}
                      >
                        <div className="text-2xl font-bold text-accent-600">
                          10K+
                        </div>
                        <div className="text-xs text-secondary-600">Users</div>
                      </div>
                      <div
                        className="animate-scale-in"
                        style={{ animationDelay: "1.4s" }}
                      >
                        <div className="text-2xl font-bold text-success-600">
                          500+
                        </div>
                        <div className="text-xs text-secondary-600">
                          Companies
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full opacity-80 animate-bounce-slow blur-sm"></div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-r from-accent-400 to-primary-600 rounded-lg opacity-60 animate-float transform rotate-12 blur-sm"></div>

              {/* Orbiting Elements */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary-200/30 rounded-full animate-spin-slow"></div>
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-accent-200/20 rounded-full animate-spin-slow"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "20s",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
