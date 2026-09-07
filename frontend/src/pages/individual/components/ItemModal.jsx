import Modal from "./Modal";
import { useState } from "react";
import { FiX } from "react-icons/fi";

const itemConfigs = {
  experiences: {
    title: "Experience",
    fields: [
      { name: "title", label: "Job Title", required: true },
      { name: "company", label: "Company", required: true },
      { name: "location", label: "Location" },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  educations: {
    title: "Education",
    fields: [
      { name: "degree", label: "Degree", required: true },
      { name: "school", label: "School", required: true },
      { name: "field", label: "Field of Study" },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
    ],
  },
  skills: {
    title: "Skill",
    fields: [{ name: "name", label: "Skill Name", required: true }],
  },
  projects: {
    title: "Project",
    fields: [
      { name: "name", label: "Project Name", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "url", label: "URL", type: "url" },
    ],
  },
  publications: {
    title: "Publication",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "journal", label: "Journal" },
      { name: "year", label: "Year" },
    ],
  },
  awards: {
    title: "Award",
    fields: [
      { name: "title", label: "Award Title", required: true },
      { name: "issuer", label: "Issuer" },
      { name: "date", label: "Date", type: "date" },
    ],
  },
  certifications: {
    title: "Certification",
    fields: [
      { name: "name", label: "Certification Name", required: true },
      { name: "issuer", label: "Issuer" },
      { name: "date_obtained", label: "Date Obtained", type: "date" },
      { name: "expiry_date", label: "Expiry Date", type: "date" },
    ],
  },
  languages: {
    title: "Language",
    fields: [
      { name: "name", label: "Language", required: true },
      { name: "proficiency_level", label: "Proficiency Level", required: true, type: "select", options: ["Beginner", "Elementary", "Intermediate", "Advanced", "Native"] },
    ],
  },
  volunteerExperiences: {
    title: "Volunteer Experience",
    fields: [
      { name: "role", label: "Role", required: true },
      { name: "organization", label: "Organization", required: true },
      { name: "location", label: "Location" },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
    ],
  },
  references: {
    title: "Reference",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "position", label: "Position" },
      { name: "company", label: "Company" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
    ],
  },
  hobbyInterests: {
    title: "Hobby Interest",
    fields: [{ name: "name", label: "Hobby/Interest", required: true }],
  },
  professionalMemberships: {
    title: "Professional Membership",
    fields: [
      { name: "organization", label: "Organization", required: true },
      { name: "membership_id", label: "Membership ID" },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
    ],
  },
  patents: {
    title: "Patent",
    fields: [
      { name: "title", label: "Patent Title", required: true },
      { name: "patent_number", label: "Patent Number" },
      { name: "filing_date", label: "Filing Date", type: "date" },
      { name: "grant_date", label: "Grant Date", type: "date" },
    ],
  },
  courseTrainings: {
    title: "Course Training",
    fields: [
      { name: "name", label: "Course Name", required: true },
      { name: "provider", label: "Provider" },
      { name: "completion_date", label: "Completion Date", type: "date" },
    ],
  },
  socialMediaLinks: {
    title: "Social Media Link",
    fields: [
      { name: "platform", label: "Platform", required: true },
      { name: "url", label: "URL", required: true, type: "url" },
      { name: "username", label: "Username" },
    ],
  },
  keyAchievements: {
    title: "Key Achievement",
    fields: [
      { name: "title", label: "Achievement Title", required: true },
      { name: "category", label: "Category" },
      { name: "date", label: "Date", type: "date" },
    ],
  },
  conferences: {
    title: "Conference",
    fields: [
      { name: "name", label: "Conference Name", required: true },
      { name: "role", label: "Role" },
      { name: "location", label: "Location" },
      { name: "date", label: "Date", type: "date" },
    ],
  },
  speakingEngagements: {
    title: "Speaking Engagement",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "event_name", label: "Event Name" },
      { name: "event_type", label: "Event Type" },
      { name: "location", label: "Location" },
      { name: "date", label: "Date", type: "date" },
      { name: "audience_size", label: "Audience Size", type: "number" },
    ],
  },
  licenses: {
    title: "License",
    fields: [
      { name: "name", label: "License Name", required: true },
      { name: "issuing_authority", label: "Issuing Authority" },
      { name: "license_number", label: "License Number" },
      { name: "issue_date", label: "Issue Date", type: "date" },
      { name: "expiry_date", label: "Expiry Date", type: "date" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
};

export default function ItemModal({ isOpen, onClose, itemType, itemData, onSave, saving }) {
  const config = itemConfigs[itemType];
  if (!isOpen || !config) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {itemData ? `Edit ${config.title}` : `Add ${config.title}`}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = {};
          for (const [key, value] of formData.entries()) {
            if (key === "is_active") {
              data[key] = true;
            } else {
              data[key] = value;
            }
          }
          // Handle unchecked checkbox
          if (config.fields.some((f) => f.type === "checkbox") && !formData.has("is_active")) {
            data.is_active = false;
          }
          onSave(data);
        }}
      >
        <div className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && "*"}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  defaultValue={itemData?.[field.name] || ""}
                  className="w-full p-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required={field.required}
                />
              ) : field.type === "select" ? (
                <select
                  name={field.name}
                  defaultValue={itemData?.[field.name] || ""}
                  className="w-full p-2 bg-white border border-gray-300 rounded text-gray-900 focus:ring-2 focus:ring-blue-500"
                  required={field.required}
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  name={field.name}
                  defaultChecked={itemData?.[field.name] || false}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  defaultValue={itemData?.[field.name] || ""}
                  className="w-full p-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : itemData ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
