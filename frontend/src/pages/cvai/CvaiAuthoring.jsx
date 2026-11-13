import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Button, Loading, ErrorNote } from "../cvai/CvaiShell";
import { cvai, messageOf } from "../../utils/cvai";
import { Plus, Trash2 } from "lucide-react";

const inputCls =
  "mt-1.5 block w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "block text-sm font-medium text-ink";

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
            <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-4 text-sm text-brand-text">{notice}</div>
          ) : null}

          <Panel title="Question">
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelCls}>
                Skill
                <select
                  value={form.skillSlug}
                  onChange={(e) => setForm((f) => ({ ...f, skillSlug: e.target.value }))}
                  className={inputCls}
                >
                  {skills.map((slug) => (
                    <option key={slug} value={slug}>{slug.replace(/-/g, " ")}</option>
                  ))}
                </select>
              </label>

              <label className={labelCls}>
                Level tested
                <select
                  value={form.levelTested}
                  onChange={(e) => setForm((f) => ({ ...f, levelTested: e.target.value }))}
                  className={inputCls}
                >
                  {["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className={`${labelCls} mt-4`}>
              Prompt
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                rows={3}
                required
                className={inputCls}
              />
            </label>
          </Panel>

          <Panel title="Answer options">
            <div className="space-y-3">
              {form.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    aria-label={`Mark option ${index + 1} as correct`}
                    className="h-6 w-6 accent-[#00AA45]"
                    checked={form.correctIndex === index}
                    onChange={() => setForm((f) => ({ ...f, correctIndex: index }))}
                  />
                  <input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={form.options.length <= 2}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Remove
                  </button>
                </div>
              ))}
              <div className="pt-1">
                <Button type="button" variant="secondary" onClick={addOption}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} /> Add option
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="Metadata">
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelCls}>
                Difficulty (1-5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.difficulty}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  className={`${inputCls} font-mono`}
                />
              </label>

              <label className={labelCls}>
                Explanation
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={3}
                  className={inputCls}
                />
              </label>
            </div>
          </Panel>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create question"}
            </Button>
          </div>
        </form>
      )}
    </CvaiShell>
  );
}
