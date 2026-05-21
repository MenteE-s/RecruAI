import { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardFooter from "../../components/layout/DashboardFooter";

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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        items={sidebarItems}
      />

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto scroll-smooth">{children}</main>

        <DashboardFooter />
      </div>
    </div>
  );
}
