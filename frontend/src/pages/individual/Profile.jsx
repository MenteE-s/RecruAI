import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, getUploadUrl } from "../../utils/auth";
import {
  FiPlus,
  FiX,
  FiEdit2,
  FiAward,
  FiBook,
  FiCode,
  FiFileText,
  FiUsers,
  FiBriefcase,
  FiCheck,
  FiX as FiXIcon,
  FiTrash2,
  FiCamera,
  FiUser,
} from "react-icons/fi";

// Date formatting utility
const formatDate = (dateString, format = "year") => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  switch (format) {
    case "full":
      return date.toLocaleDateString();
    case "year":
    default:
      return date.getFullYear().toString();
  }
};

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
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
        issuer: "",
        date: "",
        date_obtained: "",
        expiry_date: "",
        credential_id: "",
        proficiency_level: "beginner",
        organization: "",
        duration: "",
        membership_id: "",
        patent_number: "",
        filing_date: "",
        grant_date: "",
        inventors: [],
        provider: "",
        completion_date: "",
        platform: "",
        url: "",
        username: "",
        email: "",
        phone: "",
        relationship: "",
        category: "",
        event_name: "",
        event_type: "",
        audience_size: "",
        issuing_authority: "",
        license_number: "",
        issue_date: "",
        is_active: true,
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
        issuer: "",
        date: "",
        date_obtained: "",
        expiry_date: "",
        credential_id: "",
        proficiency_level: "beginner",
        organization: "",
        duration: "",
        membership_id: "",
        patent_number: "",
        filing_date: "",
        grant_date: "",
        inventors: [],
        provider: "",
        completion_date: "",
        platform: "",
        url: "",
        username: "",
        email: "",
        phone: "",
        relationship: "",
        category: "",
        event_name: "",
        event_type: "",
        audience_size: "",
        issuing_authority: "",
        license_number: "",
        issue_date: "",
        is_active: true,
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
            <select
              value={formData.employment_type || ""}
              onChange={(e) =>
                setFormData({ ...formData, employment_type: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Employment Type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
              <option value="apprenticeship">Apprenticeship</option>
            </select>
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
            <input
              type="text"
              placeholder="GPA (optional)"
              value={formData.gpa || ""}
              onChange={(e) =>
                setFormData({ ...formData, gpa: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Achievements/Awards (optional)"
              value={formData.achievements || ""}
              onChange={(e) =>
                setFormData({ ...formData, achievements: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
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
            <input
              type="number"
              placeholder="Years of Experience (optional)"
              value={formData.years_experience || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  years_experience: parseInt(e.target.value) || null,
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="0"
            />
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

      case "awards":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Award Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Issuer/Organization"
              value={formData.issuer || ""}
              onChange={(e) =>
                setFormData({ ...formData, issuer: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="date"
              placeholder="Date Received"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "certifications":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Certification Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Issuer/Organization"
              value={formData.issuer || ""}
              onChange={(e) =>
                setFormData({ ...formData, issuer: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                placeholder="Date Obtained"
                value={formData.date_obtained || ""}
                onChange={(e) =>
                  setFormData({ ...formData, date_obtained: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="Expiry Date"
                value={formData.expiry_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Credential ID"
              value={formData.credential_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, credential_id: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case "languages":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Language Name (e.g., English, Spanish)"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.proficiency_level || "beginner"}
              onChange={(e) =>
                setFormData({ ...formData, proficiency_level: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="native">Native</option>
            </select>
          </div>
        );

      case "volunteerExperiences":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Role/Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Organization"
              value={formData.organization || ""}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
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
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "references":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Title/Position"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Company/Organization"
              value={formData.company || ""}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Relationship (e.g., Former Manager)"
              value={formData.relationship || ""}
              onChange={(e) =>
                setFormData({ ...formData, relationship: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case "hobbyInterests":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Hobby/Interest Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "professionalMemberships":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Organization Name"
              value={formData.organization || ""}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Membership ID (optional)"
              value={formData.membership_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, membership_id: e.target.value })
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
              placeholder="Description (optional)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "patents":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Patent Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Patent Number"
              value={formData.patent_number || ""}
              onChange={(e) =>
                setFormData({ ...formData, patent_number: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                placeholder="Filing Date"
                value={formData.filing_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, filing_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="Grant Date"
                value={formData.grant_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, grant_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Inventors (comma-separated)"
              value={
                Array.isArray(formData.inventors)
                  ? formData.inventors.join(", ")
                  : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  inventors: e.target.value
                    ? e.target.value.split(",").map((i) => i.trim())
                    : [],
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "courseTrainings":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Course/Training Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Provider/Platform"
              value={formData.provider || ""}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="Completion Date"
              value={formData.completion_date || ""}
              onChange={(e) =>
                setFormData({ ...formData, completion_date: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Credential ID"
              value={formData.credential_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, credential_id: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "socialMediaLinks":
        return (
          <div className="space-y-4">
            <select
              value={formData.platform || ""}
              onChange={(e) =>
                setFormData({ ...formData, platform: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Platform</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter</option>
              <option value="GitHub">GitHub</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="Website">Personal Website</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="url"
              placeholder="Profile URL"
              value={formData.url || ""}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Username/Handle (optional)"
              value={formData.username || ""}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case "keyAchievements":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Achievement Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.category || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="Professional">Professional</option>
              <option value="Academic">Academic</option>
              <option value="Personal">Personal</option>
              <option value="Community">Community</option>
            </select>
            <input
              type="date"
              placeholder="Date Achieved"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "conferences":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Conference/Seminar Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.role || ""}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Role</option>
              <option value="Attendee">Attendee</option>
              <option value="Speaker">Speaker</option>
              <option value="Organizer">Organizer</option>
              <option value="Panelist">Panelist</option>
              <option value="Moderator">Moderator</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="Date"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "speakingEngagements":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Presentation/Speech Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Event Name"
              value={formData.event_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, event_name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.event_type || ""}
              onChange={(e) =>
                setFormData({ ...formData, event_type: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Event Type</option>
              <option value="Conference">Conference</option>
              <option value="Webinar">Webinar</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Meetup">Meetup</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="Date"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Audience Size (optional)"
              value={formData.audience_size || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  audience_size: parseInt(e.target.value) || null,
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <textarea
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      case "licenses":
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="License Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Issuing Authority"
              value={formData.issuing_authority || ""}
              onChange={(e) =>
                setFormData({ ...formData, issuing_authority: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="License Number"
              value={formData.license_number || ""}
              onChange={(e) =>
                setFormData({ ...formData, license_number: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                placeholder="Issue Date"
                value={formData.issue_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="Expiry Date"
                value={formData.expiry_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
                className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="mr-2"
              />
              License is currently active
            </label>
            <textarea
              placeholder="Description (optional)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4" id="modal-title">
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
    awards: [],
    certifications: [],
    languages: [],
    volunteerExperiences: [],
    references: [],
    hobbyInterests: [],
    professionalMemberships: [],
    patents: [],
    courseTrainings: [],
    socialMediaLinks: [],
    keyAchievements: [],
    conferences: [],
    speakingEngagements: [],
    licenses: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [userData, setUserData] = useState(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);

  // Load user data and profile data from backend
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    const loadProfileData = async () => {
      try {
        // Load all profile data in parallel
        const [
          aboutRes,
          expRes,
          eduRes,
          skillsRes,
          projectsRes,
          pubRes,
          awardsRes,
          certRes,
          langRes,
          volRes,
          refRes,
          hobbyRes,
          pmRes,
          patentRes,
          courseRes,
          socialRes,
          keyAchRes,
          confRes,
          speakRes,
          licRes,
        ] = await Promise.all([
          fetch("/api/profile/sections", { credentials: "include" }),
          fetch("/api/profile/experiences", { credentials: "include" }),
          fetch("/api/profile/educations", { credentials: "include" }),
          fetch("/api/profile/skills", { credentials: "include" }),
          fetch("/api/profile/projects", { credentials: "include" }),
          fetch("/api/profile/publications", { credentials: "include" }),
          fetch("/api/profile/awards", { credentials: "include" }),
          fetch("/api/profile/certifications", { credentials: "include" }),
          fetch("/api/profile/languages", { credentials: "include" }),
          fetch("/api/profile/volunteer-experiences", {
            credentials: "include",
          }),
          fetch("/api/profile/references", { credentials: "include" }),
          fetch("/api/profile/hobby-interests", { credentials: "include" }),
          fetch("/api/profile/professional-memberships", {
            credentials: "include",
          }),
          fetch("/api/profile/patents", { credentials: "include" }),
          fetch("/api/profile/course-trainings", { credentials: "include" }),
          fetch("/api/profile/social-media-links", { credentials: "include" }),
          fetch("/api/profile/key-achievements", { credentials: "include" }),
          fetch("/api/profile/conferences", { credentials: "include" }),
          fetch("/api/profile/speaking-engagements", {
            credentials: "include",
          }),
          fetch("/api/profile/licenses", { credentials: "include" }),
        ]);

        const [
          aboutData,
          expData,
          eduData,
          skillsData,
          projectsData,
          pubData,
          awardsData,
          certData,
          langData,
          volData,
          refData,
          hobbyData,
          pmData,
          patentData,
          courseData,
          socialData,
          keyAchData,
          confData,
          speakData,
          licData,
        ] = await Promise.all([
          aboutRes.ok ? aboutRes.json() : { sections: [] },
          expRes.ok ? expRes.json() : { experiences: [] },
          eduRes.ok ? eduRes.json() : { educations: [] },
          skillsRes.ok ? skillsRes.json() : { skills: [] },
          projectsRes.ok ? projectsRes.json() : { projects: [] },
          pubRes.ok ? pubRes.json() : { publications: [] },
          awardsRes.ok ? awardsRes.json() : { awards: [] },
          certRes.ok ? certRes.json() : { certifications: [] },
          langRes.ok ? langRes.json() : { languages: [] },
          volRes.ok ? volRes.json() : { volunteer_experiences: [] },
          refRes.ok ? refRes.json() : { references: [] },
          hobbyRes.ok ? hobbyRes.json() : { hobby_interests: [] },
          pmRes.ok ? pmRes.json() : { professional_memberships: [] },
          patentRes.ok ? patentRes.json() : { patents: [] },
          courseRes.ok ? courseRes.json() : { course_trainings: [] },
          socialRes.ok ? socialRes.json() : { social_media_links: [] },
          keyAchRes.ok ? keyAchRes.json() : { key_achievements: [] },
          confRes.ok ? confRes.json() : { conferences: [] },
          speakRes.ok ? speakRes.json() : { speaking_engagements: [] },
          licRes.ok ? licRes.json() : { licenses: [] },
        ]);

        // Update state with loaded data
        setProfileData({
          about: aboutData.sections.find((s) => s.section_type === "about")
            ?.section_data || { summary: "" },
          experiences: expData.experiences || [],
          educations: eduData.educations || [],
          skills: skillsData.skills || [],
          projects: projectsData.projects || [],
          publications: pubData.publications || [],
          awards: awardsData.awards || [],
          certifications: certData.certifications || [],
          languages: langData.languages || [],
          volunteerExperiences: volData.volunteer_experiences || [],
          references: refData.references || [],
          hobbyInterests: hobbyData.hobby_interests || [],
          professionalMemberships: pmData.professional_memberships || [],
          patents: patentData.patents || [],
          courseTrainings: courseData.course_trainings || [],
          socialMediaLinks: socialData.social_media_links || [],
          keyAchievements: keyAchData.key_achievements || [],
          conferences: confData.conferences || [],
          speakingEngagements: speakData.speaking_engagements || [],
          licenses: licData.licenses || [],
        });
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
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
        endpoint = `/api/profile/educations/${item.id}`;
      else if (type === "skills") endpoint = `/api/profile/skills/${item.id}`;
      else if (type === "projects")
        endpoint = `/api/profile/projects/${item.id}`;
      else if (type === "publications")
        endpoint = `/api/profile/publications/${item.id}`;
      else if (type === "awards") endpoint = `/api/profile/awards/${item.id}`;
      else if (type === "certifications")
        endpoint = `/api/profile/certifications/${item.id}`;
      else if (type === "languages")
        endpoint = `/api/profile/languages/${item.id}`;
      else if (type === "volunteerExperiences")
        endpoint = `/api/profile/volunteer-experiences/${item.id}`;
      else if (type === "references")
        endpoint = `/api/profile/references/${item.id}`;
      else if (type === "hobbyInterests")
        endpoint = `/api/profile/hobby-interests/${item.id}`;
      else if (type === "professionalMemberships")
        endpoint = `/api/profile/professional-memberships/${item.id}`;
      else if (type === "patents") endpoint = `/api/profile/patents/${item.id}`;
      else if (type === "courseTrainings")
        endpoint = `/api/profile/course-trainings/${item.id}`;
      else if (type === "socialMediaLinks")
        endpoint = `/api/profile/social-media-links/${item.id}`;
      else if (type === "keyAchievements")
        endpoint = `/api/profile/key-achievements/${item.id}`;
      else if (type === "conferences")
        endpoint = `/api/profile/conferences/${item.id}`;
      else if (type === "speakingEngagements")
        endpoint = `/api/profile/speaking-engagements/${item.id}`;
      else if (type === "licenses")
        endpoint = `/api/profile/licenses/${item.id}`;

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
        else if (type === "skills") endpoint += `/${existingItem.id}`;
        else if (type === "projects") endpoint += `/${existingItem.id}`;
        else if (type === "publications") endpoint += `/${existingItem.id}`;
        else if (type === "awards") endpoint += `/${existingItem.id}`;
        else if (type === "certifications") endpoint += `/${existingItem.id}`;
        else if (type === "languages") endpoint += `/${existingItem.id}`;
        else if (type === "volunteerExperiences")
          endpoint += `/${existingItem.id}`;
        else if (type === "references") endpoint += `/${existingItem.id}`;
        else if (type === "hobbyInterests") endpoint += `/${existingItem.id}`;
        else if (type === "professionalMemberships")
          endpoint += `/${existingItem.id}`;
        else if (type === "patents") endpoint += `/${existingItem.id}`;
        else if (type === "courseTrainings") endpoint += `/${existingItem.id}`;
        else if (type === "socialMediaLinks") endpoint += `/${existingItem.id}`;
        else if (type === "keyAchievements") endpoint += `/${existingItem.id}`;
        else if (type === "conferences") endpoint += `/${existingItem.id}`;
        else if (type === "speakingEngagements")
          endpoint += `/${existingItem.id}`;
        else if (type === "licenses") endpoint += `/${existingItem.id}`;
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
              result.award ||
              result.certification ||
              result.language ||
              result.volunteer_experience ||
              result.reference ||
              result.hobby_interest ||
              result.professional_membership ||
              result.patent ||
              result.course_training ||
              result.social_media_link ||
              result.key_achievement ||
              result.conference ||
              result.speaking_engagement ||
              result.license ||
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
                result.award ||
                result.certification ||
                result.language ||
                result.volunteer_experience ||
                result.reference ||
                result.hobby_interest ||
                result.professional_membership ||
                result.patent ||
                result.course_training ||
                result.social_media_link ||
                result.key_achievement ||
                result.conference ||
                result.speaking_engagement ||
                result.license ||
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

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploadingProfilePicture(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("profile_picture", file);

      const response = await fetch("/api/profile/upload-profile-picture", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUserData((prev) => ({
          ...prev,
          profile_picture: data.profile_picture,
        }));
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setError("Network error. Please try again.");
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse">
            <div className="text-gray-500 mb-4">Loading profile...</div>
            <div className="w-64 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
          </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiX className="mr-2" size={20} />
              <span>{error}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {userData?.profile_picture ? (
                    <img
                      src={getUploadUrl(userData.profile_picture)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser size={32} className="text-white/70" />
                  )}
                </div>
                <label
                  htmlFor="profile-picture-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors shadow-lg"
                >
                  <FiCamera size={14} className="text-gray-600" />
                </label>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={uploadingProfilePicture}
                />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-display">
                  My Profile
                </h1>
                <p className="mt-1 text-white/90">
                  Build your professional profile
                </p>
                {uploadingProfilePicture && (
                  <p className="mt-2 text-sm text-white/80">
                    Uploading profile picture...
                  </p>
                )}
              </div>
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
          {(profileData.experiences || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No experience added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.experiences || []).map((exp, index) => (
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
          {(profileData.educations || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No education added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.educations || []).map((edu, index) => (
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
          {(profileData.skills || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No skills added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profileData.skills || []).map((skill, index) => (
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
          {(profileData.projects || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No projects added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.projects || []).map((project, index) => (
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
          {(profileData.publications || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No publications added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.publications || []).map((pub, index) => (
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

        {/* Awards Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiAward className="mr-2" />
              Awards
            </h3>
            <button
              onClick={() => addItem("awards")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.awards || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No awards added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.awards || []).map((award, index) => (
                <div key={award.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {award.title}
                      </h4>
                      <p className="text-sm text-gray-600">{award.issuer}</p>
                      {award.date && (
                        <p className="text-xs text-gray-500">
                          {formatDate(award.date)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("awards", award, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("awards", index)}
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

        {/* Certifications Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiCheck className="mr-2" />
              Certifications
            </h3>
            <button
              onClick={() => addItem("certifications")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.certifications || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No certifications added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.certifications || []).map((cert, index) => (
                <div key={cert.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      {cert.date_obtained && (
                        <p className="text-xs text-gray-500">
                          Obtained: {formatDate(cert.date_obtained)}
                          {cert.expiry_date &&
                            ` - Expires: ${formatDate(cert.expiry_date)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("certifications", cert, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("certifications", index)}
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

        {/* Languages Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiCode className="mr-2" />
              Languages
            </h3>
            <button
              onClick={() => addItem("languages")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.languages || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No languages added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profileData.languages || []).map((lang, index) => (
                <span
                  key={lang.id || index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {lang.name} - {lang.proficiency_level}
                  <button
                    onClick={() => removeItem("languages", index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Volunteer Experience Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiUsers className="mr-2" />
              Volunteer Experience
            </h3>
            <button
              onClick={() => addItem("volunteerExperiences")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.volunteerExperiences || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No volunteer experience added yet
            </p>
          ) : (
            <div className="space-y-3">
              {(profileData.volunteerExperiences || []).map((vol, index) => (
                <div
                  key={vol.id || index}
                  className="border-l-2 border-purple-200 pl-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{vol.title}</h4>
                      <p className="text-sm text-gray-600">
                        {vol.organization}
                      </p>
                      <p className="text-xs text-gray-500">{vol.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editItem("volunteerExperiences", vol, index)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          removeItem("volunteerExperiences", index)
                        }
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

        {/* References Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiUsers className="mr-2" />
              References
            </h3>
            <button
              onClick={() => addItem("references")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.references || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No references added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.references || []).map((ref, index) => (
                <div key={ref.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{ref.name}</h4>
                      <p className="text-sm text-gray-600">
                        {ref.title} at {ref.company}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ref.relationship}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("references", ref, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("references", index)}
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

        {/* Hobby Interests Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiCode className="mr-2" />
              Hobby Interests
            </h3>
            <button
              onClick={() => addItem("hobbyInterests")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.hobbyInterests || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No hobby interests added yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profileData.hobbyInterests || []).map((hobby, index) => (
                <span
                  key={hobby.id || index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-800"
                >
                  {hobby.name}
                  <button
                    onClick={() => removeItem("hobbyInterests", index)}
                    className="ml-2 text-pink-600 hover:text-pink-800"
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Professional Memberships Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiBriefcase className="mr-2" />
              Professional Memberships
            </h3>
            <button
              onClick={() => addItem("professionalMemberships")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.professionalMemberships || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No professional memberships added yet
            </p>
          ) : (
            <div className="space-y-3">
              {(profileData.professionalMemberships || []).map(
                (membership, index) => (
                  <div
                    key={membership.id || index}
                    className="border rounded p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {membership.organization}
                        </h4>
                        {membership.membership_id && (
                          <p className="text-sm text-gray-600">
                            ID: {membership.membership_id}
                          </p>
                        )}
                        {(membership.start_date || membership.end_date) && (
                          <p className="text-xs text-gray-500">
                            {membership.start_date &&
                              `From: ${formatDate(membership.start_date)}`}
                            {membership.end_date &&
                              ` - To: ${formatDate(membership.end_date)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            editItem(
                              "professionalMemberships",
                              membership,
                              index
                            )
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            removeItem("professionalMemberships", index)
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </Card>

        {/* Patents Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiFileText className="mr-2" />
              Patents
            </h3>
            <button
              onClick={() => addItem("patents")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.patents || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No patents added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.patents || []).map((patent, index) => (
                <div key={patent.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {patent.title}
                      </h4>
                      {patent.patent_number && (
                        <p className="text-sm text-gray-600">
                          Patent #: {patent.patent_number}
                        </p>
                      )}
                      {(patent.filing_date || patent.grant_date) && (
                        <p className="text-xs text-gray-500">
                          {patent.filing_date &&
                            `Filed: ${formatDate(patent.filing_date)}`}
                          {patent.grant_date &&
                            ` - Granted: ${formatDate(patent.grant_date)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("patents", patent, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("patents", index)}
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

        {/* Course Trainings Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiBook className="mr-2" />
              Course Trainings
            </h3>
            <button
              onClick={() => addItem("courseTrainings")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.courseTrainings || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No course trainings added yet
            </p>
          ) : (
            <div className="space-y-3">
              {(profileData.courseTrainings || []).map((course, index) => (
                <div key={course.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {course.name}
                      </h4>
                      {course.provider && (
                        <p className="text-sm text-gray-600">
                          {course.provider}
                        </p>
                      )}
                      {course.completion_date && (
                        <p className="text-xs text-gray-500">
                          Completed:{" "}
                          {formatDate(course.completion_date, "full")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editItem("courseTrainings", course, index)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("courseTrainings", index)}
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

        {/* Social Media Links Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiCode className="mr-2" />
              Social Media Links
            </h3>
            <button
              onClick={() => addItem("socialMediaLinks")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.socialMediaLinks || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No social media links added yet
            </p>
          ) : (
            <div className="space-y-3">
              {(profileData.socialMediaLinks || []).map((link, index) => (
                <div key={link.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {link.platform}
                      </h4>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {link.url}
                      </a>
                      {link.username && (
                        <p className="text-xs text-gray-500">
                          @{link.username}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editItem("socialMediaLinks", link, index)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("socialMediaLinks", index)}
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

        {/* Key Achievements Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiAward className="mr-2" />
              Key Achievements
            </h3>
            <button
              onClick={() => addItem("keyAchievements")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.keyAchievements || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No key achievements added yet
            </p>
          ) : (
            <div className="space-y-3">
              {(profileData.keyAchievements || []).map((achievement, index) => (
                <div
                  key={achievement.id || index}
                  className="border rounded p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {achievement.category}
                      </p>
                      {achievement.date && (
                        <p className="text-xs text-gray-500">
                          {formatDate(achievement.date)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editItem("keyAchievements", achievement, index)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("keyAchievements", index)}
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

        {/* Conferences Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiUsers className="mr-2" />
              Conferences
            </h3>
            <button
              onClick={() => addItem("conferences")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.conferences || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No conferences added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.conferences || []).map((conference, index) => (
                <div
                  key={conference.id || index}
                  className="border rounded p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {conference.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Role: {conference.role}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conference.location} -{" "}
                        {conference.date && formatDate(conference.date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editItem("conferences", conference, index)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("conferences", index)}
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

        {/* Speaking Engagements Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiBriefcase className="mr-2" />
              Speaking Engagements
            </h3>
            <button
              onClick={() => addItem("speakingEngagements")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.speakingEngagements || []).length === 0 ? (
            <p className="text-gray-500 text-sm">
              No speaking engagements added yet
            </p>
          ) : (
            <div className="space-y-3">
              {(profileData.speakingEngagements || []).map(
                (engagement, index) => (
                  <div
                    key={engagement.id || index}
                    className="border rounded p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {engagement.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {engagement.event_name} ({engagement.event_type})
                        </p>
                        <p className="text-xs text-gray-500">
                          {engagement.location} -{" "}
                          {engagement.date &&
                            formatDate(engagement.date, "full")}
                          {engagement.audience_size &&
                            ` - Audience: ${engagement.audience_size}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            editItem("speakingEngagements", engagement, index)
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            removeItem("speakingEngagements", index)
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </Card>

        {/* Licenses Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiCheck className="mr-2" />
              Licenses
            </h3>
            <button
              onClick={() => addItem("licenses")}
              className="text-blue-600 hover:text-blue-700"
            >
              <FiPlus size={16} />
            </button>
          </div>
          {(profileData.licenses || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No licenses added yet</p>
          ) : (
            <div className="space-y-3">
              {(profileData.licenses || []).map((license, index) => (
                <div key={license.id || index} className="border rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {license.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {license.issuing_authority}
                      </p>
                      {license.license_number && (
                        <p className="text-xs text-gray-500">
                          License #: {license.license_number}
                        </p>
                      )}
                      {(license.issue_date || license.expiry_date) && (
                        <p className="text-xs text-gray-500">
                          {license.issue_date &&
                            `Issued: ${formatDate(license.issue_date)}`}
                          {license.expiry_date &&
                            ` - Expires: ${formatDate(license.expiry_date)}`}
                          {license.is_active && " (Active)"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem("licenses", license, index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => removeItem("licenses", index)}
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
        <h2
          className="text-xl font-bold text-gray-900 mb-4"
          id="delete-modal-title"
        >
          Delete Item
        </h2>
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
