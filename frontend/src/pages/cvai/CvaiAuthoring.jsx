import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Button, Loading, ErrorNote, EmptyNote } from "../cvai/CvaiShell";
import { cvai, messageOf } from "../../utils/cvai";

export default function CvaiAuthoring() {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({
    skillSlug: "",
    prompt: "",
    options: ["", ""],
    correctIndex: 0,
    difficulty: 1,
    levelTested: "Intermediate",
    explanation: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await cvai.taxonomy();
    if (!res.ok) {
      setError(messageOf(res, "Could not load the skill taxonomy."));
      setLoading(false);
      return;
    }
    const list = (res.data?.skills || []).map((s) => s.slug).filter(Boolean).sort();
    setSkills(list);
    setForm((f) => ({ ...f, skillSlug: f.skillSlug || list[0] || "" }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateOption(index, value) {
    setForm((f) => {
      const next = [...f.options];
      next[index] = value;
      return { ...f, options: next };
    });
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }

  function removeOption(index) {
    setForm((f) => {
      const next = f.options.filter((_, i) => i !== index);
      const nextIndex = Math.max(0, Math.min(f.correctIndex, next.length - 1));
      return { ...f, options: next, correctIndex: nextIndex };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const options = form.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      setError("At least two non-empty answer options are required.");
      return;
    }
    setSaving(true);
    const res = await cvai.createSkillQuestion({
      skill_slug: form.skillSlug,
      prompt: form.prompt.trim(),
      options,
      correct_index: Number(form.correctIndex),
      difficulty: Number(form.difficulty),
      level_tested: form.levelTested || undefined,
      explanation: form.explanation.trim() || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(messageOf(res, "Could not create the question."));
      return;
    }
    setNotice("Question added to the bank.");
    setForm((f) => ({ ...f, prompt: "", explanation: "", options: ["", ""] }));
  }

  return (
    <CvaiShell
      title="Question authoring"
      subtitle="Add shared bank questions for page administrators. Page-admin gate applies."
    >
      {loading ? (
        <Loading label="Loading taxonomy" />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : null}
          {notice ? (
            <div className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</div>
          ) : null}

          <Panel title="Question">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Skill
                <select
                  value={form.skillSlug}
                  onChange={(e) => setForm((f) => ({ ...f, skillSlug: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 bg-white px-3 py-2"
                >
                  {skills.map((slug) => (
                    <option key={slug} value={slug}>{slug.replace(/-/g, " ")}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Level tested
                <select
                  value={form.levelTested}
                  onChange={(e) => setForm((f) => ({ ...f, levelTested: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 bg-white px-3 py-2"
                >
                  {["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-4">
              Prompt
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                rows={3}
                required
                className="mt-1 block w-full border border-gray-300 px-3 py-2"
              />
            </label>
          </Panel>

          <Panel title="Answer options">
            <div className="space-y-3">
              {form.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correctIndex === index}
                    onChange={() => setForm((f) => ({ ...f, correctIndex: index }))}
                  />
                  <input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 border border-gray-300 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={form.options.length <= 2}
                    className="text-sm text-red-600 disabled:text-gray-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button type="button" onClick={addOption}>Add option</Button>
            </div>
          </Panel>

          <Panel title="Metadata">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Difficulty (1-5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.difficulty}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Explanation
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          </Panel>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create question"}
            </Button>
          </div>
        </form>
      )}
    </CvaiShell>
  );
}
