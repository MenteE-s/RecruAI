import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Clock,
  Printer,
  ChevronRight,
  CheckCircle2,
  Building2,
  Mail,
  ExternalLink,
  FileText,
  KeyRound,
  Database,
} from "lucide-react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const sections = [
  { id: "intro", title: "1. Introduction & scope" },
  { id: "collect", title: "2. Information we collect" },
  { id: "usage", title: "3. How we use your information" },
  { id: "sharing", title: "4. Information sharing & disclosures" },
  { id: "security", title: "5. Data security & encryption" },
  { id: "retention", title: "6. Data retention & account deletion" },
  { id: "rights", title: "7. Your privacy rights" },
  { id: "cookies", title: "8. Cookies and telemetry" },
  { id: "transfers", title: "9. International data transfers" },
  { id: "children", title: "10. Children's privacy" },
  { id: "changes", title: "11. Changes to this policy" },
  { id: "contact", title: "12. Contact data protection office" },
];

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState("intro");

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
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Privacy &amp; data governance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                Privacy policy
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-500 max-w-2xl leading-relaxed">
                How RecruAI and MenteE protect, process, and respect candidate profiles, interview transcripts, and organization data across Pakistan and the Gulf.
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
            <span className="font-mono text-xs text-gray-500 dark:text-gray-500">Doc ID: PP-2025-V2</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Pakistan &amp; GCC compliant</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Estimated read: <span className="font-mono tabular-nums">7 min</span></span>
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

              <div className="mt-5 pt-4 border-t border-line space-y-2">
                <Link
                  to="/terms"
                  className="t-min inline-flex items-center text-xs font-medium text-brand-text hover:underline gap-1"
                >
                  <span>View terms and conditions</span>
                  <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
                </Link>
                <Link
                  to="/cookies"
                  className="t-min inline-flex items-center text-xs font-medium text-brand-text hover:underline gap-1"
                >
                  <span>View cookies policy</span>
                  <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Legal Body */}
          <main className="lg:col-span-8 rounded-xl border border-line bg-surface p-6 sm:p-10 shadow-s5">
            <div className="space-y-10 text-sm leading-relaxed text-gray-600 dark:text-gray-500">
              <section id="intro" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  1. Introduction &amp; scope
                </h2>
                <p className="mb-3">
                  At MenteE ("we," "us," or "our"), we respect your privacy and are committed to safeguarding personal information collected through the RecruAI platform. This Privacy policy governs how we collect, process, store, and protect candidate credentials, resumes, mock interview audio/video transcripts, and organizational applicant records.
                </p>
                <p>
                  By accessing or registering for RecruAI, you acknowledge that your personal information is processed according to the terms of this policy.
                </p>
              </section>

              <section id="collect" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  2. Information we collect
                </h2>
                <p className="mb-4">
                  We collect information necessary to deliver precision semantic matching, automated ATS diagnostics, and AI interview simulations:
                </p>

                <div className="space-y-3">
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4">
                    <h3 className="text-xs font-semibold text-ink mb-1.5 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                      <span>Professional &amp; profile information</span>
                    </h3>
                    <p className="text-xs">
                      Candidate resumes, educational background, work experience, verified skills, portfolio links, and preferred salary/location preferences.
                    </p>
                  </div>

                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4">
                    <h3 className="text-xs font-semibold text-ink mb-1.5 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                      <span>Account credentials &amp; contact data</span>
                    </h3>
                    <p className="text-xs">
                      Full name, verified email address, phone number, hashed passwords (bcrypt), and role authorizations (individual, recruiter, superadmin).
                    </p>
                  </div>

                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4">
                    <h3 className="text-xs font-semibold text-ink mb-1.5 flex items-center gap-2">
                      <Database className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                      <span>Interview &amp; diagnostic telemetry</span>
                    </h3>
                    <p className="text-xs">
                      WebRTC practice interview audio/video streams, natural language transcripts, AI-generated performance scores, and 384-dimensional dense vector embeddings.
                    </p>
                  </div>
                </div>
              </section>

              <section id="usage" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  3. How we use your information
                </h2>
                <p className="mb-3">
                  Your information is utilized solely to deliver core recruitment and career advancement capabilities:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>Generate semantic vector rankings for job applications using pgvector.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>Run natural language processing (NLP) diagnostics on ATS resume compatibility.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>Power CVAI 12-week customized mentorship roadmaps and skill quizzes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>Deliver transactional security notices, invitation tokens, and interview confirmations via Resend.</span>
                  </li>
                </ul>
              </section>

              <section id="sharing" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  4. Information sharing &amp; disclosures
                </h2>
                <p className="mb-3">
                  We do not sell, rent, or monetize your personal data or interview recordings to third-party data brokers. Information is shared strictly under explicit operational bounds:
                </p>
                <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4 space-y-2 text-xs">
                  <p>• <strong>To hiring organizations:</strong> When you explicitly apply for an open job posting, your candidate profile, resume, and verified assessment scores are provided to the recruiting team.</p>
                  <p>• <strong>To infrastructure providers:</strong> Encrypted hosting on secure cloud infrastructure, LiveKit WebRTC for video rooms, and Resend for transactional emails.</p>
                  <p>• <strong>Legal compliance:</strong> When mandated by valid legal process, judicial order, or regulatory authorities in applicable jurisdictions.</p>
                </div>
              </section>

              <section id="security" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  5. Data security &amp; encryption
                </h2>
                <p className="mb-3">
                  We employ rigorous technical and organizational security controls to protect user data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-3.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-ink mb-1">
                      <Lock className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
                      <span>Encryption standards</span>
                    </div>
                    <p className="text-xs">TLS 1.3 encryption in transit and AES-256 cryptographic encryption at rest for all database assets.</p>
                  </div>
                  <div className="rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50 p-3.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-ink mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
                      <span>Authentication security</span>
                    </div>
                    <p className="text-xs">HTTP-only SameSite cookies, JWT token revocation, and secure bcrypt password hashing.</p>
                  </div>
                </div>
              </section>

              <section id="retention" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  6. Data retention &amp; account deletion
                </h2>
                <p className="mb-3">
                  We retain personal data only for the period necessary to deliver our services. One-time verification OTP codes are automatically deleted within <span className="font-mono tabular-nums font-semibold text-ink">24 hours</span>.
                </p>
                <p>
                  Upon receiving a confirmed account deletion request, user profiles, resumes, and interview records are permanently purged from active databases within <span className="font-mono tabular-nums font-semibold text-ink">30 days</span>.
                </p>
              </section>

              <section id="rights" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  7. Your privacy rights
                </h2>
                <p className="mb-3">
                  Regardless of your location across Pakistan, the GCC, or internationally, you have full ownership over your personal data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink">Right to access:</span> Request a complete export of your personal information and scores.
                  </div>
                  <div className="p-3 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink">Right to rectify:</span> Update inaccurate profile data directly through settings.
                  </div>
                  <div className="p-3 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink">Right to delete:</span> Request permanent erasure of candidate records and CVs.
                  </div>
                  <div className="p-3 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink">Right to opt-out:</span> Unsubscribe from email updates or non-essential cookies.
                  </div>
                </div>
              </section>

              <section id="cookies" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  8. Cookies and telemetry
                </h2>
                <p>
                  We utilize cookies to maintain session authenticity and interface preferences. For a comprehensive overview of how cookies are deployed, review our dedicated{" "}
                  <Link to="/cookies" className="text-brand-text hover:underline font-medium">
                    Cookies policy
                  </Link>.
                </p>
              </section>

              <section id="transfers" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  9. International data transfers
                </h2>
                <p>
                  Your information may be processed in secure data centers located in regions where our hosting infrastructure operates. We guarantee standard contractual clauses and rigorous encryption safeguards across all international data transfers.
                </p>
              </section>

              <section id="children" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  10. Children's privacy
                </h2>
                <p>
                  RecruAI is designed strictly for professionals and students seeking employment aged 16 and older. We do not knowingly collect personal information from individuals under 16 years of age.
                </p>
              </section>

              <section id="changes" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  11. Changes to this policy
                </h2>
                <p>
                  We may periodically revise this Privacy policy to reflect new capabilities or statutory updates. When material amendments occur, we will notify registered users via in-app banner or registered email.
                </p>
              </section>

              <section id="contact" className="scroll-mt-8 pt-4 border-t border-line">
                <h2 className="text-xl font-bold text-ink mb-3">
                  12. Contact data protection office
                </h2>
                <p className="mb-4">
                  To exercise your data privacy rights or submit questions regarding this policy:
                </p>
                <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <Building2 className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                    <span>MenteE Inc. — Data Protection Office</span>
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

export default PrivacyPolicy;
