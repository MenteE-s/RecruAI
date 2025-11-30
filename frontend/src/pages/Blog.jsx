import React from "react";
import { Link } from "react-router-dom";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of AI in Recruitment: Trends to Watch in 2025",
      excerpt:
        "Explore the latest AI advancements transforming how companies find and hire talent, from predictive analytics to automated screening.",
      date: "November 25, 2025",
      readTime: "5 min read",
      category: "AI Trends",
      image: "/api/placeholder/400/250",
    },
    {
      id: 2,
      title: "Building Inclusive Hiring Practices with Technology",
      excerpt:
        "How AI tools can help reduce bias in recruitment while ensuring diverse and inclusive hiring processes.",
      date: "November 18, 2025",
      readTime: "4 min read",
      category: "Diversity & Inclusion",
      image: "/api/placeholder/400/250",
    },
    {
      id: 3,
      title: "From Resume to Interview: Optimizing Your Application Strategy",
      excerpt:
        "Practical tips for job seekers to navigate modern recruitment processes and stand out to employers.",
      date: "November 10, 2025",
      readTime: "6 min read",
      category: "Career Advice",
      image: "/api/placeholder/400/250",
    },
    {
      id: 4,
      title: "The ROI of AI-Powered Recruitment Platforms",
      excerpt:
        "Understanding the measurable benefits and cost savings of implementing AI tools in your hiring process.",
      date: "November 3, 2025",
      readTime: "7 min read",
      category: "Business Strategy",
      image: "/api/placeholder/400/250",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">MenteE Blog</h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
              Insights, trends, and expert perspectives on AI-powered
              recruitment and professional development.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-48 bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-sm opacity-75">{post.category}</div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-indigo-600 transition-colors">
                  <Link to={`/blog/${post.id}`}>{post.title}</Link>
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center"
                >
                  Read more
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-indigo-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get the latest insights on AI recruitment, career advice, and
            industry trends delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
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
