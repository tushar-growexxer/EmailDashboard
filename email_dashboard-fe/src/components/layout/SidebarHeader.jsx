import React from "react";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import Tooltip from "../ui/Tooltip";

const SidebarHeader = ({ user }) => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="border-b border-border h-14 sm:h-16 flex items-center">
      {/* Logo */}
      <div
        className={cn(
          "p-2 sm:p-3 md:p-4 flex items-center justify-center transition-all duration-300 gap-2 sm:gap-3",
          isSidebarOpen ? "justify-start" : "justify-center"
        )}
      >
        <Tooltip
          content="Email Pilot"
          side="right"
          delay={200}
          disabled={isSidebarOpen}>
          <img
            src="/src/assets/matangi-logo.png"
            alt="Matangi Logo"
            className="h-8 sm:h-10 w-auto"
            loading="eager"
            fetchpriority="high"
            width="40"
            height="40"
          />
        </Tooltip>

        {isSidebarOpen && (
          <div className="transition-opacity duration-200 opacity-100 delay-100 overflow-hidden min-w-0">
            <h1 className="font-bold text-sm sm:text-base md:text-lg text-foreground whitespace-nowrap truncate">
              Email Pilot
            </h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;
