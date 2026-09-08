import React from "react";
import { Link } from "react-router-dom";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "How AI-Powered Interview Platforms Are Changing Hiring in 2025",
      excerpt:
        "Artificial intelligence is reshaping recruitment. From automated screening to realistic mock interviews, discover how AI helps companies hire faster and candidates prepare smarter.",
      date: "December 2, 2025",
      readTime: "5 min read",
      category: "AI Recruitment",
    },
    {
      id: 2,
      title: "10 Common Interview Mistakes and How to Avoid Them",
      excerpt:
        "Whether you're a fresh graduate or a seasoned professional, these interview pitfalls can cost you the job. Learn practical strategies to present your best self.",
      date: "November 28, 2025",
      readTime: "6 min read",
      category: "Career Advice",
    },
    {
      id: 3,
      title: "Building a Strong Professional Profile That Recruiters Notice",
      excerpt:
        "Your profile is your first impression. Here's how to showcase experience, skills, and achievements that stand out to hiring managers and AI screening tools.",
      date: "November 20, 2025",
      readTime: "4 min read",
      category: "Job Seekers",
    },
    {
      id: 4,
      title: "Why Companies Are Switching to AI Screening for Candidate Assessment",
      excerpt:
        "Traditional resume screening is slow and biased. Learn how organizations use AI-driven assessment to evaluate skills fairly and reduce time-to-hire.",
      date: "November 15, 2025",
      readTime: "7 min read",
      category: "Organizations",
    },
    {
      id: 5,
      title: "Remote Hiring Best Practices for Distributed Teams",
      excerpt:
        "Remote work is here to stay. Discover how leading companies conduct effective virtual interviews and onboard new hires across time zones.",
      date: "November 8, 2025",
      readTime: "5 min read",
      category: "Remote Work",
    },
    {
      id: 6,
      title: "From Application to Onboarding: The Complete Recruitment Journey",
      excerpt:
        "A step-by-step guide to the modern hiring process — from posting a job offer to welcoming your newest team member.",
      date: "November 1, 2025",
      readTime: "8 min read",
      category: "Recruitment Process",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      {/* Hero */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 text-sm font-medium text-white mb-6">
            MenteE Blog
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Insights on{" "}
            <span className="text-blue-400">AI Recruitment</span>{" "}
            & Career Growth
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Expert perspectives on interview preparation, talent acquisition,
            and the evolving landscape of AI-powered hiring.
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="h-40 bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium bg-white/20 px-3 py-1">
                  {post.category}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center text-xs text-gray-500 mb-3 gap-2">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
                  <Link
                    to={`/blog/${post.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 bg-gray-50 border border-gray-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Get the latest on AI recruitment, career advice, and product updates
            delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
