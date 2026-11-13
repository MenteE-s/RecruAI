import React, { createContext, useContext, useCallback } from "react";
import { Toaster, toast } from "sonner";

const ToastContext = createContext(null);

/**
 * ToastProvider — thin compatibility layer over Sonner.
 * Existing call sites keep using `showToast({ message, type, position, duration })`,
 * but notifications now stack cleanly with exit animations and swipe-to-dismiss.
 */
export function ToastProvider({ children }) {
  const showToast = useCallback(
    ({ message, type = "info", position = "side", duration = 3000 }) => {
      const sonnerPosition = position === "center" ? "top-center" : "bottom-right";
      const options = { position: sonnerPosition, duration };
      if (type === "success") return toast.success(message, options);
      if (type === "error") return toast.error(message, options);
      if (type === "warning") return toast.warning(message, options);
      return toast(message, options);
    },
    []
  );

  const dismissToast = useCallback((id) => {
    if (id != null) toast.dismiss(id);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme="system"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-xl !border-line !bg-surface !text-ink !shadow-s15",
            description: "!text-gray-500",
            actionButton: "!bg-brand-action !text-white",
            cancelButton: "!bg-gray-100 !text-ink",
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastContext;
