import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import { getSidebarItems } from "../../utils/auth";
import {
  FiX,
  FiMail,
  FiBriefcase,
  FiAward,
  FiBook,
  FiCode,
  FiFolder,
  FiFileText,
  FiUsers,
  FiHeart,
  FiGlobe,
  FiStar,
  FiMic,
  FiShield,
  FiArrowLeft,
} from "react-icons/fi";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/user/${userId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const formatDateRange = (startDate, endDate, currentJob = false) => {
    const start = formatDate(startDate);
    const end = currentJob ? "Present" : formatDate(endDate);
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const {
    user,
    experiences,
    educations,
    skills,
    projects,
    publications,
    awards,
    certifications,
    languages,
    volunteer_experiences,
    references,
    hobby_interests,
    professional_memberships,
    patents,
    course_trainings,
    social_media_links,
    key_achievements,
    conferences,
    speaking_engagements,
    licenses,
    team_member_info,
    is_team_member,
  } = profileData;

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <FiArrowLeft className="mr-2" />
              Back to Team
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {user.name || user.email}
                </h1>
                <div className="flex flex-wrap gap-4 text-white/90">
                  {/* Team Membership Status */}
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      is_team_member
                        ? "bg-green-500/80 text-white"
                        : "bg-orange-500/80 text-white"
                    }`}
                  >
                    {is_team_member ? "In Your Team" : "Not In Your Team"}
                  </span>

                  {team_member_info && (
                    <>
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                        {team_member_info.role}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                        Joined {formatDate(team_member_info.join_date)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-white/80" />
                    <span className="text-white/90">{user.email}</span>
                  </div>
                  {social_media_links && social_media_links.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FiGlobe className="text-white/80" />
                      <div className="flex gap-2">
                        {social_media_links.slice(0, 3).map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1 rounded-full text-sm transition-colors"
                          >
                            {link.platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Summary & Skills */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiStar className="mr-2 text-yellow-500" />
                  Profile Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="font-medium">
                      {experiences?.length || 0} roles
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Education</span>
                    <span className="font-medium">
                      {educations?.length || 0} degrees
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Skills</span>
                    <span className="font-medium">
                      {skills?.length || 0} skills
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Projects</span>
                    <span className="font-medium">
                      {projects?.length || 0} projects
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              {skills && skills.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiCode className="mr-2 text-blue-500" />
                    Skills & Expertise
                  </h3>
                  <div className="space-y-3">
                    {skills.map((skill) => (
                      <div key={skill.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {skill.name}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {skill.level}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              skill.level === "expert"
                                ? "bg-green-500 w-full"
                                : skill.level === "advanced"
                                ? "bg-blue-500 w-4/5"
                                : skill.level === "intermediate"
                                ? "bg-yellow-500 w-3/5"
                                : "bg-gray-400 w-2/5"
                            }`}
                          ></div>
                        </div>
                        {skill.years_experience && (
                          <span className="text-xs text-gray-500">
                            {skill.years_experience} years experience
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages Card */}
              {languages && languages.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiGlobe className="mr-2 text-green-500" />
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <span
                        key={lang.id}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {lang.name}
                        {lang.proficiency_level && (
                          <span className="ml-1 text-xs">
                            ({lang.proficiency_level})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Experience Timeline */}
              {experiences && experiences.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiBriefcase className="mr-3 text-blue-500" />
                    Professional Experience
                  </h3>
                  <div className="space-y-6">
                    {experiences.map((exp, index) => (
                      <div key={exp.id} className="relative">
                        {/* Timeline line */}
                        {index !== experiences.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                        )}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiBriefcase className="text-blue-600" />
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {exp.title}
                              </h4>
                              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {formatDateRange(
                                  exp.start_date,
                                  exp.end_date,
                                  exp.current_job
                                )}
                              </span>
                            </div>
                            <p className="text-blue-600 font-medium mb-2">
                              {exp.company}
                            </p>
                            {exp.location && (
                              <p className="text-gray-600 text-sm mb-2">
                                📍 {exp.location}
                              </p>
                            )}
                            {exp.description && (
                              <p className="text-gray-700 leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {educations && educations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiBook className="mr-3 text-green-500" />
                    Education
                  </h3>
                  <div className="grid gap-6">
                    {educations.map((edu) => (
                      <div
                        key={edu.id}
                        className="border-l-4 border-green-500 pl-6 py-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {edu.degree}
                          </h4>
                          <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                            {formatDateRange(edu.start_date, edu.end_date)}
                          </span>
                        </div>
                        <p className="text-green-600 font-medium mb-1">
                          {edu.school}
                        </p>
                        {edu.field && (
                          <p className="text-gray-600 mb-1">{edu.field}</p>
                        )}
                        {edu.gpa && (
                          <p className="text-sm text-gray-500 mb-1">
                            🎓 GPA: {edu.gpa}
                          </p>
                        )}
                        {edu.achievements && (
                          <p className="text-gray-700 text-sm leading-relaxed mt-2">
                            {edu.achievements}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Grid */}
              {projects && projects.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiFolder className="mr-3 text-purple-500" />
                    Projects & Portfolio
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                            {project.description}
                          </p>
                        )}
                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {project.technologies.map((tech, index) => (
                                <span
                                  key={index}
                                  className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        <div className="flex gap-3 text-sm">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 font-medium"
                            >
                              🔗 GitHub
                            </a>
                          )}
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 font-medium"
                            >
                              🌐 Demo
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications & Awards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Certifications */}
                {certifications && certifications.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiAward className="mr-2 text-yellow-500" />
                      Certifications
                    </h3>
                    <div className="space-y-4">
                      {certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="border-l-4 border-yellow-500 pl-4"
                        >
                          <h4 className="font-semibold text-gray-900">
                            {cert.name}
                          </h4>
                          <p className="text-yellow-600 text-sm mb-1">
                            {cert.issuer}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Obtained: {formatDate(cert.date_obtained)}
                          </p>
                          {cert.expiry_date && (
                            <p className="text-gray-500 text-xs">
                              Expires: {formatDate(cert.expiry_date)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {awards && awards.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiStar className="mr-2 text-orange-500" />
                      Awards & Recognition
                    </h3>
                    <div className="space-y-4">
                      {awards.map((award) => (
                        <div
                          key={award.id}
                          className="border-l-4 border-orange-500 pl-4"
                        >
                          <h4 className="font-semibold text-gray-900">
                            {award.title}
                          </h4>
                          <p className="text-orange-600 text-sm mb-1">
                            {award.issuer}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatDate(award.date)}
                          </p>
                          {award.description && (
                            <p className="text-gray-700 text-sm mt-1">
                              {award.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Publications */}
              {publications && publications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiFileText className="mr-3 text-indigo-500" />
                    Publications & Research
                  </h3>
                  <div className="space-y-4">
                    {publications.map((pub) => (
                      <div
                        key={pub.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {pub.title}
                        </h4>
                        {pub.journal && (
                          <p className="text-indigo-600 font-medium mb-1">
                            {pub.journal}
                          </p>
                        )}
                        {pub.authors && pub.authors.length > 0 && (
                          <p className="text-gray-600 text-sm mb-1">
                            👥 {pub.authors.join(", ")}
                          </p>
                        )}
                        {pub.year && (
                          <p className="text-gray-500 text-sm mb-2">
                            📅 {pub.year}
                          </p>
                        )}
                        {pub.abstract && (
                          <p className="text-gray-700 text-sm leading-relaxed mb-3">
                            {pub.abstract}
                          </p>
                        )}
                        {pub.publication_url && (
                          <a
                            href={pub.publication_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            📖 Read Publication →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Sections Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Speaking Engagements */}
                {speaking_engagements && speaking_engagements.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiMic className="mr-2 text-red-500" />
                      Speaking
                    </h3>
                    <div className="space-y-3">
                      {speaking_engagements.slice(0, 3).map((engagement) => (
                        <div key={engagement.id} className="text-sm">
                          <h4 className="font-medium text-gray-900">
                            {engagement.title}
                          </h4>
                          <p className="text-red-600">
                            {engagement.event_name}
                          </p>
                          <p className="text-gray-500">
                            {formatDate(engagement.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Professional Memberships */}
                {professional_memberships &&
                  professional_memberships.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiShield className="mr-2 text-teal-500" />
                        Memberships
                      </h3>
                      <div className="space-y-3">
                        {professional_memberships
                          .slice(0, 3)
                          .map((membership) => (
                            <div key={membership.id} className="text-sm">
                              <h4 className="font-medium text-gray-900">
                                {membership.organization}
                              </h4>
                              <p className="text-gray-500">
                                {formatDateRange(
                                  membership.start_date,
                                  membership.end_date
                                )}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Hobbies & Interests */}
                {hobby_interests && hobby_interests.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiHeart className="mr-2 text-pink-500" />
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hobby_interests.slice(0, 6).map((hobby) => (
                        <span
                          key={hobby.id}
                          className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                        >
                          {hobby.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
