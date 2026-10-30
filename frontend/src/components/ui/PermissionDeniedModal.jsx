import React from "react";
import { FiLock } from "react-icons/fi";

export default function PermissionDeniedModal({ open, title = "Access denied", message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <FiLock className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-sm text-gray-600">
          {message || "You do not have permission to view this page. If you believe this is a mistake, contact support."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
