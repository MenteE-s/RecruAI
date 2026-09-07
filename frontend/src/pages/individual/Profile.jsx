import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import {
  getSidebarItems,
  getBackendUrl,
  getAuthHeaders,
} from "../../utils/auth";
import {
  FiAward,
  FiBook,
  FiCode,
  FiFileText,
  FiUsers,
  FiBriefcase,
  FiCheck,
  FiUser,
  FiGlobe,
  FiHeart,
  FiLink,
  FiTarget,
} from "react-icons/fi";

import ProfileBanner from "./components/ProfileBanner";
import ProfileSidebar from "./components/ProfileSidebar";
import ProfileTabs from "./components/ProfileTabs";
import AboutSection from "./components/sections/AboutSection";
import ExperienceSection from "./components/sections/ExperienceSection";
import EducationSection from "./components/sections/EducationSection";
import SkillsSection from "./components/sections/SkillsSection";
import ProjectsSection from "./components/sections/ProjectsSection";
import PublicationsSection from "./components/sections/PublicationsSection";
import AwardsSection from "./components/sections/AwardsSection";
import CertificationsSection from "./components/sections/CertificationsSection";
import LanguagesSection from "./components/sections/LanguagesSection";
import VolunteerSection from "./components/sections/VolunteerSection";
import ReferencesSection from "./components/sections/ReferencesSection";
import HobbiesSection from "./components/sections/HobbiesSection";
import MembershipsSection from "./components/sections/MembershipsSection";
import PatentsSection from "./components/sections/PatentsSection";
import CoursesSection from "./components/sections/CoursesSection";
import SocialSection from "./components/sections/SocialSection";
import AchievementsSection from "./components/sections/AchievementsSection";
import ConferencesSection from "./components/sections/ConferencesSection";
import SpeakingSection from "./components/sections/SpeakingSection";
import LicensesSection from "./components/sections/LicensesSection";
import ItemModal from "./components/ItemModal";
import PersonalInfoModal from "./components/PersonalInfoModal";
import AboutModal from "./components/AboutModal";
import Modal from "./components/Modal";

// Re-export formatDate for section components
export const formatDate = (dateString, format = "year") => {
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

export default function Profile() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

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
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
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
        const [
          aboutRes, expRes, eduRes, skillsRes, projectsRes,
          pubRes, awardsRes, certRes, langRes, volRes,
          refRes, hobbyRes, pmRes, patentRes, courseRes,
          socialRes, keyAchRes, confRes, speakRes, licRes,
        ] = await Promise.all([
          fetch(`${getBackendUrl()}/api/profile/sections`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/experiences`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/educations`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/skills`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/projects`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/publications`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/awards`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/certifications`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/languages`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/volunteer-experiences`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/references`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/hobby-interests`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/professional-memberships`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/patents`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/course-trainings`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/social-media-links`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/key-achievements`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/conferences`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/speaking-engagements`, { credentials: "include", headers: getAuthHeaders() }),
          fetch(`${getBackendUrl()}/api/profile/licenses`, { credentials: "include", headers: getAuthHeaders() }),
        ]);

        const [
          aboutData, expData, eduData, skillsData, projectsData,
          pubData, awardsData, certData, langData, volData,
          refData, hobbyData, pmData, patentData, courseData,
          socialData, keyAchData, confData, speakData, licData,
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

        setProfileData({
          about: aboutData.sections?.find((s) => s.section_type === "about")?.section_data || { summary: "" },
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

  const addItem = (sectionType) => setEditingItem({ type: sectionType, data: null });
  const editItem = (sectionType, item, index) => setEditingItem({ type: sectionType, data: item, index });
  const removeItem = (sectionType, index) => setShowDeleteConfirm({ type: sectionType, index });

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    const { type, index } = showDeleteConfirm;
    const item = profileData[type][index];

    if (!item?.id) {
      setProfileData((prev) => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
      setShowDeleteConfirm(null);
      return;
    }

    const endpointMap = {
      experiences: "experiences", educations: "educations", skills: "skills",
      projects: "projects", publications: "publications", awards: "awards",
      certifications: "certifications", languages: "languages",
      volunteerExperiences: "volunteer-experiences", references: "references",
      hobbyInterests: "hobby-interests", professionalMemberships: "professional-memberships",
      patents: "patents", courseTrainings: "course-trainings",
      socialMediaLinks: "social-media-links", keyAchievements: "key-achievements",
      conferences: "conferences", speakingEngagements: "speaking-engagements",
      licenses: "licenses",
    };

    try {
      const endpoint = `${getBackendUrl()}/api/profile/${endpointMap[type]}/${item.id}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        setProfileData((prev) => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
        setShowDeleteConfirm(null);
      } else {
        setError("Failed to delete item");
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
      const apiType = type.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      let endpoint = `${getBackendUrl()}/api/profile/${apiType}`;
      let method = existingItem ? "PUT" : "POST";

      if (existingItem?.id) endpoint += `/${existingItem.id}`;

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData((prev) => {
          const newData = { ...prev };
          const item =
            result.experience || result.education || result.skill ||
            result.project || result.publication || result.award ||
            result.certification || result.language || result.volunteer_experience ||
            result.reference || result.hobby_interest || result.professional_membership ||
            result.patent || result.course_training || result.social_media_link ||
            result.key_achievement || result.conference || result.speaking_engagement ||
            result.license || result;

          if (existingItem) {
            newData[type] = [...newData[type]];
            newData[type][editingItem.index] = item;
          } else {
            newData[type] = [...newData[type], item];
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

  const handleJoinPosition = async () => {
    if (!userData?.id) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/users/${userData.id}/join-position`, {
        method: "POST", headers: getAuthHeaders(), credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to join position");
      }
    } catch (error) {
      console.error("Error joining position:", error);
      setError("Network error. Please try again.");
    }
  };

  const savePersonalInfo = async (personalData) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(personalData),
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setEditingItem(null);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update personal information");
      }
    } catch (error) {
      console.error("Error saving personal info:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveAbout = async (aboutData) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/profile/sections`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ section_type: "about", section_data: aboutData }),
      });
      if (response.ok) {
        setProfileData((prev) => ({ ...prev, about: aboutData }));
        setEditingItem(null);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update about section");
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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) { setError("Please select a valid image file (JPEG, PNG, or GIF)"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File size must be less than 5MB"); return; }

    setUploadingProfilePicture(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      const response = await fetch(`${getBackendUrl()}/api/profile/upload-profile-picture`, {
        method: "POST", headers: getAuthHeaders(), credentials: "include", body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setUserData((prev) => ({ ...prev, profile_picture: data.profile_picture }));
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

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) { setError("Please select a valid image file (JPEG, PNG, or GIF)"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File size must be less than 5MB"); return; }

    setUploadingBanner(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("banner", file);
      const response = await fetch(`${getBackendUrl()}/api/profile/upload-banner`, {
        method: "POST", headers: getAuthHeaders(), credentials: "include", body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setUserData((prev) => ({ ...prev, banner: data.banner }));
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to upload banner");
      }
    } catch (error) {
      console.error("Error uploading banner:", error);
      setError("Network error. Please try again.");
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout NavbarComponent={IndividualNavbar} sidebarItems={sidebarItems}>
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

  const tabContent = {
    about: <AboutSection about={profileData.about} onEdit={(about) => setEditingItem({ type: "about", data: about })} />,
    experience: <ExperienceSection experiences={profileData.experiences} onAdd={() => addItem("experiences")} onEdit={editItem} onRemove={removeItem} />,
    education: <EducationSection educations={profileData.educations} onAdd={() => addItem("educations")} onEdit={editItem} onRemove={removeItem} />,
    skills: <SkillsSection skills={profileData.skills} onAdd={() => addItem("skills")} onRemove={removeItem} />,
    projects: <ProjectsSection projects={profileData.projects} onAdd={() => addItem("projects")} onEdit={editItem} onRemove={removeItem} />,
    publications: <PublicationsSection publications={profileData.publications} onAdd={() => addItem("publications")} onEdit={editItem} onRemove={removeItem} />,
    awards: <AwardsSection awards={profileData.awards} onAdd={() => addItem("awards")} onEdit={editItem} onRemove={removeItem} />,
    certifications: <CertificationsSection certifications={profileData.certifications} onAdd={() => addItem("certifications")} onEdit={editItem} onRemove={removeItem} />,
    languages: <LanguagesSection languages={profileData.languages} onAdd={() => addItem("languages")} onRemove={removeItem} />,
    volunteer: <VolunteerSection volunteerExperiences={profileData.volunteerExperiences} onAdd={() => addItem("volunteerExperiences")} onEdit={editItem} onRemove={removeItem} />,
    references: <ReferencesSection references={profileData.references} onAdd={() => addItem("references")} onEdit={editItem} onRemove={removeItem} />,
    hobbyInterests: <HobbiesSection hobbyInterests={profileData.hobbyInterests} onAdd={() => addItem("hobbyInterests")} onRemove={removeItem} />,
    memberships: <MembershipsSection professionalMemberships={profileData.professionalMemberships} onAdd={() => addItem("professionalMemberships")} onEdit={editItem} onRemove={removeItem} />,
    patents: <PatentsSection patents={profileData.patents} onAdd={() => addItem("patents")} onEdit={editItem} onRemove={removeItem} />,
    courses: <CoursesSection courseTrainings={profileData.courseTrainings} onAdd={() => addItem("courseTrainings")} onEdit={editItem} onRemove={removeItem} />,
    social: <SocialSection socialMediaLinks={profileData.socialMediaLinks} onAdd={() => addItem("socialMediaLinks")} onEdit={editItem} onRemove={removeItem} />,
    achievements: <AchievementsSection keyAchievements={profileData.keyAchievements} onAdd={() => addItem("keyAchievements")} onEdit={editItem} onRemove={removeItem} />,
    conferences: <ConferencesSection conferences={profileData.conferences} onAdd={() => addItem("conferences")} onEdit={editItem} onRemove={removeItem} />,
    speaking: <SpeakingSection speakingEngagements={profileData.speakingEngagements} onAdd={() => addItem("speakingEngagements")} onEdit={editItem} onRemove={removeItem} />,
    licenses: <LicensesSection licenses={profileData.licenses} onAdd={() => addItem("licenses")} onEdit={editItem} onRemove={removeItem} />,
  };

  return (
    <DashboardLayout NavbarComponent={IndividualNavbar} sidebarItems={sidebarItems}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">×</button>
          </div>
        </div>
      )}

      <ProfileBanner userData={userData} onBannerUpload={handleBannerUpload} uploadingBanner={uploadingBanner} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProfileSidebar
            userData={userData}
            profileData={profileData}
            onProfilePictureUpload={handleProfilePictureUpload}
            uploadingProfilePicture={uploadingProfilePicture}
            onEditProfile={() =>
              setEditingItem({
                type: "personal",
                data: { name: userData?.name || "", email: userData?.email || "", phone: userData?.phone || "", location: userData?.location || "", website: userData?.website || "", linkedin: userData?.linkedin || "" },
              })
            }
            onJoinPosition={handleJoinPosition}
          />

          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className="lg:col-span-3">
          {tabContent[activeTab]}
        </div>
      </div>

      {editingItem && editingItem.type !== "about" && editingItem.type !== "personal" && (
        <ItemModal isOpen={true} onClose={() => setEditingItem(null)} itemType={editingItem.type} itemData={editingItem.data} onSave={saveItem} saving={saving} />
      )}

      <PersonalInfoModal
        isOpen={!!(editingItem && editingItem.type === "personal")}
        onClose={() => setEditingItem(null)}
        data={editingItem?.data}
        onSave={savePersonalInfo}
        saving={saving}
      />

      <AboutModal
        isOpen={!!(editingItem && editingItem.type === "about")}
        onClose={() => setEditingItem(null)}
        data={editingItem?.data}
        onSave={saveAbout}
        saving={saving}
      />

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Item</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
