import React, { useState } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Mail, Clock, AlertTriangle, ExternalLink, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogClose } from "../components/ui/Dialog";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { PaginatedTable } from "../components/ui/PaginatedTable";
import FilterSection from "../components/common/FilterSection";
import { cn } from "../lib/utils";

// Generate unique categories from mockUserEmailData
const getUniqueCategories = () => {
  if (!mockUserEmailData.categories) return [];
  return Object.keys(mockUserEmailData.categories).filter(category => category !== "_id" && category !== "user_id" && category !== "user_email" && category !== "full_name");
};

// Generate mock users based on email domains and data
const generateMockUsers = () => {
  const categories = getUniqueCategories();

  // Create a single user entry for the logged-in user
  const userEmail = mockUserEmailData.user_email;
  const userName = mockUserEmailData.full_name || userEmail.split('@')[0];

  const user = {
    id: 1,
    userName: userName,
    email: userEmail,
    categories: {}
  };

  // Group all emails by category for this user
  categories.forEach(category => {
    const emailsInCategory = mockUserEmailData.categories[category] || [];
    user.categories[category] = emailsInCategory;
  });

  // Calculate counts
  const categoryCounts = {};
  let total = 0;
  let count_24_48 = 0;
  let count_48_72 = 0;
  let count_72_168 = 0;
  let count_168_plus = 0;

  categories.forEach(category => {
    const emailsInCategory = user.categories[category] || [];
    categoryCounts[category.toLowerCase()] = emailsInCategory.length;
    total += emailsInCategory.length;

    emailsInCategory.forEach(email => {
      if (email.hours_unreplied <= 48) count_24_48++;
      else if (email.hours_unreplied <= 72) count_48_72++;
      else if (email.hours_unreplied <= 168) count_72_168++;
      else count_168_plus++;
    });
  });

  return [{
    id: user.id,
    userName: user.userName,
    email: user.email,
    total,
    count_24_48,
    count_48_72,
    count_72_168,
    count_168_plus,
    trend: total > 10 ? "up" : "down",
    ...categoryCounts
  }];
};

// Extract email address from "Name <email>" format
const extractEmailInfo = (fromEmail) => {
  const match = fromEmail.match(/(.*?)\s*<(.+?)>/);
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }
  return {
    name: fromEmail,
    email: fromEmail
  };
};

// Get dynamic table headers from categories
const getTableHeaders = () => {
  const categories = getUniqueCategories();
  return [
    { key: "userName", label: "User" },
    ...categories.map(category => ({ key: category.toLowerCase(), label: category })),
    { key: "total", label: "Total" }
  ];
};

// Mock user email data with categories
const mockUserEmailData = {
  "_id": {
    "$oid": "68ee142883f3599e3808294d"
  },
  "user_id": 11,
  "user_email": "yashpandya21@gnu.ac.in",
  "full_name": "YASH PANDYA",
  "categories": {
    "Status": [],
    "Complaint": [
      {
        "subject": "Damaged Product & Delivery Delay",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 122.84796566552586,
        "inbox_date": "Thu, 9 Oct 2025 11:52:20 +0530"
      }
    ],
    "Inquiry": [
      {
        "subject": "H2SO4",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 115.64102122108142,
        "inbox_date": "Thu, 9 Oct 2025 19:04:45 +0530"
      },
      {
        "subject": "Zinc",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 119.98046566552586,
        "inbox_date": "Thu, 9 Oct 2025 14:44:23 +0530"
      },
      {
        "subject": "Availability of Calcium chloride Barrels",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 121.6912989988592,
        "inbox_date": "Thu, 9 Oct 2025 13:01:44 +0530"
      },
      {
        "subject": "Matpers EDC 200 - Raw Material Documentation Checklist",
        "from_email": "Yash  Pandya <yash.pandya@growexx.com>",
        "hours_unreplied": 143.50435455441476,
        "inbox_date": "Wed, 8 Oct 2025 09:42:57 +0000"
      }
      ,
      {
        "subject": "Availability of Calcium chloride Barrels",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 121.6912989988592,
        "inbox_date": "Thu, 9 Oct 2025 13:01:44 +0530"
      },
      {
        "subject": "Matpers EDC 200 - Raw Material Documentation Checklist",
        "from_email": "Yash  Pandya <yash.pandya@growexx.com>",
        "hours_unreplied": 143.50435455441476,
        "inbox_date": "Wed, 8 Oct 2025 09:42:57 +0000"
      }
    ],
    "Pricing-Negotiation": [
      {
        "subject": "Re: Inquiry: Industrial Grade Hydrochloric Acid (HCl) Supply",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 138.6537989988592,
        "inbox_date": "Wed, 8 Oct 2025 20:03:59 +0530"
      }
    ],
    "Proposal": [
      {
        "subject": "Contract Finalization",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 122.89602122108141,
        "inbox_date": "Thu, 9 Oct 2025 11:49:27 +0530"
      }
    ],
    "Logistics": [
      {
        "subject": "Urgent: Delay in Truck Arrival at Loading Bay",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 122.87102122108142,
        "inbox_date": "Thu, 9 Oct 2025 11:50:57 +0530"
      }
    ],
    "Acknowledgement": [
      {
        "subject": "Hi",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 118.5937989988592,
        "inbox_date": "Thu, 9 Oct 2025 16:07:35 +0530"
      },
      {
        "subject": "Re: H2SO4",
        "from_email": "Yash Pandya <yashpandya436@gmail.com>",
        "hours_unreplied": 143.7249101099703,
        "inbox_date": "Wed, 8 Oct 2025 14:59:43 +0530"
      }
    ],
    "Status-of-Inquiry": [
      {
        "subject": "Request for Delivery Status",
        "from_email": "Yash  Pandya <yash.pandya@growexx.com>",
        "hours_unreplied": 122.35824344330364,
        "inbox_date": "Thu, 9 Oct 2025 06:51:43 +0000"
      }
    ],
    "Unclassified": [
      {
        "subject": "H2SO4",
        "from_email": "Yash  Pandya <yash.pandya@growexx.com>",
        "hours_unreplied": 166.50907677663696,
        "inbox_date": "Tue, 7 Oct 2025 10:42:40 +0000"
      }
    ]
  }
};

const summaryStats = [
  {
    title: "Total Unreplied",
    value: 12,
    icon: Mail,
    trend: "+12%",
    trendUp: true,
    color: "text-blue-600",
  },
  {
    title: "Critical (7+ Days)",
    value: 0,
    icon: AlertTriangle,
    trend: "+5%",
    trendUp: true,
    color: "text-red-600",
  },
  // {
  //   title: "Avg Response Time",
  //   value: "3.2 days",
  //   icon: Clock,
  //   trend: "-8%",
  //   trendUp: false,
  //   color: "text-orange-600",
  // },
  // {
  //   title: "SLA Compliance",
  //   value: "78%",
  //   icon: CheckCircle,
  //   trend: "+3%",
  //   trendUp: true,
  //   color: "text-green-600",
  // }
]

const EmailAnalytics = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [emailCurrentPage, setEmailCurrentPage] = useState(1);
  const [emailsPerPage, setEmailsPerPage] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Generate dynamic data from JSON
  const mockData = generateMockUsers();
  const tableHeaders = getTableHeaders();

  // Column definitions for Response Dashboard
  const responseColumns = [
    {
      key: "userName",
      header: "User",
      sortable: true,
      className: "w-[200px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(row.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate">{row.userName}</p>
            <p className="text-xs text-muted-foreground truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    ...tableHeaders.slice(1, -1).map((header) => ({
      key: header.key,
      header: header.label,
      sortable: true,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => {
        const count = row[header.key] || 0;
        return (
          <Badge
            variant={getCategoryColor(header.key)}
            className={`${count > 0 ? "cursor-pointer hover:scale-110 transition-transform" : "opacity-50"} text-xs px-2 py-1`}
            onClick={() => handleCategoryClick(row, header.label, count)}
          >
            {count}
          </Badge>
        );
      },
    })),
    {
      key: "total",
      header: "Total",
      sortable: true,
      className: "text-center font-bold",
      cellClassName: "text-center",
      render: (row) => <span className="font-bold text-base">{row.total}</span>,
    },
  ];

  // Column definitions for Aging Dashboard
  const agingColumns = [
    {
      key: "userName",
      header: "User",
      sortable: true,
      className: "w-[200px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(row.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate">{row.userName}</p>
            <p className="text-xs text-muted-foreground truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "count_24_48",
      header: "24-48 Hrs",
      sortable: true,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => <span className="text-sm">{row.count_24_48}</span>,
    },
    {
      key: "count_48_72",
      header: "48-72 Hrs",
      sortable: true,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span className="text-sm font-medium text-amber-600">{row.count_48_72}</span>
      ),
    },
    {
      key: "count_72_168",
      header: "72-168 Hrs",
      sortable: true,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span className="text-sm font-semibold text-orange-600">{row.count_72_168}</span>
      ),
    },
    {
      key: "count_168_plus",
      header: "7+ Days",
      sortable: true,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span className={cn(
          "text-sm font-bold",
          row.count_168_plus > 0 ? "text-red-600" : "text-muted-foreground"
        )}>
          {row.count_168_plus}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      className: "text-center font-bold",
      cellClassName: "text-center",
      render: (row) => <span className="font-bold text-base">{row.total}</span>,
    },
  ];

  const handleCategoryClick = (user, category, count) => {
    if (count > 0) {
      setSelectedUser(user);
      setSelectedCategory(category);
      setModalOpen(true);
      setEmailCurrentPage(1); // Reset to first page when opening modal
    }
  };

  const getCategoryColor = (category) => {
    // Normalize category name for lookup (remove spaces, hyphens, convert to camelCase)
    const normalizedCategory = category.toLowerCase().replace(/[-\s]/g, '');

    const colors = {
      status: "blue",
      complaint: "red",
      inquiry: "green",
      pricingnegotiation: "purple",
      proposal: "orange",
      logistics: "cyan",
      acknowledgement: "yellow",
      statusofinquiry: "indigo",
      unclassified: "gray",
    };
    return colors[normalizedCategory] || "gray";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Format hours into readable time string
  const formatHoursUnreplied = (hours) => {
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else if (hours < 168) {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    } else {
      const weeks = Math.floor(hours / 168);
      const days = Math.floor((hours % 168) / 24);
      return days > 0 ? `${weeks}w ${days}d` : `${weeks} weeks`;
    }
  };

// Extract email address from "Name <email>" format
const extractEmailInfo = (fromEmail) => {
  const match = fromEmail.match(/(.*?)\s*<(.+?)>/);
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }
  return {
    name: fromEmail,
    email: fromEmail
  };
};

  // Get emails for the selected category (sorted by date ascending)
  const getEmailsForCategory = () => {
    if (!selectedCategory || !mockUserEmailData.categories) {
      return [];
    }
    const emails = mockUserEmailData.categories[selectedCategory] || [];
    // Sort by inbox_date ascending (oldest first)
    return [...emails].sort((a, b) => {
      const dateA = new Date(a.inbox_date);
      const dateB = new Date(b.inbox_date);
      return dateA - dateB;
    });
  };

  // Get paginated emails for the selected category
  const getPaginatedEmailsForCategory = () => {
    const emails = getEmailsForCategory();
    const startIndex = (emailCurrentPage - 1) * emailsPerPage;
    const endIndex = startIndex + emailsPerPage;
    return emails.slice(startIndex, endIndex);
  };

  // Calculate total email pages
  const totalEmailPages = Math.ceil(getEmailsForCategory().length / emailsPerPage);

  // Handle email page change
  const handleEmailPageChange = (page) => {
    setEmailCurrentPage(Math.max(1, Math.min(page, totalEmailPages)));
  };

  // Handle emails per page change
  const handleEmailsPerPageChange = (e) => {
    setEmailsPerPage(Number(e.target.value));
    setEmailCurrentPage(1);
  };

  return (
    <div className="space-y-6 w-full mx-auto px-4">
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
      
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {summaryStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
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
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-3">Unreplied Emails by Category (24+ hrs)</h2>
        <Card className="shadow-md">
          <CardContent className="p-0">
            <PaginatedTable
              data={mockData}
              columns={responseColumns}
              searchKey="userName"
              searchPlaceholder="Filter users..."
              defaultSort={{ key: "total", direction: "desc" }}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Aging Report */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Aging Report</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Time-based analysis of unreplied emails per user
        </p>

        <Card className="shadow-md">
          <CardContent className="p-0">
            <PaginatedTable
              data={mockData}
              columns={agingColumns}
              searchKey="userName"
              searchPlaceholder="Filter users..."
              defaultSort={{ key: "total", direction: "desc" }}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>

      {/* Email Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl" onClose={() => setModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Unreplied Emails - {selectedCategory}</DialogTitle>
            <DialogDescription>
              User: {selectedUser?.userName} ({getEmailsForCategory().length} emails)
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {/* Email List */}
            {getEmailsForCategory().length > 0 ? (
              getPaginatedEmailsForCategory().map((email, index) => {
                const emailInfo = extractEmailInfo(email.from_email);
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{emailInfo.name}</p>
                            <p className="text-xs text-muted-foreground">{emailInfo.email}</p>
                      </div>
                    </div>
                    <div>
                          <p className="font-semibold text-sm">{email.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {email.inbox_date}
                      </Badge>
                          <Badge variant={getCategoryColor(selectedCategory)} className="text-xs">
                            {selectedCategory}
                      </Badge>
                          <Badge 
                            variant={email.hours_unreplied > 168 ? "red" : email.hours_unreplied > 72 ? "orange" : "yellow"} 
                            className="text-xs font-semibold"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1 inline" />
                            Unreplied: {formatHoursUnreplied(email.hours_unreplied)}
                      </Badge>
                    </div>
                        {/* <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="default">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Email
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Check className="h-3 w-3 mr-1" />
                        Mark as Replied
                      </Button>
                        </div> */}
                  </div>
                </CardContent>
              </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No unreplied emails in this category</p>
          </div>
            )}
             {/* Email Pagination Controls */}
            {getEmailsForCategory().length > 0 && (
              <div className="flex items-center justify-between px-1 py-2 border-b">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing {((emailCurrentPage - 1) * emailsPerPage) + 1} to{" "}
                  {Math.min(emailCurrentPage * emailsPerPage, getEmailsForCategory().length)} of{" "}
                  {getEmailsForCategory().length} emails
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Per page</p>
                    <Select
                      value={emailsPerPage}
                      onChange={handleEmailsPerPageChange}
                      className="h-9 w-[60px]"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmailPageChange(1)}
                      disabled={emailCurrentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmailPageChange(emailCurrentPage - 1)}
                      disabled={emailCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {emailCurrentPage} of {totalEmailPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmailPageChange(emailCurrentPage + 1)}
                      disabled={emailCurrentPage === totalEmailPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmailPageChange(totalEmailPages)}
                      disabled={emailCurrentPage === totalEmailPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailAnalytics;
