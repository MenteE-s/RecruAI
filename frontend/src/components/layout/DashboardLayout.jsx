import Header from "./Header";
import DashboardFooter from "../../components/layout/DashboardFooter";

export default function DashboardLayout({
  children,
  NavbarComponent,
  sidebarItems,
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header sidebarItems={sidebarItems} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 md:px-4 py-3">
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <DashboardFooter />
    </div>
  );
}
