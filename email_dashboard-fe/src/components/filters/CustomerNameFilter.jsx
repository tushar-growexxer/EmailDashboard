import React from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";

const CustomerNameFilter = ({ value = "", onChange, placeholder = "Search or select customer", className }) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-foreground">Customer Name</label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default CustomerNameFilter;
