import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, PanelLeftClose, Sun, Moon } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-card border-b border-border transition-colors duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Menu Button */}
        <button
          onClick={toggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Center Section - Optional Page Title */}
        <div className="flex-1 text-center">
          {/* Can add page title or breadcrumbs here */}
        </div>

        {/* Right Section - Theme Toggle & Avatar */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            <div className="relative w-5 h-5">
              <Sun
                className={cn(
                  "absolute inset-0 w-5 h-5 transition-all duration-400 text-muted-foreground",
                  isDark
                    ? "rotate-180 opacity-0 scale-0"
                    : "rotate-0 opacity-100 scale-100"
                )}
              />
              <Moon
                className={cn(
                  "absolute inset-0 w-5 h-5 transition-all duration-400 text-muted-foreground",
                  isDark
                    ? "rotate-0 opacity-100 scale-100"
                    : "rotate-180 opacity-0 scale-0"
                )}
              />
            </div>
          </button>

          {/* User Avatar */}
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all hover:scale-105 cursor-pointer"
            aria-label="Profile"
          >
            <Avatar className="w-10 h-10 border-2 border-border">
              <AvatarFallback className="bg-indigo-600 text-white text-sm">
                {getInitials(user?.fullName || "User")}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
