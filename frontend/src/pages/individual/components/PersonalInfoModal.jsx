import Modal from "./Modal";

export default function PersonalInfoModal({ isOpen, onClose, data, onSave, saving }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-base font-semibold text-ink mb-4">Edit Personal Information</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          onSave({
            name: formData.get("name"),
            headline: formData.get("headline"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            location: formData.get("location"),
            website: formData.get("website"),
            linkedin: formData.get("linkedin"),
          });
        }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" name="name" defaultValue={data?.name || ""} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input type="text" name="headline" defaultValue={data?.headline || ""} placeholder="e.g. Web Developer, Software Engineer" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input type="email" name="email" defaultValue={data?.email || ""} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" name="phone" defaultValue={data?.phone || ""} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" name="location" defaultValue={data?.location || ""} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Website</label>
            <input type="url" name="website" defaultValue={data?.website || ""} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
            <input type="url" name="linkedin" defaultValue={data?.linkedin || ""} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
