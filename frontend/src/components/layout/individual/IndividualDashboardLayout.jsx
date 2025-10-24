import { useState } from "react";
import Sidebar from "../Sidebar";
import Footer from "../Footer";
import IndividualNavbar from "../IndividualNavbar";

// Individual dashboard layout
export default function IndividualDashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const signedIn =
    typeof window !== "undefined" &&
    localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className="relative flex min-h-screen bg-gray-100">
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        items={[
          { name: "Upcoming Interviews", link: "/interviews/upcoming" },
          { name: "Interview History", link: "/interviews/history" },
          { name: "Schedule Interview", link: "/interviews/schedule" },
        ]}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <IndividualNavbar isAuthenticated={signedIn} />

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
