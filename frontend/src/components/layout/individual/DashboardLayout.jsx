import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import Footer from "../Footer";

// Individual dashboard layout — softer personal palette
export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-secondary-50 overflow-hidden">
      {/* subtle background blobs (individual theme) */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none filter blur-3xl opacity-40"
        style={{
          left: mousePosition.x - 200,
          top: mousePosition.y - 120,
          background:
            "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.20), transparent 40%)",
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none filter blur-2xl opacity-30"
        style={{
          left: mousePosition.x - 40,
          top: mousePosition.y + 60,
          background:
            "radial-gradient(circle at 70% 70%, rgba(16,185,129,0.12), transparent 40%)",
        }}
      />

      <Sidebar
        open={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-0 ml-0">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-0 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
