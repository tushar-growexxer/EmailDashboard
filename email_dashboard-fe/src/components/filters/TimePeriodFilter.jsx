import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const quickOptions = [
  { value: "Last Week", label: "Last Week" },
  { value: "Last Month", label: "Last Month" },
  { value: "Past 3 Months", label: "Past 3 Months" },
  { value: "Last Fiscal Year", label: "Last Fiscal Year" },
];

const TimePeriodFilter = ({ 
  value = "Last Month", 
  onChange, 
  customDateFrom = "",
  customDateTo = "",
  onCustomDateChange,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const handleQuickSelect = (optionValue) => {
    onChange(optionValue);
    setShowCustom(false);
    setIsOpen(false);
  };

  const handleCustomClick = () => {
    setShowCustom(!showCustom);
  };

  const handleApplyCustom = () => {
    if (customDateFrom && customDateTo) {
      onChange("Custom");
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  const getDisplayLabel = () => {
    if (value === "Custom" && customDateFrom && customDateTo) {
      return `${customDateFrom} to ${customDateTo}`;
    }
    return value || "Select time period";
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-foreground">Time Period</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 w-full justify-between font-normal",
              !value && "text-muted-foreground"
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
                    value === option.value
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

            {/* Custom Range */}
            <div>
              <button
                onClick={handleCustomClick}
                className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-foreground"
              >
                <Calendar className="h-4 w-4" />
                <span>Custom range</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    showCustom && "rotate-180"
                  )}
                />
              </button>

              {/* Custom Date Inputs */}
              {showCustom && (
                <div className="mt-3 space-y-3 px-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => onCustomDateChange?.("customDateFrom", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => onCustomDateChange?.("customDateTo", e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleApplyCustom}
                    disabled={!customDateFrom || !customDateTo}
                    className="w-full h-9"
                    size="sm"
                  >
                    Apply Custom Range
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TimePeriodFilter;
