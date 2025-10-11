import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

const Tooltip = ({ children, content, side = "right", sideOffset = 12, delay = 200, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const showTooltip = () => {
    if (disabled) return;
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (side) {
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + sideOffset;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - sideOffset;
          break;
        case "top":
          top = rect.top - sideOffset;
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + sideOffset;
          left = rect.left + rect.width / 2;
          break;
      }

      setPosition({ top, left });
    }
  }, [isVisible, side, sideOffset]);

  const getTransformClass = () => {
    switch (side) {
      case "right":
        return "-translate-y-1/2";
      case "left":
        return "-translate-y-1/2 -translate-x-full";
      case "top":
        return "-translate-x-1/2 -translate-y-full";
      case "bottom":
        return "-translate-x-1/2";
      default:
        return "";
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>
      {isVisible && content && createPortal(
        <div
          className={cn(
            "fixed z-[100] px-3 py-2 text-sm text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none",
            getTransformClass()
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-slate-900 dark:bg-slate-800 transform rotate-45",
              side === "right" && "-left-1 top-1/2 -translate-y-1/2",
              side === "left" && "-right-1 top-1/2 -translate-y-1/2",
              side === "top" && "-bottom-1 left-1/2 -translate-x-1/2",
              side === "bottom" && "-top-1 left-1/2 -translate-x-1/2"
            )}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
