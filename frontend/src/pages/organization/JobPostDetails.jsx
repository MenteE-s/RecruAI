import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import {
  FiBriefcase,
  FiMapPin,
  FiTag,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiUsers,
  FiEye,
} from "react-icons/fi";

export default function JobPostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    employment_type: "Full-time",
    category: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "USD",
    requirements: [],
    application_deadline: "",
    status: "active",
  });

  useEffect(() => {
    fetchPost();
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
        setFormData({
          title: p.title || "",
          description: p.description || "",
          location: p.location || "",
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
      const payload = { ...formData, requirements: formData.requirements.filter((r) => r.trim()) };
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
        navigate("/organization/jobs");
      } else showToast({ message: "Failed to delete", type: "error" });
    } catch {
      showToast({ message: "Failed to delete", type: "error" });
    }
  };

  const updateRequirement = (i, v) => setFormData((p) => ({ ...p, requirements: p.requirements.map((r, idx) => (idx === i ? v : r)) }));
  const addRequirement = () => setFormData((p) => ({ ...p, requirements: [...p.requirements, ""] }));
  const removeRequirement = (i) => setFormData((p) => ({ ...p, requirements: p.requirements.filter((_, idx) => idx !== i) }));

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 w-32 animate-pulse" />
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="bg-white border border-gray-200 h-64 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Job post not found</p>
          <button onClick={() => navigate("/organization/jobs")} className="mt-4 text-sm text-blue-600 hover:text-blue-700">
            Back to jobs
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <button onClick={() => navigate("/organization/jobs")} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <FiArrowLeft className="w-4 h-4" /> Back to job posts
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{post.title}</h1>
                <span className={`text-xs font-medium border px-2 py-1 ${post.status === "active" ? "bg-green-500 text-white border-green-500" : post.status === "inactive" ? "bg-amber-500 text-white border-amber-500" : "bg-red-500 text-white border-red-500"}`}>
                  {post.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.location && <span className="inline-flex items-center gap-1 text-xs bg-white/10 border border-white/20 px-2.5 py-1"><FiMapPin className="w-3 h-3" />{post.location}</span>}
                {post.employment_type && <span className="inline-flex items-center gap-1 text-xs bg-white/10 border border-white/20 px-2.5 py-1"><FiBriefcase className="w-3 h-3" />{post.employment_type}</span>}
                {post.category && <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 border border-blue-400/30 px-2.5 py-1 text-blue-200"><FiTag className="w-3 h-3" />{post.category}</span>}
                {post.salary_min && post.salary_max && <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-emerald-200"><FiDollarSign className="w-3 h-3" />${post.salary_min} - ${post.salary_max} {post.salary_currency}</span>}
                {post.application_deadline && <span className="inline-flex items-center gap-1 text-xs bg-white/10 border border-white/20 px-2.5 py-1"><FiCalendar className="w-3 h-3" />Deadline {new Date(post.application_deadline).toLocaleDateString()}</span>}
              </div>
              <p className="text-sm text-gray-300 mt-4 max-w-2xl line-clamp-3">{post.description}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => setEditing(!editing)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100">
                <FiEdit2 className="w-4 h-4" /> {editing ? "Cancel edit" : "Edit"}
              </button>
              <button onClick={handleDelete} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                <FiTrash2 className="w-4 h-4" /> Delete
              </button>
              <Link to={`/organization/candidates`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 text-center">
                <FiUsers className="w-4 h-4" /> View applicants
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{post.description || "No description"}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiEye className="w-4 h-4 text-gray-500" /> Details</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Location</p><p className="font-medium text-gray-900 mt-1">{post.location || "—"}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Employment type</p><p className="font-medium text-gray-900 mt-1">{post.employment_type || "—"}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Category</p><p className="font-medium text-gray-900 mt-1">{post.category || "—"}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Salary</p><p className="font-medium text-gray-900 mt-1">{post.salary_min && post.salary_max ? `$${post.salary_min} - $${post.salary_max} ${post.salary_currency}` : "—"}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Deadline</p><p className="font-medium text-gray-900 mt-1 flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5 text-gray-400" />{post.application_deadline ? new Date(post.application_deadline).toLocaleDateString() : "—"}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wider">Status</p><p className="font-medium mt-1"><span className={`inline-flex px-2 py-1 text-xs border ${post.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{post.status}</span></p></div>
            </div>
          </div>
          {post.requirements && post.requirements.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900">Requirements</h3>
              <ul className="mt-3 space-y-2">
                {post.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 shrink-0" />{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900">Quick actions</h3>
            <div className="mt-4 space-y-2">
              <button onClick={() => setEditing(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><FiEdit2 className="w-4 h-4" /> Edit job</button>
              <button onClick={handleDelete} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"><FiTrash2 className="w-4 h-4" /> Delete post</button>
              <Link to="/organization/pipeline" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"><FiUsers className="w-4 h-4" /> View pipeline</Link>
            </div>
          </div>
          <div className="bg-blue-600 text-white p-6">
            <h3 className="text-sm font-semibold">Need more applicants?</h3>
            <p className="text-sm text-blue-50 mt-1">Share this post or boost visibility to reach more candidates.</p>
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="mt-3 w-full bg-white text-blue-600 py-2.5 text-sm font-medium hover:bg-blue-50">Copy link</button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Edit job post</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-gray-100 text-gray-500"><FiX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea rows={4} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Salary min</label>
                  <input type="number" value={formData.salary_min} onChange={(e) => setFormData((p) => ({ ...p, salary_min: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Salary max</label>
                  <input type="number" value={formData.salary_max} onChange={(e) => setFormData((p) => ({ ...p, salary_max: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Currency</label>
                  <select value={formData.salary_currency} onChange={(e) => setFormData((p) => ({ ...p, salary_currency: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>CAD</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
                <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function FiX(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
