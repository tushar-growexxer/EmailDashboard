import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import Tooltip from "../ui/Tooltip";
import { ConfirmDialog } from "../ui/Dialog";

const SidebarFooter = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call AuthContext logout to clear everything
      await logout();
      
      // Close modal and navigate to login
      setShowLogoutModal(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // Navigate anyway to ensure user is logged out
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div className="p-4 border-t border-border">
        <Tooltip content="Logout" side="right" delay={200} disabled={isSidebarOpen}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className={cn(
              "flex items-center rounded-lg transition-all duration-300",
              isSidebarOpen
                ? "w-full px-4 py-3 gap-3 justify-start"
                : "w-10 h-10 mx-auto justify-center",
              "text-muted-foreground",
              "hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            )}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                "text-sm font-medium transition-opacity duration-200 whitespace-nowrap overflow-hidden",
                isSidebarOpen ? "opacity-100 delay-100" : "opacity-0 w-0"
              )}
            >
              Logout
            </span>
          </button>
        </Tooltip>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        title="Confirm Logout"
        description={
        <>
          Are you sure you want to logout? 
          <br />
          You'll need to sign in again to access the dashboard.
        </>
          }
        icon={AlertCircle}
        iconClassName="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500"
        confirmText={
          <>
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </>
        }
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        variant="destructive"
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default SidebarFooter;
