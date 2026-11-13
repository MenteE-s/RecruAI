import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  BookOpen,
  Target,
  Code,
  FileText,
  Award,
  CheckCircle2,
  Globe,
  Heart,
  Users,
  Link2,
} from "lucide-react";

const iconMap = {
  FiUser: User,
  FiBriefcase: Briefcase,
  FiBook: BookOpen,
  FiTarget: Target,
  FiCode: Code,
  FiFileText: FileText,
  FiAward: Award,
  FiCheck: CheckCircle2,
  FiGlobe: Globe,
  FiHeart: Heart,
  FiUsers: Users,
  FiLink: Link2,
  // Direct Lucide aliases
  User,
  Briefcase,
  BookOpen,
  Target,
  Code,
  FileText,
  Award,
  CheckCircle2,
  Globe,
  Heart,
  Users,
  Link2,
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
  { id: "social", label: "Social links", icon: "FiLink" },
  { id: "achievements", label: "Achievements", icon: "FiAward" },
  { id: "conferences", label: "Conferences", icon: "FiUsers" },
  { id: "speaking", label: "Speaking", icon: "FiUsers" },
  { id: "licenses", label: "Licenses", icon: "FiCheck" },
];

export const profileSectionTabs = allTabs;
export const profileSectionIcons = iconMap;

/**
 * ProfileTabs — Peerlist-style section navigation aligned with Stageshow craft rules.
 * Renders in the right rail (lg+) and below the hero on small screens.
 */
export default function ProfileTabs({ activeTab, onTabChange, className }) {
  const [expanded, setExpanded] = useState(false);
  const visibleTabs = expanded ? allTabs : allTabs.slice(0, 4);

  return (
    <nav aria-label="Profile sections" className={className}>
      <div className="flex flex-col gap-1">
        {visibleTabs.map((tab) => {
          const Icon = iconMap[tab.icon];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium leading-snug transition-colors ${
                isActive
                  ? "bg-gray-100 dark:bg-gray-25 font-semibold text-ink dark:text-white"
                  : "text-gray-600 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-25/60 hover:text-ink dark:hover:text-gray-200"
              }`}
            >
              {Icon && (
                <Icon
                  size={15}
                  className={`shrink-0 ${isActive ? "text-ink dark:text-white" : "text-gray-500 dark:text-gray-500"}`}
                  strokeWidth={1.75}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium leading-none text-gray-500 dark:text-gray-600 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25/60 hover:text-ink dark:hover:text-gray-200"
        >
          {expanded ? (
            <>
              <ChevronUp size={15} strokeWidth={1.75} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={15} strokeWidth={1.75} /> Show more
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
