import Modal from "./Modal";

export default function AboutModal({ isOpen, onClose, data, onSave, saving }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-base font-semibold text-ink mb-4">Edit About</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          onSave({ summary: formData.get("summary") });
        }}>
        <textarea
          name="summary"
          defaultValue={data?.summary || ""}
          placeholder="Tell us about yourself..."
          className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors resize-none focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
          rows={6}
          required
        />
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
