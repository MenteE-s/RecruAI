import { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardFooter from "../../components/layout/DashboardFooter";

export default function DashboardLayout({
  children,
  NavbarComponent,
  sidebarItems,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse (persisted); mobile drawer state stays separate.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("sidebarCollapsed", c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        items={sidebarItems}
      />

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <main className="flex-1 p-4 md:p-6 overflow-y-auto scroll-smooth">
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}
