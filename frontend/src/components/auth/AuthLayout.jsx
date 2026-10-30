import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiLock, FiMail, FiShield } from "react-icons/fi";

const DEFAULT_HIGHLIGHTS = [
  { icon: FiMail, title: "Email-verified recovery", text: "A 6-digit code is sent to the address on the account." },
  { icon: FiShield, title: "Sessions revoked", text: "Resetting a password signs out every older session." },
  { icon: FiLock, title: "No account hints", text: "Unknown addresses get the same response as real ones." },
];

export default function AuthLayout({
  children,
  backTo = "/signin",
  backLabel = "Back to sign in",
  panelEyebrow = "Account recovery",
  panelTitle = (
    <>
      Get back in.
      <br />
      <span className="text-neutral-400">Safely, in under two minutes.</span>
    </>
  ),
  highlights = DEFAULT_HIGHLIGHTS,
  footer = (
    <>
      <FiCheck className="h-4 w-4 text-emerald-400" />
      Built for Pakistan — expanding across the Gulf &amp; beyond
    </>
  ),
}) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between">
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <FiArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>
            <span className="text-sm font-extrabold tracking-tight">
              RecruAI <span className="font-medium text-neutral-400">by MenteE</span>
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-neutral-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.14), transparent 45%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.08), transparent 40%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {panelEyebrow}
            </span>
            <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">
              {panelTitle}
            </h2>
          </div>

          <div className="relative space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">{text}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t border-white/10 pt-6 text-xs text-neutral-400">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
