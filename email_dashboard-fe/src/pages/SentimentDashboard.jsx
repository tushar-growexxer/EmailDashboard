import { useState, useMemo, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  ReferenceArea,
} from "recharts";
import {
  Users,
  Smile,
  SmilePlus,
  Meh,
  Frown,
  Search,
  BarChart3,
  RefreshCw,
  Download,
  Database,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import BusinessTypeFilter from "../components/filters/BusinessTypeFilter";
import { cn } from "../lib/utils";
import TimePeriodFilter from "../components/filters/TimePeriodFilter";
import { customerApi, dashboardApi } from "../api";

// Mock data structure with 52 weeks and 14 days sentiment data for top customers
const generateMockSentimentData = () => {
  // Add total values for each customer (in crores)
  const customers = [
    { name: "ABC Corp", totalValue: 125.7 },
    { name: "XYZ Industries", totalValue: 98.3 },
    { name: "Tech Solutions", totalValue: 215.2 },
    { name: "Global Trade", totalValue: 78.9 },
    { name: "MegaMart Inc", totalValue: 342.6 },
    { name: "Prime Logistics", totalValue: 56.2 },
    { name: "Elite Services", totalValue: 189.5 },
    { name: "Dynamic Systems", totalValue: 102.4 },
    { name: "Innovate Ltd", totalValue: 76.8 },
    { name: "PowerTech", totalValue: 156.3 },
  ];

  // Sort customers by total value in descending order
  customers.sort((a, b) => b.totalValue - a.totalValue);

  const customerNames = customers.map((c) => c.name);
  const weeks = [];
  const days = [];

  // Generate 52 weeks of data (in chronological order)
  // Start from 52 weeks ago
  const today = new Date();
  for (let i = 52; i >= 1; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    weeks.push({
      date: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekStart: weekStart,
      weekEnd: weekEnd,
      weekRange: `${weekStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} - ${weekEnd.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`,
      ...customerNames.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.5,
          Math.min(
            3.8,
            2 + Math.sin((52 - i) * 0.1 + index) * 1.2 + Math.random() * 0.8
          )
        );
        return acc;
      }, {}),
    });
  }

  // Generate 14 days of data (in chronological order, including today)
  // Start from 13 days ago and go to today (total 14 days)
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ...customerNames.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.8,
          Math.min(
            3.5,
            2 + Math.sin((13 - i) * 0.2 + index * 0.5) * 1 + Math.random() * 0.6
          )
        );
        return acc;
      }, {}),
    });
  }

  return {
    customers: customerNames,
    customersWithValues: customers, // Include the full customer objects with values
    weeks: weeks,
    days: days,
    colors: [
      "#3B82F6",
      "#8B5CF6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#EC4899",
      "#6366F1",
      "#14B8A6",
      "#F97316",
      "#84CC16",
    ],
  };
};

const sentimentScale = [
  {
    label: "Higher Positive",
    value: 0,
    color: "text-green-700",
    icon: SmilePlus,
    bgColor: "bg-green-100",
    threshold: 1.2,
  },
  {
    label: "Positive",
    value: 1,
    color: "text-green-600",
    icon: Smile,
    bgColor: "bg-green-50",
    threshold: 1.8,
  },
  {
    label: "Neutral",
    value: 2,
    color: "text-gray-600",
    icon: Meh,
    bgColor: "bg-gray-100",
    threshold: 2.5,
  },
  {
    label: "Negative",
    value: 3,
    color: "text-orange-600",
    icon: Frown,
    bgColor: "bg-orange-100",
    threshold: 3.2,
  },
  {
    label: "Higher Negative",
    value: 4,
    color: "text-red-600",
    icon: Frown,
    bgColor: "bg-red-100",
    threshold: 4,
  },
];

const mockData = generateMockSentimentData();

// Format currency in Indian Rupees (Crores)
const formatIndianCurrency = (value, compact = false) => {
  if (!value || isNaN(value)) return "₹0";

  if (compact) {
    // Convert to Crores (1 Crore = 10,000,000)
    const crores = value / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)}Cr`;
    }
    // Convert to Lakhs (1 Lakh = 100,000)
    const lakhs = value / 100000;
    if (lakhs >= 1) {
      return `₹${lakhs.toFixed(2)}L`;
    }
    // Thousands
    const thousands = value / 1000;
    if (thousands >= 1) {
      return `₹${thousands.toFixed(2)}K`;
    }
    return `₹${value.toFixed(0)}`;
  }

  // Full format with Indian number system
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

// Get last calendar week (Monday to Sunday)
const getLastWeekData = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate last Monday (start of last week)
  const lastMonday = new Date(today);
  const daysToLastMonday = dayOfWeek === 0 ? 8 : dayOfWeek + 6; // If Sunday, go back 8 days, else go back to last Monday
  lastMonday.setDate(today.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);

  // Calculate last Sunday (end of last week)
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  const weeks = [];
  let currentDate = new Date(lastMonday);

  while (currentDate <= lastSunday) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const actualWeekEnd = weekEnd > lastSunday ? new Date(lastSunday) : weekEnd;

    weeks.push({
      date: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekStart: weekStart,
      weekEnd: actualWeekEnd,
      weekRange: `${weekStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} - ${actualWeekEnd.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`,
      ...mockData.customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.8,
          Math.min(3.5, 2 + Math.sin(index * 0.5) * 1 + Math.random() * 0.6)
        );
        return acc;
      }, {}),
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

// Get last calendar month (1st to last day)
const getLastMonthData = () => {
  const today = new Date();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // Day 0 = last day of previous month

  const weeks = [];
  let currentDate = new Date(lastMonthStart);

  while (currentDate <= lastMonthEnd) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const actualWeekEnd =
      weekEnd > lastMonthEnd ? new Date(lastMonthEnd) : weekEnd;

    weeks.push({
      date: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekStart: weekStart,
      weekEnd: actualWeekEnd,
      weekRange: `${weekStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} - ${actualWeekEnd.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`,
      ...mockData.customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.8,
          Math.min(
            3.5,
            2 +
              Math.sin(
                (currentDate - lastMonthStart) / (lastMonthEnd - lastMonthStart)
              ) *
                1 +
              Math.random() * 0.6
          )
        );
        return acc;
      }, {}),
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

// Get past 3 calendar months
const getPast3MonthsData = () => {
  const today = new Date();
  const threeMonthsAgoStart = new Date(
    today.getFullYear(),
    today.getMonth() - 3,
    1
  );
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const weeks = [];
  let currentDate = new Date(threeMonthsAgoStart);

  while (currentDate <= lastMonthEnd) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const actualWeekEnd =
      weekEnd > lastMonthEnd ? new Date(lastMonthEnd) : weekEnd;

    weeks.push({
      date: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekStart: weekStart,
      weekEnd: actualWeekEnd,
      weekRange: `${weekStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} - ${actualWeekEnd.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`,
      ...mockData.customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.8,
          Math.min(
            3.5,
            2 +
              Math.sin(
                (currentDate - threeMonthsAgoStart) /
                  (lastMonthEnd - threeMonthsAgoStart)
              ) *
                1 +
              Math.random() * 0.6
          )
        );
        return acc;
      }, {}),
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

const getLastFiscalYearWeeks = () => {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Last fiscal year: April 1st of previous year to March 31st of current year
  let lastFiscalYearStart, lastFiscalYearEnd;

  if (today.getMonth() < 3) {
    // If we're before April, last fiscal year was 2 years ago to last year
    lastFiscalYearStart = new Date(currentYear - 2, 3, 1);
    lastFiscalYearEnd = new Date(currentYear - 1, 2, 31);
  } else {
    // If we're after April, last fiscal year was last year to this year
    lastFiscalYearStart = new Date(currentYear - 1, 3, 1);
    lastFiscalYearEnd = new Date(currentYear, 2, 31);
  }

  const weeks = [];
  let currentDate = new Date(lastFiscalYearStart);

  // Generate weeks for the entire last fiscal year
  while (currentDate <= lastFiscalYearEnd) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // If week end is beyond fiscal year end, use fiscal year end
    const actualWeekEnd =
      weekEnd > lastFiscalYearEnd ? new Date(lastFiscalYearEnd) : weekEnd;

    weeks.push({
      date: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekStart: weekStart,
      weekEnd: actualWeekEnd,
      weekRange: `${weekStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} - ${actualWeekEnd.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`,
      ...mockData.customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.8,
          Math.min(
            3.5,
            2 +
              Math.sin(
                (currentDate - lastFiscalYearStart) /
                  (lastFiscalYearEnd - lastFiscalYearStart)
              ) *
                1 +
              Math.random() * 0.6
          )
        );
        return acc;
      }, {}),
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  console.log("Generated last fiscal year weeks:", weeks.length);
  return weeks;
};

const getFiscalYearWeeks = () => {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Fiscal year starts on April 1st
  // If today is before April 1st, fiscal year started last year
  const fiscalYearStart =
    today.getMonth() < 3
      ? new Date(currentYear - 1, 3, 1) // April 1st of last year
      : new Date(currentYear, 3, 1); // April 1st of current year

  console.log("Fiscal Year Calculation:", {
    today: today.toISOString(),
    currentMonth: today.getMonth(),
    fiscalYearStart: fiscalYearStart.toISOString(),
    currentYear,
  });

  const weeks = [];
  let currentDate = new Date(fiscalYearStart);

  // Generate weeks from fiscal year start until today
  while (currentDate <= today) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // If week end is beyond today, use today as end date
    const actualWeekEnd = weekEnd > today ? new Date(today) : weekEnd;

    weeks.push({
      date: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weekStart: weekStart,
      weekEnd: actualWeekEnd,
      weekRange: `${weekStart.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })} - ${actualWeekEnd.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`,
      ...mockData.customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(
          0.8,
          Math.min(
            3.5,
            2 +
              Math.sin(
                (currentDate - fiscalYearStart) / (today - fiscalYearStart)
              ) *
                1 +
              Math.random() * 0.6
          )
        );
        return acc;
      }, {}),
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  console.log("Generated fiscal year weeks:", weeks.length);
  return weeks;
};

const SentimentDashboard = () => {
  const [viewMode, setViewMode] = useState("top10"); // "top10" or "other"
  const [businessType, setBusinessType] = useState("All");
  const [timePeriod, setTimePeriod] = useState("Current Fiscal Year");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showDataTable, setShowDataTable] = useState(false);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState(
    mockData.customers[0] || ""
  );
  const [useLast14Days, setUseLast14Days] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSearchCustomer, setSelectedSearchCustomer] = useState(null);
  const [showDemoData, setShowDemoData] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [liveDataLoading, setLiveDataLoading] = useState(false);

  // Debounced search function
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Search customers from API
  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await customerApi.searchCustomers(term, 20);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle customer selection from dropdown
  const handleSelectCustomer = (customer) => {
    setSelectedSearchCustomer(customer);
    setSelectedDetailCustomer(customer.CardName);
    setSearchTerm(""); // Clear search input after selection
    setShowDropdown(false);
    // Don't auto-adjust business type filter anymore
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch live data from MongoDB on component mount (unless demo mode is active)
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!showDemoData && !liveData) {
        setLiveDataLoading(true);
        try {
          const response = await dashboardApi.getSentimentDashboard();
          if (response.success) {
            setLiveData(response.data);
          }
        } catch (error) {
          console.error("Error fetching live sentiment data:", error);
        } finally {
          setLiveDataLoading(false);
        }
      }
    };

    fetchLiveData();
  }, [showDemoData, liveData]);

  // Calculate current data based on time period and data source (demo/live)
  const currentData = useMemo(() => {
    // console.log("Calculating currentData:", {
    //   showDemoData,
    //   timePeriod,
    //   useLast14Days,
    // });

    // If showing demo data, use mock data
    if (showDemoData) {
      if (useLast14Days) {
        const data = mockData.days.slice(0, 14);
        console.log("Returning last 14 days data:", data.length);
        return data;
      }

      if (timePeriod === "Current Fiscal Year") {
        // Return fiscal year weeks directly
        const fiscalData = getFiscalYearWeeks();
        console.log("Returning fiscal year data:", fiscalData.length);
        return fiscalData;
      }

      if (timePeriod === "Last Fiscal Year") {
        // Return last fiscal year weeks directly
        const lastFiscalData = getLastFiscalYearWeeks();
        console.log("Returning last fiscal year data:", lastFiscalData.length);
        return lastFiscalData;
      }

      if (timePeriod === "Last Week") {
        // Return last calendar week (Monday to Sunday)
        const lastWeekData = getLastWeekData();
        console.log("Returning last week data:", lastWeekData.length);
        return lastWeekData;
      }

      if (timePeriod === "Last Month") {
        // Return last calendar month (1st to last day)
        const lastMonthData = getLastMonthData();
        console.log("Returning last month data:", lastMonthData.length);
        return lastMonthData;
      }

      if (timePeriod === "Past 3 Months") {
        // Return past 3 calendar months
        const past3MonthsData = getPast3MonthsData();
        console.log("Returning past 3 months data:", past3MonthsData.length);
        return past3MonthsData;
      }

      // Default fallback
      const data = mockData.weeks.slice(0, 52);
      console.log(
        "Returning default weeks data:",
        data.length,
        "weeksToShow:",
        weeksToShow
      );
      return data;
    }

    // If showing live data, transform MongoDB data to chart format
    if (liveData) {
      if (useLast14Days && liveData.daily && liveData.daily.domains) {
        // Use daily data for last 14 days
        const selectedDomain = liveData.daily.domains.find(
          (d) => d.domain === selectedDetailCustomer
        );

        if (selectedDomain && selectedDomain.daily_scores) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

          // Filter for last 14 days including today (days 0-13)
          const chartData = selectedDomain.daily_scores
            .filter((score) => {
              // Parse DD-MM-YYYY format
              const [day, month, year] = score.date.split("-");
              const scoreDate = new Date(year, month - 1, day);
              scoreDate.setHours(0, 0, 0, 0);

              const daysDiff = Math.floor(
                (today - scoreDate) / (1000 * 60 * 60 * 24)
              );
              // Include today (0) through 13 days ago (total 14 days)
              return daysDiff >= 0 && daysDiff <= 13;
            })
            .sort((a, b) => {
              // Sort in chronological order (oldest to newest)
              const [dayA, monthA, yearA] = a.date.split("-");
              const [dayB, monthB, yearB] = b.date.split("-");
              const dateA = new Date(yearA, monthA - 1, dayA);
              const dateB = new Date(yearB, monthB - 1, dayB);
              return dateA - dateB;
            })
            .map((score) => {
              // Parse and format date for display
              const [day, month, year] = score.date.split("-");
              const scoreDate = new Date(year, month - 1, day);
              return {
                date: scoreDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
                [selectedDetailCustomer]: score.average_sentiment_score || 2,
              };
            });
          return chartData;
        }
      } else if (liveData.weekly && liveData.weekly.domains) {
        // Use weekly data with fiscal year filtering
        const selectedDomain = liveData.weekly.domains.find(
          (d) => d.domain === selectedDetailCustomer
        );

        if (selectedDomain && selectedDomain.weekly_scores) {
          const today = new Date();
          const currentYear = today.getFullYear();

          // Determine fiscal year start
          const fiscalYearStart =
            today.getMonth() < 3
              ? new Date(currentYear - 1, 3, 1) // April 1st of last year
              : new Date(currentYear, 3, 1); // April 1st of current year

          // Filter and map weekly data based on time period
          let filteredScores = selectedDomain.weekly_scores;

          if (timePeriod === "Last Week") {
            // Filter for last calendar week (Monday to Sunday)
            const dayOfWeek = today.getDay();
            const lastMonday = new Date(today);
            const daysToLastMonday = dayOfWeek === 0 ? 8 : dayOfWeek + 6;
            lastMonday.setDate(today.getDate() - daysToLastMonday);
            lastMonday.setHours(0, 0, 0, 0);

            const lastSunday = new Date(lastMonday);
            lastSunday.setDate(lastMonday.getDate() + 6);
            lastSunday.setHours(23, 59, 59, 999);

            filteredScores = selectedDomain.weekly_scores.filter((score) => {
              if (score.start_date) {
                const [day, month, year] = score.start_date.split("-");
                const weekStartDate = new Date(year, month - 1, day);
                return (
                  weekStartDate >= lastMonday && weekStartDate <= lastSunday
                );
              }
              return false;
            });
          } else if (timePeriod === "Last Month") {
            // Filter for last calendar month (1st to last day)
            const lastMonthStart = new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              1
            );
            const lastMonthEnd = new Date(
              today.getFullYear(),
              today.getMonth(),
              0
            );

            filteredScores = selectedDomain.weekly_scores.filter((score) => {
              if (score.start_date) {
                const [day, month, year] = score.start_date.split("-");
                const weekStartDate = new Date(year, month - 1, day);
                return (
                  weekStartDate >= lastMonthStart &&
                  weekStartDate <= lastMonthEnd
                );
              }
              return false;
            });
          } else if (timePeriod === "Past 3 Months") {
            // Filter for past 3 calendar months
            const threeMonthsAgoStart = new Date(
              today.getFullYear(),
              today.getMonth() - 3,
              1
            );
            const lastMonthEnd = new Date(
              today.getFullYear(),
              today.getMonth(),
              0
            );

            filteredScores = selectedDomain.weekly_scores.filter((score) => {
              if (score.start_date) {
                const [day, month, year] = score.start_date.split("-");
                const weekStartDate = new Date(year, month - 1, day);
                return (
                  weekStartDate >= threeMonthsAgoStart &&
                  weekStartDate <= lastMonthEnd
                );
              }
              return false;
            });
          } else if (timePeriod === "Current Fiscal Year") {
            // Filter weeks from April 1st to today
            filteredScores = selectedDomain.weekly_scores.filter((score) => {
              if (score.start_date) {
                // Parse date in DD-MM-YYYY format
                const [day, month, year] = score.start_date.split("-");
                const weekStartDate = new Date(year, month - 1, day);
                return (
                  weekStartDate >= fiscalYearStart && weekStartDate <= today
                );
              }
              return true; // Include if no date info
            });
          } else if (timePeriod === "Last Fiscal Year") {
            // Filter for last fiscal year
            const lastFiscalYearStart =
              today.getMonth() < 3
                ? new Date(currentYear - 2, 3, 1)
                : new Date(currentYear - 1, 3, 1);
            const lastFiscalYearEnd =
              today.getMonth() < 3
                ? new Date(currentYear - 1, 2, 31)
                : new Date(currentYear, 2, 31);

            filteredScores = selectedDomain.weekly_scores.filter((score) => {
              if (score.start_date) {
                const [day, month, year] = score.start_date.split("-");
                const weekStartDate = new Date(year, month - 1, day);
                return (
                  weekStartDate >= lastFiscalYearStart &&
                  weekStartDate <= lastFiscalYearEnd
                );
              }
              return false;
            });
          }

          const chartData = filteredScores.map((score) => {
            // Parse start_date and end_date - always show week start date
            let weekRange = null;
            let displayDate = null;

            if (score.start_date && score.end_date) {
              // Parse DD-MM-YYYY format
              const parseDate = (dateStr) => {
                const [day, month, year] = dateStr.split("-");
                return new Date(year, month - 1, day);
              };

              const startDate = parseDate(score.start_date);
              const endDate = parseDate(score.end_date);

              // Always show week start date on x-axis
              displayDate = startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              // Week range for tooltip
              weekRange = `${startDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })} - ${endDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}`;
            }

            return {
              date: displayDate || `Week ${score.week_number}`,
              weekRange: weekRange,
              [selectedDetailCustomer]: score.average_sentiment_score || 2,
            };
          });
          return chartData;
        }
      }
    }

    // Fallback to empty array if no data
    return [];
  }, [
    timePeriod,
    useLast14Days,
    showDemoData,
    liveData,
    selectedDetailCustomer,
  ]);

  // Get top 10 customers by total value
  const top10Customers = useMemo(() => {
    return mockData.customersWithValues.slice(0, 10).map((customer, index) => {
      const values = currentData.map((d) => d[customer.name] || 2);
      // Handle incomplete weeks by calculating average only from available data
      const avg =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 2;
      return {
        customer: customer.name,
        average: avg,
        color: mockData.colors[index],
        trend: Math.random() * 0.4 - 0.2,
        totalValue: customer.totalValue,
      };
    });
  }, [currentData]);

  // Show demo or live customers based on toggle
  const displayCustomers = useMemo(() => {
    if (showDemoData) {
      // Show demo data (Top 10 mock customers)
      return top10Customers.map((c) => ({ ...c, sentimentAvailable: true }));
    } else {
      // Show live data from MongoDB
      if (liveData && liveData.userDomain && liveData.userDomain.domains) {
        // Transform MongoDB data to display format
        const liveCustomers = liveData.userDomain.domains
          .map((domain, index) => {
            // Calculate average based on time period for fiscal year
            let avgScore;

            if (
              timePeriod === "Current Fiscal Year" &&
              liveData.weekly &&
              liveData.weekly.domains
            ) {
              // For fiscal year, calculate from filtered weekly data
              const weeklyDomain = liveData.weekly.domains.find(
                (d) => d.domain === domain.domain
              );
              if (weeklyDomain && weeklyDomain.weekly_scores) {
                const today = new Date();
                const currentYear = today.getFullYear();
                const fiscalYearStart =
                  today.getMonth() < 3
                    ? new Date(currentYear - 1, 3, 1)
                    : new Date(currentYear, 3, 1);

                const fiscalYearScores = weeklyDomain.weekly_scores.filter(
                  (score) => {
                    if (score.start_date) {
                      const [day, month, year] = score.start_date.split("-");
                      const weekStartDate = new Date(year, month - 1, day);
                      return (
                        weekStartDate >= fiscalYearStart &&
                        weekStartDate <= today
                      );
                    }
                    return false;
                  }
                );

                if (fiscalYearScores.length > 0) {
                  avgScore =
                    fiscalYearScores.reduce(
                      (sum, score) =>
                        sum + (score.average_sentiment_score || 2),
                      0
                    ) / fiscalYearScores.length;
                } else {
                  avgScore =
                    domain.users.reduce(
                      (sum, user) => sum + (user.average_sentiment_score || 2),
                      0
                    ) / domain.users.length;
                }
              } else {
                avgScore =
                  domain.users.reduce(
                    (sum, user) => sum + (user.average_sentiment_score || 2),
                    0
                  ) / domain.users.length;
              }
            } else {
              // For other time periods, use overall user average
              avgScore =
                domain.users.reduce(
                  (sum, user) => sum + (user.average_sentiment_score || 2),
                  0
                ) / domain.users.length;
            }

            return {
              customer: domain.domain,
              average: avgScore,
              color: mockData.colors[index % mockData.colors.length],
              sentimentAvailable: true,
              isLive: true,
            };
          })
          .slice(0, 10); // Top 10

        return liveCustomers;
      }

      // If live data not loaded yet, show empty or loading state
      return [];
    }
  }, [showDemoData, top10Customers, liveData, timePeriod]);

  // Set initial customer on component mount
  useEffect(() => {
    if (mockData.customers.length > 0 && !selectedDetailCustomer) {
      setSelectedDetailCustomer(mockData.customers[0]);
    }
  }, []); // Run only on mount

  const getSentimentBadge = (score) => {
    const scale =
      sentimentScale.find((s) => score < s.threshold) ||
      sentimentScale[sentimentScale.length - 1];
    return {
      label: scale.label,
      variant:
        scale.value <= 1
          ? "green"
          : scale.value <= 2
          ? "gray"
          : scale.value <= 3
          ? "orange"
          : "red",
      bgColor: scale.bgColor,
      icon: scale.icon,
      color: scale.color,
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="space-y-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            Customer Sentiment Analysis
          </h1>
          <p className="text-muted-foreground">
            Sentiment trends over time for customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Demo Data Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
            <Database
              className={cn(
                "h-4 w-4",
                showDemoData ? "text-gray-400" : "text-green-600"
              )}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDemoData}
                onChange={(e) => setShowDemoData(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Show Demo Data</span>
            </label>
            {liveDataLoading && !showDemoData && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left Panel - Top 10 Customers */}
        <div className="xl:col-span-1">
          <Card className="flex flex-col">
            <CardHeader>
              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={viewMode === "top10" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setViewMode("top10");
                    setSelectedSearchCustomer(null);
                    setSearchTerm("");
                    setSelectedDetailCustomer(mockData.customers[0]);
                    setBusinessType("All");
                  }}
                  className="flex-1"
                >
                  Top 10
                </Button>
                <Button
                  variant={viewMode === "other" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("other")}
                  className="flex-1"
                >
                  Other
                </Button>
              </div>

              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                {viewMode === "top10" ? "Top 10 Customers" : "Search Customer"}
                {!showDemoData && viewMode === "top10" && (
                  <Badge variant="outline" className="text-xs ml-2">
                    Live
                  </Badge>
                )}
              </CardTitle>

              {/* Filters based on view mode */}
              <div className="mt-4 space-y-4">
                {viewMode === "top10" ? (
                  <>
                    <BusinessTypeFilter
                      value={businessType}
                      onChange={setBusinessType}
                    />
                    <TimePeriodFilter
                      value={timePeriod}
                      onChange={setTimePeriod}
                      customDateFrom={customDateFrom}
                      customDateTo={customDateTo}
                      onCustomDateChange={(key, val) => {
                        if (key === "customDateFrom") setCustomDateFrom(val);
                        if (key === "customDateTo") setCustomDateTo(val);
                      }}
                    />
                  </>
                ) : (
                  <>
                    {/* Customer Search with Dropdown */}
                    <div className="search-container">
                      <label className="block text-sm font-medium mb-2">
                        Search Customer
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          placeholder="Search by customer name or code..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!e.target.value.trim()) {
                              setSelectedSearchCustomer(null);
                            }
                          }}
                          onFocus={() => {
                            if (searchTerm.trim() && searchResults.length > 0) {
                              setShowDropdown(true);
                            }
                          }}
                          className="pl-9"
                        />
                        {searchLoading && (
                          <div className="absolute right-3 top-3 z-10">
                            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}

                        {/* Dropdown Results */}
                        {showDropdown && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                            {searchResults.map((customer) => (
                              <div
                                key={customer.CardCode}
                                onClick={() => handleSelectCustomer(customer)}
                                className={cn(
                                  "p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors",
                                  selectedSearchCustomer?.CardCode ===
                                    customer.CardCode && "bg-blue-50"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="font-medium text-sm truncate"
                                      title={customer.CardName}
                                    >
                                      {customer.CardName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Code: {customer.CardCode}
                                    </p>
                                    {customer["Domestic/Export"] && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs mt-1"
                                      >
                                        {customer["Domestic/Export"]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No results message */}
                        {showDropdown &&
                          searchTerm &&
                          !searchLoading &&
                          searchResults.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-50">
                              <p className="text-sm text-center text-muted-foreground">
                                No customers found
                              </p>
                            </div>
                          )}
                      </div>

                      {/* Selected customer info */}
                      {selectedSearchCustomer && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              title={selectedSearchCustomer.CardName}
                            >
                              Selected: {selectedSearchCustomer.CardName}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSearchCustomer(null);
                              setSearchTerm("");
                              setSelectedDetailCustomer(mockData.customers[0]);
                            }}
                            className="ml-2 text-xs text-blue-600 hover:text-blue-800 shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    <TimePeriodFilter
                      value={timePeriod}
                      onChange={setTimePeriod}
                      customDateFrom={customDateFrom}
                      customDateTo={customDateTo}
                      onCustomDateChange={(key, val) => {
                        if (key === "customDateFrom") setCustomDateFrom(val);
                        if (key === "customDateTo") setCustomDateTo(val);
                      }}
                    />
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {viewMode === "top10" ? (
                <>
                  {/* Loading State */}
                  {liveDataLoading && !showDemoData && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Loading live data...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Empty State for Live Data */}
                  {!showDemoData &&
                    !liveDataLoading &&
                    displayCustomers.length === 0 && (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Database className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            No live data available
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Customer List */}
                  {(showDemoData ||
                    (!liveDataLoading && displayCustomers.length > 0)) && (
                    <div
                      className="space-y-2 overflow-y-auto"
                      style={{ maxHeight: "calc(100vh - 450px)" }}
                    >
                      {displayCustomers.map((customerData, index) => {
                        const badge = getSentimentBadge(customerData.average);

                        return (
                          <div
                            key={customerData.customer}
                            onClick={() => {
                              setSelectedDetailCustomer(customerData.customer);
                              setSelectedSearchCustomer(null);
                              setSearchTerm("");
                            }}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                              selectedDetailCustomer ===
                                customerData.customer && !selectedSearchCustomer
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                  #{index + 1}
                                </span>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span
                                    className="font-medium text-sm break-words line-clamp-2"
                                    title={customerData.customer}
                                  >
                                    {customerData.customer}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant={badge.variant}
                                className="text-xs shrink-0 ml-2"
                              >
                                {badge.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: customerData.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                Avg: {customerData.average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {selectedSearchCustomer
                        ? "Customer selected. View details on the right."
                        : "Search for a customer above"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Detailed Chart */}
        <div className="xl:col-span-4">
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {selectedSearchCustomer
                      ? selectedSearchCustomer.CardName
                      : currentData.length > 0 &&
                        currentData[0].hasOwnProperty(
                          selectedDetailCustomer || mockData.customers[0]
                        )
                      ? selectedDetailCustomer || mockData.customers[0]
                      : mockData.customers[0]}{" "}
                    - Sentiment Trends
                  </CardTitle>
                  <br />
                  <CardDescription>
                    {useLast14Days
                      ? "Daily sentiment over last 14 days"
                      : `${timePeriod} sentiment trends`}
                    <br />
                    Lower scores indicate more positive sentiment
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {/* Last 14 Days Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useLast14DaysChart"
                      checked={useLast14Days}
                      onChange={(e) => setUseLast14Days(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="useLast14DaysChart"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Last 14 Days
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDataTable(!showDataTable)}
                    >
                      {showDataTable ? "View Chart" : "View Data Table"}
                    </Button>
                    {/* <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button> */}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Check if selected customer has sentiment data */}
              {selectedSearchCustomer ? (
                <div
                  className="flex items-center justify-center"
                  style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
                >
                  <div className="text-center">
                    <Meh className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      Sentiment Data Not Available
                    </h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      Sentiment analysis is not yet available for{" "}
                      <strong>{selectedSearchCustomer.CardName}</strong>.
                      Historical sentiment data will be displayed here once
                      available.
                    </p>
                    {/* {selectedSearchCustomer['Total Value'] && (
                      <div className="inline-block p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Total Sales Value</p>
                        <p className="text-2xl font-bold">
                          {formatIndianCurrency(selectedSearchCustomer['Total Value'], false)}
                        </p>
                      </div>
                    )} */}
                  </div>
                </div>
              ) : currentData.length === 0 && !showDemoData ? (
                <div
                  className="flex items-center justify-center"
                  style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
                >
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Chart Data Available
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      No sentiment data available for{" "}
                      <strong>{selectedDetailCustomer}</strong>.
                      <br />
                      Try selecting a different customer or check "Show Demo
                      Data".
                    </p>
                  </div>
                </div>
              ) : showDataTable ? (
                <div
                  className="overflow-x-auto"
                  style={{ maxHeight: "calc(100vh - 400px)" }}
                >
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-center font-medium">
                          Sentiment Score
                        </th>
                        <th className="p-3 text-center font-medium">
                          Sentiment Level
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((row, index) => {
                        // For live data, use selectedDetailCustomer directly
                        // For demo data, check if key exists
                        const customerKey = !showDemoData
                          ? selectedDetailCustomer
                          : currentData.length > 0 &&
                            row.hasOwnProperty(
                              selectedDetailCustomer || mockData.customers[0]
                            )
                          ? selectedDetailCustomer || mockData.customers[0]
                          : mockData.customers[0];
                        const score = row[customerKey] || 2;
                        const badge = getSentimentBadge(score);
                        return (
                          <tr
                            key={index}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="p-3 font-medium">
                              {row.weekRange || row.date}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {score.toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={badge.variant}
                                className="text-xs"
                              >
                                {badge.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="w-full relative"
                  style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={currentData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <defs>
                        {/* Gradient for negative sentiment area (above neutral) */}
                        <linearGradient
                          id="negativeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(239, 68, 68, 0.15)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(239, 68, 68, 0.05)"
                          />
                        </linearGradient>
                        {/* Gradient for positive sentiment area (below neutral) */}
                        <linearGradient
                          id="positiveGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(16, 185, 129, 0.05)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(16, 185, 129, 0.15)"
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        domain={[0, 4]}
                        ticks={[0, 1, 2, 3, 4]}
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        label={{
                          value: "Sentiment Score",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value) => [
                          parseFloat(value).toFixed(2),
                          "Sentiment Score",
                        ]}
                        labelFormatter={(label, payload) => {
                          // Show week range if available, otherwise show date
                          if (
                            payload &&
                            payload.length > 0 &&
                            payload[0].payload.weekRange
                          ) {
                            return `Week: ${payload[0].payload.weekRange}`;
                          }
                          return `Date: ${label}`;
                        }}
                      />
                      {/* Background rectangle for negative sentiment area (above neutral line) */}
                      <ReferenceArea
                        y1={2}
                        y2={4}
                        fill="url(#negativeGradient)"
                        fillOpacity={1}
                      />
                      {/* Background rectangle for positive sentiment area (below neutral line) */}
                      <ReferenceArea
                        y1={0}
                        y2={2}
                        fill="url(#positiveGradient)"
                        fillOpacity={1}
                      />
                      {/* Main sentiment line without area fill */}
                      <Area
                        type="monotone"
                        dataKey={(() => {
                          // For live data, use the selected customer directly
                          if (!showDemoData && currentData.length > 0) {
                            return selectedDetailCustomer;
                          }
                          // For demo data, check if the key exists
                          if (
                            currentData.length > 0 &&
                            currentData[0].hasOwnProperty(
                              selectedDetailCustomer || mockData.customers[0]
                            )
                          ) {
                            return (
                              selectedDetailCustomer || mockData.customers[0]
                            );
                          }
                          return mockData.customers[0];
                        })()}
                        stroke={(() => {
                          if (!showDemoData) {
                            // For live data, use a default color
                            const customerIndex = displayCustomers.findIndex(
                              (c) => c.customer === selectedDetailCustomer
                            );
                            return customerIndex >= 0
                              ? mockData.colors[customerIndex]
                              : mockData.colors[0];
                          }
                          // For demo data
                          const index = mockData.customers.indexOf(
                            selectedDetailCustomer || mockData.customers[0]
                          );
                          return index >= 0
                            ? mockData.colors[index]
                            : mockData.colors[0];
                        })()}
                        strokeWidth={3}
                        fill="transparent"
                        fillOpacity={0}
                        // dot={{
                        //   fill: (() => {
                        //     if (!showDemoData) {
                        //       const customerIndex = displayCustomers.findIndex(c => c.customer === selectedDetailCustomer);
                        //       return customerIndex >= 0 ? mockData.colors[customerIndex] : mockData.colors[0];
                        //     }
                        //     const index = mockData.customers.indexOf(selectedDetailCustomer || mockData.customers[0]);
                        //     return index >= 0 ? mockData.colors[index] : mockData.colors[0];
                        //   })(),
                        //   strokeWidth: 2,
                        //   r: 5,
                        //   stroke: "#fff"
                        // }}
                        // activeDot={{
                        //   r: 7,
                        //   strokeWidth: 2
                        // }}
                      />
                      <ReferenceLine
                        y={2}
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Sentiment Scale - Moved to bottom of chart with horizontal orientation */}
              <div className="border-t mt-4">
                <div className="flex items-end gap-6 py-3">
                  <span className="text-xs font-medium text-muted-foreground mb-1">
                    Sentiment Scale:
                  </span>
                  <div className="flex items-end gap-3">
                    {sentimentScale.map((item) => (
                      <div
                        key={item.value}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={cn("p-1.5 rounded-md", item.bgColor)}>
                          <item.icon className={cn("h-3 w-3", item.color)} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium leading-tight">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Score: {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;
