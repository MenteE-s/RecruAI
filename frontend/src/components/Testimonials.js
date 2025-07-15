import React, { useState, useEffect, useRef } from 'react';

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      companyLogo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      content: "RecruAI transformed my interview preparation completely. The AI feedback was incredibly detailed and helped me identify areas I never knew I needed to improve. I got my dream job at Google!",
      rating: 5,
      gradient: "from-primary-500 to-accent-500",
      achievement: "Landed Dream Job"
    },
    {
      name: "Michael Rodriguez",
      role: "HR Director",
      company: "TechCorp",
      companyLogo: "https://via.placeholder.com/120x40/4F46E5/white?text=TechCorp",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "As an HR professional, RecruAI has revolutionized our recruitment process. We've reduced hiring time by 40% and significantly improved candidate quality. It's a game-changer for organizations.",
      rating: 5,
      gradient: "from-accent-500 to-primary-600",
      achievement: "40% Time Saved"
    },
    {
      name: "Emily Johnson",
      role: "Product Manager",
      company: "Startup Inc",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "The personalized coaching feature is amazing. It's like having a personal interview coach available 24/7. The progress tracking helped me see my improvement over time.",
      rating: 5,
      gradient: "from-primary-600 to-success-500",
      achievement: "24/7 Coaching"
    },
    {
      name: "David Park",
      role: "Recent Graduate",
      company: "University of Technology",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      content: "Being a fresh graduate, I was nervous about interviews. RecruAI gave me the confidence I needed. The stress-free practice environment was perfect for building my skills.",
      rating: 5,
      gradient: "from-success-500 to-accent-500",
      achievement: "Confidence Boost"
    },
    {
      name: "Lisa Thompson",
      role: "Recruitment Manager",
      company: "Fortune 500 Co",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=761&q=80",
      content: "The enterprise features are outstanding. We can now standardize our interview process across all departments while maintaining flexibility for different roles.",
      rating: 5,
      gradient: "from-accent-600 to-primary-700",
      achievement: "Process Standardized"
    },
    {
      name: "James Wilson",
      role: "Career Changer",
      company: "Freelancer",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      content: "Switching careers at 35 was daunting, but RecruAI helped me practice industry-specific questions. The AI understood my background and tailored questions perfectly.",
      rating: 5,
      gradient: "from-primary-700 to-accent-600",
      achievement: "Career Pivot"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section 
      ref={sectionRef}
      id="testimonials" 
      className="py-20 bg-gradient-to-br from-white via-primary-25 to-accent-25 relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full animate-float blur-xl"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full animate-bounce-slow blur-xl"></div>
          <div className="absolute bottom-10 left-20 w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-ping-slow blur-xl"></div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200 rounded-full text-sm font-medium text-primary-700 mb-6">
            <span className="animate-pulse mr-2">💬</span>
            What Our Users Say
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-bold text-secondary-900 mb-6">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700 bg-clip-text text-transparent">
              Thousands
            </span>{' '}
            <br className="hidden sm:block" />
            of Professionals
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            See what our users say about their success with RecruAI
          </p>
        </div>

        {/* Main Testimonial Showcase */}
        <div className={`mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-primary-200 relative overflow-hidden">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[activeTestimonial].gradient} opacity-5`}></div>
              
              <div className="relative z-10">
                {/* Quote Icon */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>

                {/* Content */}
                <div className="text-center">
                  <blockquote className="text-xl md:text-2xl text-secondary-700 leading-relaxed mb-8 font-medium">
                    "{testimonials[activeTestimonial].content}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center justify-center space-x-4">
                    <div className="relative">
                      <img 
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" 
                        src={testimonials[activeTestimonial].image} 
                        alt={testimonials[activeTestimonial].name}
                      />
                      <div className={`absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r ${testimonials[activeTestimonial].gradient} rounded-full flex items-center justify-center`}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-secondary-900 text-lg">
                        {testimonials[activeTestimonial].name}
                      </div>
                      <div className="text-secondary-600">
                        {testimonials[activeTestimonial].role}
                      </div>
                      <div className="text-primary-600 font-medium">
                        {testimonials[activeTestimonial].company}
                      </div>
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  <div className="mt-6">
                    <span className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${testimonials[activeTestimonial].gradient} text-white rounded-full text-sm font-medium shadow-lg`}>
                      🎉 {testimonials[activeTestimonial].achievement}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 transform scale-125'
                      : 'bg-secondary-300 hover:bg-secondary-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-secondary-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary-300 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{animationDelay: `${0.4 + index * 0.1}s`}}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                {/* Stars */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`w-5 h-5 text-yellow-400 transition-all duration-300 ${
                        hoveredCard === index ? 'animate-bounce' : ''
                      }`}
                      style={{animationDelay: `${i * 100}ms`}}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-secondary-700 mb-6 leading-relaxed group-hover:text-secondary-800 transition-colors">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300" 
                      src={testimonial.image} 
                      alt={testimonial.name}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-secondary-600">
                        {testimonial.role}
                      </div>
                      <div className="text-sm text-primary-600 font-medium">
                        {testimonial.company}
                      </div>
                    </div>
                  </div>
                  {testimonial.companyLogo && (
                    <img 
                      className="h-6 w-auto opacity-60 group-hover:opacity-100 transition-opacity" 
                      src={testimonial.companyLogo} 
                      alt={`${testimonial.company} logo`}
                    />
                  )}
                </div>
              </div>

              {/* Hover Particles */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {hoveredCard === index && [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-1 h-1 bg-gradient-to-r ${testimonial.gradient} rounded-full animate-ping`}
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${20 + i * 20}%`,
                      animationDelay: `${i * 300}ms`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay: '0.8s'}}>
          {[
            { number: "10,000+", label: "Happy Users", icon: "👥" },
            { number: "95%", label: "Success Rate", icon: "🎯" },
            { number: "500+", label: "Companies", icon: "🏢" }
          ].map((stat, index) => (
            <div key={index} className="group">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-secondary-200 hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                <div className="text-4xl mb-2 group-hover:animate-bounce">{stat.icon}</div>
                <div className="text-3xl font-bold text-secondary-900 mb-1">{stat.number}</div>
                <div className="text-secondary-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;