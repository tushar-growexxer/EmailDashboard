import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

const Modal = ({ open, onClose, children, className }) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          "relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-2xl animate-scale-up",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className }) => (
  <div className={cn("flex items-start justify-between p-6 border-b", className)}>
    {children}
  </div>
);

const ModalTitle = ({ children, className }) => (
  <h2 className={cn("text-2xl font-semibold", className)}>{children}</h2>
);

const ModalDescription = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground mt-1", className)}>{children}</p>
);

const ModalContent = ({ children, className }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn("flex items-center justify-end gap-2 p-6 border-t", className)}>
    {children}
  </div>
);

const ModalClose = ({ onClose, className }) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn("absolute right-4 top-4", className)}
    onClick={onClose}
  >
    <X className="h-4 w-4" />
  </Button>
);

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
};
