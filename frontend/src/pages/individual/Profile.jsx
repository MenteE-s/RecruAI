import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import {
  FiPlus,
  FiX,
  FiEdit2,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiBook,
  FiCode,
  FiFileText,
  FiUsers,
  FiBriefcase,
  FiCheck,
  FiX as FiXIcon,
  FiTrash2,
} from "react-icons/fi";

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiXIcon size={24} />
        </button>
      </div>
    </div>
  );
};

// Item Modal for adding/editing individual items
const ItemModal = ({ isOpen, onClose, itemType, itemData, onSave, saving }) => {
  const [formData, setFormData] = useState(
    itemData || {
      title: "",
      company: "",
      location: "",
      description: "",
      start_date: "",
      end_date: "",
      degree: "",
      school: "",
      field: "",
      year: "",
      name: "",
      level: "beginner",
      technologies: [],
      github_url: "",
      demo_url: "",
      journal: "",
      authors: [],
      publication_url: "",
      doi: "",
    }
  );

  useEffect(() => {
    if (itemData) {
      setFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        start_date: "",
        end_date: "",
        degree: "",
        school: "",
        field: "",
        year: "",
        name: "",
        level: "beginner",
        technologies: [],
        github_url: "",
        demo_url: "",
        journal: "",
        authors: [],
        publication_url: "",
        doi: "",
        ...itemData,
      });
    } else {
      setFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        start_date: "",
        end_date: "",
        degree: "",
        school: "",
        field: "",
        year: "",
        name: "",
        level: "beginner",
        technologies: [],
        github_url: "",
        demo_url: "",
        journal: "",
        authors: [],
        publication_url: "",
        doi: "",
      });
    }
  }, [itemData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderForm = () => {
    switch (itemType) {
      case "experiences":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Job Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Company"
              value={formData.company || ""}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                placeholder="Start Date"
                value={formData.start_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="End Date"
                value={formData.end_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              placeholder="Job Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "educations":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Degree (e.g., Bachelor's in Computer Science)"
              value={formData.degree || ""}
              onChange={(e) =>
                setFormData({ ...formData, degree: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="School/University"
              value={formData.school || ""}
              onChange={(e) =>
                setFormData({ ...formData, school: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Field of Study"
              value={formData.field || ""}
              onChange={(e) =>
                setFormData({ ...formData, field: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                placeholder="Start Date"
                value={formData.start_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="End Date"
                value={formData.end_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case "skills":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Skill Name (e.g., JavaScript, Python)"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.level || "beginner"}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        );

      case "projects":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Project Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <input
              type="text"
              placeholder="Technologies (comma-separated)"
              value={
                Array.isArray(formData.technologies)
                  ? formData.technologies.join(", ")
                  : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  technologies: e.target.value
                    ? e.target.value.split(",").map((t) => t.trim())
                    : [],
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="url"
                placeholder="GitHub URL"
                value={formData.github_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, github_url: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Demo URL"
                value={formData.demo_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, demo_url: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case "publications":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Publication Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Journal/Conference"
              value={formData.journal || ""}
              onChange={(e) =>
                setFormData({ ...formData, journal: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Authors (comma-separated)"
              value={
                Array.isArray(formData.authors)
                  ? formData.authors.join(", ")
                  : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  authors: e.target.value
                    ? e.target.value.split(",").map((a) => a.trim())
                    : [],
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Year"
              value={formData.year || ""}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="Publication URL"
              value={formData.publication_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, publication_url: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {itemData ? "Edit" : "Add"} {itemType.slice(0, -1)}
      </h2>
      <form onSubmit={handleSubmit}>
        {renderForm()}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : itemData ? (
              "Update"
            ) : (
              "Add"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function Profile() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  // State for profile data
  const [profileData, setProfileData] = useState({
    about: { summary: "" },
    experiences: [],
    educations: [],
    skills: [],
    projects: [],
    publications: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Load profile data from backend
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Load all profile data in parallel
        const [aboutRes, expRes, eduRes, skillsRes, projectsRes, pubRes] =
          await Promise.all([
            fetch("/api/profile/sections", { credentials: "include" }),
            fetch("/api/profile/experiences", { credentials: "include" }),
            fetch("/api/profile/education", { credentials: "include" }),
            fetch("/api/profile/skills", { credentials: "include" }),
            fetch("/api/profile/projects", { credentials: "include" }),
            fetch("/api/profile/publications", { credentials: "include" }),
          ]);

        const [aboutData, expData, eduData, skillsData, projectsData, pubData] =
          await Promise.all([
            aboutRes.ok ? aboutRes.json() : { sections: [] },
            expRes.ok ? expRes.json() : { experiences: [] },
            eduRes.ok ? eduRes.json() : { education: [] },
            skillsRes.ok ? skillsRes.json() : { skills: [] },
            projectsRes.ok ? projectsRes.json() : { projects: [] },
            pubRes.ok ? pubRes.json() : { publications: [] },
          ]);

        // Update state with loaded data
        setProfileData({
          about: aboutData.sections.find((s) => s.section_type === "about")
            ?.section_data || { summary: "" },
          experiences: expData.experiences || [],
          educations: eduData.education || [],
          skills: skillsData.skills || [],
          projects: projectsData.projects || [],
          publications: pubData.publications || [],
        });
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const addItem = (sectionType) => {
    setEditingItem({ type: sectionType, data: null });
  };

  const editItem = (sectionType, item, index) => {
    setEditingItem({ type: sectionType, data: item, index });
  };

  const removeItem = (sectionType, index) => {
    setShowDeleteConfirm({ type: sectionType, index });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    const { type, index } = showDeleteConfirm;
    const item = profileData[type][index];

    if (!item || !item.id) {
      // Remove from local state only
      setProfileData((prev) => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index),
      }));
      setShowDeleteConfirm(null);
      return;
    }

    try {
      let endpoint = "";
      if (type === "experiences")
        endpoint = `/api/profile/experiences/${item.id}`;
      else if (type === "educations")
        endpoint = `/api/profile/education/${item.id}`;
      else if (type === "skills") endpoint = `/api/profile/skills/${item.id}`;
      else if (type === "projects")
        endpoint = `/api/profile/projects/${item.id}`;
      else if (type === "publications")
        endpoint = `/api/profile/publications/${item.id}`;

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          setProfileData((prev) => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index),
          }));
          setShowDeleteConfirm(null);
        } else {
          setError("Failed to delete item");
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Network error. Please try again.");
    }
  };

  const saveItem = async (itemData) => {
    if (!editingItem) return;

    setSaving(true);
    setError(null);

    try {
      const { type, data: existingItem } = editingItem;
      let endpoint = `/api/profile/${type}`;
      let method = existingItem ? "PUT" : "POST";
      let body = itemData;

      if (existingItem && existingItem.id) {
        if (type === "experiences") endpoint += `/${existingItem.id}`;
        else if (type === "educations") endpoint += `/${existingItem.id}`;
        // For skills, projects, publications, we might need different handling
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData((prev) => {
          const newData = { ...prev };
          if (existingItem) {
            // Update existing
            const index = editingItem.index;
            newData[type] = [...newData[type]];
            newData[type][index] =
              result.experience ||
              result.education ||
              result.skill ||
              result.project ||
              result.publication ||
              result;
          } else {
            // Add new
            newData[type] = [
              ...newData[type],
              result.experience ||
                result.education ||
                result.skill ||
                result.project ||
                result.publication ||
                result,
            ];
          }
          return newData;
        });
        setEditingItem(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveAbout = async (aboutData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section_type: "about",
          section_data: aboutData,
          order_index: 0,
        }),
      });

      if (response.ok) {
        setProfileData((prev) => ({ ...prev, about: aboutData }));
        setEditingItem(null);
      } else {
        setError("Failed to save about section");
      }
    } catch (error) {
      console.error("Error saving about:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                My Profile
              </h1>
              <p className="mt-1 text-white/90">
                Build your professional profile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* About Section */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiUsers className="mr-2" />
              About
            </h3>
            <button
              onClick={() =>
                setEditingItem({ type: "about", data: profileData.about })
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <FiEdit2 size={16} />
            </button>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {profileData.about.summary || "Tell us about yourself..."}
          </p>
        </Card>

        {/* Experience Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiBriefcase className="mr-2" />
              Experience
            </h3>
            <button
              onClick={() => addItem("experiences")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {profileData.experiences.length === 0 ? (
            <p className="text-gray-500 text-sm">No experience added yet</p>
          ) : (
            <div className="space-y-3">
              {profileData.experiences.map((exp, index) => (
                <div
                  key={exp.id || index}
                  className="border-l-2 border-blue-200 pl-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exp.title}</h4>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="text-xs text-gray-500">{exp.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("experiences", exp, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("experiences", index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Education Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiBook className="mr-2" />
              Education
            </h3>
            <button
              onClick={() => addItem("educations")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {profileData.educations.length === 0 ? (
            <p className="text-gray-500 text-sm">No education added yet</p>
          ) : (
            <div className="space-y-3">
              {profileData.educations.map((edu, index) => (
                <div
                  key={edu.id || index}
                  className="border-l-2 border-green-200 pl-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {edu.degree}
                      </h4>
                      <p className="text-sm text-gray-600">{edu.school}</p>
                      <p className="text-xs text-gray-500">{edu.field}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("educations", edu, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("educations", index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Skills Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiCode className="mr-2" />
              Skills
            </h3>
            <button
              onClick={() => addItem("skills")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {profileData.skills.length === 0 ? (
            <p className="text-gray-500 text-sm">No skills added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <span
                  key={skill.id || index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill.name}
                  <button
                    onClick={() => removeItem("skills", index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Projects Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiFileText className="mr-2" />
              Projects
            </h3>
            <button
              onClick={() => addItem("projects")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {profileData.projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects added yet</p>
          ) : (
            <div className="space-y-3">
              {profileData.projects.map((project, index) => (
                <div key={project.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("projects", project, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("projects", index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Publications Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiAward className="mr-2" />
              Publications
            </h3>
            <button
              onClick={() => addItem("publications")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {profileData.publications.length === 0 ? (
            <p className="text-gray-500 text-sm">No publications added yet</p>
          ) : (
            <div className="space-y-3">
              {profileData.publications.map((pub, index) => (
                <div key={pub.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{pub.title}</h4>
                      <p className="text-sm text-gray-600">
                        {pub.journal} ({pub.year})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("publications", pub, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("publications", index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Item Modal */}
      {editingItem && editingItem.type !== "about" && (
        <ItemModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          itemType={editingItem.type}
          itemData={editingItem.data}
          onSave={saveItem}
          saving={saving}
        />
      )}

      {/* About Modal */}
      {editingItem && editingItem.type === "about" && (
        <Modal isOpen={true} onClose={() => setEditingItem(null)}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Edit About</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              saveAbout({ summary: formData.get("summary") });
            }}
          >
            <textarea
              name="summary"
              defaultValue={editingItem.data?.summary || ""}
              placeholder="Tell us about yourself..."
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              required
            />
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Item</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteConfirm(null)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
