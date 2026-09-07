import { FiCamera } from "react-icons/fi";
import { getUploadUrl } from "../../../utils/auth";

export default function ProfileBanner({
  userData,
  onBannerUpload,
  uploadingBanner,
}) {
  return (
    <div className="relative h-48 rounded-xl overflow-hidden mb-8">
      {userData?.banner ? (
        <img
          src={getUploadUrl(userData.banner)}
          alt="Profile Banner"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-blue-600" />
      )}
      <label
        htmlFor="banner-upload"
        className="absolute top-4 right-4 bg-black/30 rounded-full p-2 cursor-pointer hover:bg-black/50 transition-colors"
      >
        <FiCamera size={18} className="text-white" />
      </label>
      <input
        id="banner-upload"
        type="file"
        accept="image/*"
        onChange={onBannerUpload}
        className="hidden"
        disabled={uploadingBanner}
      />
      {uploadingBanner && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white">Uploading banner...</div>
        </div>
      )}
    </div>
  );
}
