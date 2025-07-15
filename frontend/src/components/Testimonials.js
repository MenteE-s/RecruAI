import React, { useState, useEffect, useRef } from 'react';

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Tech Startup",
      image: "👩‍💻",
      quote: "I wish RecruAI existed when I was job hunting! The concept of AI-powered interview practice is exactly what I needed. Can't wait for the beta launch.",
      rating: 5,
      badge: "Early Supporter"
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager",
      company: "Fortune 500",
      image: "👨‍💼",
      quote: "As someone who's been through countless interviews, this platform would have saved me weeks of preparation time. The AI feedback concept is brilliant.",
      rating: 5,
      badge: "Beta Interested"
    },
    {
      name: "Emily Johnson",
      role: "Recent Graduate",
      company: "University",
      image: "👩‍🎓",
      quote: "Interview anxiety is real! Having an AI coach to practice with before facing real interviewers sounds like a game-changer. Signed up immediately.",
      rating: 5,
      badge: "Waitlist Member"
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

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-white via-primary-25 to-accent-25"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-success-100 border border-success-200 rounded-full text-sm font-medium text-success-700 mb-6">
            💬 Early Feedback
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            People are <span className="text-primary-600">excited</span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Early supporters and beta applicants share why they're excited about RecruAI
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-secondary-100 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                  {testimonial.badge}
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-secondary-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <div className="text-3xl mr-4">{testimonial.image}</div>
                <div>
                  <div className="font-semibold text-secondary-900">{testimonial.name}</div>
                  <div className="text-sm text-secondary-600">{testimonial.role}</div>
                  <div className="text-xs text-primary-600">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto border border-secondary-100">
            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              Join hundreds of professionals already on our waitlist
            </h3>
            <p className="text-secondary-600 mb-6">
              Be part of the community that's reshaping interview preparation
            </p>
            <button 
              onClick={() => window.open('https://forms.gle/NGJ3gu5MstTyLSib8', '_blank')}
              className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              Add Your Voice to the Beta 🚀
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;