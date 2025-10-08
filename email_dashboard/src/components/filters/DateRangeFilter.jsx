import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Button } from "../ui/Button";

const quickOptions = [
  { value: "last_week", label: "Last Week" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "last_year", label: "Last Year" },
  { value: "last_fiscal_year", label: "Last Fiscal Year" },
];

const DateRangeFilter = ({ value = "last_month", onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(value);

  const handleQuickSelect = (optionValue) => {
    setSelectedOption(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    const option = quickOptions.find((opt) => opt.value === selectedOption);
    return option ? option.label : "Select date range";
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-foreground">Date Range</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 w-full md:w-56 justify-between font-normal",
              !selectedOption && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {getDisplayLabel()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            {/* Quick Options */}
            <div className="space-y-1">
              <p className="text-sm font-medium mb-3">Quick Select</p>
              {quickOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQuickSelect(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedOption === option.value
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-border" />

            {/* Custom Range - Placeholder for future calendar implementation */}
            <button
              className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-muted-foreground"
              disabled
            >
              <Calendar className="h-4 w-4" />
              <span>Custom range (coming soon)</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeFilter;
