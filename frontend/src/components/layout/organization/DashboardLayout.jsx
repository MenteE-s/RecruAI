import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import Footer from "../Footer";

// Organization dashboard layout — premium palette and slightly bolder blobs
export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-b from-white to-secondary-50 overflow-hidden">
      {/* premium background blobs */}
      <div
        className="absolute w-[28rem] h-[28rem] rounded-full pointer-events-none filter blur-3xl opacity-60"
        style={{
          left: mousePosition.x - 240,
          top: mousePosition.y - 160,
          background:
            "radial-gradient(circle at 20% 25%, rgba(245,158,11,0.20), transparent 35%)",
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full pointer-events-none filter blur-2xl opacity-40"
        style={{
          left: mousePosition.x - 20,
          top: mousePosition.y + 40,
          background:
            "radial-gradient(circle at 80% 80%, rgba(139,92,246,0.14), transparent 35%)",
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
