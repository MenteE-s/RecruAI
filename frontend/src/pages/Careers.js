import React from "react";
import { Link } from "react-router-dom";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const Careers = () => {
  const openings = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description:
        "Build scalable features for our AI-powered interview platform. Work with React, Node.js, and cutting-edge ML pipelines.",
    },
    {
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description:
        "Develop and fine-tune natural language models for realistic interview simulations and candidate assessment.",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      description:
        "Craft intuitive user experiences for job seekers and recruiters. Shape the visual language of AI recruitment.",
    },
    {
      title: "Growth Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      description:
        "Drive user acquisition and engagement strategies for both job seeker and organization segments.",
    },
    {
      title: "Customer Success Lead",
      department: "Operations",
      location: "Remote",
      type: "Full-time",
      description:
        "Onboard enterprise clients, manage relationships, and ensure organizations get maximum value from RecruAI.",
    },
  ];

  const values = [
    {
      title: "Innovation First",
      description:
        "We push boundaries in AI and recruitment technology. Every team member contributes to shaping the future of hiring.",
    },
    {
      title: "Remote-Friendly Culture",
      description:
        "Work from anywhere in the world. We believe great talent isn't confined to a single location.",
    },
    {
      title: "Impact-Driven Work",
      description:
        "Your code directly helps thousands of people land jobs and helps companies build stronger teams.",
    },
    {
      title: "Growth Mindset",
      description:
        "Continuous learning is part of our DNA. We invest in our team's professional development.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      {/* Hero */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 text-sm font-medium text-white mb-6">
            Join Our Team
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Build the Future of{" "}
            <span className="text-blue-400">AI Recruitment</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            We're on a mission to transform how companies hire and how people
            prepare for interviews. Join us in building something meaningful.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Work at <span className="text-blue-600">MenteE</span>?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're building tools that change lives. Here's what drives us every
            day.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <div key={index} className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {value.title}
              </h3>
              <p className="text-gray-600 text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Open Positions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're always looking for talented people who want to do the best
            work of their careers.
          </p>
        </div>
        <div className="space-y-4">
          {openings.map((job, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 p-6 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1">
                      {job.department}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                      {job.location}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                      {job.type}
                    </span>
                  </div>
                </div>
                <Link
                  to="/signin"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-sm font-medium transition-colors text-center"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Don't See Your Role?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            We're always interested in hearing from exceptional people. Send us
            your resume and tell us how you'd contribute.
          </p>
          <a
            href="mailto:careers@mentee.org"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 text-sm font-medium transition-colors"
          >
            Send Your Resume
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;
