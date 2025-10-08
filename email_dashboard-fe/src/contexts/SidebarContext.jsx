import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  setSidebarOpen: () => {},
});

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Check localStorage for saved state
    const saved = localStorage.getItem("sidebarOpen");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const setSidebarOpen = (value) => {
    setIsSidebarOpen(value);
  };

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};
