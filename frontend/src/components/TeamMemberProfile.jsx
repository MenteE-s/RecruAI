import React, { useState, useEffect } from "react";
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
} from "react-icons/fi";

const TeamMemberProfile = ({ member, onClose }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [member]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/user/${member.user_id}`, {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
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
  } = profileData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
              <p className="text-blue-100 mt-1">
                {team_member_info.role} at {team_member_info.organization}
              </p>
              <p className="text-blue-100 text-sm">
                Joined: {formatDate(team_member_info.join_date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Personal Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FiUsers className="mr-2" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <FiMail className="text-gray-500 mr-2" />
                <span>{user.email}</span>
              </div>
              {social_media_links && social_media_links.length > 0 && (
                <div className="flex items-center">
                  <FiGlobe className="text-gray-500 mr-2" />
                  <div className="flex gap-2">
                    {social_media_links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {link.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Experience */}
          {experiences && experiences.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiBriefcase className="mr-2" />
                Experience
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold">{exp.title}</h3>
                    <p className="text-blue-600">{exp.company}</p>
                    <p className="text-gray-600 text-sm">
                      {formatDateRange(
                        exp.start_date,
                        exp.end_date,
                        exp.current_job
                      )}
                    </p>
                    {exp.location && (
                      <p className="text-gray-500 text-sm">{exp.location}</p>
                    )}
                    {exp.description && (
                      <p className="mt-2 text-gray-700">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {educations && educations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiBook className="mr-2" />
                Education
              </h2>
              <div className="space-y-4">
                {educations.map((edu) => (
                  <div
                    key={edu.id}
                    className="border-l-4 border-green-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">{edu.degree}</h3>
                    <p className="text-green-600">{edu.school}</p>
                    {edu.field && <p className="text-gray-600">{edu.field}</p>}
                    <p className="text-gray-600 text-sm">
                      {formatDateRange(edu.start_date, edu.end_date)}
                    </p>
                    {edu.gpa && (
                      <p className="text-gray-500 text-sm">GPA: {edu.gpa}</p>
                    )}
                    {edu.achievements && (
                      <p className="mt-2 text-gray-700">{edu.achievements}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiCode className="mr-2" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill.name} {skill.level && `(${skill.level})`}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiFolder className="mr-2" />
                Projects
              </h2>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-700 mt-1">
                        {project.description}
                      </p>
                    )}
                    {project.technologies &&
                      project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          GitHub
                        </a>
                      )}
                      {project.demo_url && (
                        <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Publications */}
          {publications && publications.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiFileText className="mr-2" />
                Publications
              </h2>
              <div className="space-y-4">
                {publications.map((pub) => (
                  <div key={pub.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{pub.title}</h3>
                    {pub.journal && (
                      <p className="text-gray-600">{pub.journal}</p>
                    )}
                    {pub.authors && pub.authors.length > 0 && (
                      <p className="text-gray-600 text-sm">
                        Authors: {pub.authors.join(", ")}
                      </p>
                    )}
                    {pub.year && (
                      <p className="text-gray-600 text-sm">Year: {pub.year}</p>
                    )}
                    {pub.abstract && (
                      <p className="mt-2 text-gray-700">{pub.abstract}</p>
                    )}
                    {pub.publication_url && (
                      <a
                        href={pub.publication_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Publication
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiAward className="mr-2" />
                Certifications
              </h2>
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="border-l-4 border-yellow-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">{cert.name}</h3>
                    <p className="text-yellow-600">{cert.issuer}</p>
                    <p className="text-gray-600 text-sm">
                      Obtained: {formatDate(cert.date_obtained)}
                    </p>
                    {cert.expiry_date && (
                      <p className="text-gray-600 text-sm">
                        Expires: {formatDate(cert.expiry_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiGlobe className="mr-2" />
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang.id}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {lang.name}{" "}
                    {lang.proficiency_level && `(${lang.proficiency_level})`}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Key Achievements */}
          {key_achievements && key_achievements.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiStar className="mr-2" />
                Key Achievements
              </h2>
              <div className="space-y-4">
                {key_achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="border-l-4 border-purple-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">
                      {achievement.title}
                    </h3>
                    {achievement.description && (
                      <p className="text-gray-700 mt-1">
                        {achievement.description}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {formatDate(achievement.date)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Speaking Engagements */}
          {speaking_engagements && speaking_engagements.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiMic className="mr-2" />
                Speaking Engagements
              </h2>
              <div className="space-y-4">
                {speaking_engagements.map((engagement) => (
                  <div key={engagement.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">
                      {engagement.title}
                    </h3>
                    {engagement.event_name && (
                      <p className="text-gray-600">{engagement.event_name}</p>
                    )}
                    {engagement.event_type && (
                      <p className="text-gray-600 text-sm">
                        {engagement.event_type}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {formatDate(engagement.date)}
                    </p>
                    {engagement.location && (
                      <p className="text-gray-500 text-sm">
                        {engagement.location}
                      </p>
                    )}
                    {engagement.audience_size && (
                      <p className="text-gray-500 text-sm">
                        Audience: {engagement.audience_size}
                      </p>
                    )}
                    {engagement.description && (
                      <p className="mt-2 text-gray-700">
                        {engagement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Awards */}
          {awards && awards.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiAward className="mr-2" />
                Awards
              </h2>
              <div className="space-y-4">
                {awards.map((award) => (
                  <div
                    key={award.id}
                    className="border-l-4 border-yellow-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">{award.title}</h3>
                    <p className="text-yellow-600">{award.issuer}</p>
                    <p className="text-gray-600 text-sm">
                      {formatDate(award.date)}
                    </p>
                    {award.description && (
                      <p className="mt-2 text-gray-700">{award.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Memberships */}
          {professional_memberships && professional_memberships.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiShield className="mr-2" />
                Professional Memberships
              </h2>
              <div className="space-y-4">
                {professional_memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="border-l-4 border-indigo-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">
                      {membership.organization}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {formatDateRange(
                        membership.start_date,
                        membership.end_date
                      )}
                    </p>
                    {membership.membership_id && (
                      <p className="text-gray-500 text-sm">
                        ID: {membership.membership_id}
                      </p>
                    )}
                    {membership.description && (
                      <p className="mt-2 text-gray-700">
                        {membership.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Volunteer Experience */}
          {volunteer_experiences && volunteer_experiences.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiHeart className="mr-2" />
                Volunteer Experience
              </h2>
              <div className="space-y-4">
                {volunteer_experiences.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="border-l-4 border-pink-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">{volunteer.title}</h3>
                    <p className="text-pink-600">{volunteer.organization}</p>
                    <p className="text-gray-600 text-sm">
                      {formatDateRange(
                        volunteer.start_date,
                        volunteer.end_date
                      )}
                    </p>
                    {volunteer.location && (
                      <p className="text-gray-500 text-sm">
                        {volunteer.location}
                      </p>
                    )}
                    {volunteer.description && (
                      <p className="mt-2 text-gray-700">
                        {volunteer.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Course Trainings */}
          {course_trainings && course_trainings.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiBook className="mr-2" />
                Course & Training
              </h2>
              <div className="space-y-4">
                {course_trainings.map((course) => (
                  <div
                    key={course.id}
                    className="border-l-4 border-teal-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">{course.name}</h3>
                    {course.provider && (
                      <p className="text-teal-600">{course.provider}</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      Completed: {formatDate(course.completion_date)}
                    </p>
                    {course.credential_id && (
                      <p className="text-gray-500 text-sm">
                        Credential ID: {course.credential_id}
                      </p>
                    )}
                    {course.description && (
                      <p className="mt-2 text-gray-700">{course.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Patents */}
          {patents && patents.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiShield className="mr-2" />
                Patents
              </h2>
              <div className="space-y-4">
                {patents.map((patent) => (
                  <div key={patent.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{patent.title}</h3>
                    {patent.patent_number && (
                      <p className="text-gray-600">
                        Patent #{patent.patent_number}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      Filed: {formatDate(patent.filing_date)}
                    </p>
                    {patent.grant_date && (
                      <p className="text-gray-600 text-sm">
                        Granted: {formatDate(patent.grant_date)}
                      </p>
                    )}
                    {patent.inventors && patent.inventors.length > 0 && (
                      <p className="text-gray-600 text-sm">
                        Inventors: {patent.inventors.join(", ")}
                      </p>
                    )}
                    {patent.description && (
                      <p className="mt-2 text-gray-700">{patent.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Licenses */}
          {licenses && licenses.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiShield className="mr-2" />
                Licenses
              </h2>
              <div className="space-y-4">
                {licenses.map((license) => (
                  <div
                    key={license.id}
                    className="border-l-4 border-red-500 pl-4"
                  >
                    <h3 className="text-lg font-semibold">{license.name}</h3>
                    {license.issuing_authority && (
                      <p className="text-red-600">
                        {license.issuing_authority}
                      </p>
                    )}
                    {license.license_number && (
                      <p className="text-gray-600 text-sm">
                        License #: {license.license_number}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      Issued: {formatDate(license.issue_date)}
                    </p>
                    {license.expiry_date && (
                      <p className="text-gray-600 text-sm">
                        Expires: {formatDate(license.expiry_date)}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm">
                      Status: {license.is_active ? "Active" : "Inactive"}
                    </p>
                    {license.description && (
                      <p className="mt-2 text-gray-700">
                        {license.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Conferences */}
          {conferences && conferences.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiUsers className="mr-2" />
                Conferences
              </h2>
              <div className="space-y-4">
                {conferences.map((conference) => (
                  <div key={conference.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{conference.name}</h3>
                    {conference.role && (
                      <p className="text-gray-600">Role: {conference.role}</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {formatDate(conference.date)}
                    </p>
                    {conference.location && (
                      <p className="text-gray-500 text-sm">
                        {conference.location}
                      </p>
                    )}
                    {conference.description && (
                      <p className="mt-2 text-gray-700">
                        {conference.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hobby Interests */}
          {hobby_interests && hobby_interests.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiHeart className="mr-2" />
                Hobbies & Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {hobby_interests.map((hobby) => (
                  <div
                    key={hobby.id}
                    className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                  >
                    {hobby.name}
                    {hobby.description && (
                      <span className="ml-1 text-xs">
                        ({hobby.description})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* References */}
          {references && references.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FiUsers className="mr-2" />
                References
              </h2>
              <div className="space-y-4">
                {references.map((ref) => (
                  <div key={ref.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{ref.name}</h3>
                    {ref.title && <p className="text-gray-600">{ref.title}</p>}
                    {ref.company && (
                      <p className="text-gray-600">{ref.company}</p>
                    )}
                    {ref.relationship && (
                      <p className="text-gray-600 text-sm">
                        Relationship: {ref.relationship}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      {ref.email && <span>{ref.email}</span>}
                      {ref.phone && <span>{ref.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProfile;
