import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems } from "../../utils/auth";
import { FiBell, FiMapPin, FiBriefcase, FiClock, FiEye, FiBookmark, FiMail, FiSmartphone, FiCalendar, FiZap, FiSettings, FiPlus } from "react-icons/fi";

export default function JobAlerts() {
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
                <FiBell className="w-3.5 h-3.5" />
                ALERTS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Job alerts</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Get notified instantly when roles matching your preferences go live.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-gray-300 mt-1">Active</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">12</p>
                <p className="text-xs text-blue-200 mt-1">Matches today</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">✓</p>
                <p className="text-xs text-gray-300 mt-1">Enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[
            { title: "Software Engineer — Remote", company: "TechCorp Inc.", location: "San Francisco, CA • Remote", time: "2 hours ago", badge: "New", color: "bg-green-50 text-green-700 border-green-200" },
            { title: "Frontend Developer", company: "StartupXYZ", location: "New York, NY", time: "1 day ago", badge: "Hot", color: "bg-blue-50 text-blue-700 border-blue-200" },
          ].map((job, i) => (
            <div key={i} className="group bg-white border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="hidden sm:flex w-10 h-10 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{job.company[0]}</div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-blue-600">{job.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5"><FiBriefcase className="w-3.5 h-3.5 text-gray-400" />{job.company} <span className="text-gray-300">•</span> <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 text-gray-400" />{job.location}</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1.5"><FiClock className="w-3 h-3" />{job.time}</p>
                  </div>
                </div>
                <span className={`hidden sm:inline-flex text-xs font-medium border px-2.5 py-1 h-fit ${job.color}`}>{job.badge}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><FiEye className="w-4 h-4" /> View job</button>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiBookmark className="w-4 h-4" /> Save</button>
                <span className={`sm:hidden inline-flex items-center text-xs font-medium border px-2 py-1 ml-auto ${job.color}`}>{job.badge}</span>
              </div>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <FiZap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Create a new alert</p>
              <p className="text-xs text-amber-700 mt-1">Set a search like “Remote • Product Designer • $90k+” and get daily digests.</p>
              <button className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-50"><FiPlus className="w-3.5 h-3.5" /> New alert</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiSettings className="w-4 h-4 text-gray-500" /> Alert settings</h3>
            <div className="mt-4 space-y-4">
              {[
                { label: "Email notifications", desc: "Instant matches to your inbox", icon: FiMail, checked: true },
                { label: "Push notifications", desc: "Browser & mobile pushes", icon: FiSmartphone, checked: true },
                { label: "Weekly summary", desc: "Digest every Monday", icon: FiCalendar, checked: false },
              ].map((pref) => {
                const Icon = pref.icon;
                return (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                        <p className="text-xs text-gray-500">{pref.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={pref.checked} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-600 text-white p-6">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FiZap className="w-4 h-4" /> Pro tip</h3>
            <p className="text-sm text-blue-50 mt-2">Add salary range and location to reduce noise. You’ll get 3× more relevant alerts.</p>
            <button className="mt-4 w-full bg-white text-blue-600 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors">Manage alert criteria</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
