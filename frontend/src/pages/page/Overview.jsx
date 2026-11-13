// Page manager -> Overview.
//
// Deliberately not a CRM dashboard. There are no KPI tiles, no coloured icon
// boxes and no progress bar: those read as enterprise software, not like the
// rest of RecruAI. This is closer to a LinkedIn page — a cover, an identity
// block, and plain lists separated by hairlines.
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import { getCurrentUser, getBackendUrl, getAuthHeaders, getUploadUrl } from "../../utils/auth";
import {
  Briefcase,
  Mail,
  MapPin,
  Check,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

// Each item points at the section that fixes it.
const CHECKLIST = [
  { key: "profile_image", label: "Add a logo", to: "/page/profile", hint: "Pages with a logo get far more applications." },
  { key: "description", label: "Write a short description", to: "/page/profile", hint: "Say what the company does in a sentence or two." },
  { key: "industry", label: "Set your industry", to: "/page/profile", hint: "Candidates filter jobs on this." },
  { key: "contact_email", label: "Add a company email", to: "/page/profile", hint: "Applicants use this to reach you." },
  { key: "location", label: "Add your address", to: "/page/profile", hint: "Helps people judge whether they can apply." },
];

const SHORTCUTS = [
  { to: "/page/posts", label: "Post a job" },
  { to: "/page/candidates", label: "Browse candidates" },
  { to: "/page/interviews", label: "Interviews" },
  { to: "/page/team", label: "Invite teammates" },
];

export default function PageOverview() {
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user?.organization_id || cancelled) return;
      try {
        const res = await fetch(`${getBackendUrl()}/api/organizations/${user.organization_id}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok && !cancelled) setOrg(await res.json());
      } catch { /* non-fatal: the checklist just stays empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const done = CHECKLIST.filter((c) => org?.[c.key]).length;
  const allDone = done === CHECKLIST.length;
  const logo = org?.profile_image ? getUploadUrl(org.profile_image) : null;
  const cover = org?.banner_image ? getUploadUrl(org.banner_image) : null;

  return (
    <PageManagerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Cover + identity, the way a LinkedIn page opens */}
          <div className="bg-surface border border-line rounded-xl shadow-s5 overflow-hidden">
            {cover && <img src={cover} alt="" className="w-full h-36 object-cover" />}
            <div className="px-5 pb-5">
              <div className={cover ? "-mt-10" : "pt-5"}>
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover border-2 border-surface shadow-s5 bg-surface"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-50 border border-line dark:bg-gray-25 flex items-center justify-center shadow-s5">
                    <Briefcase className="h-6 w-6 text-gray-500" strokeWidth={1.75} />
                  </div>
                )}
                <h1 className="mt-3.5 text-xl font-bold text-ink tracking-tight">
                  {org?.name || "Your page"}
                </h1>
                <p className="mt-1 text-[13px] text-gray-500 font-mono">
                  {org ? (
                    org.slug ? `recruai.menteeai.org/org/${org.slug}` : "No custom address set"
                  ) : (
                    "Loading…"
                  )}
                </p>
                {org?.description && (
                  <p className="mt-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-600 line-clamp-3">
                    {org.description}
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate("/page/posts?new=1")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 shadow-s5 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" strokeWidth={1.75} /> Post a job
                </button>
                <Link
                  to="/page/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface text-ink text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5 transition-colors"
                >
                  Edit page
                </Link>
              </div>
            </div>
          </div>

          {org && !org.accepting_applications && (
            <section className="border border-amber-200 bg-amber-50 rounded-xl px-5 py-4 shadow-s5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <h2 className="text-[13.5px] font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                You're not accepting applications
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-400">
                Your listings stay visible, but candidates can't apply right now.
              </p>
              <button
                onClick={() => navigate("/page/visibility")}
                className="mt-2 text-[12.5px] font-semibold text-amber-800 dark:text-amber-400 underline underline-offset-2 hover:no-underline"
              >
                Turn it back on
              </button>
            </section>
          )}

          {/* Get started Checklist */}
          {!allDone && (
            <section className="bg-surface border border-line rounded-xl shadow-s5 overflow-hidden">
              <div className="px-5 pt-4 pb-2.5 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-ink">
                    Get started
                  </h2>
                  <p className="text-[11.5px] text-gray-500 mt-0.5">
                    Complete your setup to maximize applicant discovery.
                  </p>
                </div>
                <span className="text-xs font-medium font-mono tabular-nums text-gray-500 bg-gray-50 dark:bg-gray-25 px-2.5 py-1 rounded-lg border border-line">
                  {CHECKLIST.length - done} left
                </span>
              </div>
              <ul className="divide-y divide-line">
                {CHECKLIST.map((item) => {
                  const complete = Boolean(org?.[item.key]);
                  if (complete) return null;
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => navigate(item.to)}
                        className="w-full flex items-start gap-3.5 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors group"
                      >
                        <span className="mt-0.5 h-4 w-4 rounded-full border-2 border-line shrink-0 group-hover:border-brand transition-colors" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-ink group-hover:text-brand-text transition-colors">
                            {item.label}
                          </span>
                          <span className="block text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">
                            {item.hint}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-500 mt-1 shrink-0 group-hover:text-ink group-hover:translate-x-0.5 transition-all" strokeWidth={1.75} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {allDone && (
            <section className="bg-surface border border-line rounded-xl shadow-s5 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-brand-text" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-ink">
                    Your page is complete
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Keep it fresh as the company grows — candidates skim the profile first.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Side Column */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Shortcuts */}
          <section className="bg-surface border border-line rounded-xl shadow-s5 overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-[13px] font-semibold text-ink">
                Hiring shortcuts
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {SHORTCUTS.map((s) => (
                <li key={s.to}>
                  <button
                    onClick={() => navigate(s.to)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors group"
                  >
                    <span className="text-[13px] font-medium text-ink group-hover:text-brand-text transition-colors">
                      {s.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-500 shrink-0 group-hover:text-ink group-hover:translate-x-0.5 transition-all" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Page Completeness & Overview Info */}
          <section className="bg-surface border border-line rounded-xl shadow-s5 p-4 space-y-3">
            <h2 className="text-[13px] font-semibold text-ink">
              Profile health
            </h2>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} />
                <span className="text-gray-500">Industry:</span>
                <span className="ml-auto font-medium text-ink truncate max-w-[140px]">
                  {org?.industry || <span className="text-amber-600 dark:text-amber-400">Not set</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} />
                <span className="text-gray-500">Contact:</span>
                <span className="ml-auto font-medium text-ink truncate max-w-[140px]">
                  {org?.contact_email || <span className="text-amber-600 dark:text-amber-400">Not set</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} />
                <span className="text-gray-500">Address:</span>
                <span className="ml-auto font-medium text-ink truncate max-w-[140px]">
                  {org?.location || <span className="text-amber-600 dark:text-amber-400">Not set</span>}
                </span>
              </div>
            </div>
            {!allDone && (
              <div className="pt-2 border-t border-line">
                <Link
                  to="/page/profile"
                  className="text-[12px] font-semibold text-brand-text hover:text-brand-text inline-flex items-center gap-1 transition-colors"
                >
                  Complete your profile <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
              </div>
            )}
          </section>

          {/* Hiring tip */}
          <div className="bg-gray-50 border border-line rounded-xl shadow-s5 p-4 dark:bg-gray-25 text-[12px] leading-relaxed text-gray-600 dark:text-gray-500 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" strokeWidth={1.75} />
            <span>
              Pages with a logo, clear description, and address get noticeably more qualified candidate applications.
            </span>
          </div>
        </div>
      </div>
    </PageManagerLayout>
  );
}
