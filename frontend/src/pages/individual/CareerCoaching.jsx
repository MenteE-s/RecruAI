import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems } from "../../utils/auth";
import { FiUsers, FiCalendar, FiClock, FiCheckCircle, FiArrowRight, FiBookOpen, FiTarget, FiAward, FiVideo, FiMessageSquare, FiStar } from "react-icons/fi";

export default function CareerCoaching() {
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
                <FiTarget className="w-3.5 h-3.5" />
                COACHING
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Career coaching</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Personalized guidance to accelerate your growth — 1:1 sessions, plans, and resources.</p>
              <div className="mt-4 flex gap-2">
                <button className="bg-white text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">Book session</button>
                <button className="bg-white/10 border border-white/20 text-white px-4 py-2 text-sm font-medium hover:bg-white/15 transition-colors">View plan</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-gray-300 mt-1">Sessions</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-gray-300 mt-1">Goals</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">Top 10%</p>
                <p className="text-xs text-blue-200 mt-1">Progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiUsers className="w-4 h-4 text-gray-500" /> Your career coach</h3>
            <div className="mt-4 flex gap-4">
              <div className="w-14 h-14 bg-gray-900 text-white flex items-center justify-center text-lg font-bold shrink-0">SJ</div>
              <div>
                <h4 className="text-[15px] font-semibold text-gray-900">Sarah Johnson</h4>
                <p className="text-sm text-gray-600">Senior Career Coach • 15+ years</p>
                <div className="mt-1.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => <FiStar key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-xs text-gray-500 ml-1">4.9 (128 reviews)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">Leadership</span>
              <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1">Tech</span>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1">Interview</span>
            </div>
            <button className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"><FiCalendar className="w-4 h-4" /> Schedule session</button>
            <button className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiMessageSquare className="w-4 h-4" /> Message coach</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiCalendar className="w-4 h-4 text-gray-500" /> Upcoming sessions</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center"><FiVideo className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Resume review</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FiClock className="w-3 h-3" /> Tomorrow • 3:00 PM • 30m</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">Join</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center"><FiTarget className="w-5 h-5 text-gray-500" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Interview prep</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FiClock className="w-3 h-3" /> Friday • 2:00 PM • 45m</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">Reschedule</button>
            </div>
          </div>
          <button className="mt-4 w-full py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">View all sessions</button>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiAward className="w-4 h-4 text-gray-500" /> Development plan</h3>
          <div className="mt-4 space-y-3">
            <div className="flex gap-3 p-3 bg-green-50 border border-green-200">
              <div className="w-7 h-7 bg-green-600 text-white flex items-center justify-center shrink-0"><FiCheckCircle className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Complete skills assessment</p>
                <p className="text-xs text-gray-500">Finished 2 days ago</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200">
              <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center shrink-0"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Update resume with achievements</p>
                <p className="text-xs text-gray-500">In progress • 60% • Due Friday</p>
                <div className="mt-1.5 h-1 bg-white border border-blue-200">
                  <div className="h-1 bg-blue-600" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-white border border-gray-200">
              <div className="w-7 h-7 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0"><FiClock className="w-4 h-4 text-gray-400" /></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Practice technical interviews</p>
                <p className="text-xs text-gray-500">Up next</p>
              </div>
            </div>
          </div>
          <button className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">View full plan <FiArrowRight className="w-4 h-4" /></button>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiBookOpen className="w-4 h-4 text-gray-500" /> Recommended resources</h3>
          <div className="mt-4 space-y-2">
            <a href="#" className="block p-4 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 group transition-colors">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">System design interview guide</p>
              <p className="text-xs text-gray-500 mt-1">Master complex system design questions • 12 chapters • 4.8★</p>
            </a>
            <a href="#" className="block p-4 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 group transition-colors">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Leadership communication</p>
              <p className="text-xs text-gray-500 mt-1">Improve presentation and storytelling • Video course</p>
            </a>
            <a href="#" className="block p-4 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 group transition-colors">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Behavioral interview: STAR method</p>
              <p className="text-xs text-gray-500 mt-1">Craft compelling stories • Templates included</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
