import React from "react";
import Card from "../ui/Card";

const RecommendationCard = ({
  item,
  type,
  isRecommended = false,
  onClick,
  className = "",
  children
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'agent':
        return {
          icon: '🤖',
          title: item.agent_name || item.name,
          subtitle: item.industry,
          description: item.interview_type ? `Specializes in ${item.interview_type} interviews` : 'AI Interview Agent',
          badgeColor: 'bg-purple-100 text-purple-800'
        };
      case 'job':
        return {
          icon: '💼',
          title: item.job_title || item.title,
          subtitle: item.industry || item.company_name,
          description: item.experience_required ? `${item.experience_required} years experience` : 'Job Opportunity',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      case 'candidate':
        return {
          icon: '👤',
          title: item.name || item.first_name + ' ' + item.last_name,
          subtitle: item.role || 'Professional',
          description: item.skills_count ? `${item.skills_count} skills listed` : 'Candidate Profile',
          badgeColor: 'bg-green-100 text-green-800'
        };
      default:
        return {
          icon: '📄',
          title: item.name || item.title,
          subtitle: '',
          description: '',
          badgeColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Card
      className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="text-3xl mr-4">{config.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {config.title}
                </h3>
                {isRecommended && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                    ⭐ Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{config.subtitle}</p>
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            </div>
          </div>
          <div className={`px-3 py-1 text-xs rounded-full ${config.badgeColor}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        </div>

        {item.explanation && (
          <div className="bg-blue-50 border-l-4 border-blue-200 p-3 rounded mb-4">
            <p className="text-sm text-blue-800">
              <strong>Why recommended:</strong> {item.explanation}
            </p>
          </div>
        )}

        {item.similarity_score && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>Match Score: {(item.similarity_score * 100).toFixed(1)}%</span>
          </div>
        )}

        {children}
      </div>
    </Card>
  );
};

export default RecommendationCard;