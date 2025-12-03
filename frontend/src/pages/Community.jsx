import React from "react";
import { Link } from "react-router-dom";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const Community = () => {
  const communityFeatures = [
    {
      icon: "💬",
      title: "Discussion Forums",
      description:
        "Connect with fellow recruiters and job seekers. Share experiences, ask questions, and get advice from the community.",
    },
    {
      icon: "📚",
      title: "Resource Library",
      description:
        "Access guides, templates, best practices, and educational content curated by industry experts.",
    },
    {
      icon: "🎯",
      title: "Career Groups",
      description:
        "Join specialized groups for your industry, role, or career level to network with like-minded professionals.",
    },
    {
      icon: "🏆",
      title: "Success Stories",
      description:
        "Read inspiring stories from users who found their dream jobs or built successful teams using RecruAI.",
    },
    {
      icon: "📅",
      title: "Events & Webinars",
      description:
        "Attend virtual events, workshops, and webinars to learn from industry leaders and stay updated.",
    },
    {
      icon: "🤝",
      title: "Mentorship Program",
      description:
        "Connect with mentors and mentees in your field for career guidance and professional development.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp",
      content:
        "The RecruAI community has been invaluable for staying updated on recruitment trends and getting advice from other HR professionals.",
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      company: "StartupXYZ",
      content:
        "Through the community forums, I got great feedback on my resume and interview tips that helped me land my current role.",
      avatar: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Recruitment Manager",
      company: "Global Solutions",
      content:
        "The mentorship program connected me with an amazing mentor who helped me advance my career in recruitment.",
      avatar: "ER",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Join Our Community
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
              Connect, learn, and grow with thousands of recruiters, job
              seekers, and HR professionals worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Community Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What You'll Find in Our Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A vibrant ecosystem designed to support your professional journey
            and help you succeed in recruitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {communityFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Community Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Community by the Numbers
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                50,000+
              </div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                25,000+
              </div>
              <div className="text-gray-600">Discussions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                500+
              </div>
              <div className="text-gray-600">Expert Contributors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                150+
              </div>
              <div className="text-gray-600">Countries Represented</div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What Our Community Says
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Join Community CTA */}
        <div className="bg-indigo-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Join the Conversation?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Become part of a supportive community that helps you grow
            professionally and achieve your career goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Join the Community
            </Link>
            <Link
              to="/signin"
              className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-md hover:bg-indigo-50 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Community;
