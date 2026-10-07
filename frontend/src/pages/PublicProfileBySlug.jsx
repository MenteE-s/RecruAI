// Public profile at /in/<slug>.
//
// Reachable signed out — a slug is meant to be pasted into an email or a
// business card. Shows only what backend/api/profile/slug_routes.py returns,
// which deliberately omits email, phone and subscription state.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiMapPin, FiBriefcase, FiGlobe, FiLinkedin, FiArrowLeft,
  FiAlertTriangle,
} from "react-icons/fi";
import { getBackendUrl, getUploadUrl } from "../utils/auth";

export default function PublicProfileBySlug() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`${getBackendUrl()}/api/in/${encodeURIComponent(slug || "")}`)
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xs text-gray-400">Loading profile…</p>
      </div>
    );
  }

  if (notFound || !data?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center max-w-sm">
          <p className="text-sm font-semibold text-gray-900">Profile not found</p>
          <p className="mt-1.5 text-xs text-gray-500">
            No one on RecruAI uses <span className="font-semibold">/{slug}</span>.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Go to RecruAI
          </Link>
        </div>
      </div>
    );
  }

  const u = data.user;
  const avatar = u.profile_picture ? getUploadUrl(u.profile_picture) : null;
  const banner = u.banner ? getUploadUrl(u.banner) : null;
  const firstName = (u.name || "").trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/mentee-logo.png" alt="RecruAI" className="w-6 h-6 rounded-md object-contain" />
            <span className="text-sm font-extrabold text-blue-700 tracking-tight">RecruAI</span>
          </Link>
          <Link
            to="/signin"
            className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-800"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Identity card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {banner && <img src={banner} alt="" className="w-full h-28 object-cover" />}
          <div className="px-5 py-4">
            <div className="flex items-start gap-4">
              {avatar ? (
                <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow shrink-0 -mt-8" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shrink-0 -mt-8 border-2 border-white shadow">
                  {(u.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 truncate">{u.name}</h1>
                {u.headline && (
                  <p className="text-[12.5px] text-gray-700 mt-0.5 leading-snug">{u.headline}</p>
                )}
                <p className="text-[11.5px] text-gray-400 mt-0.5">/in/{u.slug}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              {u.current_position && (
                <p className="text-[12px] text-gray-600 flex items-center gap-1.5">
                  <FiBriefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {u.current_position}
                  {u.current_company && ` at ${u.current_company}`}
                </p>
              )}
              {u.location && (
                <p className="text-[12px] text-gray-600 flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {u.location}
                </p>
              )}
              {u.website && (
                <p className="text-[12px] text-gray-600 flex items-center gap-1.5">
                  <FiGlobe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{u.website}</span>
                </p>
              )}
              {u.linkedin && (
                <p className="text-[12px] text-gray-600 flex items-center gap-1.5">
                  <FiLinkedin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{u.linkedin}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {data.is_discoverable === false && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-900">
            <FiAlertTriangle className="w-4 h-4 mt-px shrink-0 text-amber-600" />
            <span>
              {firstName} has turned off search visibility, so this profile
              won&rsquo;t appear in search results. The link still works.
            </span>
          </div>
        )}
      </main>
    </div>
  );
}