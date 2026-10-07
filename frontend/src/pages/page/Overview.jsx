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
  FiBriefcase, FiMail, FiMapPin, FiCheck, FiAlertTriangle,
  FiArrowRight, FiPlusCircle, FiGlobe,
} from "react-icons/fi";

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
      <div className="max-w-2xl">
        {/* Cover + identity, the way a LinkedIn page opens */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {cover && <img src={cover} alt="" className="w-full h-32 object-cover" />}
          <div className="px-5 pb-4">
            <div className={cover ? "-mt-10" : "pt-5"}>
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200" />
              )}
              <h1 className="mt-3 text-xl font-semibold text-gray-900 tracking-tight">
                {org?.name || "Your page"}
              </h1>
              <p className="mt-0.5 text-[13px] text-gray-500">
                {org ? (
                  <>{org.slug && `recruai.menteeai.org/org/${org.slug}`}</>
                ) : (
                  "Loading…"
                )}
              </p>
              {org?.description && (
                <p className="mt-2.5 text-[13px] leading-relaxed text-gray-700 line-clamp-2">
                  {org.description}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/page/posts?new=1")}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <FiPlusCircle className="w-3.5 h-3.5" /> Post a job
              </button>
              <Link
                to="/page/profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit page
              </Link>
              {org?.slug && (
                <Link
                  to={`/org/${org.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiGlobe className="w-3.5 h-3.5" /> View public page
                </Link>
              )}
            </div>
          </div>
        </div>

        {!allDone && (
          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-gray-500">
            <FiAlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-gray-400" />
            <span>
              Pages with a logo and a description get noticeably more applications.
            </span>
          </p>
        )}

        {/* Get started — a plain list, no progress bar or counters */}
        {!allDone && (
          <section className="mt-4 bg-white border border-gray-200 rounded-lg">
            <h2 className="px-5 pt-4 pb-1 text-[15px] font-semibold text-gray-900">
              Get started
            </h2>
            <ul className="pb-1">
              {CHECKLIST.map((item) => {
                const complete = Boolean(org?.[item.key]);
                if (complete) return null;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => navigate(item.to)}
                      className="w-full flex items-start gap-3 px-5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium text-gray-900">
                          {item.label}
                        </span>
                        <span className="block text-[12px] text-gray-500 mt-0.5">
                          {item.hint}
                        </span>
                      </span>
                      <FiArrowRight className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-gray-100 px-5 py-2.5 text-[12px] text-gray-400">
              {CHECKLIST.length - done} left to complete
            </p>
          </section>
        )}

        {allDone && (
          <section className="mt-4 bg-white border border-gray-200 rounded-lg px-5 py-4">
            <p className="flex items-center gap-2 text-[13.5px] font-medium text-gray-900">
              <FiCheck className="w-4 h-4 text-green-600" />
              Your page is complete
            </p>
            <p className="mt-1 text-[12.5px] text-gray-500">
              Keep it fresh as the company grows — candidates skim the profile first.
            </p>
          </section>
        )}

        {/* Shortcuts — text links, the way LinkedIn lists sidebar nav */}
        <section className="mt-4 bg-white border border-gray-200 rounded-lg">
          <h2 className="px-5 pt-4 pb-1 text-[15px] font-semibold text-gray-900">
            Hiring
          </h2>
          <ul className="pb-1">
            {SHORTCUTS.map((s) => (
              <li key={s.to}>
                <button
                  onClick={() => navigate(s.to)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[13.5px] font-medium text-gray-900">{s.label}</span>
                  <FiArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {org && !org.accepting_applications && (
          <section className="mt-4 border border-amber-300 bg-amber-50 rounded-lg px-5 py-3.5">
            <h2 className="text-[13.5px] font-semibold text-amber-900">
              You're not accepting applications
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-amber-800">
              Your listings stay visible, but candidates can't apply.
            </p>
            <button
              onClick={() => navigate("/page/visibility")}
              className="mt-2 text-[12.5px] font-semibold text-amber-900 underline underline-offset-2 hover:no-underline"
            >
              Turn it back on
            </button>
          </section>
        )}

        {/* Only surfaced when genuinely missing — not a metrics strip */}
        {org && !org.industry && (
          <p className="mt-4 flex items-center gap-1.5 text-[12px] text-gray-400">
            <FiBriefcase className="w-3.5 h-3.5 shrink-0" />
            No industry set
          </p>
        )}
        {org && !org.contact_email && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-400">
            <FiMail className="w-3.5 h-3.5 shrink-0" />
            No company email set
          </p>
        )}
        {org && !org.location && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-400">
            <FiMapPin className="w-3.5 h-3.5 shrink-0" />
            No address set
          </p>
        )}
      </div>
    </PageManagerLayout>
  );
}