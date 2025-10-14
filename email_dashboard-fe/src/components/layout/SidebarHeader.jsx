import React from "react";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import Tooltip from "../ui/Tooltip";

const SidebarHeader = ({ user }) => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="border-b border-border h-16 flex items-center">
      {/* Logo */}
      <div
        className={cn(
          "p-4 flex items-center justify-center transition-all duration-300 gap-3",
          isSidebarOpen ? "justify-start" : "justify-center"
        )}
      >
        <Tooltip
          content="Email Dashboard"
          side="right"
          delay={200}
          disabled={isSidebarOpen}>
          <img
            src="/src/assets/matangi-logo.png"
            alt="Matangi Logo"
            className="h-10 w-auto"
          />
        </Tooltip>

        {isSidebarOpen && (
          <div className="transition-opacity duration-200 opacity-100 delay-100 overflow-hidden">
            <h1 className="font-bold text-lg text-foreground whitespace-nowrap">
              Email Dashboard
            </h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Management Portal
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;
