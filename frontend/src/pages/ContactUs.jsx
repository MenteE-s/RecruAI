import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  Headphones,
} from "lucide-react";
import { FiTwitter, FiLinkedin, FiGithub } from "react-icons/fi";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors">
      <RecruAINavbar />

      {/* Hero Section */}
      <section className="border-b border-line bg-surface py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-semibold text-brand-text mb-4">
            <Headphones className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>Support &amp; inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
            Get in touch with <span className="text-brand-text">RecruAI</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Have questions about our AI interview platform or organizational hiring solutions? Our team is here to help.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">
              Contact information
            </h2>

            <div className="space-y-4">
              <div className="flex items-start rounded-xl border border-line bg-surface p-5 shadow-s5">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text shrink-0 mr-4">
                  <Mail className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Email</h3>
                  <a
                    href="mailto:contact@menteeai.org"
                    className="text-sm text-gray-600 dark:text-gray-500 hover:text-brand-text transition-colors mt-0.5 block"
                  >
                    contact@menteeai.org
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-brand-text" strokeWidth={1.8} />
                    <span>Average reply within <span className="font-mono tabular-nums font-semibold text-ink">24 hours</span></span>
                  </p>
                </div>
              </div>

              <div className="flex items-start rounded-xl border border-line bg-surface p-5 shadow-s5">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text shrink-0 mr-4">
                  <Phone className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Regional phone &amp; support</h3>
                  <p className="font-mono tabular-nums text-sm text-gray-600 dark:text-gray-500 mt-0.5">+92 300 000 0000</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Monday to Friday, <span className="font-mono tabular-nums">9:00 AM – 6:00 PM</span> PKT / GST
                  </p>
                </div>
              </div>

              <div className="flex items-start rounded-xl border border-line bg-surface p-5 shadow-s5">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text shrink-0 mr-4">
                  <MapPin className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Regional headquarters</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-500 mt-0.5 leading-relaxed">
                    MenteE Inc.
                    <br />
                    Lahore, Pakistan · Serving Pakistan &amp; the Gulf
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Health Mini Card */}
            <div className="mt-6 rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span className="font-medium text-ink">Platform systems operational</span>
                </div>
                <span className="font-mono tabular-nums text-brand-text font-semibold">99.98% uptime</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-ink mb-3">
                Follow us
              </h3>
              <div className="flex space-x-2.5">
                <a
                  href="https://twitter.com/menteeaiorg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-gray-500 dark:text-gray-500 transition-colors hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
                  aria-label="Twitter"
                >
                  <FiTwitter className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a
                  href="https://linkedin.com/company/menteeai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-gray-500 dark:text-gray-500 transition-colors hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
                  aria-label="LinkedIn"
                >
                  <FiLinkedin className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a
                  href="https://github.com/mentee-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-line bg-surface flex items-center justify-center text-gray-500 dark:text-gray-500 transition-colors hover:text-brand-text hover:border-brand/40 hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5"
                  aria-label="GitHub"
                >
                  <FiGithub className="h-4 w-4" strokeWidth={1.8} />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-s5">
            <h2 className="text-xl font-bold text-ink mb-6">
              Send us a message
            </h2>

            {submitted ? (
              <div className="rounded-xl border border-brand/20 bg-brand/10 p-6 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-text">
                    Message sent successfully
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                    Thank you for reaching out. A member of our team will review your message and reply within 24 hours.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-ink mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-ink mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs font-semibold text-ink mb-1.5"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/20"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General inquiry</option>
                    <option value="enterprise">Organization hiring &amp; ATS</option>
                    <option value="support">Candidate technical support</option>
                    <option value="billing">Billing &amp; beta access</option>
                    <option value="partnership">Partnership opportunity</option>
                    <option value="feedback">Feedback &amp; suggestions</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-semibold text-ink mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="block w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/20"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-s5"
                  >
                    <Send className="h-4 w-4" strokeWidth={1.8} />
                    <span>{isSubmitting ? "Sending..." : "Send message"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
