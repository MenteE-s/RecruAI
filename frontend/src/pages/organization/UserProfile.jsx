import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import { getSidebarItems, getBackendUrl, getUploadUrl } from "../../utils/auth";
import {
  FiMail,
  FiBriefcase,
  FiAward,
  FiBook,
  FiCode,
  FiFolder,
  FiFileText,
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
  const [currentUser, setCurrentUser] = useState(null);
  const [likedProfiles, setLikedProfiles] = useState(new Set());

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getBackendUrl()}/api/profile/user/${userId}`,
        {
          credentials: "include",
        }
      );

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
  }, [userId]);

  // Fetch current user data
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  }, []);

  // Check if profile is liked
  const checkIfLiked = useCallback(async () => {
    if (!currentUser || !userId) return;

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/users/${currentUser.id}/is-favorite/${userId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.favorited) {
          setLikedProfiles(prev => new Set(prev).add(userId));
        }
      }
    } catch (err) {
      console.error("Error checking if profile is liked:", err);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    fetchProfileData();
    fetchCurrentUser();
  }, [fetchProfileData, fetchCurrentUser]);

  useEffect(() => {
    if (currentUser && userId) {
      checkIfLiked();
    }
  }, [checkIfLiked, currentUser, userId]);

  const toggleLike = async (targetUserId) => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/users/${currentUser.id}/toggle-favorite/${targetUserId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.favorited) {
          setLikedProfiles(prev => new Set(prev).add(targetUserId));
        } else {
          setLikedProfiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(targetUserId);
            return newSet;
          });
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
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
          {/* Banner Section */}
          {user.banner && (
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={getUploadUrl(user.banner)} 
                alt={`${user.name || user.email} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* User profile image with fallback to initials */}
              {user.profile_picture ? (
                <img 
                  src={getUploadUrl(user.profile_picture)} 
                  alt={`${user.name || user.email} profile`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30 shadow-lg">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
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
                  </div>
                  {currentUser && currentUser.id !== parseInt(userId) && (
                    <button
                      onClick={() => toggleLike(parseInt(userId))}
                      className={`p-3 rounded-full ${
                        likedProfiles.has(userId)
                          ? "bg-red-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      } transition-colors`}
                      title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                    >
                      <FiHeart 
                        className={likedProfiles.has(userId) ? "fill-current" : ""} 
                        size={24} 
                      />
                    </button>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                <button
                  onClick={() => toggleLike(parseInt(userId))}
                  className={`absolute top-4 right-4 p-2 rounded-full ${
                    likedProfiles.has(userId)
                      ? "bg-red-100 text-red-500"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  } transition-colors`}
                  title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                >
                  <FiHeart 
                    className={likedProfiles.has(userId) ? "fill-current" : ""} 
                    size={18} 
                  />
                </button>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
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

              {/* Education */}
              {educations && educations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiBook className="mr-3 text-purple-500" />
                    Education
                  </h3>
                  <div className="space-y-6">
                    {educations.map((edu) => (
                      <div key={edu.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <FiBook className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {edu.degree}
                          </h4>
                          <p className="text-purple-600 font-medium">
                            {edu.school}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {formatDateRange(edu.start_date, edu.end_date)}
                          </p>
                          {edu.field_of_study && (
                            <p className="text-gray-700 mt-1">
                              Field of Study: {edu.field_of_study}
                            </p>
                          )}
                          {edu.grade && (
                            <p className="text-gray-700 mt-1">Grade: {edu.grade}</p>
                          )}
                          {edu.activities_and_societies && (
                            <p className="text-gray-700 mt-1">
                              Activities: {edu.activities_and_societies}
                            </p>
                          )}
                          {edu.description && (
                            <p className="text-gray-700 mt-2">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projects && projects.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiFolder className="mr-3 text-indigo-500" />
                    Projects
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <h4 className="font-semibold text-gray-900">
                          {project.name}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1">
                          {formatDateRange(project.start_date, project.end_date)}
                        </p>
                        {project.description && (
                          <p className="text-gray-700 mt-2 text-sm">
                            {project.description}
                          </p>
                        )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 inline-block"
                          >
                            View Project ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications && certifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiAward className="mr-3 text-yellow-500" />
                    Certifications
                  </h3>
                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <FiAward className="text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {cert.name}
                          </h4>
                          <p className="text-yellow-600">{cert.organization}</p>
                          <p className="text-gray-600 text-sm">
                            {formatDate(cert.issue_date)}
                            {cert.expiration_date && (
                              <span> - {formatDate(cert.expiration_date)}</span>
                            )}
                          </p>
                          {cert.credential_id && (
                            <p className="text-gray-700 text-sm mt-1">
                              Credential ID: {cert.credential_id}
                            </p>
                          )}
                          {cert.credential_url && (
                            <a
                              href={cert.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-600 hover:text-yellow-800 text-sm mt-1 inline-block"
                            >
                              View Credential ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {awards && awards.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiStar className="mr-3 text-amber-500" />
                    Awards
                  </h3>
                  <div className="space-y-4">
                    {awards.map((award) => (
                      <div key={award.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                          <FiStar className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {award.title}
                          </h4>
                          <p className="text-amber-600">{award.organization}</p>
                          <p className="text-gray-600 text-sm">
                            {formatDate(award.issue_date)}
                          </p>
                          {award.description && (
                            <p className="text-gray-700 mt-2">
                              {award.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {publications && publications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiFileText className="mr-3 text-emerald-500" />
                    Publications
                  </h3>
                  <div className="space-y-4">
                    {publications.map((pub) => (
                      <div key={pub.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <FiFileText className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {pub.title}
                          </h4>
                          <p className="text-emerald-600">{pub.publisher}</p>
                          <p className="text-gray-600 text-sm">
                            {formatDate(pub.publication_date)}
                          </p>
                          {pub.description && (
                            <p className="text-gray-700 mt-2">
                              {pub.description}
                            </p>
                          )}
                          {pub.link && (
                            <a
                              href={pub.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-800 text-sm mt-1 inline-block"
                            >
                              View Publication ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volunteer Experience */}
              {volunteer_experiences && volunteer_experiences.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiHeart className="mr-3 text-rose-500" />
                    Volunteer Experience
                  </h3>
                  <div className="space-y-4">
                    {volunteer_experiences.map((vol) => (
                      <div key={vol.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                          <FiHeart className="text-rose-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {vol.role}
                          </h4>
                          <p className="text-rose-600">{vol.organization}</p>
                          <p className="text-gray-600 text-sm">
                            {formatDateRange(vol.start_date, vol.end_date)}
                          </p>
                          {vol.cause && (
                            <p className="text-gray-700 text-sm mt-1">
                              Cause: {vol.cause}
                            </p>
                          )}
                          {vol.description && (
                            <p className="text-gray-700 mt-2">
                              {vol.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses & Trainings */}
              {course_trainings && course_trainings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiBook className="mr-3 text-cyan-500" />
                    Courses & Training
                  </h3>
                  <div className="space-y-4">
                    {course_trainings.map((course) => (
                      <div key={course.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                          <FiBook className="text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {course.name}
                          </h4>
                          <p className="text-cyan-600">{course.provider}</p>
                          <p className="text-gray-600 text-sm">
                            {formatDate(course.completion_date)}
                          </p>
                          {course.description && (
                            <p className="text-gray-700 mt-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conferences */}
              {conferences && conferences.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiMic className="mr-3 text-violet-500" />
                    Conferences
                  </h3>
                  <div className="space-y-4">
                    {conferences.map((conf) => (
                      <div key={conf.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                          <FiMic className="text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {conf.name}
                          </h4>
                          <p className="text-violet-600">{conf.organization}</p>
                          <p className="text-gray-600 text-sm">
                            {formatDate(conf.date)}
                          </p>
                          {conf.description && (
                            <p className="text-gray-700 mt-2">
                              {conf.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaking Engagements */}
              {speaking_engagements && speaking_engagements.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiMic className="mr-3 text-red-500" />
                    Speaking Engagements
                  </h3>
                  <div className="space-y-3">
                    {speaking_engagements.slice(0, 3).map((engagement) => (
                      <div key={engagement.id} className="text-sm">
                        <h4 className="font-medium text-gray-900">
                          {engagement.title}
                        </h4>
                        <p className="text-red-600">{engagement.event_name}</p>
                        <p className="text-gray-500">{formatDate(engagement.date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Memberships */}
              {professional_memberships && professional_memberships.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FiShield className="mr-3 text-teal-500" />
                    Memberships
                  </h3>
                  <div className="space-y-3">
                    {professional_memberships.slice(0, 3).map((membership) => (
                      <div key={membership.id} className="text-sm">
                        <h4 className="font-medium text-gray-900">
                          {membership.organization}
                        </h4>
                        <p className="text-gray-500">
                          {formatDateRange(membership.start_date, membership.end_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hobbies & Interests */}
              {hobby_interests && hobby_interests.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                  <button
                    onClick={() => toggleLike(parseInt(userId))}
                    className={`absolute top-4 right-4 p-2 rounded-full ${
                      likedProfiles.has(userId)
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    } transition-colors`}
                    title={likedProfiles.has(userId) ? "Unlike profile" : "Like profile"}
                  >
                    <FiHeart 
                      className={likedProfiles.has(userId) ? "fill-current" : ""} 
                      size={18} 
                    />
                  </button>
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
    </DashboardLayout>
  );
}