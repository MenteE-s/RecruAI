import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Cookie,
  Clock,
  Printer,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Mail,
  Building2,
} from "lucide-react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const cookieData = [
  {
    type: "Session cookies",
    purpose: "Maintain secure user authentication and active session state during browsing",
    duration: "Until browser closes",
    category: "Essential",
  },
  {
    type: "Persistent cookies",
    purpose: "Remember UI theme (dark/light), locale, and regional matching preferences",
    duration: "Up to 12 months",
    category: "Functional",
  },
  {
    type: "Analytics cookies",
    purpose: "Measure candidate funnel drop-offs and platform uptime performance anonymously",
    duration: "Up to 24 months",
    category: "Analytics",
  },
  {
    type: "Security tokens",
    purpose: "Cross-site request forgery (CSRF) protection and rate-limiting enforcement",
    duration: "Session / 24 hours",
    category: "Essential",
  },
];

const sections = [
  { id: "what-are-cookies", title: "1. What are cookies" },
  { id: "how-we-use", title: "2. How we use cookies" },
  { id: "types-of-cookies", title: "3. Types of cookies we use" },
  { id: "third-party", title: "4. Third-party cookies" },
  { id: "managing-cookies", title: "5. Managing your preferences" },
  { id: "impact", title: "6. Impact of disabling cookies" },
  { id: "updates", title: "7. Updates to this policy" },
  { id: "contact", title: "8. Contact our privacy team" },
];

const CookiesPolicy = () => {
  const [activeSection, setActiveSection] = useState("what-are-cookies");

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface text-ink transition-colors">
      <RecruAINavbar />

      {/* Header */}
      <section className="border-b border-line bg-surface py-12 sm:py-16">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-brand/10 border border-brand/20 text-xs font-semibold text-brand-text mb-3">
                <Cookie className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Legal &amp; privacy compliance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                Cookies policy
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-500 max-w-2xl leading-relaxed">
                How RecruAI and MenteE use cookies and browser storage technologies to deliver secure, responsive recruitment workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-gray-100 dark:bg-gray-25 text-xs text-gray-600 dark:text-gray-600">
                <Clock className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
                <span>Last updated: <span className="font-mono tabular-nums font-semibold text-ink">Nov 30, 2025</span></span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-gray-100 dark:hover:bg-gray-25 text-xs font-medium text-ink transition-colors shadow-s5"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Print policy</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-500 dark:text-gray-500">Doc ID: CP-2025-V2</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Pakistan &amp; GCC compliant</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Estimated read: <span className="font-mono tabular-nums">4 min</span></span>
          </div>
        </div>
      </section>

      {/* Main Content with Table of Contents */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-4 sticky top-6 hidden lg:block">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-3">
                Contents
              </h2>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      activeSection === sec.id
                        ? "bg-brand/10 text-brand-text font-semibold"
                        : "text-gray-600 dark:text-gray-500 hover:text-ink hover:bg-gray-100 dark:hover:bg-gray-25"
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={1.8} />
                  </button>
                ))}
              </nav>

              <div className="mt-5 pt-4 border-t border-line">
                <Link
                  to="/privacy"
                  className="t-min inline-flex items-center text-xs font-medium text-brand-text hover:underline gap-1"
                >
                  <span>View privacy policy</span>
                  <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Legal Body */}
          <main className="lg:col-span-8 rounded-xl border border-line bg-surface p-6 sm:p-10 shadow-s5">
            <div className="space-y-10 text-sm leading-relaxed text-gray-600 dark:text-gray-500">
              <section id="what-are-cookies" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  1. What are cookies
                </h2>
                <p>
                  Cookies are compact text files stored on your computer or mobile device when you interact with our website and application. They allow RecruAI to recognize your authenticated session, remember interface preferences, and optimize system speed across subsequent visits.
                </p>
              </section>

              <section id="how-we-use" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  2. How we use cookies
                </h2>
                <p className="mb-4">
                  RecruAI utilizes cookies and local storage tokens strictly for functional, analytical, and security purposes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-3.5">
                    <h3 className="text-xs font-semibold text-ink mb-1">Essential authentication</h3>
                    <p className="text-xs">Maintains HTTP-only JWT session cookies, CSRF protection tokens, and user credentials.</p>
                  </div>
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-3.5">
                    <h3 className="text-xs font-semibold text-ink mb-1">Interface continuity</h3>
                    <p className="text-xs">Preserves your preferred theme (light/dark mode) and recent search filters.</p>
                  </div>
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-3.5">
                    <h3 className="text-xs font-semibold text-ink mb-1">Performance diagnostics</h3>
                    <p className="text-xs">Monitors API latency, pgvector query responsiveness, and WebRTC interview stability.</p>
                  </div>
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-3.5">
                    <h3 className="text-xs font-semibold text-ink mb-1">Regional localization</h3>
                    <p className="text-xs">Calibrates currency, date formats, and regional hiring hub standards.</p>
                  </div>
                </div>
              </section>

              <section id="types-of-cookies" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-4">
                  3. Types of cookies we use
                </h2>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-gray-100 dark:bg-gray-25 font-semibold text-ink">
                        <th className="p-3.5">Cookie type</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Purpose</th>
                        <th className="p-3.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {cookieData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-100/30 dark:hover:bg-gray-25/30 transition-colors">
                          <td className="p-3.5 font-semibold text-ink whitespace-nowrap">{row.type}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-semibold text-brand-text">
                              {row.category}
                            </span>
                          </td>
                          <td className="p-3.5">{row.purpose}</td>
                          <td className="p-3.5 font-mono tabular-nums text-gray-500 dark:text-gray-500 whitespace-nowrap">{row.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="third-party" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  4. Third-party services
                </h2>
                <p className="mb-3">
                  Certain infrastructure partners may establish transient cookies or tokens necessary for platform execution:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span><strong>LiveKit WebRTC:</strong> Manages real-time audio/video peer connection negotiation during mock interviews.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span><strong>Resend:</strong> Verifies one-time password (OTP) delivery and transactional account verification emails.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span><strong>Cloudflare CDN:</strong> Shields against distributed denial-of-service (DDoS) threats and enforces rate-limiting.</span>
                  </li>
                </ul>
              </section>

              <section id="managing-cookies" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  5. Managing your preferences
                </h2>
                <p className="mb-3">
                  Most modern browsers allow you to inspect, manage, or delete cookies via system preferences. You can configure your browser to block third-party cookies or alert you when cookies are set.
                </p>
                <p>
                  To manage browser cookie settings directly, visit your browser's Privacy or Security settings menu.
                </p>
              </section>

              <section id="impact" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  6. Impact of disabling cookies
                </h2>
                <p className="mb-3">
                  If you disable essential cookies, core features of RecruAI will become unavailable:
                </p>
                <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4 space-y-2 text-xs">
                  <p>• You will be required to authenticate repeatedly on each page navigation.</p>
                  <p>• Practice interview WebRTC media rooms cannot maintain encrypted session state.</p>
                  <p>• Saved search filters and UI theme preferences will reset to defaults upon reload.</p>
                </div>
              </section>

              <section id="updates" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  7. Updates to this policy
                </h2>
                <p>
                  We may periodically revise this Cookies policy to align with regional statutory requirements and platform feature updates. Material changes will be highlighted via in-app notifications or registered account emails.
                </p>
              </section>

              <section id="contact" className="scroll-mt-8 pt-4 border-t border-line">
                <h2 className="text-xl font-bold text-ink mb-3">
                  8. Contact our privacy team
                </h2>
                <p className="mb-4">
                  For inquiries or privacy compliance queries regarding cookies and telemetry data:
                </p>
                <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <Building2 className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                    <span>MenteE Inc. — Privacy &amp; Data Protection Office</span>
                  </div>
                  <p>Lahore, Pakistan · Serving Pakistan &amp; the Gulf</p>
                  <div className="flex items-center gap-2 pt-1 text-gray-600 dark:text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
                    <span>Email: <a href="mailto:privacy@menteeai.org" className="text-brand-text hover:underline">privacy@menteeai.org</a></span>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CookiesPolicy;
