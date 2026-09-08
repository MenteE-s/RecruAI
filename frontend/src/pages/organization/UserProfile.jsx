import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getUploadUrl, getAuthHeaders } from "../../utils/auth";
import { FiMail, FiBriefcase, FiAward, FiBook, FiCode, FiFolder, FiFileText, FiHeart, FiGlobe, FiStar, FiMic, FiShield, FiArrowLeft, FiMapPin, FiCalendar, FiUsers } from "react-icons/fi";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [likedProfiles, setLikedProfiles] = useState(new Set());

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getBackendUrl()}/api/profile/user/${userId}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setProfileData(await res.json());
      else setError((await res.json().catch(() => ({}))).error || "Failed to load profile");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [userId]);
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setCurrentUser((await res.json()).user);
    } catch {}
  }, []);
  const checkIfLiked = useCallback(async () => {
    if (!currentUser || !userId) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUser.id}/is-favorite/${userId}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok && (await res.json()).favorited) setLikedProfiles((prev) => new Set(prev).add(userId));
    } catch {}
  }, [currentUser, userId]);
  useEffect(() => { fetchProfileData(); fetchCurrentUser(); }, [fetchProfileData, fetchCurrentUser]);
  useEffect(() => { if (currentUser && userId) checkIfLiked(); }, [checkIfLiked, currentUser, userId]);

  const toggleLike = async (targetUserId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUser.id}/toggle-favorite/${targetUserId}`, { method: "POST", credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.favorited) setLikedProfiles((prev) => new Set(prev).add(targetUserId));
        else setLikedProfiles((prev) => { const n = new Set(prev); n.delete(targetUserId); return n; });
      }
    } catch {}
  };
  const formatDate = (d) => {
    if (!d) return "Present";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };
  const formatDateRange = (s, e, currentJob = false) => `${formatDate(s)} - ${currentJob ? "Present" : formatDate(e)}`;

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-64 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 h-64 animate-pulse" />
            <div className="bg-white border border-gray-200 h-64 animate-pulse col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  if (error) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4"><FiArrowLeft className="w-4 h-4" /> Back</button>
          <div className="bg-white border border-gray-200 p-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm">Go back</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, experiences, educations, skills, projects, publications, awards, certifications, languages, volunteer_experiences, references, hobby_interests, professional_memberships, patents, course_trainings, social_media_links, key_achievements, conferences, speaking_engagements, licenses, team_member_info, is_team_member, hired_organizations } = profileData;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"><FiArrowLeft className="w-4 h-4" /> Back</button>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gray-900 text-white mb-6">
        {user.banner && <img src={getUploadUrl(user.banner)} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6">
          {user.profile_picture ? <img src={getUploadUrl(user.profile_picture)} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shrink-0" /> : <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">{(user.name || user.email)[0].toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{user.name || user.email}</h1>
                <p className="text-gray-300 mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className={`px-2 py-1 text-xs font-medium border ${is_team_member ? "bg-green-500/20 text-green-200 border-green-400/20" : "bg-amber-500/20 text-amber-200 border-amber-400/20"}`}>{is_team_member ? "In your team" : "Not in team"}</span>
                  {team_member_info && <><span className="bg-white/10 border border-white/20 px-2 py-1 text-xs">{team_member_info.role}</span><span className="text-gray-400">Joined {formatDate(team_member_info.join_date)}</span></>}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hired_organizations?.map((org, i) => <span key={i} className="bg-white text-gray-900 px-2 py-1 text-xs font-medium">Hired by {org.organization_name}</span>)}
                </div>
              </div>
              {currentUser && currentUser.id !== parseInt(userId) && (
                <div className="flex gap-2">
                  <button onClick={() => toggleLike(parseInt(userId))} className={`p-2.5 ${likedProfiles.has(userId) ? "bg-red-500 text-white" : "bg-white/10 border border-white/20 text-white hover:bg-white/20"}`}><FiHeart className={`w-5 h-5 ${likedProfiles.has(userId) ? "fill-white" : ""}`} /></button>
                  <button onClick={() => window.open(`/profile/${userId}`, "_blank")} className="p-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20"><FiGlobe className="w-5 h-5" /></button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-300">
              <span className="flex items-center gap-1.5"><FiMail className="w-4 h-4 text-gray-400" />{user.email}</span>
              {social_media_links?.slice(0, 3).map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="bg-white/10 border border-white/20 px-2 py-1 text-xs hover:bg-white/20">{link.platform}</a>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiStar className="w-4 h-4 text-amber-500" /> Summary</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 border border-gray-200 p-3"><p className="text-xl font-bold text-gray-900">{experiences?.length || 0}</p><p className="text-xs text-gray-500">Roles</p></div>
              <div className="bg-gray-50 border border-gray-200 p-3"><p className="text-xl font-bold text-gray-900">{educations?.length || 0}</p><p className="text-xs text-gray-500">Degrees</p></div>
              <div className="bg-gray-50 border border-gray-200 p-3"><p className="text-xl font-bold text-gray-900">{skills?.length || 0}</p><p className="text-xs text-gray-500">Skills</p></div>
              <div className="bg-gray-50 border border-gray-200 p-3"><p className="text-xl font-bold text-gray-900">{projects?.length || 0}</p><p className="text-xs text-gray-500">Projects</p></div>
            </div>
          </div>
          {skills?.length > 0 && (
            <div className="bg-white border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiCode className="w-4 h-4 text-blue-600" /> Skills</h3>
              <div className="mt-4 space-y-3">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex justify-between text-sm"><span className="font-medium text-gray-900">{skill.name}</span><span className="text-xs text-gray-500 capitalize">{skill.level}</span></div>
                    <div className="mt-1 h-1.5 bg-gray-100"><div className={`h-1.5 ${skill.level === "expert" ? "bg-green-600 w-full" : skill.level === "advanced" ? "bg-blue-600 w-4/5" : skill.level === "intermediate" ? "bg-amber-500 w-3/5" : "bg-gray-400 w-2/5"}`} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {languages?.length > 0 && (
            <div className="bg-white border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiGlobe className="w-4 h-4 text-green-600" /> Languages</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">{languages.map((lang) => <span key={lang.id} className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 text-xs">{lang.name}{lang.proficiency_level && ` (${lang.proficiency_level})`}</span>)}</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {experiences?.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiBriefcase className="w-4 h-4 text-blue-600" /> Experience</h3>
              <div className="mt-4 space-y-6">
                {experiences.map((exp) => (
                  <div key={exp.id} className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><FiBriefcase className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-sm text-blue-600">{exp.company}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FiCalendar className="w-3 h-3" />{formatDateRange(exp.start_date, exp.end_date, exp.current_job)} {exp.location && <><FiMapPin className="w-3 h-3 ml-2" />{exp.location}</>}</p>
                      {exp.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {educations?.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiBook className="w-4 h-4 text-purple-600" /> Education</h3>
              <div className="mt-4 space-y-4">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex gap-4">
                    <div className="w-10 h-10 bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0"><FiBook className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-sm text-purple-600">{edu.school} {edu.field_of_study && `• ${edu.field_of_study}`}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDateRange(edu.start_date, edu.end_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {projects?.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiFolder className="w-4 h-4 text-indigo-600" /> Projects</h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <div key={p.id} className="border border-gray-200 p-4 hover:bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900">{p.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{formatDateRange(p.start_date, p.end_date)}</p>
                    {p.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</p>}
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">View →</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Simplified other sections - keep original but styled */}
          {[ 
            { data: certifications, title: "Certifications", icon: FiAward, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
            { data: awards, title: "Awards", icon: FiStar, color: "text-amber-600 bg-amber-50 border-amber-100" },
            { data: publications, title: "Publications", icon: FiFileText, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          ].map((section) => section.data?.length > 0 && (
            <div key={section.title} className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><section.icon className="w-4 h-4 text-gray-500" />{section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.data.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium text-gray-900">{item.name || item.title}</p>
                    <p className="text-xs text-gray-500">{item.organization || item.publisher || ""} • {formatDate(item.issue_date || item.publication_date)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
