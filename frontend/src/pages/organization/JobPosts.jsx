import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import {
  FiBriefcase,
  FiMapPin,
  FiTag,
  FiDollarSign,
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiClock,
} from "react-icons/fi";

export default function JobPosts() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ title: "", description: "", location: "", employment_type: "Full-time", category: "", salary_min: "", salary_max: "", salary_currency: "USD", requirements: [], application_deadline: "", status: "active" });
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => { (async () => { const user = await verifyTokenWithServer(); if (user?.organization_id) setOrganizationId(user.organization_id); })(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setPosts((await res.json()).data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPost ? `${getBackendUrl()}/api/posts/${editingPost.id}` : `${getBackendUrl()}/api/posts`;
      const method = editingPost ? "PUT" : "POST";
      const orgId = editingPost?.organization_id ?? organizationId;
      if (!orgId) { showToast({ message: "Unable to determine your organization. Please sign in again.", type: "error" }); return; }
      const payload = { ...formData, organization_id: orgId, requirements: formData.requirements.filter((r) => r.trim()) };
      const res = await fetch(url, { method, headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(payload) });
      if (res.ok) { await fetchPosts(); resetForm(); showToast({ message: editingPost ? "Job post updated!" : "Job post created!", type: "success" }); } else showToast({ message: (await res.json().catch(() => ({})))?.error || "Failed to save", type: "error" });
    } catch { showToast({ message: "Failed to save job post", type: "error" }); }
  };
  const handleDelete = async (postId) => { setPostToDelete(postId); setShowDeleteConfirm(true); };
  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts/${postToDelete}`, { method: "DELETE", credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { await fetchPosts(); setShowDeleteConfirm(false); setPostToDelete(null); showToast({ message: "Deleted", type: "success" }); } else showToast({ message: "Failed to delete", type: "error" });
    } catch { showToast({ message: "Failed to delete", type: "error" }); }
  };
  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({ title: post.title || "", description: post.description || "", location: post.location || "", employment_type: post.employment_type || "Full-time", category: post.category || "", salary_min: post.salary_min || "", salary_max: post.salary_max || "", salary_currency: post.salary_currency || "USD", requirements: post.requirements || [], application_deadline: post.application_deadline || "", status: post.status || "active" });
    setShowCreateForm(true);
  };
  const resetForm = () => { setFormData({ title: "", description: "", location: "", employment_type: "Full-time", category: "", salary_min: "", salary_max: "", salary_currency: "USD", requirements: [], application_deadline: "", status: "active" }); setEditingPost(null); setShowCreateForm(false); };
  const addRequirement = () => setFormData((p) => ({ ...p, requirements: [...p.requirements, ""] }));
  const updateRequirement = (i, v) => setFormData((p) => ({ ...p, requirements: p.requirements.map((r, idx) => (idx === i ? v : r)) }));
  const removeRequirement = (i) => setFormData((p) => ({ ...p, requirements: p.requirements.filter((_, idx) => idx !== i) }));

  const filtered = posts.filter((p) => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-44 animate-pulse" />
          <div className="bg-white border border-gray-200 h-64 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiBriefcase className="w-3.5 h-3.5" />
                JOB POSTS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Job posts</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Manage and publish opportunities for candidates.</p>
              <div className="mt-4 relative max-w-xl">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search posts by title, location, category…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-9 py-3 bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500"><FiX className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:w-[340px]">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">{posts.length}</p>
                  <p className="text-xs text-gray-300 mt-1">Total</p>
                </div>
                <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                  <p className="text-2xl font-bold text-green-200">{posts.filter((p) => p.status === "active").length}</p>
                  <p className="text-xs text-green-200 mt-1">Active</p>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">{posts.filter((p) => p.status !== "active").length}</p>
                  <p className="text-xs text-gray-300 mt-1">Other</p>
                </div>
              </div>
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-3 text-sm font-medium hover:bg-gray-100 transition-colors">
                <FiPlus className="w-4 h-4" /> {showCreateForm ? "Cancel" : "New job post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{editingPost ? "Edit job post" : "Create new job post"}</h3>
            <p className="text-xs text-gray-500 mt-1">Fill in the details — all fields except title are optional.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Job title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea rows={4} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the role, responsibilities, and ideal candidate…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} placeholder="Remote or City, Country" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Employment type</label>
                <select value={formData.employment_type} onChange={(e) => setFormData((p) => ({ ...p, employment_type: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Salary min</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="number" value={formData.salary_min} onChange={(e) => setFormData((p) => ({ ...p, salary_min: e.target.value }))} placeholder="80000" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Salary max</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="number" value={formData.salary_max} onChange={(e) => setFormData((p) => ({ ...p, salary_max: e.target.value }))} placeholder="120000" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Currency</label>
                <select value={formData.salary_currency} onChange={(e) => setFormData((p) => ({ ...p, salary_currency: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>CAD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Application deadline</label>
              <div className="relative max-w-xs">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="date" value={formData.application_deadline} onChange={(e) => setFormData((p) => ({ ...p, application_deadline: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Requirements</label>
              <div className="space-y-2">
                {formData.requirements.map((req, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={req} onChange={(e) => updateRequirement(idx, e.target.value)} placeholder="e.g. 3+ years React experience" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                    <button type="button" onClick={() => removeRequirement(idx)} className="px-3 py-2 bg-white border border-red-200 text-red-600 text-sm hover:bg-red-50">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={addRequirement} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiPlus className="w-4 h-4" /> Add requirement</button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">{editingPost ? "Update post" : "Create post"}</button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Your job posts • {filtered.length}</h3>
          <span className="text-xs text-gray-500">{posts.length} total</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3"><FiBriefcase className="w-6 h-6 text-gray-400" /></div>
            <p className="text-sm text-gray-500">No job posts yet. Create your first posting!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((post) => (
              <div key={post.id} className="p-5 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-semibold text-gray-900">{post.title}</h4>
                      <span className={`text-xs font-medium border px-2 py-0.5 ${post.status === "active" ? "bg-green-50 text-green-700 border-green-200" : post.status === "inactive" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>{post.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.location && <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1"><FiMapPin className="w-3 h-3" />{post.location}</span>}
                      {post.employment_type && <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1"><FiBriefcase className="w-3 h-3" />{post.employment_type}</span>}
                      {post.category && <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1"><FiTag className="w-3 h-3" />{post.category}</span>}
                      {post.salary_min && post.salary_max && <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1"><FiDollarSign className="w-3 h-3" />${post.salary_min} - ${post.salary_max} {post.salary_currency}</span>}
                      {post.application_deadline && <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-1"><FiCalendar className="w-3 h-3" />{new Date(post.application_deadline).toLocaleDateString()}</span>}
                    </div>
                    {post.requirements && post.requirements.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{post.requirements.slice(0, 3).map((r, j) => <span key={j} className="text-xs bg-white border border-gray-200 px-2 py-1 text-gray-600">{r}</span>)} {post.requirements.length > 3 && <span className="text-xs text-gray-500">+{post.requirements.length - 3}</span>}</div>}
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-4">
                    <button onClick={() => handleEdit(post)} className="p-2 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(post.id)} className="p-2 bg-white border border-gray-200 text-red-600 hover:bg-red-50"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900">Confirm delete</h3>
            <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this job post? This cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-2.5 text-sm font-medium hover:bg-red-700">Delete</button>
              <button onClick={() => { setShowDeleteConfirm(false); setPostToDelete(null); }} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
