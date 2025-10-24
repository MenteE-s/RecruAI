import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    ({ message, type = "info", position = "side", duration = 3000 }) => {
      const id = ++toastId;
      const t = { id, message, type, position };
      setToasts((s) => [...s, t]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((s) => s.filter((x) => x.id !== id));
        }, duration);
      }
      return id;
    },
    []
  );

  const dismissToast = useCallback(
    (id) => setToasts((s) => s.filter((t) => t.id !== id)),
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Side toasts (stack on bottom-right) */}
      <div className="pointer-events-none fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts
          .filter((t) => t.position === "side")
          .map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto max-w-xs w-full rounded-lg p-3 shadow-lg border ${
                t.type === "error"
                  ? "bg-red-600 text-white border-red-700"
                  : t.type === "success"
                  ? "bg-green-600 text-white border-green-700"
                  : "bg-white text-neutral-900 border-secondary-200"
              }`}
            >
              <div className="text-sm">{t.message}</div>
            </div>
          ))}
      </div>

      {/* Center toasts (pop) */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50">
        {toasts
          .filter((t) => t.position === "center")
          .map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto mx-auto max-w-xl w-full rounded-xl p-4 shadow-2xl border text-center ${
                t.type === "error"
                  ? "bg-red-600 text-white border-red-700"
                  : t.type === "success"
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-white text-neutral-900 border-secondary-200"
              }`}
            >
              <div className="text-base font-medium">{t.message}</div>
            </div>
          ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastContext;
