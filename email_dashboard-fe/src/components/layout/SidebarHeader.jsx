import React from "react";
import { Mail } from "lucide-react";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import Tooltip from "../ui/Tooltip";

const SidebarHeader = ({ user }) => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="border-b border-border h-16 flex items-center">
      {/* Logo */}
      <div className={cn("p-4 transition-all duration-300", isSidebarOpen ? "flex items-center gap-3" : "flex justify-center")}>
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Tooltip content="Email Dashboard" side="right" delay={200} disabled={isSidebarOpen}>
            <Mail className="h-6 w-6 text-white" />
          </Tooltip>
        </div>
        <div
          className={cn(
            "transition-opacity duration-200 overflow-hidden",
            isSidebarOpen ? "opacity-100 delay-100" : "opacity-0 w-0"
          )}
        >
          <h1 className="font-bold text-lg text-foreground whitespace-nowrap">Email Dashboard</h1>
          <p className="text-xs text-muted-foreground whitespace-nowrap">Management Portal</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
