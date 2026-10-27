import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkSuperadmin, login } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      try {
        sessionStorage.setItem("admin_email", email.trim());
      } catch { /* ignore */ }
      await checkSuperadmin();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.status === 403
        ? "This account is not a platform superadmin."
        : err.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>RecruAI Admin</h1>
        <p>Superadmin sign-in. Regular and org-admin accounts are rejected here.</p>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error && <div className="err">{error}</div>}
      </form>
    </div>
  );
}
