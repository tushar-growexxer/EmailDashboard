import React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import SidebarNew from "./SidebarNew";
import DashboardHeader from "./DashboardHeader";
import Footer from "./Footer";

const DashboardLayout = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <SidebarNew />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isSidebarOpen ? "ml-[280px]" : "ml-[72px]"
        )}
      >
        <DashboardHeader />
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
