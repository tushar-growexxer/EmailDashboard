import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import Tooltip from "../ui/Tooltip";
import { Badge } from "../ui/Badge";

const NavigationItem = ({ icon: Icon, label, path, badge }) => {
  const { isSidebarOpen } = useSidebar();

  return (
    <Tooltip content={label} side="right" sideOffset={12} delay={200} disabled={isSidebarOpen}>
      <NavLink
        to={path}
        className={({ isActive }) =>
          cn(
            "relative flex items-center rounded-lg transition-colors duration-300 h-10 sm:h-12",
            isSidebarOpen
              ? "w-full px-3 sm:px-4 gap-2 sm:gap-3 justify-start"
              : "w-10 sm:w-12 mx-auto my-1 sm:my-2 justify-center",
            isActive
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-l-3 border-indigo-600 dark:border-indigo-400"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {badge && !isSidebarOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </div>
            <span
              className={cn(
                "text-xs sm:text-sm transition-opacity duration-200 whitespace-nowrap overflow-hidden",
                isSidebarOpen ? "opacity-100 delay-100" : "opacity-0 w-0",
                isActive && "font-semibold"
              )}
            >
              {label}
            </span>
            {badge && isSidebarOpen && (
              <Badge variant="secondary" className="text-xs ml-auto shrink-0">
                {badge}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    </Tooltip>
  );
};

export default NavigationItem;
