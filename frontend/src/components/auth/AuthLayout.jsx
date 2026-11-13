import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Lock, Mail, Shield, CheckCircle2 } from "lucide-react";

const DEFAULT_HIGHLIGHTS = [
  { icon: Mail, title: "Email-verified recovery", text: "A 6-digit code is sent to the address on the account." },
  { icon: Shield, title: "Sessions revoked", text: "Resetting a password signs out every older session." },
  { icon: Lock, title: "No account hints", text: "Unknown addresses get the same response as real ones." },
];

function DefaultStageshowPreview() {
  return (
    <div className="my-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4.5 sm:p-5 backdrop-blur-md shadow-2xl">
      {/* Window chrome */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-[11px] font-mono tracking-tight text-slate-400">recruai.app/match</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-underline">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          Live
        </span>
      </div>

      {/* Miniature product card */}
      <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 border border-brand/30 text-xs font-bold text-brand-underline">
              RA
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">Senior Full Stack Engineer</p>
              <p className="text-[11px] text-slate-400">Gulf &amp; Pakistan region</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md border border-brand/30 bg-brand/15 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-underline tabular-nums">
            94% match
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            React 18
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            Python
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            pgvector
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            LiveKit
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-underline" strokeWidth={2} />
            <span>ATS score <strong className="font-mono text-white tabular-nums">92/100</strong></span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">Rank #1 · Instant signal</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
  backTo = "/signin",
  onBack,
  backLabel = "Back to sign in",
  panelEyebrow = "Account recovery",
  panelTitle = (
    <>
      Get back in.
      <br />
      <span className="text-slate-400">Safely, in under two minutes.</span>
    </>
  ),
  highlights = DEFAULT_HIGHLIGHTS,
  footer = (
    <>
      <Check className="h-4 w-4 text-brand-underline shrink-0" strokeWidth={2} />
      <span>Built for Pakistan — expanding across the Gulf &amp; beyond</span>
    </>
  ),
  preview,
}) {
  return (
    <div className="min-h-screen bg-surface text-ink transition-colors duration-150 page-transition">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: Form Column */}
        <div className="flex flex-col px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded-lg px-1.5 py-1 -ml-1.5"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                <span>{backLabel}</span>
              </button>
            ) : (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded-lg px-1.5 py-1 -ml-1.5"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                <span>{backLabel}</span>
              </Link>
            )}
            <Link
              to="/"
              className="t-min inline-flex items-center text-sm font-extrabold tracking-tight transition-opacity hover:opacity-90 gap-1.5"
            >
              <span>RecruAI</span>
              <span className="text-xs font-medium text-gray-500">by MenteE</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-12">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>

        {/* Right: Stageshow Brand & Feature Showcase Panel */}
        <div className="relative hidden overflow-hidden bg-[#0f172a] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16 border-l border-line/80">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.14), transparent 45%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.08), transparent 40%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-200">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {panelEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-[1.12] tracking-tight xl:text-4xl 2xl:text-5xl text-white">
              {panelTitle}
            </h2>

            {/* Stageshow Faux UI Product Preview */}
            {preview !== null && (preview || <DefaultStageshowPreview />)}
          </div>

          <div className="relative space-y-3 pt-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <Icon className="h-4 w-4 text-brand-underline" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-400 leading-snug">{text}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t border-white/10 pt-4.5 text-xs text-slate-400">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
