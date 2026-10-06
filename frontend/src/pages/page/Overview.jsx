// Page manager -> Overview.
//
// Landing pad after creating a page: setup checklist for the things that
// actually affect applicant response rates, plus a jump into the core
// recruiting actions.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import { getCurrentUser, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import {
  FiFileText, FiUsers, FiCalendar, FiTrendingUp, FiArrowRight,
  FiCheck, FiAlertTriangle, FiBriefcase, FiMail, FiImage,
  FiMapPin, FiGlobe,
} from "react-icons/fi";

// Each item points at the section that fixes it.
const CHECKLIST = [
  { key: "profile_image", label: "Add a logo", icon: FiImage, to: "/page/profile", hint: "Pages with a logo get far more applications." },
  { key: "description", label: "Write a short description", icon: FiBriefcase, to: "/page/profile", hint: "Say what the company does in a sentence or two." },
  { key: "industry", label: "Set your industry", icon: FiBriefcase, to: "/page/profile", hint: "Candidates filter jobs on this." },
  { key: "contact_email", label: "Add a company email", icon: FiMail, to: "/page/profile", hint: "Applicants use this to reach you." },
  { key: "location", label: "Add your address", icon: FiMapPin, to: "/page/profile", hint: "Helps people judge whether they can apply." },
];

const ACTIONS = [
  { to: "/page/posts", label: "Post a job", desc: "Publish an open role", icon: FiFileText },
  { to: "/page/candidates", label: "Browse candidates", desc: "Search people to hire", icon: FiUsers },
  { to: "/page/interviews", label: "Schedule interviews", desc: "Run your pipeline", icon: FiCalendar },
  { to: "/page/team", label: "Invite teammates", desc: "Let colleagues help hire", icon: FiTrendingUp },
];

export default function PageOverview() {
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [stats, setStats] = useState(null);

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

      // Counts are a nice-to-have; a failure here shouldn't blank the page.
      try {
        const postsRes = await fetch(`${getBackendUrl()}/api/organizations/${user.organization_id}/posts`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        const posts = postsRes.ok ? await postsRes.json() : [];
        if (!cancelled) {
          setStats({
            posts: Array.isArray(posts) ? posts.length : (posts?.posts?.length ?? 0),
          });
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const done = CHECKLIST.filter((c) => org?.[c.key]).length;

  return (
    <PageManagerLayout
      title={org ? `${org.name} — overview` : "Page overview"}
      subtitle="Everything for running your company page."
    >
      <div className="space-y-4">
        {/* Setup checklist */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-gray-900">Finish setting up your page</h2>
            <span className="text-[11px] font-semibold text-gray-500 shrink-0">
              {done} of {CHECKLIST.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(done / CHECKLIST.length) * 100}%` }}
            />
          </div>

          <ul className="divide-y divide-gray-100">
            {CHECKLIST.map((item) => {
              const complete = Boolean(org?.[item.key]);
              return (
                <li key={item.key}>
                  <button
                    onClick={() => navigate(item.to)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    {complete ? (
                      <FiCheck className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <item.icon className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12.5px] font-medium leading-tight ${complete ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {item.label}
                      </p>
                      {!complete && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.hint}</p>
                      )}
                    </div>
                    {!complete && <FiArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {done === CHECKLIST.length && (
            <p className="px-4 py-2.5 bg-green-50 text-[11.5px] text-green-800 border-t border-green-100">
              Your page is complete. Keep it fresh as the company grows.
            </p>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.to}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                  <a.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-gray-900">{a.label}</p>
                  <p className="text-[11px] text-gray-500">{a.desc}</p>
                </div>
                <FiArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* At a glance */}
        {stats && (
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-[13px] font-semibold text-gray-900">At a glance</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
              <div className="p-3.5">
                <p className="text-lg font-bold text-gray-900">{stats.posts ?? 0}</p>
                <p className="text-[11px] text-gray-500">Job posts</p>
              </div>
              <div className="p-3.5">
                <p className="text-lg font-bold text-gray-900">{org?.company_size || "—"}</p>
                <p className="text-[11px] text-gray-500">Company size</p>
              </div>
              <div className="p-3.5">
                <p className="text-lg font-bold text-gray-900">{org?.founded_year || "—"}</p>
                <p className="text-[11px] text-gray-500">Founded</p>
              </div>
              <div className="p-3.5">
                <p className="text-lg font-bold text-gray-900">
                  {org?.is_public ? "Public" : "Private"}
                </p>
                <p className="text-[11px] text-gray-500">Visibility</p>
              </div>
            </div>
          </section>
        )}

        {org && !org.accepting_applications && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-900">
            <FiAlertTriangle className="w-4 h-4 mt-px shrink-0 text-amber-600" />
            <span>
              This page is currently marked as <strong>not accepting applications</strong>, so
              candidates can't apply to your open roles.{" "}
              <button
                onClick={() => navigate("/page/visibility")}
                className="underline underline-offset-2 font-semibold"
              >
                Turn it back on
              </button>
            </span>
          </div>
        )}

        {org?.website && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <FiGlobe className="w-3 h-3" /> {org.website}
          </p>
        )}
      </div>
    </PageManagerLayout>
  );
}