import React from "react";
import { LayoutDashboard, TrendingUp, Settings, BarChart3 } from "lucide-react";
import NavigationItem from "./NavigationItem";

const navigationItems = [

  {
    icon: BarChart3,
    label: "Email Analytics",
    path: "/email-analytics",
  },
  // {
  //   icon: TrendingUp,
  //   label: "Sentiment",
  //   path: "/sentiment",
  // },
];

const SidebarNavigation = ({ userRole }) => {
  const items = [...navigationItems];

  // Add Settings for admin only (case-insensitive check)
  if (userRole && userRole.toLowerCase() === "admin") {
    items.push({
      icon: Settings,
      label: "Settings",
      path: "/settings",
    });
  }

  return (
    <nav className="flex-1 p-4 overflow-y-auto">
      <div className="flex flex-col space-y-1">
        {items.map((item) => (
          <NavigationItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
          />
        ))}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
