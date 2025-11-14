import React, { useState, useMemo, useEffect } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Mail, Clock, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "../components/ui/Dialog";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { PaginatedTable } from "../components/ui/PaginatedTable";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import useDashboardData from "../hooks/useDashboardData";
import { authApi } from "../api";
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
  const { showError, showInfo } = useSnackbar();
  
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
  const [lastShownError, setLastShownError] = useState(null);
  const [isSynced, setIsSynced] = useState(false);
  const [checkingSyncStatus, setCheckingSyncStatus] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Check email sync status on mount
  useEffect(() => {
    const checkSyncStatus = async () => {
      if (!user || !user.isGoogleUser) {
        setCheckingSyncStatus(false);
        return;
      }

      try {
        const result = await authApi.checkEmailSyncStatus();
        if (result.success) {
          setIsSynced(result.isSynced || false);
        }
      } catch (error) {
        console.error('Error checking sync status:', error);
        // Don't show error to user, just assume not synced
        setIsSynced(false);
      } finally {
        setCheckingSyncStatus(false);
      }
    };

    checkSyncStatus();
  }, [user]);

  // Show error in snackbar when error occurs (only once per error)
  useEffect(() => {
    const currentError = errorResponse || errorAging;
    if (currentError && currentError !== lastShownError) {
      setLastShownError(currentError);
      // Convert technical error messages to user-friendly ones
      let userFriendlyMessage = "Unable to load dashboard data. Please try refreshing.";
      
      if (currentError.includes("User not found") || currentError.includes("user not found")) {
        userFriendlyMessage = "Your account could not be found. Please contact support.";
      } else if (currentError.includes("401") || currentError.includes("Unauthorized")) {
        userFriendlyMessage = "Your session has expired. Please log in again.";
      } else if (currentError.includes("403") || currentError.includes("Forbidden")) {
        userFriendlyMessage = "You don't have permission to access this data.";
      } else if (currentError.includes("Network") || currentError.includes("fetch")) {
        userFriendlyMessage = "Unable to connect to the server. Please check your connection.";
      }
      
      showError(userFriendlyMessage);
    } else if (!currentError && lastShownError) {
      // Reset when error is cleared
      setLastShownError(null);
    }
  }, [errorResponse, errorAging, showError, lastShownError]);

  // Handle email sync
  const handleSyncEmail = async () => {
    setIsSyncing(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const syncUrl = `${apiBaseUrl}/api/v1/auth/google/sync`;
      // Redirect to Gmail sync OAuth endpoint
      window.location.href = syncUrl;
    } catch (error) {
      console.error('Error initiating email sync:', error);
      showError('Failed to initiate email sync. Please try again.');
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2">Email Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive view of unreplied emails and aging analysis
          </p>
          {lastFetched && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              Last refreshed: {formatDateTimeWithAMPM(new Date().setHours(7,0,0,0))}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Sync Email Button - Only show for Google users who haven't synced */}
          {user?.isGoogleUser && !checkingSyncStatus && !isSynced && (
            <Button
              onClick={handleSyncEmail}
              disabled={isSyncing}
              className="gap-2 w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Mail className={cn("h-4 w-4", isSyncing && "animate-pulse")} />
              <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Email"}</span>
              <span className="sm:hidden">{isSyncing ? "..." : "Sync"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            variant="outline"
            className="gap-2 w-full sm:w-auto shrink-0"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            <span className="sm:hidden">{refreshing ? "..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={cn("p-2 sm:p-3 rounded-full bg-muted shrink-0", stat.color)}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 1: Response Dashboard */}
      <div className="w-full">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Unreplied Emails by Category (24+ hrs)</h2>
        <Card className="shadow-md">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-16 gap-2">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                <span className="text-sm sm:text-base">Loading dashboard data...</span>
              </div>
            ) : transformedResponseData.length > 0 ? (
              <PaginatedTable
                data={transformedResponseData}
                columns={responseColumns}
                searchKey= {["userName", "email"]}
                searchPlaceholder="Search by Sales Employee"
                defaultSort={{ key: "total", direction: "desc" }}
                pageSize={10}
              />
            ) : (
              <div className="text-center py-8 sm:py-16 text-muted-foreground px-4">
                <Mail className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base">No dashboard data available</p>
                <Button onClick={handleRefresh} variant="outline" className="mt-3 sm:mt-4" size="sm">
                  Try Refreshing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Aging Report */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Aging Report</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          Time-based analysis of unreplied emails per user
        </p>

        <Card className="shadow-md">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-16 gap-2">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                <span className="text-sm sm:text-base">Loading aging data...</span>
              </div>
            ) : transformedAgingData.length > 0 ? (
              <PaginatedTable
                data={transformedAgingData}
                columns={agingColumns}
                searchKey={["userName", "email"]}
                searchPlaceholder="Search by Sales Employee"
                defaultSort={{ key: "total", direction: "desc" }}
                pageSize={10}
              />
            ) : (
              <div className="text-center py-8 sm:py-16 text-muted-foreground px-4">
                <Clock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base">No aging data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto" onClose={() => setModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Unreplied Emails - {selectedCategory}</DialogTitle>
            <DialogDescription>
              User: {selectedUserData?.full_name} ({getEmailsForCategory().length} emails)
            </DialogDescription>
            <DialogDescription>
              Unreplied time is measured as duration from email receipt to 7 AM refresh.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-2 sm:space-y-3">
            {/* Email List */}
            {getEmailsForCategory().length > 0 ? (
              getPaginatedEmailsForCategory().map((email, index) => {
                // Dashboard 1 emails use "from" field, Dashboard 2 uses "from_email"
                const fromField = email.from || email.from_email;
                const emailInfo = extractEmailInfo(fromField);
                const dateField = email.inbox_date || email.date;
                
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{emailInfo.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{emailInfo.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm break-words">{email.subject}</p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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
              <div className="text-center py-6 sm:py-8 text-muted-foreground px-4">
                <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No unreplied emails in this category</p>
              </div>
            )}

            {/* Email Pagination Controls */}
            {getEmailsForCategory().length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 px-1 py-2 sm:py-3 border-t">
                <div className="flex-1 text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  <span className="hidden sm:inline">Showing </span>
                  {((emailCurrentPage - 1) * emailsPerPage) + 1} to{" "}
                  {Math.min(emailCurrentPage * emailsPerPage, getEmailsForCategory().length)} of{" "}
                  {getEmailsForCategory().length} <span className="hidden sm:inline">emails</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Per page</p>
                    <Select
                      value={emailsPerPage}
                      onChange={handleEmailsPerPageChange}
                      className="h-8 sm:h-9 w-[60px] text-xs sm:text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
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
                    <span className="text-xs sm:text-sm font-medium px-1 sm:px-2">
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

