import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  Clock,
  Printer,
  ChevronRight,
  CheckCircle2,
  Building2,
  Mail,
  ExternalLink,
  FileCheck,
} from "lucide-react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const sections = [
  { id: "acceptance", title: "1. Acceptance of terms" },
  { id: "description", title: "2. Description of service" },
  { id: "accounts", title: "3. User accounts & security" },
  { id: "acceptable-use", title: "4. Acceptable use policy" },
  { id: "intellectual-prop", title: "5. Intellectual property" },
  { id: "candidate-data", title: "6. Candidate data & interview rights" },
  { id: "billing", title: "7. Free beta & subscription terms" },
  { id: "termination", title: "8. Termination & suspension" },
  { id: "warranty", title: "9. Disclaimer of warranties" },
  { id: "liability", title: "10. Limitation of liability" },
  { id: "governing-law", title: "11. Governing law & dispute resolution" },
  { id: "changes", title: "12. Changes to terms" },
  { id: "contact", title: "13. Legal contact information" },
];

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState("acceptance");

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
                <Scale className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>Legal terms &amp; agreements</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                Terms and conditions
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-500 max-w-2xl leading-relaxed">
                Rules, guidelines, and legal rights governing the use of RecruAI by job seekers, candidates, and hiring organizations.
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
                <span>Print terms</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-500 dark:text-gray-500">Doc ID: TC-2025-V2</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Pakistan &amp; GCC compliant</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">Estimated read: <span className="font-mono tabular-nums">6 min</span></span>
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
                  to="/privacy"
                  className="t-min inline-flex items-center text-xs font-medium text-brand-text hover:underline gap-1"
                >
                  <span>View privacy policy</span>
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
              <section id="acceptance" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  1. Acceptance of terms
                </h2>
                <p className="mb-3">
                  By accessing, browsing, or creating an account on RecruAI ("the Service"), provided by MenteE ("MenteE," "we," or "us"), you agree to be bound by these Terms and conditions and all applicable regulations.
                </p>
                <p>
                  If you do not agree with any provision set forth in these terms, you must discontinue using the Service immediately.
                </p>
              </section>

              <section id="description" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  2. Description of service
                </h2>
                <p className="mb-3">
                  RecruAI is an integrated AI-powered talent acquisition and career growth platform offering:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink block mb-1">Semantic vector matching</span>
                    <span>Dense embedding matching between candidate profiles and job requirements using pgvector.</span>
                  </div>
                  <div className="p-3.5 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink block mb-1">ATS resume diagnostics</span>
                    <span>Objective natural language scoring, section audits, and quantified impact analysis.</span>
                  </div>
                  <div className="p-3.5 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink block mb-1">AI practice interviews</span>
                    <span>Realistic WebRTC mock interview simulations with automated transcription and feedback.</span>
                  </div>
                  <div className="p-3.5 rounded-lg border border-line bg-gray-100/50 dark:bg-gray-25/50">
                    <span className="font-semibold text-ink block mb-1">CVAI career roadmaps</span>
                    <span>12-week customized skill acquisition plans mapped to regional job market requirements.</span>
                  </div>
                </div>
              </section>

              <section id="accounts" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  3. User accounts &amp; security
                </h2>
                <p className="mb-3">
                  To utilize certain features, you must register for an account. By creating an account, you represent and warrant that:
                </p>
                <ul className="space-y-2 list-none pl-0 text-xs">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>You provide truthful, accurate, and complete information regarding your identity and background.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>You are solely responsible for maintaining the confidentiality of your account credentials.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0 mt-0.5" strokeWidth={1.8} />
                    <span>You will notify our security team immediately of any suspected unauthorized account access.</span>
                  </li>
                </ul>
              </section>

              <section id="acceptable-use" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  4. Acceptable use policy
                </h2>
                <p className="mb-3">
                  Users agree not to misuse the RecruAI platform or facilitate prohibited activities, including:
                </p>
                <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-4 space-y-2 text-xs">
                  <p>• Submitting fraudulent credentials, impersonating others, or falsifying verified skill assessments.</p>
                  <p>• Attempting to reverse engineer, scrape, or extract dense vector models or proprietary question banks.</p>
                  <p>• Circumventing rate limits, trial periods, token allocations, or security controls.</p>
                  <p>• Uploading malicious payloads, malicious scripts, or harassing candidates or recruiters.</p>
                </div>
              </section>

              <section id="intellectual-prop" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  5. Intellectual property
                </h2>
                <p className="mb-3">
                  The Service, including software architecture, recommendation algorithms, user interfaces, branding, and proprietary skill taxonomies, is the exclusive property of MenteE and its licensors.
                </p>
                <p>
                  You retain ownership over candidate resumes and text submissions you upload to RecruAI, granting us a limited license to process and score such content to deliver the Service.
                </p>
              </section>

              <section id="candidate-data" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  6. Candidate data &amp; interview rights
                </h2>
                <p>
                  Interview video and audio streams recorded during practice simulations or official recruiter assessments are processed securely. Candidates retain the right to delete practice recordings from their candidate history at any time.
                </p>
              </section>

              <section id="billing" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  7. Free beta &amp; subscription terms
                </h2>
                <div className="rounded-xl border border-brand/20 bg-brand/10 p-4 mb-3">
                  <div className="flex items-center gap-2 font-semibold text-xs text-brand-text mb-1">
                    <FileCheck className="h-4 w-4" strokeWidth={1.8} />
                    <span>Free beta period policy</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-600">
                    RecruAI is currently operating under a controlled free beta. New individual and organization accounts receive full 30-day access to AI features with generous token allowances without immediate payment requirements.
                  </p>
                </div>
                <p className="text-xs">
                  Any future commercial subscriptions or premium tier activations will be communicated with advance notification.
                </p>
              </section>

              <section id="termination" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  8. Termination &amp; suspension
                </h2>
                <p>
                  We reserve the right to suspend or terminate accounts that violate our acceptable use policy or compromise platform integrity, without prior notice or liability.
                </p>
              </section>

              <section id="warranty" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  9. Disclaimer of warranties
                </h2>
                <p>
                  The Service is provided on an "as is" and "as available" basis without express or implied warranties of any kind. While our models are designed with high precision, RecruAI does not guarantee hiring offers or candidate placement outcomes.
                </p>
              </section>

              <section id="liability" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  10. Limitation of liability
                </h2>
                <p>
                  To the maximum extent permitted under applicable law, MenteE and its directors, employees, or partners shall not be liable for indirect, incidental, special, or consequential damages resulting from platform use.
                </p>
              </section>

              <section id="governing-law" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  11. Governing law &amp; dispute resolution
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of Pakistan, with regional dispute resolution procedures applying to cross-border users across the GCC.
                </p>
              </section>

              <section id="changes" className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink mb-3">
                  12. Changes to terms
                </h2>
                <p>
                  We reserve the right to modify or replace these Terms at any time. Material revisions will be posted on this page with an updated modification timestamp.
                </p>
              </section>

              <section id="contact" className="scroll-mt-8 pt-4 border-t border-line">
                <h2 className="text-xl font-bold text-ink mb-3">
                  13. Legal contact information
                </h2>
                <p className="mb-4">
                  For formal legal notices, contract inquiries, or regulatory compliance:
                </p>
                <div className="rounded-xl border border-line bg-gray-100/50 dark:bg-gray-25/50 p-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <Building2 className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                    <span>MenteE Inc. — Legal &amp; Corporate Affairs</span>
                  </div>
                  <p>Lahore, Pakistan · Serving Pakistan &amp; the Gulf</p>
                  <div className="flex items-center gap-2 pt-1 text-gray-600 dark:text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.8} />
                    <span>Email: <a href="mailto:legal@menteeai.org" className="text-brand-text hover:underline">legal@menteeai.org</a></span>
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

export default TermsAndConditions;
