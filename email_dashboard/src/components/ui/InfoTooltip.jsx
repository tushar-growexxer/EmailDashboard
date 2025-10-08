import React from "react";
import { Info } from "lucide-react";
import Tooltip from "./Tooltip";
import { cn } from "../../lib/utils";

const InfoTooltip = ({ content, className }) => {
  if (!content) return null;

  return (
    <Tooltip content={content} side="right" delay={200}>
      <Info
        className={cn(
          "w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help transition-colors",
          className
        )}
      />
    </Tooltip>
  );
};

export default InfoTooltip;
