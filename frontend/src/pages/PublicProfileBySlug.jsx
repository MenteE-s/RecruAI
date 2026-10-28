// Public profile at /in/<slug>.
//
// Reachable signed out — a slug is meant to be pasted into an email or a
// business card. Signed-in viewers get the normal app header; anonymous
// visitors get the small public header. The API deliberately omits email,
// phone, organization ownership, plan and subscription state.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle, FiArrowLeft, FiAward, FiBookOpen, FiBriefcase,
  FiCalendar, FiCheckCircle, FiCode, FiEdit2, FiFileText, FiFolder,
  FiGlobe, FiHeart, FiLinkedin, FiMapPin, FiStar,
} from "react-icons/fi";
import DashboardLayout from "../components/layout/DashboardLayout";
import EmploymentBadge from "../components/ui/EmploymentStatus";
import MenteeLoader from "../components/ui/MenteeLoader";
import {
  getBackendUrl, getCurrentUser, getUploadUrl,
} from "../utils/auth";

function formatMonthYear(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatRange(start, end, current = false) {
  const from = formatMonthYear(start);
  const to = current ? "Present" : formatMonthYear(end);
  if (from && to) return `${from} – ${to}`;
  return from || to || "";
}

function externalUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function aboutTextFor(about) {
  if (!about) return "";
  if (typeof about === "string") return about.trim();
  const value = about.content || about.summary || about.text || "";
  return typeof value === "string" ? value.trim() : "";
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-blue-700" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/mentee-logo.png"
            alt="RecruAI"
            className="h-6 w-6 rounded-md object-contain"
          />
          <span className="text-sm font-extrabold tracking-tight text-blue-700">
            RecruAI
          </span>
        </Link>
        <Link
          to="/signin"
          className="text-[12.5px] font-semibold text-blue-700 hover:text-blue-800"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

function ProfileShell({ viewer, children }) {
  if (viewer) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl py-1">{children}</div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}

export default function PublicProfileBySlug() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setLoadError(false);

    const profileRequest = fetch(
      `${getBackendUrl()}/api/in/${encodeURIComponent(slug || "")}`,
      { credentials: "include" }
    ).then(async (response) => {
      if (response.status === 404) return { missing: true };
      if (!response.ok) throw new Error("failed");
      return { payload: await response.json() };
    });

    Promise.allSettled([profileRequest, getCurrentUser()])
      .then(([profileResult, viewerResult]) => {
        if (cancelled) return;
        if (viewerResult.status === "fulfilled") {
          setViewer(viewerResult.value || null);
        }
        if (profileResult.status === "rejected") {
          setLoadError(true);
          return;
        }
        if (profileResult.value?.missing) {
          setNotFound(true);
          return;
        }
        setData(profileResult.value?.payload || null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  const handleBack = () => {
    const cameFromApp =
      typeof document !== "undefined" &&
      document.referrer.startsWith(window.location.origin);
    if (cameFromApp) {
      navigate(-1);
    } else {
      navigate(viewer ? "/feed" : "/");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <MenteeLoader size={72} text="Loading profile…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ProfileShell viewer={viewer}>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            Could not load this profile
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      </ProfileShell>
    );
  }

  if (notFound || !data?.user) {
    return (
      <ProfileShell viewer={viewer}>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Profile not found</p>
          <p className="mt-1 text-xs text-gray-500">
            No one on RecruAI uses{" "}
            <span className="font-semibold">/{slug}</span>.
          </p>
          <Link
            to={viewer ? "/feed" : "/"}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            {viewer ? "Back to dashboard" : "Go to RecruAI"}
          </Link>
        </div>
      </ProfileShell>
    );
  }

  const u = data.user;
  const avatar = u.profile_picture ? getUploadUrl(u.profile_picture) : null;
  const banner = u.banner ? getUploadUrl(u.banner) : null;
  const firstName =
    (u.name || "").trim().split(/\s+/)[0] || "This member";
  const isOwner = Boolean(viewer && String(viewer.id) === String(u.id));

  const experiences = u.experiences || [];
  const educations = u.educations || [];
  const skills = u.skills || [];
  const projects = u.projects || [];
  const certifications = u.certifications || [];
  const awards = u.awards || [];
  const publications = u.publications || [];
  const languages = u.languages || [];
  const volunteerExperiences = u.volunteer_experiences || [];
  const socialLinks = u.social_media_links || [];
  const aboutText = aboutTextFor(u.about);

  const hasProfileContent =
    Boolean(aboutText) ||
    experiences.length > 0 ||
    educations.length > 0 ||
    skills.length > 0 ||
    projects.length > 0 ||
    certifications.length > 0 ||
    awards.length > 0 ||
    publications.length > 0 ||
    languages.length > 0 ||
    volunteerExperiences.length > 0;

  return (
    <ProfileShell viewer={viewer}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="h-4 w-4" />
          {viewer ? "Back to dashboard" : "Back"}
        </button>
        {isOwner && (
          <Link
            to="/in/profile"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
            Edit my profile
          </Link>
        )}
      </div>

      {/* Identity card */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="relative h-36 bg-gray-900">
          {banner ? (
            <img
              src={banner}
              alt={`${u.name || "Member"} banner`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          )}
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={u.name || "Profile"}
                className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-2xl font-bold text-gray-600 shadow">
                {(u.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {u.name || "RecruAI member"}
              </h1>
              <EmploymentBadge status={u.employment_status} />
            </div>
            {u.headline && (
              <p className="mt-1 text-sm leading-snug text-gray-700">
                {u.headline}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">/in/{u.slug || slug}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
              {u.current_position && (
                <span className="inline-flex items-center gap-1.5">
                  <FiBriefcase className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {u.current_position}
                  {u.current_company && ` at ${u.current_company}`}
                </span>
              )}
              {u.location && (
                <span className="inline-flex items-center gap-1.5">
                  <FiMapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {u.location}
                </span>
              )}
              {u.created_at && (
                <span className="inline-flex items-center gap-1.5">
                  <FiCalendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  Member since {formatMonthYear(u.created_at)}
                </span>
              )}
            </div>

            {(u.website || u.linkedin || socialLinks.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {u.website && (
                  <a
                    href={externalUrl(u.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <FiGlobe className="h-3 w-3" />
                    Website
                  </a>
                )}
                {u.linkedin && (
                  <a
                    href={externalUrl(u.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <FiLinkedin className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
                {socialLinks.slice(0, 6).map((link) => (
                  <a
                    key={link.id}
                    href={externalUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <FiGlobe className="h-3 w-3" />
                    {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 space-y-4">
        {data.is_discoverable === false && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-900">
            <FiAlertTriangle className="mt-px h-4 w-4 shrink-0 text-amber-600" />
            <span>
              {firstName} has turned off search visibility, so this profile
              won&rsquo;t appear in search results. The link still works.
            </span>
          </div>
        )}

        {aboutText && (
          <SectionCard icon={FiFileText} title="About">
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {aboutText}
            </p>
          </SectionCard>
        )}

        {experiences.length > 0 && (
          <SectionCard icon={FiBriefcase} title="Experience">
            <div className="space-y-5">
              {experiences.map((exp) => {
                const range = formatRange(
                  exp.start_date,
                  exp.end_date,
                  exp.current_job
                );
                return (
                  <div key={exp.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                      <FiBriefcase className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {exp.title}
                      </p>
                      <p className="text-sm text-blue-700">{exp.company}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        {range && (
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar className="h-3 w-3" />
                            {range}
                          </span>
                        )}
                        {exp.location && (
                          <span className="inline-flex items-center gap-1">
                            <FiMapPin className="h-3 w-3" />
                            {exp.location}
                          </span>
                        )}
                        {exp.employment_type && <span>{exp.employment_type}</span>}
                      </p>
                      {exp.description && (
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {educations.length > 0 && (
          <SectionCard icon={FiBookOpen} title="Education">
            <div className="space-y-4">
              {educations.map((edu) => {
                const range =
                  formatRange(edu.start_date, edu.end_date) || edu.year || "";
                return (
                  <div key={edu.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                      <FiBookOpen className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {edu.degree}
                      </p>
                      <p className="text-sm text-gray-700">
                        {edu.school}
                        {edu.field ? ` · ${edu.field}` : ""}
                      </p>
                      {range && (
                        <p className="mt-1 text-xs text-gray-500">{range}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {skills.length > 0 && (
          <SectionCard icon={FiCode} title="Skills">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-800"
                >
                  {skill.name}
                  {skill.level && (
                    <span className="text-[10px] font-normal text-gray-400">
                      {skill.level}
                    </span>
                  )}
                  {skill.verified && (
                    <FiCheckCircle className="h-3 w-3 text-blue-700" />
                  )}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {projects.length > 0 && (
          <SectionCard icon={FiFolder} title="Projects">
            <div className="space-y-3">
              {projects.map((project) => {
                const range = formatRange(
                  project.start_date,
                  project.end_date
                );
                return (
                  <div
                    key={project.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.name}
                        </p>
                        {range && (
                          <p className="mt-0.5 text-xs text-gray-500">{range}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {project.github_url && (
                          <a
                            href={externalUrl(project.github_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Code
                          </a>
                        )}
                        {project.demo_url && (
                          <a
                            href={externalUrl(project.demo_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Demo
                          </a>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                        {project.description}
                      </p>
                    )}
                    {project.technologies?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {certifications.length > 0 && (
          <SectionCard icon={FiAward} title="Certifications">
            <div className="space-y-3">
              {certifications.map((certification) => (
                <div key={certification.id}>
                  <p className="text-sm font-medium text-gray-900">
                    {certification.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {certification.issuer}
                    {certification.date_obtained
                      ? ` · ${formatMonthYear(certification.date_obtained)}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {awards.length > 0 && (
          <SectionCard icon={FiStar} title="Awards">
            <div className="space-y-3">
              {awards.map((award) => (
                <div key={award.id}>
                  <p className="text-sm font-medium text-gray-900">
                    {award.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {award.issuer}
                    {award.date ? ` · ${formatMonthYear(award.date)}` : ""}
                  </p>
                  {award.description && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {award.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {publications.length > 0 && (
          <SectionCard icon={FiFileText} title="Publications">
            <div className="space-y-3">
              {publications.map((publication) => (
                <div key={publication.id}>
                  <p className="text-sm font-medium text-gray-900">
                    {publication.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {publication.journal}
                    {publication.journal && publication.year ? " · " : ""}
                    {publication.year || ""}
                  </p>
                  {publication.authors?.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {publication.authors.join(", ")}
                    </p>
                  )}
                  {publication.publication_url && (
                    <a
                      href={externalUrl(publication.publication_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[11px] font-semibold text-blue-700 hover:text-blue-800"
                    >
                      View publication
                    </a>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {languages.length > 0 && (
          <SectionCard icon={FiGlobe} title="Languages">
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language.id}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  {language.name}
                  {language.proficiency_level
                    ? ` · ${language.proficiency_level}`
                    : ""}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {volunteerExperiences.length > 0 && (
          <SectionCard icon={FiHeart} title="Volunteering">
            <div className="space-y-4">
              {volunteerExperiences.map((volunteer) => {
                const range = formatRange(
                  volunteer.start_date,
                  volunteer.end_date
                );
                return (
                  <div key={volunteer.id}>
                    <p className="text-sm font-semibold text-gray-900">
                      {volunteer.title}
                    </p>
                    <p className="text-sm text-gray-700">
                      {volunteer.organization}
                    </p>
                    {range && (
                      <p className="mt-1 text-xs text-gray-500">{range}</p>
                    )}
                    {volunteer.description && (
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {volunteer.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {!hasProfileContent && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center">
            <p className="text-sm font-semibold text-gray-900">
              {firstName} hasn&rsquo;t added profile details yet.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Experience, education, skills, and projects will appear here once
              they add them.
            </p>
            {isOwner && (
              <Link
                to="/in/profile"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                <FiEdit2 className="h-3.5 w-3.5" />
                Complete your profile
              </Link>
            )}
          </div>
        )}
      </div>
    </ProfileShell>
  );
}
