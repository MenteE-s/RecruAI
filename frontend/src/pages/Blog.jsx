import React, { useState } from "react";
import { Link } from "react-router-dom";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";
import { Avatar } from "../components/ui/Avatar";
import {
  ArrowRight,
  Clock,
  BookOpen,
  Mail,
} from "lucide-react";

/**
 * Blog — Editorial structure: a featured split-hero article,
 * category tabs, and a responsive card feed with reading-time
 * badges and author bylines.
 */

const CATEGORIES = ["All", "AI recruitment", "Career advice", "Product", "Culture"];

const blogPosts = [
  {
    id: 1,
    title: "How AI-powered interview platforms are changing hiring in 2025",
    excerpt:
      "Artificial intelligence is reshaping recruitment. From automated screening to realistic mock interviews, discover how AI helps companies hire faster and candidates prepare smarter.",
    date: "Dec 2, 2025",
    readTime: "5 min read",
    category: "AI recruitment",
    author: { name: "Adeel Sayyad", role: "Founder, MenteE" },
    featured: true,
  },
  {
    id: 2,
    title: "10 common interview mistakes and how to avoid them",
    excerpt:
      "Whether you're a fresh graduate or a seasoned professional, these interview pitfalls can cost you the job. Learn practical strategies to present your best self.",
    date: "Nov 28, 2025",
    readTime: "6 min read",
    category: "Career advice",
    author: { name: "Fatima Raza", role: "HR Manager" },
  },
  {
    id: 3,
    title: "Building a portfolio that gets you hired in the Gulf",
    excerpt:
      "Employers in Dubai, Riyadh and Doha want proof of work, not just titles. Here is how to structure a portfolio that survives a recruiter's first ten seconds.",
    date: "Nov 21, 2025",
    readTime: "4 min read",
    category: "Career advice",
    author: { name: "Usman Tariq", role: "Growth Lead" },
  },
  {
    id: 4,
    title: "What recruiters actually look at in a resume in 2025",
    excerpt:
      "We analyzed thousands of applications to find the sections that move the needle — and the ones recruiters skip entirely.",
    date: "Nov 14, 2025",
    readTime: "7 min read",
    category: "AI recruitment",
    author: { name: "Ayesha Malik", role: "Product Manager" },
  },
  {
    id: 5,
    title: "How we built CVAI: A learning engine for careers",
    excerpt:
      "Inside the design of our skill-gap engine — how a canonical taxonomy of 137 skills powers verified assessments and 12-week plans.",
    date: "Nov 8, 2025",
    readTime: "8 min read",
    category: "Product",
    author: { name: "Adeel Sayyad", role: "Founder, MenteE" },
  },
  {
    id: 6,
    title: "Remote work in Gulf companies: What's actually changing",
    excerpt:
      "Hybrid is the new default in Riyadh and Dubai. Here's what candidates should ask about flexibility — and what employers are offering.",
    date: "Nov 1, 2025",
    readTime: "5 min read",
    category: "Culture",
    author: { name: "Bilal Ahmed", role: "Community Manager" },
  },
];

function CategoryTabs({ active, onChange, counts }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold transition-colors ${
              isActive ? "text-brand-text" : "text-gray-500 hover:text-ink dark:text-gray-500"
            }`}
          >
            <span>{cat}</span>
            <span
              className={`font-mono tabular-nums rounded-full px-1.5 py-0.5 text-[10px] ${
                isActive
                  ? "bg-brand/10 text-brand-text font-semibold"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-25 dark:text-gray-500"
              }`}
            >
              {counts[cat] ?? 0}
            </span>
            {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}

function Byline({ author, date, readTime, light }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={author.name} size="sm" />
      <div className="min-w-0">
        <p className={`truncate text-xs font-semibold ${light ? "text-white" : "text-ink"}`}>{author.name}</p>
        <p className={`flex items-center gap-1.5 text-[11px] ${light ? "text-white/70" : "text-gray-500 dark:text-gray-500"}`}>
          <span className="font-mono tabular-nums">{date}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
            <Clock className="h-3 w-3" strokeWidth={1.8} />
            <span>{readTime}</span>
          </span>
        </p>
      </div>
    </div>
  );
}

function ArticleCard({ post }) {
  return (
    <Link
      to="/blog"
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-s5 transition-colors hover:border-brand/40"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#DFF3E6] to-[#BFE3CF] dark:from-[#1b3827] dark:to-[#0f2418]">
        <span aria-hidden className="absolute inset-0 flex items-center justify-center font-serif text-4xl italic text-[#2f6d4a]/35 dark:text-[#82c87d]/20">
          {post.category.split(" ").map((w) => w[0]).join("")}
        </span>
        <span className="absolute left-3 top-3 inline-flex h-6 items-center rounded-full border border-line bg-surface/90 px-2.5 text-[10px] font-semibold text-gray-700 dark:text-gray-600">
          {post.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-text">
          {post.title}
        </h3>
        <p className="clamp-2 mt-1.5 text-[13px] leading-5 text-gray-600 dark:text-gray-500">{post.excerpt}</p>
        <div className="mt-auto pt-4">
          <Byline author={post.author} date={post.date} readTime={post.readTime} />
        </div>
      </div>
    </Link>
  );
}

function FeaturedArticle({ post }) {
  return (
    <Link
      to="/blog"
      className="group grid overflow-hidden rounded-xl border border-line bg-surface shadow-s5 transition-colors hover:border-brand/40 lg:grid-cols-2"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#DFF3E6] to-[#BFE3CF] dark:from-[#1b3827] dark:to-[#0f2418] lg:aspect-auto lg:h-full">
        <span aria-hidden className="absolute inset-0 flex items-center justify-center font-serif text-6xl italic text-[#2f6d4a]/30 dark:text-[#82c87d]/20">
          {post.category.split(" ").map((w) => w[0]).join("")}
        </span>
        <span className="absolute left-3 top-3 inline-flex h-6 items-center rounded-full border border-line bg-surface/90 px-2.5 text-[10px] font-semibold text-gray-700 dark:text-gray-600">
          {post.category}
        </span>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <h2 className="text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-brand-text sm:text-2xl">
          {post.title}
        </h2>
        <p className="mt-2 text-[13.5px] leading-6 text-gray-600 dark:text-gray-500">{post.excerpt}</p>
        <div className="mt-5">
          <Byline author={post.author} date={post.date} readTime={post.readTime} />
        </div>
        <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-text">
          <span>Read article</span>
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
        </div>
      </div>
    </Link>
  );
}

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "All" ? blogPosts.length : blogPosts.filter((p) => p.category === cat).length;
    return acc;
  }, {});

  const featured = blogPosts.find((p) => p.featured) || blogPosts[0];
  const rest = blogPosts.filter((p) => p.id !== featured.id);
  const visible = activeCategory === "All" ? rest : rest.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors">
      <RecruAINavbar />

      <div className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-gray-100 dark:bg-gray-25 text-xs font-medium text-gray-600 dark:text-gray-500 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
            <span>The RecruAI blog</span>
          </div>
          <h1 className="font-serif text-4xl leading-[1.06] tracking-[-0.01em] text-ink sm:text-5xl">
            Hiring and career stories from Pakistan &amp; the Gulf.
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-gray-600 dark:text-gray-500">
            How AI is changing recruitment, practical interview advice, and looks inside how we build RecruAI.
          </p>
        </div>

        <div className="mt-10">
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} counts={counts} />
        </div>

        <div className="mt-8">
          <FeaturedArticle post={featured} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visible.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
          {visible.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-line bg-surface p-12 text-center text-sm text-gray-500 dark:text-gray-500">
              No articles in this category yet — check back soon.
            </div>
          )}
        </div>

        <div className="mt-14 rounded-xl border border-line bg-surface p-8 sm:p-10 text-center shadow-s5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-3 text-brand-text">
            <Mail className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-ink">Get hiring insights in your inbox</h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-gray-600 dark:text-gray-500">
            One email a month. Real hiring insights, no spam ever.
          </p>
          <div className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@example.com"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/20"
            />
            <button className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 shadow-s5 whitespace-nowrap">
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
