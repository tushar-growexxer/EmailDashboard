import React from "react";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import SidebarHeader from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import SidebarFooter from "./SidebarFooter";

const SidebarNew = ({ user }) => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-[230px]" : "w-[72px]"
      )}
    >
      {/* Header */}
      <SidebarHeader user={user} />

      {/* Navigation */}
      <SidebarNavigation userRole={user?.role} />

      {/* Footer */}
      <SidebarFooter />
    </div>
  );
};

export default SidebarNew;
