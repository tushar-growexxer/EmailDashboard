import React from "react";
import { cn } from "../../lib/utils";

const ToggleGroup = ({ value, onValueChange, options, className }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-muted p-1",
        className
      )}
      role="group"
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "px-4 h-9 rounded-md text-sm font-medium transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ToggleGroup;
