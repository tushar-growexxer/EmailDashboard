import React from "react";
import ReactDOM from "react-dom";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

const AlertDialog = ({ open, onClose, children }) => {
  if (!open) return null;

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Overlay - Blurs everything behind */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        style={{ backdropFilter: 'blur(8px)' }}
      />
      
      {/* Dialog Content */}
      <div className="relative z-50 w-full max-w-md mx-4 animate-scale-up">
        {children}
      </div>
    </div>
  );

  // Render via portal to escape any parent stacking contexts (e.g., sidebar)
  return ReactDOM.createPortal(dialog, document.body);
};

const AlertDialogContent = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-2xl p-6",
        "transition-colors duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};

const AlertDialogHeader = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col items-center text-center mb-6", className)}>
      {children}
    </div>
  );
};

const AlertDialogIcon = ({ icon: Icon, className }) => {
  return (
    <div
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-4",
        "bg-amber-100 dark:bg-amber-900/20",
        className
      )}
    >
      <Icon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
    </div>
  );
};

const AlertDialogTitle = ({ children, className }) => {
  return (
    <h2 className={cn("text-xl font-semibold text-foreground mb-2", className)}>
      {children}
    </h2>
  );
};

const AlertDialogDescription = ({ children, className }) => {
  return (
    <p className={cn("text-sm text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
};

const AlertDialogFooter = ({ children, className }) => {
  return (
    <div className={cn("flex gap-3 mt-6", className)}>
      {children}
    </div>
  );
};

const AlertDialogCancel = ({ onClick, children, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors",
        "border border-border bg-background hover:bg-accent",
        "text-foreground",
        className
      )}
    >
      {children || "Cancel"}
    </button>
  );
};

const AlertDialogAction = ({ onClick, children, variant = "destructive", className }) => {
  const variants = {
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    default: "bg-primary hover:bg-primary/90 text-primary-foreground",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors",
        "flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
