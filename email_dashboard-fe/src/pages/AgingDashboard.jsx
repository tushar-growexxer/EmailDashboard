import React from "react";
import { Mail, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import FilterSection from "../components/common/FilterSection";
import { cn } from "../lib/utils";

// Mock data
const summaryStats = [
  {
    title: "Total Unreplied",
    value: 156,
    icon: Mail,
    trend: "+12%",
    trendUp: true,
    color: "text-blue-600",
  },
  {
    title: "Critical (7+ Days)",
    value: 23,
    icon: AlertTriangle,
    trend: "+5%",
    trendUp: true,
    color: "text-red-600",
  },
  {
    title: "Avg Response Time",
    value: "3.2 days",
    icon: Clock,
    trend: "-8%",
    trendUp: false,
    color: "text-orange-600",
  },
  {
    title: "SLA Compliance",
    value: "78%",
    icon: CheckCircle,
    trend: "+3%",
    trendUp: true,
    color: "text-green-600",
  },
];

const mockData = [
  {
    id: 1,
    userName: "John Smith",
    email: "john.smith@company.com",
    count_24_48: 8,
    count_48_72: 5,
    count_72_168: 3,
    count_168_plus: 2,
    total: 18,
    trend: "up",
  },
  {
    id: 2,
    userName: "Sarah Johnson",
    email: "sarah.j@company.com",
    count_24_48: 12,
    count_48_72: 7,
    count_72_168: 4,
    count_168_plus: 1,
    total: 24,
    trend: "down",
  },
  {
    id: 3,
    userName: "Mike Wilson",
    email: "mike.w@company.com",
    count_24_48: 6,
    count_48_72: 3,
    count_72_168: 2,
    count_168_plus: 0,
    total: 11,
    trend: "up",
  },
];

const AgingDashboard = () => {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getHeatmapColor = (count, max) => {
    if (count === 0) return "bg-gray-50";
    const intensity = Math.ceil((count / max) * 4);
    const colors = [
      "bg-red-50",
      "bg-red-100",
      "bg-red-200",
      "bg-red-300",
      "bg-red-400",
    ];
    return colors[intensity] || colors[0];
  };

  const maxCount = Math.max(...mockData.flatMap(row => [
    row.count_24_48,
    row.count_48_72,
    row.count_72_168,
    row.count_168_plus
  ]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email Aging Report</h1>
        <p className="text-muted-foreground mt-1">
          Time-based analysis of unreplied emails per user
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last refreshed: Today at 7:00 AM
        </p>
      </div>

      {/* Filters */}
      <FilterSection
        onApplyFilters={(filters) => console.log("Filters applied:", filters)}
        onReset={(filters) => console.log("Filters reset:", filters)}
        onExport={() => console.log("Export clicked")}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trendUp ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      stat.trendUp ? "text-green-600" : "text-red-600"
                    )}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={cn("p-3 rounded-full bg-muted", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aging Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Aging by User</CardTitle>
          <CardDescription>
            Color intensity indicates higher email counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead className="text-center">
                  <div>24-48 Hours</div>
                  <div className="text-xs font-normal text-muted-foreground">Warning</div>
                </TableHead>
                <TableHead className="text-center">
                  <div>48-72 Hours</div>
                  <div className="text-xs font-normal text-muted-foreground">Attention</div>
                </TableHead>
                <TableHead className="text-center">
                  <div>72-168 Hours</div>
                  <div className="text-xs font-normal text-muted-foreground">Urgent</div>
                </TableHead>
                <TableHead className="text-center">
                  <div>7+ Days</div>
                  <div className="text-xs font-normal text-muted-foreground">Critical</div>
                </TableHead>
                <TableHead className="text-center font-bold">Total Unreplied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(row.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{row.userName}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-16 h-10 rounded-md",
                      getHeatmapColor(row.count_24_48, maxCount)
                    )}>
                      <Badge variant="yellow" className="font-semibold">
                        {row.count_24_48}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-16 h-10 rounded-md",
                      getHeatmapColor(row.count_48_72, maxCount)
                    )}>
                      <Badge variant="orange" className="font-semibold">
                        {row.count_48_72}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-16 h-10 rounded-md",
                      getHeatmapColor(row.count_72_168, maxCount)
                    )}>
                      <Badge variant="red" className="font-semibold">
                        {row.count_72_168}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-16 h-10 rounded-md",
                      row.count_168_plus > 0 ? "bg-red-500" : "bg-gray-50"
                    )}>
                      <Badge 
                        variant={row.count_168_plus > 0 ? "destructive" : "gray"}
                        className="font-semibold"
                      >
                        {row.count_168_plus}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-lg">{row.total}</span>
                      {row.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100"></div>
              <span>24-48 Hours (Warning)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100"></div>
              <span>48-72 Hours (Attention)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-200"></div>
              <span>72-168 Hours (Urgent)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>7+ Days (Critical)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgingDashboard;
