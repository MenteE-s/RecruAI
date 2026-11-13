import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  MessageSquare,
  Target,
  Users2,
  MessageCircle,
  ThumbsUp,
  Share2,
} from "lucide-react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const communityFeatures = [
  {
    icon: MessageSquare,
    title: "Discussion forums",
    description:
      "Connect with fellow recruiters and job seekers. Share experiences, ask questions, and get advice from the community.",
  },
  {
    icon: BookOpen,
    title: "Resource library",
    description:
      "Access guides, templates, best practices, and educational content curated by industry experts.",
  },
  {
    icon: Target,
    title: "Career groups",
    description:
      "Join specialized groups for your industry, role, or career level to network with like-minded professionals.",
  },
  {
    icon: Award,
    title: "Success stories",
    description:
      "Read inspiring stories from users who found their dream jobs or built successful teams using RecruAI.",
  },
  {
    icon: Calendar,
    title: "Events & webinars",
    description:
      "Attend virtual events, workshops, and webinars to learn from industry leaders and stay updated.",
  },
  {
    icon: Users2,
    title: "Mentorship program",
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

const stats = [
  { value: "50,000+", label: "Active members", sub: "Pakistan & GCC region" },
  { value: "25,000+", label: "Discussions started", sub: "Hiring & preparation" },
  { value: "500+", label: "Expert contributors", sub: "Verified hiring leads" },
  { value: "150+", label: "Cities & hubs", sub: "Worldwide connectivity" },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-surface text-ink transition-colors">
      <RecruAINavbar />

      {/* Hero Section */}
      <section className="border-b border-line bg-surface py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-semibold text-brand-text mb-4">
            <Users2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>Global talent network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
            Join the <span className="text-brand-text">RecruAI community</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Connect, learn, and grow with thousands of recruiters, job seekers, and hiring leaders across Pakistan, the Gulf, and worldwide.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5"
            >
              <span>Join community free</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
            <Link
              to="/signin"
              className="rounded-xl border border-line bg-surface px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Community Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5 transition-colors hover:border-brand/40"
            >
              <div className="font-mono tabular-nums text-3xl font-bold text-brand-text mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-ink mb-0.5">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {stat.sub}
              </div>
            </div>
          ))}
        </section>

        {/* Faux UI Community Spotlight Card */}
        <section className="mb-16 rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-s5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-line mb-6 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand" />
              <h3 className="text-base font-semibold text-ink">Featured community discussion</h3>
              <span className="rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-semibold text-brand-text">
                Live
              </span>
            </div>
            <span className="font-mono text-xs text-gray-500 dark:text-gray-500">
              #interview-prep · 42 replies
            </span>
          </div>

          <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-5 mb-4">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 text-brand-text flex items-center justify-center font-bold text-xs shrink-0">
                ZA
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">Zainab Ali</span>
                  <span className="text-[11px] font-medium text-brand-text bg-brand/10 px-1.5 py-0.5 rounded">
                    Staff Engineer @ Careem
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">2h ago</span>
                </div>
                <h4 className="text-sm font-semibold text-ink mt-1">
                  How we evaluate distributed systems questions in Gulf tech interviews
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-1 leading-relaxed">
                  Focus on trade-offs rather than memorizing definitions: latency vs consistency, partitioning strategies, and clear estimation of QPS and memory footprint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-line text-xs text-gray-500 dark:text-gray-500">
              <span className="inline-flex items-center gap-1.5 hover:text-brand-text transition-colors cursor-pointer">
                <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span className="font-mono tabular-nums">128</span>
              </span>
              <span className="inline-flex items-center gap-1.5 hover:text-brand-text transition-colors cursor-pointer">
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span className="font-mono tabular-nums">42</span>
              </span>
              <span className="inline-flex items-center gap-1.5 hover:text-brand-text transition-colors cursor-pointer ml-auto">
                <Share2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Share</span>
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text hover:underline"
            >
              <span>Join conversation and read all answers</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </Link>
          </div>
        </section>

        {/* Features Header */}
        <section className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
            What you'll find in our community
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A vibrant ecosystem designed to support your professional journey and help you navigate modern recruitment.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {communityFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-line bg-surface p-6 shadow-s5 transition-colors hover:border-brand/40"
            >
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text mb-4">
                <feature.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-ink text-center mb-10">
            What our community says
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl border border-line bg-surface p-6 shadow-s5 flex flex-col justify-between transition-colors hover:border-brand/40"
              >
                <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center pt-4 border-t border-line">
                  <div className="w-10 h-10 bg-brand/10 border border-brand/20 text-brand-text rounded-xl flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 truncate">
                      {testimonial.role} · {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Join Community CTA */}
        <section className="rounded-xl border border-line bg-surface p-8 sm:p-10 text-center shadow-s5">
          <h3 className="text-xl sm:text-2xl font-bold text-ink mb-3">
            Ready to join the conversation?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 mb-6 max-w-xl mx-auto leading-relaxed">
            Become part of a forward-thinking network that supports your career development and hiring goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5"
            >
              <span>Join the community</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-7 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Community;
