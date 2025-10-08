import React, { useState } from "react";
import { Mail, ExternalLink, Check, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalHeader, ModalTitle } from "../components/ui/Modal";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import FilterSection from "../components/common/FilterSection";
import { cn } from "../lib/utils";

// Mock data
const mockData = [
  {
    id: 1,
    userName: "John Smith",
    email: "john.smith@company.com",
    inquiry: 5,
    complaint: 2,
    request: 3,
    feedback: 1,
    other: 0,
    total: 11,
    count_24_48: 3,
    count_48_72: 2,
    count_72_168: 4,
    count_168_plus: 2,
    trend: "up",
  },
  {
    id: 2,
    userName: "Sarah Johnson",
    email: "sarah.j@company.com",
    inquiry: 8,
    complaint: 4,
    request: 2,
    feedback: 0,
    other: 1,
    total: 15,
    count_24_48: 5,
    count_48_72: 4,
    count_72_168: 5,
    count_168_plus: 1,
    trend: "down",
  },
  {
    id: 3,
    userName: "Mike Wilson",
    email: "mike.w@company.com",
    inquiry: 3,
    complaint: 1,
    request: 5,
    feedback: 2,
    other: 0,
    total: 11,
    count_24_48: 4,
    count_48_72: 3,
    count_72_168: 4,
    count_168_plus: 0,
    trend: "up",
  },
];

const mockEmails = [
  {
    id: 1,
    sender: "customer1@example.com",
    customerName: "ABC Corp",
    subject: "Urgent: Product inquiry regarding bulk order",
    preview: "We are interested in placing a bulk order for your products. Could you please provide pricing details...",
    receivedAt: "2024-01-15T10:30:00",
    category: "Inquiry",
    timeUnreplied: "36 hours",
  },
  {
    id: 2,
    sender: "customer2@example.com",
    customerName: "XYZ Industries",
    subject: "Follow-up on previous inquiry",
    preview: "I sent an email last week regarding the product specifications. Waiting for your response...",
    receivedAt: "2024-01-14T14:20:00",
    category: "Inquiry",
    timeUnreplied: "48 hours",
  },
];

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

const EmailAnalytics = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleCategoryClick = (user, category, count) => {
    if (count > 0) {
      setSelectedUser(user);
      setSelectedCategory(category);
      setModalOpen(true);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      inquiry: "blue",
      complaint: "red",
      request: "green",
      feedback: "purple",
      other: "gray",
    };
    return colors[category] || "gray";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Email Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive view of unreplied emails and aging analysis
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last refreshed: Today at 7:00 AM
        </p>
      </div>

      {/* Shared Filters */}
      <FilterSection
        onApplyFilters={(filters) => console.log("Filters applied:", filters)}
        onReset={(filters) => console.log("Filters reset:", filters)}
        onExport={() => console.log("Export clicked")}
      />

      
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

      {/* Section 1: Response Dashboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Unreplied Emails by Category (24+ hrs)</h2>
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead className="text-center">Inquiry</TableHead>
                  <TableHead className="text-center">Complaint</TableHead>
                  <TableHead className="text-center">Request</TableHead>
                  <TableHead className="text-center">Feedback</TableHead>
                  <TableHead className="text-center">Other</TableHead>
                  <TableHead className="text-center font-bold">Total</TableHead>
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
                      <Badge
                        variant={getCategoryColor("inquiry")}
                        className={row.inquiry > 0 ? "cursor-pointer hover:scale-110 transition-transform" : "opacity-50"}
                        onClick={() => handleCategoryClick(row, "Inquiry", row.inquiry)}
                      >
                        {row.inquiry}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getCategoryColor("complaint")}
                        className={row.complaint > 0 ? "cursor-pointer hover:scale-110 transition-transform" : "opacity-50"}
                        onClick={() => handleCategoryClick(row, "Complaint", row.complaint)}
                      >
                        {row.complaint}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getCategoryColor("request")}
                        className={row.request > 0 ? "cursor-pointer hover:scale-110 transition-transform" : "opacity-50"}
                        onClick={() => handleCategoryClick(row, "Request", row.request)}
                      >
                        {row.request}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getCategoryColor("feedback")}
                        className={row.feedback > 0 ? "cursor-pointer hover:scale-110 transition-transform" : "opacity-50"}
                        onClick={() => handleCategoryClick(row, "Feedback", row.feedback)}
                      >
                        {row.feedback}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getCategoryColor("other")}
                        className={row.other > 0 ? "cursor-pointer hover:scale-110 transition-transform" : "opacity-50"}
                        onClick={() => handleCategoryClick(row, "Other", row.other)}
                      >
                        {row.other}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-lg">{row.total}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Aging Report */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aging Report</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Time-based analysis of unreplied emails per user
        </p>

        {/* Aging Table - Minimal Design */}
        <Card>
          <CardContent className="p-6">
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
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="py-4 px-6">
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
                    <TableCell className="text-center py-4 px-6">
                      <span className="text-base">{row.count_24_48}</span>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <span className="text-base font-medium text-amber-600">
                        {row.count_48_72}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <span className="text-base font-semibold text-orange-600">
                        {row.count_72_168}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <span className={cn(
                        "text-base font-bold",
                        row.count_168_plus > 0 ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {row.count_168_plus}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
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
      </div>

      {/* Email Details Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} className="max-w-4xl">
        <ModalClose onClose={() => setModalOpen(false)} />
        <ModalHeader>
          <div>
            <ModalTitle>Unreplied Emails - {selectedCategory}</ModalTitle>
            <ModalDescription>User: {selectedUser?.userName}</ModalDescription>
          </div>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {mockEmails.map((email) => (
              <Card key={email.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{email.sender}</p>
                        <p className="text-xs text-muted-foreground">{email.customerName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{email.subject}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{email.preview}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {new Date(email.receivedAt).toLocaleString()}
                      </Badge>
                      <Badge variant={getCategoryColor(email.category.toLowerCase())} className="text-xs">
                        {email.category}
                      </Badge>
                      <Badge variant="red" className="text-xs">
                        Unreplied: {email.timeUnreplied}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="default">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Email
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Check className="h-3 w-3 mr-1" />
                        Mark as Replied
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default EmailAnalytics;
