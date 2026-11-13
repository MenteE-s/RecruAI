import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Users,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { useToast } from "../components/ui/ToastContext";
import {
  clearLocalAuth,
  getAuthHeaders,
  getBackendUrl,
  setAuthSession,
  verifyTokenWithServer,
} from "../utils/auth";

function Spinner() {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-brand-text" strokeWidth={2} />
      <span>Checking your invitation…</span>
    </div>
  );
}

const inputCls =
  "block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-gray-400 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5";
const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500";

/* ── Stageshow illustration: AcceptInvite right panel ───────────────────── */
function InviteIllustration({ orgName, role }) {
  return (
    <div className="my-6 space-y-3.5">
      {/* Window card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4.5 sm:p-5 shadow-2xl backdrop-blur-md">
        {/* Window chrome header */}
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-mono tracking-tight text-gray-500">recruai.app/team/invite</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Team invite
          </span>
        </div>

        {/* Workspace preview card */}
        <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 border border-brand/30 text-xs font-bold text-brand-text">
                <Building2 className="h-4 w-4 text-brand-text" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{orgName || "Organization"}</p>
                <p className="text-[11px] text-gray-500">Collaborative hiring workspace</p>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-brand/30 bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand-text capitalize">
              {role || "Team member"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              ATS pipeline
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              Candidate scoring
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              Team interviews
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={2} />
              <span>Inbox verified</span>
            </span>
            <span className="font-mono text-[10px] text-gray-500">1-click joining</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token") || "",
    [location.search]
  );
  const invitePath = `/accept-invite?token=${encodeURIComponent(token)}`;
  const signInUrl = `/signin?next=${encodeURIComponent(invitePath)}`;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ name: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      setError(null);
      setData(null);
      if (!token) {
        setLoadError({ message: "This invitation link is missing its token.", code: "missing_token" });
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${getBackendUrl()}/api/invitations/${encodeURIComponent(token)}`,
          { credentials: "include", headers: getAuthHeaders() }
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setLoadError({
              message: payload.error || "This invitation is no longer valid.",
              code: payload.code || "invalid_invitation",
            });
          }
          return;
        }
        if (!cancelled) {
          setData(payload);
          setForm((prev) => ({
            ...prev,
            name: prev.name || payload.suggested_name || "",
          }));
        }
      } catch {
        if (!cancelled) {
          setLoadError({
            message: "We could not reach RecruAI. Check your connection and try again.",
            code: "network_error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const invitation = data?.invitation;
  const org = invitation?.organization;
  const orgName = org?.name || "the team";
  const needsPasswordSetup = Boolean(data?.can_set_password);
  const needsSignIn = Boolean(data?.requires_sign_in);
  const wrongAccount = Boolean(data?.signed_in && !data?.signed_in_matches);
  const canJoin = Boolean(data?.signed_in_matches);

  async function acceptInvitation(e) {
    e?.preventDefault();
    setError(null);

    if (needsPasswordSetup) {
      if (!form.name.trim()) {
        setError("Enter your name.");
        return;
      }
      if (!form.password) {
        setError("Choose a password.");
        return;
      }
      if (form.password !== form.confirm) {
        setError("The passwords do not match.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch(
        `${getBackendUrl()}/api/invitations/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
          credentials: "include",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(
            needsPasswordSetup
              ? { name: form.name.trim(), password: form.password }
              : {}
          ),
        }
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (payload.code === "sign_in_required") {
          setError("Sign in to accept this invitation.");
          return;
        }
        setError(payload.error || "Could not accept the invitation.");
        return;
      }

      if (payload.access_token) {
        setAuthSession(payload.access_token, payload.user);
      }

      // Refresh the auth cache so the new team membership is visible immediately.
      try {
        await verifyTokenWithServer({ forceRefresh: true });
      } catch {
        // The accept response is enough to continue.
      }

      showToast({
        message: `You've joined ${payload.organization?.name || orgName}`,
        type: "success",
        position: "side",
        duration: 3000,
      });
      navigate(
        payload.organization?.slug ? `/org/${payload.organization.slug}` : "/feed",
        { replace: true }
      );
    } catch {
      setError("We could not reach RecruAI. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    try {
      await fetch(`${getBackendUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
      });
    } catch {
      // Local state still needs clearing even if the network call fails.
    }
    clearLocalAuth();
    window.location.assign(signInUrl);
  }

  const panelHighlights = [
    { icon: Users, title: "Join the workspace", text: "See the team, hiring pipeline and shared work." },
    { icon: Briefcase, title: invitation?.role ? `Role: ${invitation.role}` : "Your role", text: "Your access is set by the team admin." },
    { icon: Shield, title: "Inbox-verified", text: "Only the person who received this email can accept." },
  ];

  return (
    <AuthLayout
      backTo={token ? signInUrl : "/signin"}
      backLabel="Back to sign in"
      panelEyebrow="Team invitation"
      panelTitle={
        <>
          Join {orgName}.
          <br />
          <span className="text-gray-500">Your team is waiting.</span>
        </>
      }
      highlights={panelHighlights}
      preview={<InviteIllustration orgName={orgName} role={invitation?.role} />}
      footer={
        <>
          <Check className="h-4 w-4 text-brand-text shrink-0" strokeWidth={2} />
          <span>
            Invitation expires{" "}
            {invitation?.expires_at
              ? new Date(invitation.expires_at).toLocaleDateString(undefined, { month: "long", day: "numeric" })
              : "in 7 days"}
          </span>
        </>
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
        You&apos;re invited
      </p>
      <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
        Join {orgName}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {invitation?.inviter_name
          ? `${invitation.inviter_name} invited you to join the team as ${invitation.role}.`
          : "Accept the invitation to join the team."}
      </p>

      {loading ? (
        <div className="mt-8">
          <Spinner />
        </div>
      ) : loadError ? (
        <div className="mt-7 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4.5 sm:p-5 shadow-s5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" strokeWidth={2} />
            <div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Invitation unavailable</p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300 leading-relaxed">{loadError.message}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to="/signin" className="text-rose-800 underline underline-offset-4 hover:no-underline dark:text-rose-300">
                  Sign in
                </Link>
                <Link to="/" className="text-rose-800 underline underline-offset-4 hover:no-underline dark:text-rose-300">
                  Go home
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-line bg-canvas p-4 shadow-s5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface shadow-s5">
                <Mail className="h-5 w-5 text-gray-500" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Invited email</p>
                <p className="truncate text-sm font-semibold text-ink">{invitation?.email}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-300 shadow-s5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" strokeWidth={2} />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {wrongAccount ? (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4.5 sm:p-5 shadow-s5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">This invite is for a different email</p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    You&apos;re signed in as <b>{data.current_user_email}</b>. Sign out and use{" "}
                    <b>{invitation?.email}</b> to accept it.
                  </p>
                  <button
                    type="button"
                    onClick={switchAccount}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-s5 transition hover:bg-gray-100 dark:hover:bg-gray-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <span>Use a different account</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ) : needsSignIn ? (
            <div className="mt-6 rounded-xl border border-line bg-surface p-4.5 sm:p-5 shadow-s5">
              <p className="text-sm font-bold text-ink">You already have an account</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Sign in with <b>{invitation?.email}</b> to join this team. We&apos;ll bring you right back here.
              </p>
              <Link
                to={signInUrl}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span>Sign in to accept</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          ) : needsPasswordSetup ? (
            <form onSubmit={acceptInvitation} className="mt-6 space-y-3.5">
              {data.account_unverified && (
                <div className="rounded-xl border border-brand/20 bg-brand/10 p-3.5 text-sm text-brand-text shadow-s5">
                  This invitation was sent before your account was activated. Set a password to finish joining.
                </div>
              )}
              <div>
                <label htmlFor="invite-name" className={labelCls}>
                  Full name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="invite-password" className={labelCls}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="invite-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={`${inputCls} pr-11`}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition-colors hover:text-ink focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="invite-confirm" className={labelCls}>
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" strokeWidth={2} />
                  <input
                    id="invite-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
                    className={`${inputCls} pl-10`}
                    placeholder="Repeat your password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span>{busy ? "Joining…" : "Accept invitation"}</span>
                {!busy && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
              </button>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span>Your account is created only when you accept. The organization cannot sign in as you.</span>
              </p>
            </form>
          ) : canJoin ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={acceptInvitation}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 py-3 text-sm font-semibold text-white shadow-s5 transition hover:bg-brand/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span>{busy ? "Joining…" : `Join ${orgName}`}</span>
                {!busy && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500">
                You&apos;re signed in as {data.current_user_email}.
              </p>
            </div>
          ) : null}

          <p className="mt-7 text-center text-xs text-gray-500">
            Wrong email? Ask a team admin for a new invitation.
          </p>
        </>
      )}
    </AuthLayout>
  );
}