import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiCreditCard, FiX, FiCheckCircle } from "react-icons/fi";

/**
 * A reusable paywall modal shown when an unsubscribed (lapsed) user tries to
 * access a paid CVAI feature. Provides a clear upgrade CTA instead of a silent
 * 403.
 */
export default function PaywallModal({ open, feature, onClose, onUpgrade }) {
  const navigate = useNavigate();

  if (!open) return null;

  const featureLabels = {
    quizzes: "Quizzes",
    projects: "Guided projects",
    "mock-interviews": "Mock interviews",
    coaching: "Coaching",
    mentorship: "Mentorship",
  };

  const label = featureLabels[feature] || "this feature";

  function handleSubscribe() {
    if (onUpgrade) onUpgrade();
    else navigate("/billing");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <FiLock className="h-6 w-6 text-blue-600" />
        </div>

        <h2 className="text-lg font-bold text-gray-900">
          {label} is a paid feature
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {label} is part of the CVAI paid tier. Every individual account gets a
          <strong> 30-day free trial</strong> with full access. After that you
          can subscribe to keep going after the trial ends.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <FiCheckCircle className="h-4 w-4 text-green-600" />
            Free trial: 30 days of full access, no card needed
          </li>
          <li className="flex items-center gap-2">
            <FiCheckCircle className="h-4 w-4 text-green-600" />
            After trial: subscribe to keep using paid features
          </li>
          <li className="flex items-center gap-2">
            <FiLock className="h-4 w-4 text-gray-400" />
            Free previews of quizzes & projects always available
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleSubscribe}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            <FiCreditCard className="h-4 w-4" /> Subscribe now
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
