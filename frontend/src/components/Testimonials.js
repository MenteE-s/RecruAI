import React, { useState } from "react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
    content: "RecruAI transformed my interview preparation completely. The AI feedback was incredibly detailed and helped me identify areas I never knew I needed to improve. I got my dream job at Google!",
    rating: 5,
    achievement: "Landed Dream Job",
  },
  {
    name: "Michael Rodriguez",
    role: "HR Director",
    company: "TechCorp",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    content: "As an HR professional, RecruAI has revolutionized our recruitment process. We've reduced hiring time by 40% and significantly improved candidate quality. It's a game-changer for organizations.",
    rating: 5,
    achievement: "40% Time Saved",
  },
  {
    name: "Emily Johnson",
    role: "Product Manager",
    company: "Startup Inc",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    content: "The personalized coaching feature is amazing. It's like having a personal interview coach available 24/7. The progress tracking helped me see my improvement over time.",
    rating: 5,
    achievement: "24/7 Coaching",
  },
  {
    name: "David Park",
    role: "Recent Graduate",
    company: "University of Technology",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
    content: "Being a fresh graduate, I was nervous about interviews. RecruAI gave me the confidence I needed. The stress-free practice environment was perfect for building my skills.",
    rating: 5,
    achievement: "Confidence Boost",
  },
  {
    name: "Lisa Thompson",
    role: "Recruitment Manager",
    company: "Fortune 500 Co",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=761&q=80",
    content: "The enterprise features are outstanding. We can now standardize our interview process across all departments while maintaining flexibility for different roles.",
    rating: 5,
    achievement: "Process Standardized",
  },
  {
    name: "James Wilson",
    role: "Career Changer",
    company: "Freelancer",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
    content: "Switching careers at 35 was daunting, but RecruAI helped me practice industry-specific questions. The AI understood my background and tailored questions perfectly.",
    rating: 5,
    achievement: "Career Pivot",
  },
];

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700 mb-4">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our{" "}
            <span className="text-blue-600">Users Say</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of professionals worldwide
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gray-50 border border-gray-200 p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <svg className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
              </svg>
              <div>
                <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-6">
                  "{testimonials[activeTestimonial].content}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    className="w-12 h-12 object-cover"
                    src={testimonials[activeTestimonial].image}
                    alt={testimonials[activeTestimonial].name}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonials[activeTestimonial].role} at{" "}
                      {testimonials[activeTestimonial].company}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-block bg-blue-600 text-white text-xs font-medium px-2 py-1">
                      {testimonials[activeTestimonial].achievement}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 transition-colors ${
                  index === activeTestimonial ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-gray-700 text-sm mb-6">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  className="w-10 h-10 object-cover"
                  src={testimonial.image}
                  alt={testimonial.name}
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { number: "10,000+", label: "Happy Users" },
            { number: "95%", label: "Success Rate" },
            { number: "500+", label: "Companies" },
          ].map((stat, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
