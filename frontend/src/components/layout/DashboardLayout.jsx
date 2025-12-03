import { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardFooter from "./DashboardFooter";

export default function DashboardLayout({
  children,
  NavbarComponent,
  sidebarItems,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const signedIn =
    typeof window !== "undefined" &&
    localStorage.getItem("isAuthenticated") === "true";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <Sidebar
          open={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          items={sidebarItems}
        />
      </div>

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">
        {NavbarComponent && <NavbarComponent isAuthenticated={signedIn} />}

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>

        <DashboardFooter />
      </div>
    </div>
  );
}
