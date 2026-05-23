import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import {
  getSidebarItems,
  getBackendUrl,
  getUploadUrl,
  getAuthHeaders,
} from "../../utils/auth";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheck,
  FiX,
  FiLoader,
  FiStar,
  FiCalendar,
  FiBookOpen,
  FiMapPin,
  FiExternalLink,
  FiCode,
  FiAward,
  FiGlobe,
} from "react-icons/fi";

export default function CandidateAnalysis() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [orgId, setOrgId] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [compareError, setCompareError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!meRes.ok) throw new Error("Auth error");
        const meData = await meRes.json();
        setOrgId(meData.user?.organization_id);

        const profileRes = await fetch(
          `${getBackendUrl()}/api/recommendations/candidate/${userId}`,
          { credentials: "include", headers: getAuthHeaders() }
        );
        if (profileRes.ok) {
          setCandidate(await profileRes.json());
        } else {
          throw new Error("Candidate not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const loadJobs = useCallback(async () => {
    if (!orgId || jobsList.length > 0) return;
    setJobsLoading(true);
    try {
      const res = await fetch(
        `${getBackendUrl()}/api/organizations/${orgId}/posts`,
        { credentials: "include", headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setJobsList(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently fail
    } finally {
      setJobsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadJobs();
  }, [orgId, loadJobs]);

  const runCompare = useCallback(async () => {
    if (!selectedJobId) return;
    setComparing(true);
    setCompareError(null);
    setComparison(null);
    try {
      const res = await fetch(
        `${getBackendUrl()}/api/recommendations/compare`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ candidate_id: userId, job_id: selectedJobId }),
        }
      );
      if (res.ok) {
        setComparison(await res.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        setCompareError(errData.error || "Compare failed");
      }
    } catch {
      setCompareError("Network error. Try again.");
    } finally {
      setComparing(false);
    }
  }, [userId, selectedJobId]);

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-20">
          <div className="text-center animate-pulse">
            <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-gray-300" />
            <div className="text-gray-500">Loading candidate data...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !candidate) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="p-4 md:p-8">
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FiBriefcase size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Candidate Not Found</h3>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button
                onClick={() => navigate("/organization/hire")}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Hire People
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedJob = jobsList.find((j) => String(j.id) === String(selectedJobId));
  const matchPct = comparison ? comparison.comparison.skill_match_ratio * 100 : 0;

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/organization/hire")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiArrowLeft size={16} />
              Back to Hire People
            </button>
            <button
              onClick={() => navigate(`/organization/user/${userId}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FiExternalLink size={14} />
              View Full Profile
            </button>
          </div>

        {/* Profile Card */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-8">
            <div className="flex items-center gap-5">
              {candidate.profile_picture ? (
                <img
                  src={getUploadUrl(candidate.profile_picture)}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {(candidate.name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="text-white">
                <h1 className="text-2xl font-bold font-display">
                  {candidate.name || "Anonymous"}
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  {candidate.current_position || "No current position"}
                  {candidate.current_company && ` at ${candidate.current_company}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {candidate.employment_status && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {candidate.employment_status}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      <FiMapPin size={10} />
                      {candidate.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-6 py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {candidate.skills_count || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                Skills
              </div>
            </div>
            <div className="px-6 py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {candidate.experience_years ? `${candidate.experience_years}` : "—"}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                Years Exp
              </div>
            </div>
            <div className="px-6 py-4 text-center">
              <div className="text-sm font-bold text-gray-900 truncate px-2">
                {candidate.education_level || "—"}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                Education
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skills */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiStar size={14} className="text-yellow-500" />
              Skills
            </h2>
            {candidate.skills && candidate.skills.length > 0 ? (
              <div className="flex flex-wrap">
                {candidate.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mr-1.5 mb-1.5"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiStar size={16} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No skills listed yet</p>
              </div>
            )}
          </div>

          {/* Experience Timeline */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiCalendar size={14} className="text-purple-500" />
              Experience
            </h2>
            {candidate.experiences && candidate.experiences.length > 0 ? (
              <div className="space-y-4">
                {candidate.experiences.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      {i < candidate.experiences.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                      {exp.company && (
                        <div className="text-xs text-gray-500">{exp.company}</div>
                      )}
                      {exp.start_date && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(exp.start_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })}
                          {exp.end_date
                            ? ` — ${new Date(exp.end_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                              })}`
                            : " — Present"}
                        </div>
                      )}
                      {exp.description && (
                        <div className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiCalendar size={16} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No experience data</p>
              </div>
            )}
          </div>

          {/* Compare with Job */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiBriefcase size={14} className="text-blue-500" />
              Compare with Job
            </h2>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setComparison(null);
                setCompareError(null);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            >
              <option value="">Select a job posting...</option>
              {jobsLoading ? (
                <option disabled>Loading jobs...</option>
              ) : (
                jobsList.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={runCompare}
              disabled={!selectedJobId || comparing}
              className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {comparing ? (
                <FiLoader className="animate-spin" size={14} />
              ) : (
                <FiBriefcase size={14} />
              )}
              {comparing ? "Comparing..." : "Run Comparison"}
            </button>
            {candidate.education_level && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FiBookOpen size={12} />
                  <span>Education: <span className="font-medium text-gray-700">{candidate.education_level}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        {candidate.projects && candidate.projects.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiCode size={14} className="text-indigo-500" />
              Projects ({candidate.projects.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.projects.map((proj, i) => (
                <div key={i} className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">{proj.name}</div>
                  {proj.description && (
                    <p className="text-xs text-gray-500 mb-2">{proj.description}</p>
                  )}
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1">
                      {(typeof proj.technologies === 'string'
                        ? proj.technologies.split(',').map(t => t.trim())
                        : Array.isArray(proj.technologies)
                          ? proj.technologies
                          : []
                      ).filter(Boolean).map((tech, j) => (
                        <span key={j} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {candidate.certifications && candidate.certifications.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiAward size={14} className="text-yellow-600" />
              Certifications ({candidate.certifications.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {candidate.certifications.map((cert, i) => (
                <div key={i} className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{cert.name}</div>
                  {cert.issuer && (
                    <div className="text-xs text-gray-500 mt-0.5">{cert.issuer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {candidate.languages && candidate.languages.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiGlobe size={14} className="text-teal-500" />
              Languages ({candidate.languages.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {candidate.languages.map((lang, i) => (
                <div key={i} className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                  {lang.proficiency && (
                    <div className="text-xs text-gray-500 mt-0.5">{lang.proficiency}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {compareError && (
          <div className="rounded-2xl p-4 bg-red-50 border border-red-200 text-sm text-red-700">
            {compareError}
          </div>
        )}

        {comparison && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <FiBriefcase size={20} className="text-white" />
                <div>
                  <h2 className="text-white font-semibold">
                    {candidate.name} vs {selectedJob?.title || "Job"}
                  </h2>
                  <p className="text-blue-100 text-xs mt-0.5">Skills & experience comparison</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Skills Match Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Skills Match</span>
                  <span
                    className={`text-lg font-bold ${
                      matchPct >= 50 ? "text-green-600" : matchPct > 0 ? "text-yellow-600" : "text-red-600"
                    }`}
                  >
                    {matchPct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      matchPct >= 50 ? "bg-green-500" : matchPct > 0 ? "bg-yellow-500" : "bg-red-400"
                    }`}
                    style={{ width: `${matchPct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {comparison.comparison.total_required_skills} required skills
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched */}
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1.5">
                    <FiCheck size={16} />
                    Matched ({comparison.comparison.matched_skill_count})
                  </h3>
                  {comparison.comparison.skill_match.length > 0 ? (
                    <div className="flex flex-wrap">
                      {comparison.comparison.skill_match.map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-white text-green-700 border border-green-300 mr-1.5 mb-1.5"
                        >
                          <FiCheck size={12} className="mr-1" />
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600 italic">No skills matched</p>
                  )}
                </div>

                {/* Missing */}
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-1.5">
                    <FiX size={16} />
                    Missing ({comparison.comparison.missing_skill_count})
                  </h3>
                  {comparison.comparison.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap">
                      {comparison.comparison.missing_skills.map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-white text-red-700 border border-red-300 mr-1.5 mb-1.5"
                        >
                          <FiX size={12} className="mr-1" />
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 italic">All required skills matched!</p>
                  )}
                </div>
              </div>

              {/* Experience + Details row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Experience
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {comparison.comparison.candidate_experience_years}
                    </span>
                    <span className="text-sm text-gray-500">years</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Education
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {candidate.education_level || "Not specified"}
                  </div>
                </div>
              </div>

              {/* Job Description */}
              {comparison.job.description && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Job Description
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {comparison.job.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
