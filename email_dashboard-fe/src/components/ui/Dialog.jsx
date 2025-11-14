import React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Dialog Root Component
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @param {React.ReactNode} props.children - Dialog content
 */
const Dialog = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        onOpenChange?.(false);
      }
    };
    
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      
      {/* Dialog container */}
      <div className="relative z-50 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );

  // Render via portal for proper stacking
  return ReactDOM.createPortal(dialog, document.body);
};

/**
 * Dialog Content - Main container
 */
const DialogContent = React.forwardRef(({ children, className, onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative bg-background border border-border rounded-lg shadow-2xl",
        "w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden",
        "animate-in zoom-in-95 fade-in duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
      {onClose && (
        <DialogClose onClick={onClose} />
      )}
    </div>
  );
});
DialogContent.displayName = "DialogContent";

/**
 * Dialog Header
 */
const DialogHeader = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-1.5 p-4 sm:p-6 border-b", className)}>
    {children}
  </div>
);

/**
 * Dialog Title
 */
const DialogTitle = ({ children, className }) => (
  <h2 className={cn("text-lg sm:text-xl font-semibold leading-none tracking-tight", className)}>
    {children}
  </h2>
);

/**
 * Dialog Description
 */
const DialogDescription = ({ children, className }) => (
  <p className={cn("text-xs sm:text-sm text-muted-foreground", className)}>
    {children}
  </p>
);

/**
 * Dialog Body - Scrollable content area
 */
const DialogBody = ({ children, className }) => (
  <div className={cn("p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-180px)]", className)}>
    {children}
  </div>
);

/**
 * Dialog Footer
 */
const DialogFooter = ({ children, className }) => (
  <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t", className)}>
    {children}
  </div>
);

/**
 * Dialog Close Button (X icon)
 */
const DialogClose = ({ onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
      "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      "disabled:pointer-events-none",
      className
    )}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
);

/**
 * Confirmation Dialog - Specialized dialog for confirmations
 */
const ConfirmDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  icon: Icon,
  iconClassName,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
  children
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm?.();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const variantStyles = {
    default: "bg-primary hover:bg-primary/90 text-primary-foreground",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClose={handleCancel}>
        {Icon && (
          <div className="flex justify-center pt-6">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              iconClassName || "bg-amber-100 dark:bg-amber-900/20"
            )}>
              <Icon className={cn(
                "w-6 h-6",
                iconClassName ? "" : "text-amber-600 dark:text-amber-500"
              )} />
            </div>
          </div>
        )}
        <div className="text-center p-4 sm:p-6 pb-0">
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{description}</p>
          )}
          {children}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-colors",
              "border border-border bg-background hover:bg-accent",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-colors",
              "flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              variantStyles[variant]
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Form Dialog - Specialized dialog for forms
 */
const FormDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description,
  children,
  footer,
  className,
  maxWidth = "max-w-lg"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, className)} onClose={() => onOpenChange(false)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <DialogBody>
          {children}
        </DialogBody>
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  ConfirmDialog,
  FormDialog,
};

