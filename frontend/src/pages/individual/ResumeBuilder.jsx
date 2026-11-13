import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { FiFileText, FiLayout, FiZap, FiCheckCircle, FiEye, FiDownload, FiPlus, FiArrowRight } from "react-icons/fi";

export default function ResumeBuilder() {
  return (
    <AppShell>
      <CenterBar title="Resume builder" backTo="/feed" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-surface border border-line p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 text-brand-text text-xs font-semibold rounded-full tracking-wide mb-3">
                <FiFileText className="h-3.5 w-3.5" />
                AI RESUME BUILDER
              </div>
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
                Create and optimize your resume with AI
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
                Tailored templates, ATS score checks, and instant suggestions — all in one workspace.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="bg-surface border border-line text-ink px-4 py-2 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors inline-flex items-center gap-1.5">
                  <FiEye className="h-3.5 w-3.5" /> Preview
                </button>
                <button className="bg-brand-action text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors inline-flex items-center gap-1.5">
                  <FiDownload className="h-3.5 w-3.5" /> Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:w-[320px]">
              <div className="bg-gray-50 dark:bg-gray-25 border border-line rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-ink">3</p>
                <p className="text-xs text-gray-500 mt-0.5">Templates</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-25 border border-line rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-ink">12</p>
                <p className="text-xs text-gray-500 mt-0.5">Sections</p>
              </div>
              <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-brand-text">AI</p>
                <p className="text-xs text-brand-text mt-0.5 font-medium">Enabled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-xl border border-line overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-gray-500" /> Editor
                </h3>
                <span className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                  Draft
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="h-[360px] bg-gray-50 dark:bg-gray-25 border border-dashed border-line rounded-xl flex flex-col items-center justify-center text-center p-6 sm:p-8">
                  <div className="h-12 w-12 bg-surface border border-line rounded-xl flex items-center justify-center mb-3">
                    <FiFileText className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-semibold text-ink">Resume Editor Canvas</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                    Drag sections, edit inline, and see AI suggestions update in real time. Your changes save automatically.
                  </p>
                  <button className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-action text-white text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors">
                    <FiPlus className="h-3.5 w-3.5" /> Add section
                  </button>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <button className="px-4 py-2 bg-surface border border-line text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-25 transition-colors">
                    Reset
                  </button>
                  <button className="px-5 py-2 bg-brand-action text-white text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors">
                    Save resume
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Templates Selector */}
            <div className="bg-surface rounded-xl border border-line p-5">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <FiLayout className="h-4 w-4 text-gray-500" /> Templates
              </h3>
              <div className="mt-3.5 space-y-2">
                {[
                  { name: "Modern", desc: "Clean, ATS-friendly", active: true },
                  { name: "Classic", desc: "Traditional & formal", active: false },
                  { name: "Creative", desc: "Bold for design roles", active: false },
                ].map((tpl) => (
                  <button
                    key={tpl.name}
                    className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-colors ${
                      tpl.active
                        ? "bg-gray-50 dark:bg-gray-25 border-brand text-ink"
                        : "bg-surface border-line hover:bg-gray-50 dark:hover:bg-gray-25 text-gray-600 dark:text-gray-500"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink">{tpl.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{tpl.desc}</p>
                    </div>
                    {tpl.active ? (
                      <FiCheckCircle className="h-4 w-4 text-brand-text" />
                    ) : (
                      <FiArrowRight className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestions Card */}
            <div className="bg-surface rounded-xl border border-line p-5">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <FiZap className="h-4 w-4 text-brand-text" /> AI suggestions
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 bg-brand rounded-full mt-1.5 shrink-0" />
                  Add quantifiable achievements (e.g. “Improved API latency by 32%”).
                </li>
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 bg-brand rounded-full mt-1.5 shrink-0" />
                  Include verified skills: React, Node.js, and TypeScript.
                </li>
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 bg-brand rounded-full mt-1.5 shrink-0" />
                  Add a concise professional summary (2-3 lines).
                </li>
              </ul>
              <button className="mt-4 w-full bg-brand/10 border border-brand/20 text-brand-text py-2 text-xs font-semibold rounded-lg hover:bg-brand/20 transition-colors">
                Apply all suggestions
              </button>
            </div>

            {/* Export */}
            <div className="bg-surface rounded-xl border border-line p-5">
              <h3 className="text-sm font-semibold text-ink">Export</h3>
              <p className="text-xs text-gray-500 mt-1">Download optimized PDF or share your online link.</p>
              <div className="mt-3.5 flex gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-action text-white text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors">
                  <FiDownload className="h-3.5 w-3.5" /> PDF
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface border border-line text-xs font-semibold rounded-lg text-ink hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors">
                  Share link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
