import { OrgAppShell } from "../../components/layout/OrgAppShell";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import { COUNTRIES, CURRENCIES, formatSalaryRange, splitLocation, joinLocation } from "../../utils/jobMeta";
import {
  Briefcase,
  MapPin,
  Tag,
  CreditCard,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
} from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function JobPosts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [search, setSearch] = useState("");
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
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const [canManageHiring, setCanManageHiring] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await verifyTokenWithServer();
      if (user?.organization_id) {
        setOrganizationId(user.organization_id);
        setCanManageHiring((user.organization_permissions || []).includes("hiring.manage"));
        fetchPosts(user.organization_id);
      } else {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async (orgId) => {
    try {
      const id = orgId ?? organizationId;
      if (!id) return;
      const res = await fetch(`${getBackendUrl()}/api/organizations/${id}/posts`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setPosts(Array.isArray(json) ? json : json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingPost) {
      await doSave();
    } else {
      setShowPublishConfirm(true);
    }
  };

  const doSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const url = editingPost
        ? `${getBackendUrl()}/api/posts/${editingPost.id}`
        : `${getBackendUrl()}/api/posts`;
      const method = editingPost ? "PUT" : "POST";
      const orgId = editingPost?.organization_id ?? organizationId;
      if (!orgId) {
        showToast({
          message: "Unable to determine your organization. Please sign in again.",
          type: "error",
        });
        return;
      }
      const payload = {
        ...formData,
        location: joinLocation({ city: locCity, country: locCountry, remote: locRemote }),
        organization_id: orgId,
        requirements: formData.requirements.filter((r) => r.trim()),
      };
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchPosts(organizationId);
        resetForm();
        setShowPublishConfirm(false);
        showToast({
          message: editingPost ? "Job post updated!" : "Job post published!",
          type: "success",
        });
      } else {
        showToast({
          message: (await res.json().catch(() => ({})))?.error || "Failed to save",
          type: "error",
        });
      }
    } catch {
      showToast({ message: "Failed to save job post", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId) => {
    setPostToDelete(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts/${postToDelete}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchPosts(organizationId);
        setShowDeleteConfirm(false);
        setPostToDelete(null);
        showToast({ message: "Job post deleted", type: "success" });
      } else {
        showToast({ message: "Failed to delete job post", type: "error" });
      }
    } catch {
      showToast({ message: "Failed to delete job post", type: "error" });
    }
  };

  const openForm = (post) => {
    if (post) {
      setEditingPost(post);
      const loc = splitLocation(post.location || "");
      setLocCity(loc.city);
      setLocCountry(loc.country);
      setLocRemote(loc.remote);
      setFormData({
        title: post.title || "",
        description: post.description || "",
        employment_type: post.employment_type || "Full-time",
        category: post.category || "",
        salary_min: post.salary_min || "",
        salary_max: post.salary_max || "",
        salary_currency: post.salary_currency || "USD",
        requirements: post.requirements || [],
        application_deadline: post.application_deadline || "",
        status: post.status || "active",
      });
    } else {
      setEditingPost(null);
      setLocCity("");
      setLocCountry("");
      setLocRemote(false);
      setFormData({
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
    }
    setShowCreateForm(true);
  };

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openForm();
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleEdit = (post) => openForm(post);
  const resetForm = () => {
    setFormData({
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
    setLocCity("");
    setLocCountry("");
    setLocRemote(false);
    setEditingPost(null);
    setShowCreateForm(false);
    setShowPublishConfirm(false);
  };

  const addRequirement = () =>
    setFormData((p) => ({ ...p, requirements: [...p.requirements, ""] }));
  const updateRequirement = (i, v) =>
    setFormData((p) => ({
      ...p,
      requirements: p.requirements.map((r, idx) => (idx === i ? v : r)),
    }));
  const removeRequirement = (i) =>
    setFormData((p) => ({
      ...p,
      requirements: p.requirements.filter((_, idx) => idx !== i),
    }));

  const filtered = posts.filter(
    (p) =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const statusChip = (status) => {
    const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
    if (status === "active") return `${base} bg-brand/10 text-brand-text border border-brand/20`;
    if (status === "inactive")
      return `${base} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20`;
    return `${base} bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20`;
  };

  const chipCls =
    "inline-flex items-center gap-1.5 rounded-lg border border-line dark:border-line bg-gray-50 dark:bg-gray-25/80 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-700";

  if (loading) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-25" />
          <div className="h-28 animate-pulse rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25" />
          <div className="h-64 animate-pulse rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25" />
        </div>
      </OrgAppShell>
    );
  }

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 py-4">
        {/* Page header card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5 card-hover">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold leading-7 text-ink">Job posts</h1>
              <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-500">
                Manage, publish, and track opportunities for candidates.
              </p>
            </div>
            {canManageHiring && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => (showCreateForm ? resetForm() : openForm(null))}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />{" "}
                {showCreateForm ? "Cancel" : "New job post"}
              </Button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/60 p-3.5 text-center shadow-s5">
              <p className="font-mono tabular-nums text-xl font-bold text-ink">{posts.length}</p>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Total posts</p>
            </div>
            <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/60 p-3.5 text-center shadow-s5">
              <p className="font-mono tabular-nums text-xl font-bold text-brand-text">
                {posts.filter((p) => p.status === "active").length}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Active</p>
            </div>
            <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/60 p-3.5 text-center shadow-s5">
              <p className="font-mono tabular-nums text-xl font-bold text-ink">
                {posts.filter((p) => p.status !== "active").length}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Inactive / closed</p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
            <Input
              type="text"
              placeholder="Search posts by title, location, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink dark:bg-transparent dark:hover:bg-gray-25"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>

        {/* Create / Edit Form Card */}
        {showCreateForm && (
          <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s5 card-hover">
            <div className="border-b border-line dark:border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">
                {editingPost ? "Edit job post" : "Create new job post"}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                Fill in the details — all fields except job title are optional.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Job title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Senior Frontend Engineer"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Select category</option>
                    <option>Software Engineering</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>Design</option>
                    <option>Product Management</option>
                    <option>Data Science</option>
                    <option>DevOps</option>
                    <option>HR</option>
                    <option>Finance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and ideal candidate…"
                  className={`${inputCls} min-h-[96px] resize-y`}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Location
                  </label>
                  <label className="mb-2 flex cursor-pointer select-none items-center gap-2 text-sm text-gray-700 dark:text-gray-600">
                    <input
                      type="checkbox"
                      checked={locRemote}
                      onChange={(e) => setLocRemote(e.target.checked)}
                      className="h-4 w-4 rounded accent-brand"
                    />
                    Remote position
                  </label>
                  <div className="relative mb-2">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                    <input
                      type="text"
                      value={locCity}
                      disabled={locRemote}
                      onChange={(e) => setLocCity(e.target.value)}
                      placeholder="City (optional)"
                      className={`${inputCls} pl-9 disabled:opacity-50`}
                    />
                  </div>
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
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Employment type
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData((p) => ({ ...p, employment_type: e.target.value }))}
                    className={inputCls}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Salary min
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                    <input
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => setFormData((p) => ({ ...p, salary_min: e.target.value }))}
                      placeholder="80000"
                      className={`${inputCls} pl-9 font-mono tabular-nums`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Salary max
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                    <input
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => setFormData((p) => ({ ...p, salary_max: e.target.value }))}
                      placeholder="120000"
                      className={`${inputCls} pl-9 font-mono tabular-nums`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Currency
                  </label>
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
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                  Application deadline
                </label>
                <div className="relative max-w-xs">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                  <input
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData((p) => ({ ...p, application_deadline: e.target.value }))}
                    className={`${inputCls} pl-9 font-mono tabular-nums`}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                  Requirements
                </label>
                <div className="space-y-2">
                  {formData.requirements.map((req, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateRequirement(idx, e.target.value)}
                        placeholder="e.g. 3+ years React experience"
                        className={inputCls}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={() => removeRequirement(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div className="pt-1">
                    <Button variant="secondary" size="sm" type="button" onClick={addRequirement}>
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Add requirement
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <Button variant="primary" type="submit">
                  {editingPost ? "Update post" : "Review and publish"}
                </Button>
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Posts list card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s5 card-hover">
          <div className="flex items-center justify-between border-b border-line dark:border-line px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Your job posts · {filtered.length}</h3>
            <span className="font-mono tabular-nums text-xs text-gray-500 dark:text-gray-500">{posts.length} total</span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No job posts yet"
              body="Create your first posting to start receiving applications."
              action={
                canManageHiring ? (
                  <Button variant="secondary" size="sm" onClick={() => openForm(null)}>
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Create post
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="divide-y divide-line dark:divide-line">
              {filtered.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/org/jobs/${post.id}`)}
                  className="cursor-pointer px-5 py-4 transition-colors hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-25/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-ink">{post.title}</h4>
                        <span className={statusChip(post.status)}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-gray-600 dark:text-gray-500">
                        {post.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {post.location && (
                          <span className={chipCls}>
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            {post.location}
                          </span>
                        )}
                        {post.employment_type && (
                          <span className={chipCls}>
                            <Briefcase className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            {post.employment_type}
                          </span>
                        )}
                        {post.category && (
                          <span className={chipCls}>
                            <Tag className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            {post.category}
                          </span>
                        )}
                        {(() => {
                          const range = formatSalaryRange(
                            post.salary_min,
                            post.salary_max,
                            post.salary_currency
                          );
                          return (
                            range && (
                              <span className={chipCls}>
                                <CreditCard className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                                <span className="font-mono tabular-nums">{range}</span>
                              </span>
                            )
                          );
                        })()}
                        {post.application_deadline && (
                          <span className={chipCls}>
                            <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            <span className="font-mono tabular-nums">
                              {new Date(post.application_deadline).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    {canManageHiring && (
                      <div className="ml-4 flex shrink-0 gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(post);
                          }}
                          aria-label={`Edit ${post.title}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post.id);
                          }}
                          aria-label={`Delete ${post.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review & Publish confirmation modal */}
      {showPublishConfirm && !editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s15">
            <div className="border-b border-line dark:border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Publish this job post?</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Review the details — candidates will see this role immediately.
              </p>
            </div>
            <dl className="max-h-[50vh] space-y-2.5 overflow-y-auto px-5 py-4 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                  Title
                </dt>
                <dd className="font-semibold text-ink">{formData.title || "—"}</dd>
              </div>
              {formData.category && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                    Category
                  </dt>
                  <dd className="text-gray-700 dark:text-gray-600">{formData.category}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                  Location
                </dt>
                <dd className="text-gray-700 dark:text-gray-600">
                  {joinLocation({ city: locCity, country: locCountry, remote: locRemote }) || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                  Type
                </dt>
                <dd className="text-gray-700 dark:text-gray-600">{formData.employment_type}</dd>
              </div>
              {formatSalaryRange(formData.salary_min, formData.salary_max, formData.salary_currency) && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                    Salary
                  </dt>
                  <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-600">
                    {formatSalaryRange(
                      formData.salary_min,
                      formData.salary_max,
                      formData.salary_currency
                    )}
                  </dd>
                </div>
              )}
              {formData.application_deadline && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                    Deadline
                  </dt>
                  <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-600">
                    {new Date(formData.application_deadline).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                  Status
                </dt>
                <dd className="capitalize text-gray-700 dark:text-gray-600">{formData.status}</dd>
              </div>
              {formData.requirements.filter((r) => r.trim()).length > 0 && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500">
                    Requires
                  </dt>
                  <dd className="text-gray-700 dark:text-gray-600">
                    <span className="font-mono tabular-nums">{formData.requirements.filter((r) => r.trim()).length}</span> requirement(s)
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex gap-2.5 border-t border-line dark:border-line px-5 py-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={doSave}
                disabled={saving}
              >
                {saving ? "Publishing…" : "Publish post"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPublishConfirm(false)}
                disabled={saving}
              >
                Back to edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s15">
            <h3 className="text-sm font-semibold text-ink">Confirm delete</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">
              Are you sure you want to delete this job post? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="danger" className="flex-1" onClick={confirmDelete}>
                Delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPostToDelete(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </OrgAppShell>
  );
}
