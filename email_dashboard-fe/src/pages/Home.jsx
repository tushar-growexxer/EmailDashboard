import React from "react";
import { Mail, Clock, TrendingUp, AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/utils";

const quickStats = [
  {
    title: "Total Unreplied Emails",
    value: "156",
    change: "+12%",
    changeType: "increase",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    link: "/email-analytics",
  },
  {
    title: "Critical (7+ Days)",
    value: "23",
    change: "+5",
    changeType: "increase",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    link: "/email-analytics",
  },
  {
    title: "Avg Response Time",
    value: "3.2 days",
    change: "-8%",
    changeType: "decrease",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    link: "/email-analytics",
  },
  {
    title: "Avg Sentiment Score",
    value: "1.9",
    change: "Positive",
    changeType: "neutral",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    link: "/sentiment",
  },
];

const recentActivity = [
  {
    user: "John Smith",
    action: "has 5 new unreplied inquiries",
    time: "2 hours ago",
    priority: "high",
  },
  {
    user: "Sarah Johnson",
    action: "has emails aging over 7 days",
    time: "3 hours ago",
    priority: "critical",
  },
  {
    user: "Mike Wilson",
    action: "improved response time by 15%",
    time: "5 hours ago",
    priority: "positive",
  },
  {
    user: "Emily Davis",
    action: "has 3 new customer complaints",
    time: "6 hours ago",
    priority: "high",
  },
];

const dashboardLinks = [
  {
    title: "Email Analytics",
    description: "Response & Aging Reports",
    icon: Mail,
    link: "/email-analytics",
    badge: "Combined View",
    color: "border-blue-200 hover:border-blue-400",
  },
  {
    title: "Sentiment Analysis",
    description: "Customer sentiment trends",
    icon: TrendingUp,
    link: "/sentiment",
    badge: "Top 10",
    color: "border-purple-200 hover:border-purple-400",
  },
];

const Home = () => {
  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold mb-2">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back! Here's what's happening with your emails today.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Last refreshed: Today at 7:00 AM
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickStats.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {stat.title}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant={
                          stat.changeType === "increase" ? "red" :
                          stat.changeType === "decrease" ? "green" : "gray"
                        }
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">vs last period</span>
                    </div>
                  </div>
                  <div className={cn("p-2 sm:p-3 rounded-full shrink-0", stat.bgColor)}>
                    <stat.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", stat.color)} />
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View details
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Quick Access */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {dashboardLinks.map((item, index) => (
              <Link key={index} to={item.link}>
                <Card className={cn("border-2 transition-all hover:shadow-md", item.color)}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-muted shrink-0">
                        <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base">{item.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.badge}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                        <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-primary">
                          Open dashboard
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Latest Updates</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Real-time activity from your team</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3 pb-3 sm:pb-4 border-b last:border-0 last:pb-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 sm:mt-2 shrink-0",
                      activity.priority === "critical" ? "bg-red-500" :
                      activity.priority === "high" ? "bg-orange-500" :
                      activity.priority === "positive" ? "bg-green-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Email Sync</span>
                  </div>
                  <Badge variant="green" className="text-xs shrink-0">Active</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">SAP Integration</span>
                  </div>
                  <Badge variant="green" className="text-xs shrink-0">Connected</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">AI Sentiment Engine</span>
                  </div>
                  <Badge variant="green" className="text-xs shrink-0">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
