// src/pages/Dashboard.jsx
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  FiVideo,
  FiImage,
  FiFileText,
  FiClock,
  FiMapPin,
  FiAward,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiBriefcase,
  FiBell,
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Sidebar — Profile & Stats */}
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-20 bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-purple-500/20 relative">
              <img
                src="/banner-pattern.svg"
                alt=""
                className="w-full h-full object-cover opacity-30"
              />
            </div>
            <div className="px-5 pb-5 relative">
              <img
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face&q=80"
                alt="Profile"
                className="w-16 h-16 rounded-full border-4 border-white shadow-md -mt-8 mb-3 object-cover bg-gray-100"
              />
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Syed Ahmad</h2>
              <p className="text-xs text-gray-500 mt-1 leading-snug">Founder & AI Engineer · Building RecruAI</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <FiMapPin className="w-3 h-3" /> Riyadh, Saudi Arabia
              </div>
              <span className="inline-block mt-2 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">Freelance</span>
            </div>
            <div className="border-t border-gray-100 px-5 py-3 flex gap-6">
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">265</p>
                <p className="text-[11px] text-gray-400">Profile viewers</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">40</p>
                <p className="text-[11px] text-gray-400">Impressions</p>
              </div>
            </div>
          </div>

          {/* Company / Activity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1">MenteE AI</h3>
            <p className="text-xs text-gray-400 mb-3">Your company · AI recruiting platform</p>
            <div className="flex gap-6 text-xs text-gray-600">
              <div>
                <p className="text-sm font-bold text-gray-900">0</p>
                <span>Activity</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">19</p>
                <span>Visitors</span>
              </div>
            </div>
          </div>

          {/* Premium CTA */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20">
            <h3 className="text-sm font-bold mb-1">Grow faster with Premium</h3>
            <p className="text-xs text-blue-100 mb-3">Unlock analytics, priority listings, and custom branding.</p>
            <button className="w-full py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-xs font-semibold transition-colors">Start Premium Page</button>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-9 order-1 lg:order-2 space-y-6">
          {/* Compose Box */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face&q=80"
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0"
                />
                <button
                  onClick={() => alert("Compose mode: You can create job posts, share updates, or write articles here.")}
                  className="flex-1 text-left h-11 px-4 bg-[#edf3f8] border border-transparent rounded-full text-sm text-gray-500 hover:bg-white hover:border-gray-200 hover:text-gray-700 transition-all"
                >
                  Start a post
                </button>
              </div>
              <div className="flex items-center justify-between md:justify-start md:gap-6">
                <button
                  onClick={() => alert("Video post mode")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors"
                >
                  <FiVideo className="w-5 h-5 text-amber-600" /> <span>Video</span>
                </button>
                <button
                  onClick={() => alert("Photo post mode")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors"
                >
                  <FiImage className="w-5 h-5 text-green-600" /> <span>Photo</span>
                </button>
                <button
                  onClick={() => alert("Write article mode")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors"
                >
                  <FiFileText className="w-5 h-5 text-orange-600" /> <span>Write article</span>
                </button>
              </div>
            </div>
          </div>

          {/* Post Feed */}
          <div className="space-y-4">
            {/* Featured Job / Internship Post */}
            <article className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face&q=80"
                    alt="Anam Javed"
                    className="w-11 h-11 rounded-full object-cover bg-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[15px] font-semibold text-gray-900">Anam Javed</h4>
                      <span className="text-xs text-gray-400">2nd</span>
                      <span className="text-xs text-blue-600 font-medium hover:underline">Follow</span>
                    </div>
                    <p className="text-xs text-gray-500">Founder & CEO @ Research Rover · Empowering Scholars Worldwide</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <FiClock className="w-3 h-3" /> 1w · <FiEye className="w-3 h-3" /> 3,842 views
                    </p>
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-snug mb-2">
                  FULLY FUNDED 6 WEEKS Research Internship Program in Saudi Arabia
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Location: KAUST Campus (King Abdullah University of Science & Technology). A transformative, fully funded 6-week internship for scholars and researchers looking to expand their work in a world-class environment.
                </p>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1560472354-82b78c16ad7f?w=800&h=400&fit=crop&q=80"
                    alt="Internship Banner"
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-5 text-sm text-gray-500">
                  <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors font-medium">
                    <FiHeart className="w-4 h-4" /> <span>Like</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium">
                    <FiMessageCircle className="w-4 h-4" /> <span>Comment</span>
                  </button>
                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                    <FiEye className="w-3.5 h-3.5" /> <span className="font-semibold text-gray-600">3,842</span> views
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md font-medium border border-emerald-100">No Application Fee</span>
                </div>
              </div>
            </article>

            {/* Second Job Post */}
            <article className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face&q=80"
                    alt="Muhammad Murad"
                    className="w-11 h-11 rounded-full object-cover bg-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[15px] font-semibold text-gray-900">Muhammad Murad</h4>
                      <span className="text-xs text-gray-400">1w · Liked this</span>
                    </div>
                    <p className="text-xs text-gray-500">AI Product Manager · MenteE AI</p>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                  Hiring: AI Research Intern (Remote) — 3-Month Paid Program
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  We're looking for a motivated AI research intern to join our core team. Work on real-world NLP and computer vision problems, co-author papers, and build production-grade models.
                </p>
                <div className="flex items-center gap-5 text-sm text-gray-500">
                  <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors font-medium">
                    <FiHeart className="w-4 h-4" /> <span>Like</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium">
                    <FiMessageCircle className="w-4 h-4" /> <span>Comment</span>
                  </button>
                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto font-medium">
                    <FiUsers className="w-3.5 h-3.5" /> <span className="text-blue-600">28</span> applications
                  </span>
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium border border-blue-100">Paid</span>
                  <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium border border-gray-200">Remote</span>
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
