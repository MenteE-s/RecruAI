import { OrgAppShell } from "../../components/layout/OrgAppShell";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { Button, ButtonLink } from "../../components/ui/Button";
import { COUNTRIES, CURRENCIES, formatSalaryRange, splitLocation, joinLocation } from "../../utils/jobMeta";
import {
  Briefcase,
  MapPin,
  Tag,
  CreditCard,
  Calendar,
  Edit2,
  Trash2,
  ArrowLeft,
  Users,
  X,
  Copy,
} from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-900/60 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function JobPostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    employment_type: "Full-time",
    category: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "USD",
    requirements: [],
    application_deadline: "",
    status: "active",
  });
  const [locCity, setLocCity] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [locRemote, setLocRemote] = useState(false);

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts/${id}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.data || data;
        setPost(p);
        const loc = splitLocation(p.location || "");
        setLocCity(loc.city);
        setLocCountry(loc.country);
        setLocRemote(loc.remote);
        setFormData({
          title: p.title || "",
          description: p.description || "",
          employment_type: p.employment_type || "Full-time",
          category: p.category || "",
          salary_min: p.salary_min || "",
          salary_max: p.salary_max || "",
          salary_currency: p.salary_currency || "USD",
          requirements: p.requirements || [],
          application_deadline: p.application_deadline ? p.application_deadline.split("T")[0] : "",
          status: p.status || "active",
        });
      } else {
        showToast({ message: "Failed to load job post", type: "error" });
      }
    } catch {
      showToast({ message: "Failed to load job post", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        location: joinLocation({ city: locCity, country: locCountry, remote: locRemote }),
        requirements: formData.requirements.filter((r) => r.trim()),
      };
      const res = await fetch(`${getBackendUrl()}/api/posts/${id}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(updated.data || updated);
        setEditing(false);
        showToast({ message: "Job post updated", type: "success" });
      } else showToast({ message: "Failed to update", type: "error" });
    } catch {
      showToast({ message: "Failed to update", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this job post? This cannot be undone.")) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast({ message: "Deleted", type: "success" });
        navigate("/org/jobs");
      } else showToast({ message: "Failed to delete", type: "error" });
    } catch {
      showToast({ message: "Failed to delete", type: "error" });
    }
  };

  if (loading) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-25" />
          <div className="h-48 animate-pulse rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25" />
          <div className="h-64 animate-pulse rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25" />
        </div>
      </OrgAppShell>
    );
  }

  if (!post) {
    return (
      <OrgAppShell>
        <div className="mx-4 mt-4 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-12 text-center shadow-s5">
          <h1 className="text-lg font-semibold text-ink">Job post not found</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            This post may have been deleted, or it belongs to another organization.
          </p>
          <ButtonLink to="/org/jobs" variant="secondary" size="sm" className="mt-4">
            Back to jobs
          </ButtonLink>
        </div>
      </OrgAppShell>
    );
  }

  const statusChip = (status) => {
    const base = "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold";
    if (status === "active") return `${base} bg-brand/10 text-brand-text border border-brand/20`;
    if (status === "inactive")
      return `${base} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20`;
    return `${base} bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20`;
  };

  const metaChip =
    "inline-flex items-center gap-1.5 rounded-lg border border-line dark:border-line bg-gray-50 dark:bg-gray-25/80 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-700";

  return (
    <OrgAppShell>
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate("/org/jobs")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-ink dark:text-gray-500 dark:hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Back to job posts
        </button>
      </div>

      {/* Header card */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[20px] font-semibold leading-7 text-ink">{post.title}</h1>
                <span className={statusChip(post.status)}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.location && (
                  <span className={metaChip}>
                    <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    {post.location}
                  </span>
                )}
                {post.employment_type && (
                  <span className={metaChip}>
                    <Briefcase className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    {post.employment_type}
                  </span>
                )}
                {post.category && (
                  <span className={metaChip}>
                    <Tag className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    {post.category}
                  </span>
                )}
                {(() => {
                  const range = formatSalaryRange(post.salary_min, post.salary_max, post.salary_currency);
                  return (
                    range && (
                      <span className={metaChip}>
                        <CreditCard className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                        <span className="font-mono tabular-nums">{range}</span>
                      </span>
                    )
                  );
                })()}
                {post.application_deadline && (
                  <span className={metaChip}>
                    <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    <span>Deadline</span>{" "}
                    <span className="font-mono tabular-nums">
                      {new Date(post.application_deadline).toLocaleDateString()}
                    </span>
                  </span>
                )}
              </div>
              <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-500">
                {post.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 md:w-[200px]">
              <Button variant="secondary" onClick={() => setEditing(!editing)}>
                <Edit2 className="h-3.5 w-3.5" strokeWidth={1.75} /> {editing ? "Cancel edit" : "Edit post"}
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Delete post
              </Button>
              <ButtonLink to="/org/candidates" variant="secondary">
                <Users className="h-3.5 w-3.5" strokeWidth={1.75} /> View applicants
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4">
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
          <h3 className="text-sm font-semibold text-ink">Description</h3>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.description || "No description provided."}
          </p>
        </div>
        {post.requirements && post.requirements.length > 0 && (
          <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
            <h3 className="text-sm font-semibold text-ink">Requirements</h3>
            <ul className="mt-3 space-y-2">
              {post.requirements.map((r, i) => (
                <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-gray-700 dark:text-gray-600">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Share this opportunity</p>
              <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-500">
                Share this link directly with candidates or across job boards.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast({ message: "Link copied to clipboard!", type: "success" });
              }}
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} /> Copy link
            </Button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s15">
            <div className="flex items-center justify-between border-b border-line dark:border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Edit job post</h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink dark:bg-transparent dark:hover:bg-gray-25"
                aria-label="Close edit modal"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Job title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className={`${inputCls} min-h-[96px] resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Location</label>
                  <label className="mb-2 flex cursor-pointer select-none items-center gap-2 text-sm text-gray-700 dark:text-gray-600">
                    <input
                      type="checkbox"
                      checked={locRemote}
                      onChange={(e) => setLocRemote(e.target.checked)}
                      className="h-4 w-4 rounded accent-brand"
                    />
                    Remote position
                  </label>
                  <input
                    type="text"
                    value={locCity}
                    disabled={locRemote}
                    onChange={(e) => setLocCity(e.target.value)}
                    placeholder="City (optional)"
                    className={`${inputCls} mb-2 disabled:opacity-50`}
                  />
                  <select
                    value={locCountry}
                    disabled={locRemote}
                    onChange={(e) => setLocCountry(e.target.value)}
                    className={`${inputCls} disabled:opacity-50`}
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Salary min</label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData((p) => ({ ...p, salary_min: e.target.value }))}
                    className={`${inputCls} font-mono tabular-nums`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Salary max</label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData((p) => ({ ...p, salary_max: e.target.value }))}
                    className={`${inputCls} font-mono tabular-nums`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Currency</label>
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => setFormData((p) => ({ ...p, salary_currency: e.target.value }))}
                    className={inputCls}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <Button variant="primary" type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OrgAppShell>
  );
}
