import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems } from "../../utils/auth";
import { FiFileText, FiLayout, FiZap, FiCheckCircle, FiEye, FiDownload, FiPlus, FiArrowRight } from "react-icons/fi";

export default function ResumeBuilder() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiFileText className="w-3.5 h-3.5" />
                RESUME
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Resume builder</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Create and optimize your resume with AI — tailored templates and instant suggestions.</p>
              <div className="mt-4 flex gap-2">
                <button className="bg-white text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-1.5"><FiEye className="w-4 h-4" /> Preview</button>
                <button className="bg-white/10 border border-white/20 text-white px-4 py-2 text-sm font-medium hover:bg-white/15 transition-colors inline-flex items-center gap-1.5"><FiDownload className="w-4 h-4" /> Export PDF</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-xl font-bold">3</p>
                <p className="text-xs text-gray-300 mt-1">Templates</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-xl font-bold">12</p>
                <p className="text-xs text-gray-300 mt-1">Sections</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-xl font-bold text-blue-200">AI</p>
                <p className="text-xs text-blue-200 mt-1">Enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiFileText className="w-4 h-4 text-gray-500" /> Editor</h3>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1">Draft</span>
            </div>
            <div className="p-6">
              <div className="h-[420px] bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center mb-3"><FiFileText className="w-6 h-6 text-gray-400" /></div>
                <p className="text-sm font-medium text-gray-700">Resume editor</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Drag sections, edit inline, and see AI suggestions update in real time. Your changes save automatically.</p>
                <button className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-black"><FiPlus className="w-4 h-4" /> Add section</button>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset</button>
                <button className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Save resume</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiLayout className="w-4 h-4 text-gray-500" /> Templates</h3>
            <div className="mt-4 space-y-2">
              {[
                { name: "Modern", desc: "Clean, ATS-friendly", active: true },
                { name: "Classic", desc: "Traditional & formal", active: false },
                { name: "Creative", desc: "Bold for design roles", active: false },
              ].map((tpl) => (
                <button key={tpl.name} className={`w-full text-left p-3 border flex items-center justify-between transition-colors ${tpl.active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"}`}>
                  <div>
                    <p className={`text-sm font-medium ${tpl.active ? "text-white" : "text-gray-900"}`}>{tpl.name}</p>
                    <p className={`text-xs ${tpl.active ? "text-gray-300" : "text-gray-500"}`}>{tpl.desc}</p>
                  </div>
                  {tpl.active ? <FiCheckCircle className="w-4 h-4 text-white" /> : <FiArrowRight className="w-4 h-4 text-gray-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 text-white p-6">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FiZap className="w-4 h-4" /> AI suggestions</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-blue-50">
              <li className="flex gap-2"><span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-2 shrink-0" />Add quantifiable achievements (e.g. “Improved API latency 32%”)</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-2 shrink-0" />Include keywords: React, Node.js, TypeScript for tech roles</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-2 shrink-0" />Add a concise summary (2-3 lines) at the top</li>
            </ul>
            <button className="mt-4 w-full bg-white text-blue-600 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors">Apply all suggestions</button>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900">Export</h3>
            <p className="text-xs text-gray-500 mt-1">Download optimized PDF or share via link.</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-black"><FiDownload className="w-4 h-4" /> PDF</button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Share link</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
