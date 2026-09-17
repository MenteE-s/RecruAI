import { useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiBriefcase,
  FiBook,
  FiTarget,
  FiCode,
  FiFileText,
  FiAward,
  FiCheck,
  FiGlobe,
  FiHeart,
  FiUsers,
  FiLink,
} from "react-icons/fi";

const iconMap = {
  FiUser, FiBriefcase, FiBook, FiTarget, FiCode, FiFileText,
  FiAward, FiCheck, FiGlobe, FiHeart, FiUsers, FiLink,
};

const allTabs = [
  { id: "about", label: "About", icon: "FiUser" },
  { id: "experience", label: "Experience", icon: "FiBriefcase" },
  { id: "education", label: "Education", icon: "FiBook" },
  { id: "skills", label: "Skills", icon: "FiTarget" },
  { id: "projects", label: "Projects", icon: "FiCode" },
  { id: "publications", label: "Publications", icon: "FiFileText" },
  { id: "awards", label: "Awards", icon: "FiAward" },
  { id: "certifications", label: "Certifications", icon: "FiCheck" },
  { id: "languages", label: "Languages", icon: "FiGlobe" },
  { id: "volunteer", label: "Volunteer", icon: "FiHeart" },
  { id: "references", label: "References", icon: "FiUsers" },
  { id: "hobbyInterests", label: "Hobbies", icon: "FiCode" },
  { id: "memberships", label: "Memberships", icon: "FiBriefcase" },
  { id: "patents", label: "Patents", icon: "FiFileText" },
  { id: "courses", label: "Courses", icon: "FiBook" },
  { id: "social", label: "Social Links", icon: "FiLink" },
  { id: "achievements", label: "Achievements", icon: "FiAward" },
  { id: "conferences", label: "Conferences", icon: "FiUsers" },
  { id: "speaking", label: "Speaking", icon: "FiUsers" },
  { id: "licenses", label: "Licenses", icon: "FiCheck" },
];

export default function ProfileTabs({ activeTab, onTabChange }) {
  const [expanded, setExpanded] = useState(false);
  const visibleTabs = expanded ? allTabs : allTabs.slice(0, 4);

  return (
    <div className="mt-4">
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = iconMap[tab.icon];
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                <FiChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <FiChevronDown size={16} />
                Show More
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
