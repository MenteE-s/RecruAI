import { Camera } from "lucide-react";
import { getUploadUrl } from "../../../utils/auth";

export default function ProfileBanner({
  userData,
  onBannerUpload,
  uploadingBanner,
}) {
  return (
    <div className="relative mx-4 mt-4 h-28 overflow-hidden rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25">
      {userData?.banner ? (
        <img
          src={getUploadUrl(userData.banner)}
          alt="Profile banner"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      )}
      <label
        htmlFor="banner-upload"
        aria-label="Upload profile banner"
        className="absolute right-3 top-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line dark:border-line bg-surface/90 dark:bg-gray-25/90 text-gray-600 dark:text-gray-800 shadow-s5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25"
      >
        <Camera className="h-3.5 w-3.5 stroke-[1.75]" />
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-[1px]">
          <span className="text-xs font-medium leading-none text-white">Uploading banner…</span>
        </div>
      )}
    </div>
  );
}
