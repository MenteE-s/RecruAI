import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { getBackendUrl } from "../utils/auth";
import {
  FiMail,
  FiCalendar,
  FiBriefcase,
  FiBook,
  FiCode,
  FiFileText,
  FiAward,
  FiExternalLink,
  FiGithub,
  FiShare2,
} from "react-icons/fi";
import { toast } from "react-toastify";

// Date formatting utility
const formatDate = (dateString, format = "year") => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  switch (format) {
    case "full":
      return date.toLocaleDateString();
    case "month-year":
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    case "year":
    default:
      return date.getFullYear().toString();
  }
};

// Public Profile Component
const PublicProfile = () => {
  const { slug } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPublicProfile = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/public/${slug}`);
      const data = await response.json();

      if (data.success) {
        setProfileData(data.data);
      } else {
        setError(data.message || "Profile not found");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPublicProfile();
  }, [loadPublicProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Not Found
          </h1>
          <p className="text-gray-600">{error}</p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const { profile, user } = profileData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-lg text-gray-600 mt-1">{user.role}</p>
              {user.organization && (
                <p className="text-md text-gray-500">{user.organization}</p>
              )}

              {/* Contact Info (if enabled) */}
              {profile.show_contact_info && (
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <FiMail className="mr-1" />
                      {user.email}
                    </a>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {profile.view_count}
                  </div>
                  <div className="text-sm text-gray-500">Profile Views</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About
              </h2>
              <p className="text-gray-700">
                Welcome to my professional profile. Here you can find
                information about my experience, skills, and projects.
              </p>
            </Card>

            {/* Experience */}
            {profile.show_experience &&
              user.experiences &&
              user.experiences.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiBriefcase className="mr-2" />
                    Experience
                  </h2>
                  <div className="space-y-4">
                    {user.experiences.map((exp, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-500 pl-4"
                      >
                        <h3 className="font-semibold text-gray-900">
                          {exp.title}
                        </h3>
                        <p className="text-blue-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(exp.start_date, "month-year")} -{" "}
                          {exp.end_date
                            ? formatDate(exp.end_date, "month-year")
                            : "Present"}
                        </p>
                        {exp.description && (
                          <p className="text-gray-700 mt-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Education */}
            {profile.show_education &&
              user.educations &&
              user.educations.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiBook className="mr-2" />
                    Education
                  </h2>
                  <div className="space-y-4">
                    {user.educations.map((edu, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-green-500 pl-4"
                      >
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree}
                        </h3>
                        <p className="text-green-600">{edu.school}</p>
                        <p className="text-sm text-gray-500">{edu.field}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(edu.year)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Skills */}
            {profile.show_skills && user.skills && user.skills.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiCode className="mr-2" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill.name} - {skill.level}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Projects */}
            {profile.show_projects &&
              user.projects &&
              user.projects.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiFileText className="mr-2" />
                    Projects
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.projects.map((project, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900">
                          {project.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {project.description}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FiGithub />
                            </a>
                          )}
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FiExternalLink />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Certifications */}
            {user.certifications && user.certifications.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiAward className="mr-2" />
                  Certifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.certifications.map((cert, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">
                        {cert.name}
                      </h3>
                      <p className="text-blue-600">{cert.issuer}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(cert.issue_date)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-semibold">{profile.view_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Viewed</span>
                  <span className="font-semibold">
                    {profile.last_viewed_at
                      ? formatDate(profile.last_viewed_at, "full")
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Created</span>
                  <span className="font-semibold">
                    {formatDate(profile.created_at, "full")}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Connect
              </h3>
              <div className="space-y-3">
                {profile.show_contact_info && user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="flex items-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FiMail className="mr-2" />
                    Send Email
                  </a>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Profile link copied!");
                  }}
                  className="flex items-center w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <FiShare2 className="mr-2" />
                  Share Profile
                </button>
              </div>
            </Card>

            {/* Profile Settings Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Settings
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      profile.is_public ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  {profile.is_public ? "Public Profile" : "Private Profile"}
                </div>
                <div className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      profile.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  {profile.is_active ? "Active" : "Inactive"}
                </div>
                {profile.expires_at && (
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    Expires: {formatDate(profile.expires_at, "full")}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>
              Powered by RecruAI • Profile shared via {window.location.origin}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicProfile;
