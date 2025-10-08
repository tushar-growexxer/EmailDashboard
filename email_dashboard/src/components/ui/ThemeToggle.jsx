import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";
import Tooltip from "./Tooltip";

const ThemeToggle = ({ isCollapsed = true }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (isCollapsed) {
    return (
      <Tooltip content={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} side="right" delay={200}>
        <button
          onClick={toggleTheme}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300",
            "bg-muted hover:bg-accent",
            "text-muted-foreground"
          )}
          aria-label="Toggle theme"
        >
          <div className="relative w-6 h-6">
            {/* Sun Icon */}
            <Sun
              className={cn(
                "absolute inset-0 w-6 h-6 transition-all duration-400",
                isDark
                  ? "rotate-180 opacity-0 scale-0"
                  : "rotate-0 opacity-100 scale-100"
              )}
            />
            {/* Moon Icon */}
            <Moon
              className={cn(
                "absolute inset-0 w-6 h-6 transition-all duration-400",
                isDark
                  ? "rotate-0 opacity-100 scale-100"
                  : "rotate-180 opacity-0 scale-0"
              )}
            />
          </div>
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="w-full p-3 bg-muted rounded-lg transition-all duration-300">
      <button
        onClick={toggleTheme}
        className="w-full flex items-center justify-between gap-3 relative"
        aria-label="Toggle theme"
      >
        {/* Sun Icon */}
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-200",
            !isDark
              ? "text-primary scale-110 opacity-100"
              : "text-muted-foreground scale-90 opacity-50"
          )}
        >
          <Sun className="h-5 w-5" />
        </div>

        {/* Toggle Switch */}
        <div className="relative flex-1 h-6 bg-background rounded-full transition-colors duration-300">
          <div
            className={cn(
              "absolute top-0.5 w-5 h-5 bg-primary rounded-full transition-all duration-300 ease-in-out",
              !isDark ? "left-0.5" : "right-0.5"
            )}
          />
        </div>

        {/* Moon Icon */}
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-200",
            isDark
              ? "text-primary scale-110 opacity-100"
              : "text-muted-foreground scale-90 opacity-50"
          )}
        >
          <Moon className="h-5 w-5" />
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
