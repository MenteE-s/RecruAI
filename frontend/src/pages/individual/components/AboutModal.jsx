import Modal from "./Modal";

export default function AboutModal({ isOpen, onClose, data, onSave, saving }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Edit About</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          onSave({ summary: formData.get("summary") });
        }}
      >
        <textarea
          name="summary"
          defaultValue={data?.summary || ""}
          placeholder="Tell us about yourself..."
          className="w-full p-3 bg-white border border-gray-300 rounded-lg resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          rows={6}
          required
        />
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
