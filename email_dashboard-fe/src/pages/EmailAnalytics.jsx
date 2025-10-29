import React, { useState, useMemo, useEffect } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Mail, Clock, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "../components/ui/Dialog";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { PaginatedTable } from "../components/ui/PaginatedTable";
import { useAuth } from "../contexts/AuthContext";
import useDashboardData from "../hooks/useDashboardData";
import {
  transformResponseDashboardData,
  transformAgingDashboardData,
  getTableHeaders,
  getAgingTableHeaders,
  calculateResponseSummaryStats,
  calculateAgingSummaryStats,
  getCategoryColor,
  getInitials,
  formatHoursUnreplied,
  extractEmailInfo,
  sortEmailsByDate,
  getUniqueCategories,
  calculateHoursUnreplied,
  formatDateTimeWithAMPM,
  formatProperCase,
} from "../utils/dashboardUtils";
import { cn } from "../lib/utils";

/**
 * Email Analytics Dashboard with MongoDB Integration
 * 
 * Features:
 * - Real-time data from MongoDB (with 24-hour cache)
 * - Loading and error states
 * - Manual refresh capability
 * - Response and Aging analysis
 * - Email details modal with pagination
 */
const EmailAnalytics = () => {
  const { user } = useAuth();
  
  // Dashboard data hooks
  const {
    data: responseData,
    loading: loadingResponse,
    error: errorResponse,
    refresh: refreshResponse,
    lastFetched,
  } = useDashboardData({ type: 'response', autoFetch: true });

  const {
    data: agingData,
    loading: loadingAging,
    error: errorAging,
    refresh: refreshAging,
  } = useDashboardData({ type: 'aging', autoFetch: true });

  // Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [emailCurrentPage, setEmailCurrentPage] = useState(1);
  const [emailsPerPage, setEmailsPerPage] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Transform MongoDB data for tables
  const transformedResponseData = useMemo(() => {
    return transformResponseDashboardData(responseData);
  }, [responseData]);

  const transformedAgingData = useMemo(() => {
    return transformAgingDashboardData(agingData);
  }, [agingData]);

  // Get table headers dynamically
  const tableHeaders = useMemo(() => {
    return getTableHeaders(responseData);
  }, [responseData]);

  // Calculate summary statistics from both dashboards
  const summaryStats = useMemo(() => {
    // Response Dashboard stats (unreplied emails in last 24h)
    const responseStats = calculateResponseSummaryStats(responseData);
    
    // Aging Dashboard stats (total unreplied and critical)
    const agingStats = calculateAgingSummaryStats(agingData);
    
    return [
      {
        title: "Unreplied (24h+)",
        value: responseStats.totalUnreplied24h,
        icon: Mail,
        description: "Emails unreplied in last 24 hours",
        color: "text-blue-600",
      },
      // {
      //   title: "Total Unreplied",
      //   value: agingStats.totalUnreplied,
      //   icon: Clock,
      //   description: "All unreplied emails across all time",
      //   color: "text-indigo-600",
      // },
      {
        title: "Critical (7+ Days)",
        value: agingStats.critical,
        icon: AlertTriangle,
        description: "Emails unreplied for more than 7 days",
        color: "text-red-600",
      },
    ];
  }, [responseData, agingData]);

  // Column definitions for Response Dashboard
  const responseColumns = useMemo(() => [
    {
      key: "userName",
      header: "Sales Employee",
      sortable: true,
      className: "w-[200px] text-left",
      cellClassName: "text-left",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="sm:h-10 sm:w-10">
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
      render: (row) => <span 
        className="font-bold text-base cursor-pointer hover:text-primary transition-colors"
        onClick={() => handleTotalUnrepliedClick(row)}
        title="Click to view all unreplied emails"
      >
        {row.total}
      </span>,
    },
  ], [tableHeaders]);

  // Get aging table headers dynamically
  const agingHeaders = useMemo(() => {
    return getAgingTableHeaders(agingData);
  }, [agingData]);

  // Column definitions for Aging Dashboard (Dynamic)
  const agingColumns = useMemo(() => {
    // Color mapping for different time ranges
    const getCategoryColorClass = (index, total) => {
      if (index === 0) return "text-sm"; // First bucket - normal
      if (index === total - 1) return "text-sm font-bold text-red-600"; // Last bucket (7+) - red
      if (index === total - 2) return "text-sm font-semibold text-orange-600"; // Second to last - orange
      return "text-sm font-medium text-amber-600"; // Middle buckets - amber
    };

    return [
      {
        key: "userName",
        header: "Sales Employee",
        sortable: true,
        className: "w-[200px] text-left",
        cellClassName: "text-left",
        render: (row) => (
          <div className="flex items-center gap-2">
            <Avatar className="sm:h-10 sm:w-10">
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
      // Dynamic aging bucket columns
      ...agingHeaders.map((header, index) => ({
        key: header.key,
        header: header.label,
        sortable: true,
        className: "text-center",
        cellClassName: "text-center",
        render: (row) => {
          const value = row[header.key] || 0;
          return (
            <span className={cn(
              getCategoryColorClass(index, agingHeaders.length),
              value === 0 && "text-muted-foreground"
            )}>
              {value}
            </span>
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
  }, [agingHeaders]);

  // Handle category click to show email details (for specific category)
  const handleCategoryClick = (userRow, category, count) => {
    if (count > 0) {
      // Find the MongoDB user data for this user
      const mongoUser = responseData.find(u => u.user_id === userRow.id);
      if (mongoUser) {
        setSelectedUserData(mongoUser);
        setSelectedCategory(category);
        setModalOpen(true);
        setEmailCurrentPage(1);
      }
    }
  };

  // Handle total unreplied click to show ALL emails from ALL categories
  const handleTotalUnrepliedClick = (userRow) => {
    if (userRow.total > 0) {
      // Find the MongoDB user data for this user
      const mongoUser = responseData.find(u => u.user_id === userRow.id);
      if (mongoUser) {
        setSelectedUserData(mongoUser);
        setSelectedCategory("All Categories"); // Special marker for all emails
        setModalOpen(true);
        setEmailCurrentPage(1);
      }
    }
  };

  // Get emails for selected category (uses Intent array from Dashboard 1)
  const getEmailsForCategory = () => {
    if (!selectedCategory || !selectedUserData || !selectedUserData.Intent) {
      return [];
    }
    
    // Handle "All Categories" case - collect emails from all Intent categories
    if (selectedCategory === "All Categories") {
      const allEmails = [];
      const intents = selectedUserData.Intent || [];
      
      // Iterate through Intent array and collect emails
      intents.forEach(intent => {
        if (intent.emails && Array.isArray(intent.emails)) {
          // Add category name to each email for display
          intent.emails.forEach(email => {
            allEmails.push({
              ...email,
              category_name: intent.category, // Add category name for badge display
            });
          });
        }
      });
      
      return sortEmailsByDate(allEmails, true); // Sort ascending (oldest first)
    }
    
    // Handle specific category - find it in Intent array
    const intent = selectedUserData.Intent.find(i => i.category === selectedCategory);
    const emails = intent?.emails || [];
    return sortEmailsByDate(emails, true); // Sort ascending (oldest first)
  };

  // Paginated emails
  const getPaginatedEmailsForCategory = () => {
    const emails = getEmailsForCategory();
    const startIndex = (emailCurrentPage - 1) * emailsPerPage;
    const endIndex = startIndex + emailsPerPage;
    return emails.slice(startIndex, endIndex);
  };

  // Pagination calculations
  const totalEmailPages = Math.ceil(getEmailsForCategory().length / emailsPerPage);

  const handleEmailPageChange = (page) => {
    setEmailCurrentPage(Math.max(1, Math.min(page, totalEmailPages)));
  };

  const handleEmailsPerPageChange = (e) => {
    setEmailsPerPage(Number(e.target.value));
    setEmailCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshResponse(), refreshAging()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  const isLoading = loadingResponse || loadingAging;

  // Error state
  const hasError = errorResponse || errorAging;

  return (
    <div className="space-y-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Email Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of unreplied emails and aging analysis
          </p>
          {lastFetched && (
            <p className="text-sm text-muted-foreground mt-2">
              Last refreshed: {formatDateTimeWithAMPM(new Date().setHours(7,0,0,0))}
            </p>
          )}
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Error Display */}
      {hasError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Error loading dashboard data</p>
                <p className="text-sm">{errorResponse || errorAging}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">
                    {isLoading ? "..." : stat.value}
                  </p>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading dashboard data...</span>
              </div>
            ) : transformedResponseData.length > 0 ? (
              <PaginatedTable
                data={transformedResponseData}
                columns={responseColumns}
                searchKey= {["userName", "email"]}
                searchPlaceholder="Filter users..."
                defaultSort={{ key: "total", direction: "desc" }}
                pageSize={10}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>No dashboard data available</p>
                <Button onClick={handleRefresh} variant="outline" className="mt-4">
                  Try Refreshing
                </Button>
              </div>
            )}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading aging data...</span>
              </div>
            ) : transformedAgingData.length > 0 ? (
              <PaginatedTable
                data={transformedAgingData}
                columns={agingColumns}
                searchKey={["userName", "email"]}
                searchPlaceholder="Filter users..."
                defaultSort={{ key: "total", direction: "desc" }}
                pageSize={10}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>No aging data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl" onClose={() => setModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Unreplied Emails - {selectedCategory}</DialogTitle>
            <DialogDescription>
              User: {selectedUserData?.full_name} ({getEmailsForCategory().length} emails)
            </DialogDescription>
            <DialogDescription>
              Unreplied time is measured as duration from email receipt to 7 AM refresh.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {/* Email List */}
            {getEmailsForCategory().length > 0 ? (
              getPaginatedEmailsForCategory().map((email, index) => {
                // Dashboard 1 emails use "from" field, Dashboard 2 uses "from_email"
                const fromField = email.from || email.from_email;
                const emailInfo = extractEmailInfo(fromField);
                const dateField = email.inbox_date || email.date;
                
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
                            {dateField}
                          </Badge>
                          {/* Show individual email category if viewing "All Categories", otherwise show selected category */}
                          {email.category_name ? (
                            <Badge variant={getCategoryColor(email.category_name)} className="text-xs">
                              {email.category_name}
                            </Badge>
                          ) : (
                            <Badge variant={getCategoryColor(selectedCategory)} className="text-xs">
                              {selectedCategory}
                            </Badge>
                          )}
                          {/* Always show hours unreplied badge for all emails */}
                          <Badge 
                            variant={(() => {
                              const hours = calculateHoursUnreplied(dateField);
                              return hours > 168 ? "red" : hours > 72 ? "orange" : "yellow";
                            })()}
                            className="text-xs font-semibold"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1 inline" />
                            Unreplied: {formatHoursUnreplied(calculateHoursUnreplied(dateField))}
                          </Badge>
                        </div>
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
              <div className="flex items-center justify-between px-1 py-2 border-t">
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

