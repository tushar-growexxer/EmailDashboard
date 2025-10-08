import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
