export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-s15 animate-popIn">
        <div className="max-h-[90vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
