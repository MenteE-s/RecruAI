import { useContext } from "react";
import Header from "./Header";
import DashboardFooter from "../../components/layout/DashboardFooter";
import { PageManagerContext } from "../page/PageManagerContext";

export default function DashboardLayout({
  children,
  NavbarComponent,
  sidebarItems,
}) {
  // When rendered inside PageManagerLayout, that shell already provides the
  // header, scroll container and footer — and adds the page sidebar. Rendering
  // them again here would nest a duplicate header inside the content area, so
  // pass the children straight through instead.
  const insidePageManager = useContext(PageManagerContext);
  if (insidePageManager) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 md:px-4 py-3">
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <DashboardFooter />
    </div>
  );
}