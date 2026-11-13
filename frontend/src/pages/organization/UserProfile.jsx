import { OrgAppShell } from "../../components/layout/OrgAppShell";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackendUrl, getUploadUrl, getAuthHeaders } from "../../utils/auth";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { ProfileSkillChip } from "../../components/profile/ProfileBits";
import { FiMail, FiBriefcase, FiAward, FiBook, FiCode, FiFolder, FiFileText, FiHeart, FiGlobe, FiStar, FiArrowLeft, FiMapPin, FiCalendar, FiEdit2, FiCheckCircle } from "react-icons/fi";
import EmploymentBadge, { employmentMeta } from "../../components/ui/EmploymentStatus";

// Proficiency bars, keyed lowercase. Backend levels are canonical Title-Case
// from the skill taxonomy, so the lookup normalizes rather than comparing
// against lowercase literals (which is what this used to do, and why a
// normalized "Expert" rendered as an empty grey bar).
const LEVEL_BAR_CLASS = {
  expert: "bg-brand w-full",
  advanced: "bg-brand w-4/5",
  intermediate: "bg-amber-500 w-3/5",
  beginner: "bg-gray-400 w-2/5",
};

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
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
    const key = String(targetUserId);
    const wasLiked = likedProfiles.has(key);
    setLikedProfiles((prev) => { const n = new Set(prev); if (wasLiked) n.delete(key); else n.add(key); return n; });
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUser.id}/toggle-favorite/${targetUserId}`, { method: "POST", credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLikedProfiles((prev) => { const n = new Set(prev); if (data.favorited) n.add(key); else n.delete(key); return n; });
    } catch {
      setLikedProfiles((prev) => { const n = new Set(prev); if (wasLiked) n.add(key); else n.delete(key); return n; });
    }
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
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <div className="h-40 animate-pulse rounded-xl border border-line bg-surface" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
            <div className="h-64 animate-pulse rounded-xl border border-line bg-surface col-span-2" />
          </div>
        </div>
      </OrgAppShell>
    );
  }
  if (error) {
    return (
      <OrgAppShell>
        <div className="mx-4 mt-4 max-w-4xl p-6">
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-600 hover:text-ink"><FiArrowLeft className="h-4 w-4" /> Back</button>
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
          </div>
        </div>
      </OrgAppShell>
    );
  }

  const { user, experiences, educations, skills, projects, publications, awards, certifications, languages, social_media_links, team_member_info, is_team_member, hired_organizations } = profileData;

  const cardCls = "rounded-xl border border-line bg-surface p-5";
  const sectionTitle = "flex items-center gap-2 text-sm font-semibold text-ink";

  return (
    <OrgAppShell>
      {/* Back + own-profile edit */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-ink"><FiArrowLeft className="h-4 w-4" /> Back</button>
        {currentUser && String(currentUser.id) === String(userId) && (
          <ButtonLink to="/in/profile" variant="secondary" size="sm">
            <FiEdit2 className="h-3.5 w-3.5" /> Edit my profile
          </ButtonLink>
        )}
      </div>

      {/* Hero */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-col gap-5 md:flex-row">
            {user.profile_picture ? (
              <img src={getUploadUrl(user.profile_picture)} alt={user.name} className={`h-20 w-20 shrink-0 rounded-full border-4 border-surface object-cover shadow-s5 ${employmentMeta(user.employment_status).ring}`} />
            ) : (
              <div className={`shrink-0 ${employmentMeta(user.employment_status).ring}`}>
                <Avatar name={user.name || user.email} size="3xl" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-[20px] font-semibold leading-7 text-ink">{user.name || user.email}</h1>
                  {user.headline && (
                    <p className="mt-1 text-[13px] font-medium text-gray-600">{user.headline}</p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <EmploymentBadge status={user.employment_status} />
                    <span className={`rounded-full px-2 py-1 text-xs font-medium border ${is_team_member ? "bg-brand/10 text-brand-text border-transparent" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{is_team_member ? "In your team" : "Not in team"}</span>
                    {team_member_info && <><span className="rounded-lg border border-line bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-25">{team_member_info.role}</span><span className="text-xs text-gray-500">Joined {formatDate(team_member_info.join_date)}</span></>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {hired_organizations?.map((org, i) => <span key={i} className="rounded-lg border border-line bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-25">Hired by {org.organization_name}</span>)}
                  </div>
                </div>
                {currentUser && currentUser.id !== parseInt(userId) && (
                  <div className="flex gap-2">
                    <button onClick={() => toggleLike(userId)} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${likedProfiles.has(String(userId)) ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" : "border-line bg-surface text-gray-500 hover:bg-gray-50 hover:text-ink"}`} aria-label={likedProfiles.has(String(userId)) ? "Remove favorite" : "Mark as favorite"}>
                      <FiHeart className={`h-4 w-4 ${likedProfiles.has(String(userId)) ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                    <button onClick={() => window.open(`/in/profile/${userId}`, "_blank")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-gray-500 transition-colors hover:bg-gray-50 hover:text-ink" aria-label="Open public profile">
                      <FiGlobe className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><FiMail className="h-4 w-4 text-gray-500" />{user.email}</span>
                {social_media_links?.slice(0, 3).map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line bg-gray-50 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-25 dark:bg-gray-25">{link.platform}</a>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className={cardCls}>
            <h3 className={sectionTitle}><FiStar className="h-4 w-4 text-amber-500" /> Summary</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25"><p className="text-xl font-bold text-ink">{experiences?.length || 0}</p><p className="text-xs text-gray-500">Roles</p></div>
              <div className="rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25"><p className="text-xl font-bold text-ink">{educations?.length || 0}</p><p className="text-xs text-gray-500">Degrees</p></div>
              <div className="rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25"><p className="text-xl font-bold text-ink">{skills?.length || 0}</p><p className="text-xs text-gray-500">Skills</p></div>
              <div className="rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25"><p className="text-xl font-bold text-ink">{projects?.length || 0}</p><p className="text-xs text-gray-500">Projects</p></div>
            </div>
          </div>
          {skills?.length > 0 && (
            <div className={cardCls}>
              <h3 className={sectionTitle}><FiCode className="h-4 w-4 text-gray-500" /> Skills</h3>
              <div className="mt-4 space-y-3">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-ink">
                        {skill.name}
                        {skill.verified && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded border border-line bg-brand/10 px-1 py-px align-middle text-[10px] font-semibold text-brand-text" title={skill.evidence_source === "assessment" ? "Level confirmed by a skills assessment" : `Backed by ${String(skill.evidence_source || "").replace(/_/g, "")}`}>
                            <FiCheckCircle className="h-2.5 w-2.5" /> Verified
                          </span>
                        )}
                      </span>
                      <span className="text-xs capitalize text-gray-500">{skill.level}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100"><div className={`h-1.5 rounded-full ${LEVEL_BAR_CLASS[(skill.level || "").toLowerCase()] || "bg-gray-400 w-2/5"}`} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {languages?.length > 0 && (
            <div className={cardCls}>
              <h3 className={sectionTitle}><FiGlobe className="h-4 w-4 text-gray-500" /> Languages</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">{languages.map((lang) => <ProfileSkillChip key={lang.id} label={lang.name + (lang.proficiency_level ? ` (${lang.proficiency_level})` : "")} />)}</div>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          {experiences?.length > 0 && (
            <div className={cardCls}>
              <h3 className={sectionTitle}><FiBriefcase className="h-4 w-4 text-gray-500" /> Experience</h3>
              <div className="mt-4 space-y-5">
                {experiences.map((exp) => (
                  <div key={exp.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-gray-50 dark:bg-gray-25"><FiBriefcase className="h-4 w-4 text-gray-500" /></div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[13px] font-semibold text-ink">{exp.title}</h4>
                      <p className="text-[12px] text-gray-600">{exp.company}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500"><FiCalendar className="h-3 w-3" />{formatDateRange(exp.start_date, exp.end_date, exp.current_job)} {exp.location && <><FiMapPin className="ml-2 h-3 w-3" />{exp.location}</>}</p>
                      {exp.description && <p className="mt-1.5 text-[12px] leading-5 text-gray-600">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {educations?.length > 0 && (
            <div className={cardCls}>
              <h3 className={sectionTitle}><FiBook className="h-4 w-4 text-gray-500" /> Education</h3>
              <div className="mt-4 space-y-4">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-gray-50 dark:bg-gray-25"><FiBook className="h-4 w-4 text-gray-500" /></div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-semibold text-ink">{edu.degree}</h4>
                      <p className="text-[12px] text-gray-600">{edu.school} {edu.field_of_study && `• ${edu.field_of_study}`}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">{formatDateRange(edu.start_date, edu.end_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {projects?.length > 0 && (
            <div className={cardCls}>
              <h3 className={sectionTitle}><FiFolder className="h-4 w-4 text-gray-500" /> Projects</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-xl border border-line p-4 transition-colors hover:bg-gray-50">
                    <h4 className="text-[13px] font-semibold text-ink">{p.name}</h4>
                    <p className="mt-0.5 text-[11px] text-gray-500">{formatDateRange(p.start_date, p.end_date)}</p>
                    {p.description && <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-gray-600">{p.description}</p>}
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-ink hover:text-brand-text">View →</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {[
            { data: certifications, title: "Certifications", icon: FiAward },
            { data: awards, title: "Awards", icon: FiStar },
            { data: publications, title: "Publications", icon: FiFileText },
          ].map((section) => section.data?.length > 0 && (
            <div key={section.title} className={cardCls}>
              <h3 className={sectionTitle}><section.icon className="h-4 w-4 text-gray-500" />{section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.data.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium text-ink">{item.name || item.title}</p>
                    <p className="text-xs text-gray-500">{item.organization || item.publisher || ""} • {formatDate(item.issue_date || item.publication_date)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </OrgAppShell>
  );
}
