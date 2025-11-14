import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, PanelLeftClose, Sun, Moon, LogOut, User, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/Avatar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/Popover";
import { Button } from "../ui/Button";
import { useTheme } from "../../contexts/ThemeContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isDark = theme === "dark";

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Check if user is a Google user
  const isGoogleUser = user?.id && typeof user.id === 'string' && user.id.startsWith('google_');

  // Handle change account - redirects to Google OAuth with account selection
  const handleChangeAccount = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    // Add prompt=select_account to show Google's account chooser
    window.location.href = `${backendUrl}/api/v1/auth/google?prompt=select_account`;
  };

  // Handle logout
  const handleLogout = async () => {
    setIsPopoverOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 h-14 sm:h-16 bg-card border-b border-border transition-colors duration-300">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section - Menu Button */}
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          ) : (
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
        </button>

        {/* Center Section - Optional Page Title */}
        <div className="flex-1 text-center">
          {/* Can add page title or breadcrumbs here */}
        </div>

        {/* Right Section - Theme Toggle & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors shrink-0"
            aria-label="Toggle theme"
          >
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
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

          {/* User Avatar with Dropdown */}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1 sm:gap-2 rounded-lg hover:bg-accent transition-colors p-1"
                aria-label="User menu"
              >
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-border cursor-pointer">
                  <AvatarFallback className="bg-indigo-600 text-white text-xs sm:text-sm">
                    {getInitials(user?.fullName || user?.displayName || "User")}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground hidden sm:block" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <div className="flex flex-col gap-1">
                {/* User Info */}
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {user?.fullName || user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Change Account - Only show for Google users */}
                {isGoogleUser && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={handleChangeAccount}
                  >
                    <User className="w-4 h-4" />
                    Change Account
                  </Button>
                )}

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
