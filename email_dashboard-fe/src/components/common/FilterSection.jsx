import React, { useState } from "react";
import { Filter, X, Download } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import CustomerNameFilter from "../filters/CustomerNameFilter";
import BusinessTypeFilter from "../filters/BusinessTypeFilter";
import TimePeriodFilter from "../filters/TimePeriodFilter";

const FilterSection = ({ onApplyFilters, onReset, onExport }) => {
  const [filters, setFilters] = useState({
    customer: "",
    businessType: "All",
    timePeriod: "Last Month",
    customDateFrom: "",
    customDateTo: "",
  });

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleApply = () => {
    onApplyFilters?.(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      customer: "",
      businessType: "All",
      timePeriod: "Last Month",
      customDateFrom: "",
      customDateTo: "",
    };
    setFilters(resetFilters);
    onReset?.(resetFilters);
  };

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* Customer Name */}
          <CustomerNameFilter
            value={filters.customer}
            onChange={(value) => handleFilterChange("customer", value)}
            className="flex-1 min-w-[280px]"
          />

          {/* Business Type */}
          <BusinessTypeFilter
            value={filters.businessType}
            onChange={(value) => handleFilterChange("businessType", value)}
            className="w-[200px]"
          />

          {/* Time Period */}
          <TimePeriodFilter
            value={filters.timePeriod}
            onChange={(value) => handleFilterChange("timePeriod", value)}
            customDateFrom={filters.customDateFrom}
            customDateTo={filters.customDateTo}
            onCustomDateChange={handleFilterChange}
            className="w-[200px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button onClick={handleApply}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          <Button variant="secondary" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FilterSection;
