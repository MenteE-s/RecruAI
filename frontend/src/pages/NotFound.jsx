import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiArrowLeft,
  FiCompass,
  FiBriefcase,
  FiUsers,
  FiSearch,
  FiMail,
} from "react-icons/fi";

const SHORTCUTS = [
  { label: "Dashboard", desc: "Back to your home base", to: "/dashboard", icon: FiHome },
  { label: "Find jobs", desc: "Browse open roles", to: "/dashboard", icon: FiBriefcase },
  { label: "Hire people", desc: "Meet your next hire", to: "/organization/hire", icon: FiUsers },
  { label: "Search talent", desc: "Look up candidates", to: "/network", icon: FiSearch },
];

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const missingPath = location.pathname || "/unknown";

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      {/* Backdrop: faint dot grid + soft emerald wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl"
      />
      {/* Giant ghost numeral */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-10 select-none text-center font-extrabold leading-none tracking-tighter text-neutral-900/[0.05]"
        style={{ fontSize: "clamp(10rem, 32vw, 24rem)" }}
      >
        404
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        {/* Compass mark */}
        <div className="float-slow mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-emerald-400 shadow-xl shadow-neutral-900/20">
          <FiCompass className="h-8 w-8" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
          Error 404 — off the map
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          This page didn't make
          <br />
          the <span className="relative inline-block">
            shortlist
            <span aria-hidden="true" className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-emerald-400" />
          </span>
          .
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-500">
          No route matches{" "}
          <code className="rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-xs text-neutral-700">
            {missingPath}
          </code>
          . It may have moved, been deleted, or never existed — let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
          >
            <FiArrowLeft className="h-4 w-4" /> Go back
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-neutral-900 transition hover:border-neutral-900"
          >
            <FiHome className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        {/* Shortcuts */}
        <div className="mt-12 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SHORTCUTS.map(({ label, desc, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition hover:border-neutral-900 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition group-hover:bg-neutral-900 group-hover:text-emerald-400">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-neutral-900">{label}</span>
                <span className="block truncate text-xs text-neutral-400">{desc}</span>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 flex items-center gap-1.5 text-xs text-neutral-400">
          <FiMail className="h-3.5 w-3.5" />
          Think something's broken?{" "}
          <Link to="/contact" className="font-semibold text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
            Contact us
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-10px) rotate(4deg); }
        }
        .float-slow { animation: floatSlow 5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
