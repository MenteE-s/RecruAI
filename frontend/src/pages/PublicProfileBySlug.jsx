// Public profile at /in/<slug>.
//
// Reachable signed out — a slug is meant to be pasted into an email or a
// business card. Signed-in viewers get the normal app shell; anonymous
// visitors get the small public shell. The API deliberately omits email,
// phone, organization ownership, plan and subscription state. The public
// surface renders only fields the public DTO provides.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Edit2,
  FileText,
  Folder,
  Globe,
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import { FiLinkedin } from "react-icons/fi";
import { AppShell } from "../components/layout/AppShell";
import { RailSection } from "../components/layout/RightRail";
import { Button, ButtonLink } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import MenteeLoader from "../components/ui/MenteeLoader";
import {
  ProfileHero,
  ProfileTopBar,
  ExperienceRow,
  ProjectCard,
  ProfileSkillChip,
} from "../components/profile/ProfileBits";
import { ProfileSection } from "../components/profile/ProfileSection";
import {
  getBackendUrl,
  getCurrentUser,
  getUploadUrl,
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

function PublicHeader() {
  const isAuth = typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true";

  return (
    <header className="border-b border-line dark:border-line bg-surface dark:bg-gray-25">
      <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/mentee-logo.png"
            alt="RecruAI"
            className="h-6 w-6 rounded-md object-contain"
          />
          <span className="text-sm font-bold tracking-tight text-brand-text dark:text-brand-400">RecruAI</span>
        </Link>
        {!isAuth ? (
          <Link
            to="/signin"
            className="text-xs font-semibold text-ink dark:text-gray-800 hover:text-brand-text dark:hover:text-brand-400"
          >
            Sign in
          </Link>
        ) : (
          <Link
            to="/feed"
            className="text-xs font-semibold text-ink dark:text-gray-800 hover:text-brand-text dark:hover:text-brand-400"
          >
            Dashboard
          </Link>
        )}
      </div>
    </header>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <ProfileSection>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
        <span className="text-gray-500 dark:text-gray-500">
          <Icon aria-hidden className="h-4 w-4 stroke-[1.75]" />
        </span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </ProfileSection>
  );
}

export default function PublicProfileBySlug() {
  const { slug } = useParams();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <MenteeLoader size={72} text="Loading profile…" />
      </div>
    );
  }

  const isAuthedViewer =
    Boolean(viewer) ||
    (typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true");

  if (loadError) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        {!isAuthedViewer && <PublicHeader />}
        <div className="mx-auto max-w-xl px-4 py-12">
          <EmptyState
            icon={AlertTriangle}
            title="Could not load this profile"
            body="Check your connection and try again."
            action={
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (notFound || !data?.user) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        {!isAuthedViewer && <PublicHeader />}
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-4 py-12">
          <div className="rounded-2xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-8 text-center shadow-s5">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-25 dark:text-gray-600">
              <AlertTriangle className="h-6 w-6 stroke-[1.75]" />
            </span>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-600">404</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink dark:text-white">This profile isn&rsquo;t here</h1>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-600">
              No RecruAI profile matches <span className="font-mono font-medium text-ink dark:text-gray-800">/{slug}</span>. The link may be
              mistyped, or the profile may have been made private — either way, it isn't public right now.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
              <ButtonLink to={isAuthedViewer ? "/feed" : "/register"} variant="primary" size="sm">
                {isAuthedViewer ? "Back to feed" : "Create your profile"}
              </ButtonLink>
              <ButtonLink to={isAuthedViewer ? "/in/jobs" : "/"} variant="secondary" size="sm">
                {isAuthedViewer ? "Browse jobs" : "Explore RecruAI"}
              </ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-line dark:border-line pt-5 text-[11.5px] text-gray-500 dark:text-gray-600">
              <Link to={isAuthedViewer ? "/in/network" : "/"} className="font-medium hover:text-ink dark:hover:text-white">
                Find people
              </Link>
              <span aria-hidden>•</span>
              <Link to="/status" className="font-medium hover:text-ink dark:hover:text-white">
                System status
              </Link>
              <span aria-hidden>•</span>
              <Link to="/contact" className="font-medium hover:text-ink dark:hover:text-white">
                Contact support
              </Link>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500">
              Looking for your own page? Sign in to open your dashboard, or create an
              account to publish a profile that recruiters can find.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const u = data.user;
  const avatar = u.profile_picture ? getUploadUrl(u.profile_picture) : null;
  const banner = u.banner ? getUploadUrl(u.banner) : null;
  const firstName = (u.name || "").trim().split(/\s+/)[0] || "This member";
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

  const heroMeta = (
    <>
      {u.current_position && (
        <span className="inline-flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5 stroke-[1.75]" />
          {u.current_position}
          {u.current_company && ` at ${u.current_company}`}
        </span>
      )}
      {u.location && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 stroke-[1.75]" />
          {u.location}
        </span>
      )}
      {u.created_at && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 stroke-[1.75]" />
          Member since {formatMonthYear(u.created_at)}
        </span>
      )}
      {u.website && (
        <a href={externalUrl(u.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white">
          <Globe className="h-3.5 w-3.5 stroke-[1.75]" /> Website
        </a>
      )}
      {u.linkedin && (
        <a href={externalUrl(u.linkedin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white">
          <FiLinkedin className="h-3.5 w-3.5" /> LinkedIn
        </a>
      )}
      {socialLinks.slice(0, 6).map((link) => (
        <a key={link.id} href={externalUrl(link.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white">
          <Globe className="h-3.5 w-3.5 stroke-[1.75]" /> {link.platform}
        </a>
      ))}
    </>
  );

  const profileContent = (
    <>
      {banner && (
        <div className="mx-4 mt-4 overflow-hidden rounded-xl border border-line dark:border-line bg-gray-900">
          <img src={banner} alt={`${u.name || "Member"} banner`} className="h-28 w-full object-cover" />
        </div>
      )}

      <ProfileHero
        avatar={
          avatar ? (
            <img src={avatar} alt={u.name || "Profile"} className="h-24 w-24 rounded-full border-4 border-surface dark:border-line object-cover shadow-s5" />
          ) : (
            <Avatar name={u.name || "Member"} size="3xl" />
          )
        }
        name={u.name || "RecruAI member"}
        headline={u.headline}
        meta={heroMeta}
        skills={skills.map((s) => s.name).filter(Boolean)}
      />

      <div className="px-4 pb-4 pt-4">
        {data.is_discoverable === false && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.75] text-amber-600 dark:text-amber-400" />
            <span>
              {firstName} has turned off search visibility, so this profile
              won&rsquo;t appear in search results. The link still works.
            </span>
          </div>
        )}

        <div className="space-y-3">
          {aboutText && (
            <SectionCard icon={FileText} title="About">
              <p className="whitespace-pre-line text-xs sm:text-[13px] leading-relaxed text-ink dark:text-gray-800">{aboutText}</p>
            </SectionCard>
          )}

          {experiences.length > 0 && (
            <SectionCard icon={Briefcase} title="Experience">
              <div className="divide-y divide-line dark:divide-line">
                {experiences.map((exp) => (
                  <ExperienceRow
                    key={exp.id}
                    role={exp.title}
                    company={exp.company}
                    period={formatRange(exp.start_date, exp.end_date, exp.current_job)}
                    location={exp.location}
                    summary={exp.description}
                    verified={false}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {educations.length > 0 && (
            <SectionCard icon={BookOpen} title="Education">
              <div className="divide-y divide-line dark:divide-line">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex gap-3 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 font-mono text-[10px] font-bold uppercase text-gray-600 dark:text-gray-700">
                      {edu.school ? edu.school.slice(0, 2) : "ED"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink dark:text-white">{edu.degree}</p>
                      <p className="truncate text-xs text-gray-600 dark:text-gray-700">
                        {edu.school}{edu.field ? ` · ${edu.field}` : ""}
                      </p>
                      {(formatRange(edu.start_date, edu.end_date) || edu.year) && (
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-600">
                          {formatRange(edu.start_date, edu.end_date) || edu.year}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {projects.length > 0 && (
            <SectionCard icon={Folder} title="Projects">
              <div className="divide-y divide-line dark:divide-line">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.name}
                    tagline={project.description || project.tagline}
                    counts={
                      <>
                        {project.github_url && (
                          <a href={externalUrl(project.github_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand-text dark:text-gray-800 dark:hover:text-brand-400">
                            Code
                          </a>
                        )}
                        {project.demo_url && (
                          <a href={externalUrl(project.demo_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand-text dark:text-gray-800 dark:hover:text-brand-400">
                            Demo
                          </a>
                        )}
                        {project.technologies?.length > 0 && (
                          <span className="truncate">{project.technologies.join(" · ")}</span>
                        )}
                      </>
                    }
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {certifications.length > 0 && (
            <SectionCard icon={Award} title="Certifications">
              <div className="divide-y divide-line dark:divide-line">
                {certifications.map((certification) => (
                  <div key={certification.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-ink dark:text-white">{certification.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-600">
                      {certification.issuer}
                      {certification.date_obtained ? ` · ${formatMonthYear(certification.date_obtained)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {awards.length > 0 && (
            <SectionCard icon={Star} title="Awards">
              <div className="divide-y divide-line dark:divide-line">
                {awards.map((award) => (
                  <div key={award.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-ink dark:text-white">{award.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-600">
                      {award.issuer}{award.date ? ` · ${formatMonthYear(award.date)}` : ""}
                    </p>
                    {award.description && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-700">{award.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {publications.length > 0 && (
            <SectionCard icon={FileText} title="Publications">
              <div className="divide-y divide-line dark:divide-line">
                {publications.map((publication) => (
                  <div key={publication.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-ink dark:text-white">{publication.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-600">
                      {publication.journal}{publication.journal && publication.year ? " · " : ""}{publication.year || ""}
                    </p>
                    {publication.authors?.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-600">{publication.authors.join(", ")}</p>
                    )}
                    {publication.publication_url && (
                      <a href={externalUrl(publication.publication_url)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[11px] font-semibold text-ink hover:text-brand-text dark:text-gray-800 dark:hover:text-brand-400">
                        View publication
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {languages.length > 0 && (
            <SectionCard icon={Globe} title="Languages">
              <div className="flex flex-wrap gap-1.5">
                {languages.map((language) => (
                  <ProfileSkillChip key={language.id} label={language.name + (language.proficiency_level ? ` · ${language.proficiency_level}` : "")} />
                ))}
              </div>
            </SectionCard>
          )}

          {volunteerExperiences.length > 0 && (
            <SectionCard icon={Heart} title="Volunteering">
              <div className="divide-y divide-line dark:divide-line">
                {volunteerExperiences.map((volunteer) => (
                  <div key={volunteer.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-ink dark:text-white">{volunteer.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-700">{volunteer.organization}</p>
                    {formatRange(volunteer.start_date, volunteer.end_date) && (
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-600">{formatRange(volunteer.start_date, volunteer.end_date)}</p>
                    )}
                    {volunteer.description && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-700">{volunteer.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {!hasProfileContent && (
            <EmptyState
              icon={Briefcase}
              title={`${firstName} hasn't added profile details yet.`}
              body="Experience, education, skills, and projects will appear here once they add them."
              action={
                isOwner ? (
                  <ButtonLink to="/in/profile" variant="secondary" size="sm">
                    <Edit2 className="h-3.5 w-3.5 stroke-[1.75]" /> Complete your profile
                  </ButtonLink>
                ) : null
              }
            />
          )}
        </div>
      </div>
    </>
  );

  if (isAuthedViewer) {
    return (
      <AppShell rail={<RailSection />}>
        <ProfileTopBar
          backTo={isAuthedViewer ? "/feed" : "/"}
          backLabel={isAuthedViewer ? "Back to dashboard" : "Back"}
          avatar={avatar ? <img src={avatar} alt={u.name || "Profile"} className="h-8 w-8 rounded-full border border-line dark:border-line object-cover" /> : <Avatar name={u.name || "Member"} size="sm" />}
          title={u.name || "Profile"}
          subtitle={`@${u.slug || slug}`}
          actions={
            isOwner ? (
              <ButtonLink to="/in/profile" variant="secondary" size="sm">
                <Edit2 className="h-3.5 w-3.5 stroke-[1.75]" /> Edit my profile
              </ButtonLink>
            ) : null
          }
        />
        {profileContent}
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PublicHeader />
      <main className="mx-auto max-w-[640px] px-4 py-4">
        {profileContent}
      </main>
    </div>
  );
}
