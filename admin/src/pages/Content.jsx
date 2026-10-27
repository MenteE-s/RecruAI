import { useEffect, useState } from "react";
import { api } from "../lib/api";

const LABELS = {
  skill_questions: "Skill bank questions",
  quizzes: "Quizzes",
  guided_projects: "Guided projects",
  mock_interview_questions: "Mock-interview questions",
  practice_ai_agents: "Personal AI agents (user-created)",
  org_interview_agents: "Org interview agents (templates)",
};

export default function Content() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/admin/content")
      .then((body) => { if (!cancelled) setData(body); })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load content"); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <p className="sub">Loading…</p>;

  const empty = Object.entries(data).filter(([, v]) => v === 0).map(([k]) => k);

  return (
    <>
      <h1>Content banks</h1>
      <p className="sub">Seeded question banks and templates the coaching features draw from. New content ships via the question-bank seed scripts and admin authoring.</p>
      {empty.length > 0 && (
        <div className="notice">
          Empty banks: {empty.join(", ")}. Run the <code className="inline">cvai_seed</code> compose profile on the host to seed them.
        </div>
      )}
      <div className="cards">
        {Object.entries(LABELS).map(([key, label]) => (
          <div className="card" key={key}>
            <div className="k">{label}</div>
            <div className="v">{data[key] ?? 0}</div>
          </div>
        ))}
      </div>
    </>
  );
}
