import React from "react";
import { cn } from "../../lib/utils";

const BusinessTypeFilter = ({ value = "All", onChange, className }) => {
  const options = ["All", "Domestic", "Export"];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-foreground">Business Type</label>
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {options.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              value === type
                ? "bg-background shadow-sm text-foreground bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BusinessTypeFilter;
