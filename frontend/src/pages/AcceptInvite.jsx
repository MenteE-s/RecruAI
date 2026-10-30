import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUsers,
} from "react-icons/fi";
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
    <div className="flex items-center gap-3 text-sm text-neutral-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      Checking your invitation…
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
    { icon: FiUsers, title: "Join the workspace", text: "See the team, hiring pipeline and shared work." },
    { icon: FiBriefcase, title: invitation?.role ? `Role: ${invitation.role}` : "Your role", text: "Your access is set by the team admin." },
    { icon: FiShield, title: "Inbox-verified", text: "Only the person who received this email can accept." },
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
          <span className="text-neutral-400">Your team is waiting.</span>
        </>
      }
      highlights={panelHighlights}
      footer={
        <>
          <FiCheckCircle className="h-4 w-4 text-emerald-400" />
          Invitation expires {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "in 7 days"}
        </>
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
        You&apos;re invited
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Join {orgName}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        {invitation?.inviter_name
          ? `${invitation.inviter_name} invited you to join the team as ${invitation.role}.`
          : "Accept the invitation to join the team."}
      </p>

      {loading ? (
        <div className="mt-8"><Spinner /></div>
      ) : loadError ? (
        <div className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">Invitation unavailable</p>
              <p className="mt-1 text-sm text-red-700">{loadError.message}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to="/signin" className="text-red-800 underline underline-offset-4">Sign in</Link>
                <Link to="/" className="text-red-800 underline underline-offset-4">Go home</Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <FiMail className="h-5 w-5 text-neutral-700" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Invited email</p>
                <p className="truncate text-sm font-semibold text-neutral-900">{invitation?.email}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {wrongAccount ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900">This invite is for a different email</p>
                  <p className="mt-1 text-sm text-amber-800">
                    You&apos;re signed in as <b>{data.current_user_email}</b>. Sign out and use{" "}
                    <b>{invitation?.email}</b> to accept it.
                  </p>
                  <button
                    type="button"
                    onClick={switchAccount}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-700"
                  >
                    Use a different account <FiArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : needsSignIn ? (
            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-bold text-neutral-900">You already have an account</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                Sign in with <b>{invitation?.email}</b> to join this team. We&apos;ll bring you right back here.
              </p>
              <Link
                to={signInUrl}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-neutral-700"
              >
                Sign in to accept <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : needsPasswordSetup ? (
            <form onSubmit={acceptInvitation} className="mt-6 space-y-4">
              {data.account_unverified && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800">
                  This invitation was sent before your account was activated. Set a password to finish joining.
                </div>
              )}
              <div>
                <label htmlFor="invite-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Full name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="invite-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="invite-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-11 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="invite-confirm" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Confirm password
                </label>
                <input
                  id="invite-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-gray-400 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="Repeat your password"
                  minLength={8}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Joining…" : "Accept invitation"}
                {!busy && <FiArrowRight className="h-4 w-4" />}
              </button>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-neutral-400">
                <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Your account is created only when you accept. The organization cannot sign in as you.
              </p>
            </form>
          ) : canJoin ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={acceptInvitation}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Joining…" : `Join ${orgName}`}
                {!busy && <FiArrowRight className="h-4 w-4" />}
              </button>
              <p className="mt-3 text-center text-xs text-neutral-400">
                You&apos;re signed in as {data.current_user_email}.
              </p>
            </div>
          ) : null}

          <p className="mt-7 text-center text-xs text-neutral-400">
            Wrong email? Ask a team admin for a new invitation.
          </p>
        </>
      )}
    </AuthLayout>
  );
}
