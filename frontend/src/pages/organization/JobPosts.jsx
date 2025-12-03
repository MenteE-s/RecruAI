import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, verifyTokenWithServer } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";

export default function JobPosts() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
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
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const user = await verifyTokenWithServer();
      if (user?.organization_id) {
        setOrganizationId(user.organization_id);
      }
    };
    loadProfile();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts";
      const method = editingPost ? "PUT" : "POST";

      const orgId = editingPost?.organization_id ?? organizationId;
      if (!orgId) {
        showToast({
          message:
            "Unable to determine your organization. Please sign in again or contact support.",
          type: "error",
        });
        return;
      }

      const payload = {
        ...formData,
        organization_id: orgId,
        requirements: formData.requirements.filter((req) => req.trim()),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchPosts();
        resetForm();
        showToast({
          message: editingPost
            ? "Job post updated successfully!"
            : "Job post created successfully!",
          type: "success",
        });
      } else {
        const errorPayload = await response.json().catch(() => null);
        const errorMessage = errorPayload?.error || "Failed to save job post";
        showToast({
          message: errorMessage,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving post:", error);
      showToast({
        message: "Failed to save job post",
        type: "error",
      });
    }
  };

  const handleDelete = async (postId) => {
    setPostToDelete(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/posts/${postToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchPosts();
        setShowDeleteConfirm(false);
        setPostToDelete(null);
        showToast({
          message: "Job post deleted successfully",
          type: "success",
        });
      } else {
        showToast({
          message: "Failed to delete job post",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast({
        message: "Failed to delete job post",
        type: "error",
      });
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      description: post.description || "",
      location: post.location || "",
      employment_type: post.employment_type || "Full-time",
      category: post.category || "",
      salary_min: post.salary_min || "",
      salary_max: post.salary_max || "",
      salary_currency: post.salary_currency || "USD",
      requirements: post.requirements || [],
      application_deadline: post.application_deadline || "",
      status: post.status || "active",
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
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
    setEditingPost(null);
    setShowCreateForm(false);
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const updateRequirement = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? value : req
      ),
    }));
  };

  const removeRequirement = (index) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Job Posts
              </h1>
              <p className="mt-1 text-white/90">
                Manage and publish job opportunities
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 font-medium"
            >
              {showCreateForm ? "Cancel" : "+ New Job Post"}
            </button>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPost ? "Edit Job Post" : "Create New Job Post"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Category</option>
                  <option value="Software Engineering">
                    Software Engineering
                  </option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Design">Design</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Data Science">Data Science</option>
                  <option value="DevOps">DevOps</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employment_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Min
                </label>
                <input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salary_min: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="80000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Max
                </label>
                <input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salary_max: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="120000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.salary_currency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salary_currency: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.application_deadline}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    application_deadline: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 3+ years of React experience"
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md border border-indigo-200"
              >
                + Add Requirement
              </button>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingPost ? "Update Post" : "Create Post"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Job Posts</h3>
          <span className="text-sm text-gray-500">{posts.length} posts</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No job posts yet. Create your first job posting!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {post.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          post.status === "active"
                            ? "bg-green-100 text-green-800"
                            : post.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{post.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {post.location && <span>📍 {post.location}</span>}
                      {post.employment_type && (
                        <span>💼 {post.employment_type}</span>
                      )}
                      {post.category && <span>🏷️ {post.category}</span>}
                      {post.salary_min && post.salary_max && (
                        <span>
                          💰 ${post.salary_min} - ${post.salary_max}{" "}
                          {post.salary_currency}
                        </span>
                      )}
                      {post.application_deadline && (
                        <span>
                          ⏰ Deadline:{" "}
                          {new Date(
                            post.application_deadline
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {post.requirements && post.requirements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          Requirements:
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {post.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(post)}
                      className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job post? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPostToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
