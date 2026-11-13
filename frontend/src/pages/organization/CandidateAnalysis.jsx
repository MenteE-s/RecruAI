import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBackendUrl,
  getUploadUrl,
  getAuthHeaders,
} from "../../utils/auth";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { ProfileSkillChip } from "../../components/profile/ProfileBits";
import EmptyState from "../../components/ui/EmptyState";
import {
  ArrowLeft,
  Briefcase,
  Check,
  X,
  Loader2,
  Star,
  Calendar,
  BookOpen,
  MapPin,
  ExternalLink,
  Code,
  Award,
  Globe,
} from "lucide-react";

const cardCls = "rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5";
const headingCls = "mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-600";

export default function CandidateAnalysis() {
  const { userId } = useParams();
  const navigate = useNavigate();

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
      if (!userId) {
        try {
          const meRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
          if (meRes.ok) setOrgId((await meRes.json()).user?.organization_id);
        } catch {}
        setLoading(false);
        return;
      }
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
    } finally {
      setJobsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <OrgAppShell>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-center">
            <div className="mx-auto mb-4 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-25" />
            <div className="text-sm text-gray-500 dark:text-gray-500">Loading candidate data…</div>
          </div>
        </div>
      </OrgAppShell>
    );
  }

  if (!userId) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
            <h1 className="text-[20px] font-semibold leading-7 text-ink">Candidate analysis</h1>
            <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-500">Select a candidate from Hire to see AI-powered skill comparison.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate("/org/hire")}>
              <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} /> Go to hire people
            </Button>
          </div>
          <EmptyState
            icon={Briefcase}
            title="No candidate selected"
            body="Go to hire people, search for a candidate, and click the briefcase icon to view their analysis. Or open /org/candidate-analysis/:userId directly."
            action={
              <Button variant="secondary" size="sm" onClick={() => navigate("/org/hire")}>
                Browse candidates
              </Button>
            }
          />
        </div>
      </OrgAppShell>
    );
  }

  if (error || !candidate) {
    return (
      <OrgAppShell>
        <div className="px-4 py-8">
          <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-6 shadow-s5">
            <EmptyState
              icon={Briefcase}
              title="Candidate not found"
              body={error || ""}
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate("/org/hire")}>
                  Back to hire people
                </Button>
              }
            />
          </div>
        </div>
      </OrgAppShell>
    );
  }

  const selectedJob = jobsList.find((j) => String(j.id) === String(selectedJobId));
  const matchPct = comparison ? comparison.comparison.skill_match_ratio * 100 : 0;

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 py-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate("/org/hire")}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-ink dark:text-gray-500 dark:hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to hire
            </button>
            <h1 className="mt-1 text-[20px] font-semibold leading-7 text-ink">Candidate analysis</h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-500">AI-powered comparison of candidate skills vs job requirements.</p>
          </div>
          <ButtonLink to={`/org/user/${userId}`} variant="secondary" size="sm" className="self-start md:self-auto">
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} /> View full profile
          </ButtonLink>
        </div>

        {/* Profile card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s5">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            {candidate.profile_picture ? (
              <img
                src={getUploadUrl(candidate.profile_picture)}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border-4 border-surface dark:border-line object-cover shadow-s5"
              />
            ) : (
              <Avatar name={candidate.name || "?"} size="3xl" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] font-semibold leading-7 text-ink">{candidate.name || "Anonymous"}</h2>
              <p className="mt-0.5 text-[13px] text-gray-600 dark:text-gray-500">
                {candidate.headline || candidate.current_position || "No current position"}
                {!candidate.headline && candidate.current_company && ` at ${candidate.current_company}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {candidate.employment_status && (
                  <span className="inline-flex items-center rounded-full border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-700">
                    {candidate.employment_status.charAt(0).toUpperCase() + candidate.employment_status.slice(1)}
                  </span>
                )}
                {candidate.location && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-700">
                    <MapPin className="h-3 w-3" strokeWidth={1.75} /> {candidate.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-line dark:divide-line border-t border-line dark:border-line">
            <div className="px-4 py-4 text-center">
              <div className="font-mono tabular-nums text-2xl font-bold text-ink">{candidate.skills_count || 0}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">Skills</div>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="font-mono tabular-nums text-2xl font-bold text-ink">
                {candidate.experience_years ? `${candidate.experience_years}` : "—"}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">Years experience</div>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="truncate px-2 text-sm font-bold text-ink">{candidate.education_level || "—"}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">Education</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Skills */}
          <div className={cardCls}>
            <h2 className={headingCls}>
              <Star className="h-3.5 w-3.5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} /> Skills
            </h2>
            {candidate.skills && candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, i) => (
                  <ProfileSkillChip key={i} label={skill} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-25">
                  <Star className="h-4 w-4 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">No skills listed yet</p>
              </div>
            )}
          </div>

          {/* Experience */}
          <div className={cardCls}>
            <h2 className={headingCls}>
              <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} /> Experience
            </h2>
            {candidate.experiences && candidate.experiences.length > 0 ? (
              <div className="space-y-4">
                {candidate.experiences.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-brand" />
                      {i < candidate.experiences.length - 1 && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-50" />}
                    </div>
                    <div className="pb-4">
                      <div className="text-sm font-medium text-ink">{exp.title}</div>
                      {exp.company && <div className="text-xs text-gray-500 dark:text-gray-500">{exp.company}</div>}
                      {exp.start_date && (
                        <div className="mt-1 font-mono tabular-nums text-xs text-gray-500 dark:text-gray-500">
                          {new Date(exp.start_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                          {exp.end_date
                            ? ` — ${new Date(exp.end_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}`
                            : " — Present"}
                        </div>
                      )}
                      {exp.description && (
                        <div className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-500">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-25">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">No experience data</p>
              </div>
            )}
          </div>

          {/* Compare */}
          <div className={cardCls}>
            <h2 className={headingCls}>
              <Briefcase className="h-3.5 w-3.5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} /> Compare with job posting
            </h2>
            <select
              aria-label="Compare with job posting"
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setComparison(null);
                setCompareError(null);
              }}
              className="mb-3 h-9 w-full rounded-lg border border-line dark:border-line bg-surface dark:bg-gray-900/60 px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/10"
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
            <Button
              variant="dark"
              className="flex w-full items-center justify-center gap-2"
              onClick={runCompare}
              disabled={!selectedJobId || comparing}
            >
              {comparing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              {comparing ? "Comparing…" : "Run comparison"}
            </Button>
            {candidate.education_level && (
              <div className="mt-4 border-t border-line dark:border-line pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Education: <span className="font-medium text-ink">{candidate.education_level}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        {candidate.projects && candidate.projects.length > 0 && (
          <div className={cardCls}>
            <h2 className={headingCls}>
              <Code className="h-3.5 w-3.5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} /> Projects (<span className="font-mono tabular-nums">{candidate.projects.length}</span>)
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {candidate.projects.map((proj, i) => (
                <div key={i} className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4">
                  <div className="mb-1 text-sm font-semibold text-ink">{proj.name}</div>
                  {proj.description && <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">{proj.description}</p>}
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1">
                      {(typeof proj.technologies === 'string'
                        ? proj.technologies.split(',').map(t => t.trim())
                        : Array.isArray(proj.technologies)
                          ? proj.technologies
                          : []
                      ).filter(Boolean).map((tech, j) => (
                        <span key={j} className="inline-flex rounded-lg border border-line dark:border-line bg-surface dark:bg-gray-25 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-700">
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
          <div className={cardCls}>
            <h2 className={headingCls}>
              <Award className="h-3.5 w-3.5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} /> Certifications (<span className="font-mono tabular-nums">{candidate.certifications.length}</span>)
            </h2>
            <div className="flex flex-wrap gap-2">
              {candidate.certifications.map((cert, i) => (
                <div key={i} className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-4 py-3">
                  <div className="text-sm font-medium text-ink">{cert.name}</div>
                  {cert.issuer && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{cert.issuer}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {candidate.languages && candidate.languages.length > 0 && (
          <div className={cardCls}>
            <h2 className={headingCls}>
              <Globe className="h-3.5 w-3.5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} /> Languages (<span className="font-mono tabular-nums">{candidate.languages.length}</span>)
            </h2>
            <div className="flex flex-wrap gap-2">
              {candidate.languages.map((lang, i) => (
                <div key={i} className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-4 py-3">
                  <div className="text-sm font-medium text-ink">{lang.name}</div>
                  {lang.proficiency && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{lang.proficiency}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison error */}
        {compareError && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
            {compareError}
          </div>
        )}

        {/* Comparison results */}
        {comparison && (
          <div className="overflow-hidden rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s5">
            <div className="border-b border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-5 py-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                <div>
                  <h2 className="font-semibold text-ink">{candidate.name} vs {selectedJob?.title || "Job"}</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">Skills and experience comparison</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-700">Skills match</span>
                  <span className={`font-mono tabular-nums text-lg font-bold ${matchPct >= 50 ? "text-brand-text" : matchPct > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                    {matchPct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-25">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${matchPct >= 50 ? "bg-brand" : matchPct > 0 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${matchPct}%` }}
                  />
                </div>
                <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                  <span className="font-mono tabular-nums">{comparison.comparison.total_required_skills}</span> required skills
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-brand/20 bg-brand/5 dark:bg-brand/10 p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-brand-text">
                    <Check className="h-4 w-4" strokeWidth={1.75} /> Matched (<span className="font-mono tabular-nums">{comparison.comparison.matched_skill_count}</span>)
                  </h3>
                  {comparison.comparison.skill_match.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {comparison.comparison.skill_match.map((s, i) => (
                        <span key={i} className="inline-flex items-center rounded-lg border border-brand/20 bg-surface dark:bg-gray-25 px-2.5 py-1 text-xs font-medium text-brand-text">
                          <Check className="mr-1 h-3 w-3" strokeWidth={1.75} /> {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-500 dark:text-gray-500">No skills matched</p>
                  )}
                </div>

                <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-red-800 dark:text-red-400">
                    <X className="h-4 w-4" strokeWidth={1.75} /> Missing (<span className="font-mono tabular-nums">{comparison.comparison.missing_skill_count}</span>)
                  </h3>
                  {comparison.comparison.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {comparison.comparison.missing_skills.map((s, i) => (
                        <span key={i} className="inline-flex items-center rounded-lg border border-red-200 dark:border-red-500/30 bg-surface dark:bg-gray-25 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300">
                          <X className="mr-1 h-3 w-3" strokeWidth={1.75} /> {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-500 dark:text-gray-500">All required skills matched!</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4">
                  <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-500">Experience</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono tabular-nums text-2xl font-bold text-ink">{comparison.comparison.candidate_experience_years}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-500">years</span>
                  </div>
                </div>
                <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4">
                  <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-500">Education</div>
                  <div className="text-sm font-medium text-ink">{candidate.education_level || "Not specified"}</div>
                </div>
              </div>

              {comparison.job.description && (
                <div className="border-t border-line dark:border-line pt-4">
                  <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-500">Job description</div>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-500">{comparison.job.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OrgAppShell>
  );
}
