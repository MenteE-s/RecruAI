import {
  FiUser,
  FiMapPin,
  FiEdit2,
  FiCamera,
  FiCheck,
  FiExternalLink,
} from "react-icons/fi";
import Card from "../../../components/ui/Card";
import { getUploadUrl } from "../../../utils/auth";

export default function ProfileSidebar({
  userData,
  profileData,
  onProfilePictureUpload,
  uploadingProfilePicture,
  onEditProfile,
  onJoinPosition,
}) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        {/* Profile Picture */}
        <div className="relative mb-4">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-4 ${
              userData?.subscription_status?.is_paid_active
                ? "border-blue-600"
                : "border-gray-200"
            }`}
          >
            {userData?.profile_picture ? (
              <img
                src={getUploadUrl(userData.profile_picture)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser size={40} className="text-gray-400" />
            )}
          </div>
          {userData?.subscription_status?.is_paid_active && (
            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              PRO
            </div>
          )}
          <label
            htmlFor="profile-picture-upload"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors shadow-md border border-gray-200"
          >
            <FiCamera size={12} className="text-gray-600" />
          </label>
          <input
            id="profile-picture-upload"
            type="file"
            accept="image/*"
            onChange={onProfilePictureUpload}
            className="hidden"
            disabled={uploadingProfilePicture}
          />
        </div>

        {/* Name & Info */}
        <h2 className="text-xl font-bold text-gray-900">
          {userData?.name || "Guest"}
        </h2>
        {userData?.location && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <FiMapPin size={14} /> {userData.location}
          </p>
        )}

        {/* Employment Status */}
        {userData?.employment_status &&
          userData.employment_status !== "unemployed" && (
            <div className="mt-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  userData.employment_status === "hired"
                    ? "bg-blue-100 text-blue-800"
                    : userData.employment_status === "working"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {userData.employment_status === "hired" && "Hired"}
                {userData.employment_status === "working" && "Working"}
                {userData.employment_status === "onboarding" && "Onboarding"}
              </span>
              {userData.current_position && userData.current_company && (
                <p className="text-xs text-gray-500 mt-1">
                  {userData.current_position} at {userData.current_company}
                </p>
              )}
            </div>
          )}

        {/* Links */}
        <div className="mt-4 space-y-2 w-full">
          {userData?.email && (
            <p className="text-sm text-gray-600 truncate">{userData.email}</p>
          )}
          {userData?.phone && (
            <p className="text-sm text-gray-600">{userData.phone}</p>
          )}
          {userData?.website && (
            <a
              href={userData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <FiExternalLink size={12} /> Website
            </a>
          )}
          {userData?.linkedin && (
            <a
              href={userData.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <FiExternalLink size={12} /> LinkedIn
            </a>
          )}
        </div>

        {/* Join Button */}
        {userData?.employment_status === "hired" && (
          <button
            onClick={onJoinPosition}
            className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiCheck className="mr-2" size={16} />
            Join Position
          </button>
        )}

        {/* Edit Profile Button */}
        <button
          onClick={onEditProfile}
          className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FiEdit2 className="mr-2" size={14} />
          Edit Profile
        </button>

        {uploadingProfilePicture && (
          <p className="mt-2 text-xs text-gray-500">
            Uploading profile picture...
          </p>
        )}
      </div>
    </Card>
  );
}
