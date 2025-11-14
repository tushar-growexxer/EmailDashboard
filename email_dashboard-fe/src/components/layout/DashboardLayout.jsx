import React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import SidebarNew from "./SidebarNew";
import DashboardHeader from "./DashboardHeader";
import Footer from "./Footer";

const DashboardLayout = () => {
  const { isSidebarOpen } = useSidebar();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <SidebarNew user={user} />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          // Responsive sidebar margin - no margin on mobile (sidebar hidden), adjusted on larger screens
          "ml-0",
          // On small screens and up, add margin based on sidebar state
          "sm:ml-[72px]",
          // When sidebar is open on small screens and up, use full width
          isSidebarOpen && "sm:ml-[230px]"
        )}
      >
        <DashboardHeader />
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
