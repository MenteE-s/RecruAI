import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { checkSuperadmin, logout } from "../lib/api";

export default function Layout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("admin_email") || "";
      setEmail(raw);
    } catch {
      setEmail("");
    }
  }, []);

  async function signOut() {
    try {
      sessionStorage.removeItem("admin_email");
    } catch { /* ignore */ }
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">RecruAI Admin<small>platform control plane</small></div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Overview</NavLink>
          <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>People</NavLink>
          <NavLink to="/organizations" className={({ isActive }) => (isActive ? "active" : "")}>Organizations</NavLink>
          <NavLink to="/plans" className={({ isActive }) => (isActive ? "active" : "")}>Plans</NavLink>
          <NavLink to="/ai-providers" className={({ isActive }) => (isActive ? "active" : "")}>AI providers</NavLink>
          <NavLink to="/outbox" className={({ isActive }) => (isActive ? "active" : "")}>Outbox &amp; retries</NavLink>
          <NavLink to="/content" className={({ isActive }) => (isActive ? "active" : "")}>Content banks</NavLink>
        </nav>
        <div className="side-foot">
          <div style={{ marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis" }}>
            {email || "superadmin"}
          </div>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function RequireSuperadmin({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    checkSuperadmin()
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch(() => {
        if (!cancelled) {
          setState("denied");
          navigate("/login", { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (state !== "ok") {
    return (
      <div className="login-wrap">
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Verifying admin access…</p>
      </div>
    );
  }
  return children;
}
