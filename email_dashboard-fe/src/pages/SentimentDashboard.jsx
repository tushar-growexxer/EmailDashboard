import React, { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area, Brush, ReferenceArea } from "recharts";
import { TrendingUp, Users, Building, Smile, SmilePlus, Meh, Frown, ArrowUpDown, Search, Calendar, BarChart3, Clock, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import BusinessTypeFilter from "../components/filters/BusinessTypeFilter";
import { cn } from "../lib/utils";
import TimePeriodFilter from "../components/filters/TimePeriodFilter";

// Mock data structure with 52 weeks and 14 days sentiment data for top customers
const generateMockSentimentData = () => {
  const customers = [
    "ABC Corp", "XYZ Industries", "Tech Solutions", "Global Trade", "MegaMart Inc",
    "Prime Logistics", "Elite Services", "Dynamic Systems", "Innovate Ltd", "PowerTech"
  ];
  
  const weeks = [];
  const days = [];
  
  // Generate 52 weeks of data (in chronological order)
  for (let i = 1; i <= 52; i++) {
    weeks.push({
      date: `Week ${i}`,
      ...customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(0.5, Math.min(3.8, 2 + Math.sin(i * 0.1 + index) * 1.2 + Math.random() * 0.8));
        return acc;
      }, {})
    });
  }

  // Generate 14 days of data (in chronological order)
  for (let i = 1; i <= 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      ...customers.reduce((acc, customer, index) => {
        acc[customer] = Math.max(0.8, Math.min(3.5, 2 + Math.sin(i * 0.2 + index * 0.5) * 1 + Math.random() * 0.6));
        return acc;
      }, {})
    });
  }

  return {
    customers,
    weeks: weeks,
    days: days,
    colors: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16"]
  };
};

const sentimentScale = [
  { label: "Higher Positive", value: 0, color: "text-green-700", icon: SmilePlus, bgColor: "bg-green-100", threshold: 1.2 },
  { label: "Positive", value: 1, color: "text-green-600", icon: Smile, bgColor: "bg-green-50", threshold: 1.8 },
  { label: "Neutral", value: 2, color: "text-gray-600", icon: Meh, bgColor: "bg-gray-100", threshold: 2.5 },
  { label: "Negative", value: 3, color: "text-orange-600", icon: Frown, bgColor: "bg-orange-100", threshold: 3.2 },
  { label: "Higher Negative", value: 4, color: "text-red-600", icon: Frown, bgColor: "bg-red-100", threshold: 4 },
];

const mockData = generateMockSentimentData();

const SentimentDashboard = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [businessType, setBusinessType] = useState("All");
  const [timePeriod, setTimePeriod] = useState("Last Fiscal Year");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showDataTable, setShowDataTable] = useState(false);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState(mockData.customers[0] || "");
  const [viewMode, setViewMode] = useState("top10"); // "top10" or "search"
  const [useLast14Days, setUseLast14Days] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referenceLineTooltip, setReferenceLineTooltip] = useState(null);

  // Calculate current data based on time period and view mode
  const currentData = useMemo(() => {
    if (useLast14Days) {
      return mockData.days.slice(0, 14); // Get first 14 days (most recent)
    }

    // For time period, use weeks data
    const weeksToShow = timePeriod === "Last Week" ? 1 :
                       timePeriod === "Last Month" ? 4 :
                       timePeriod === "Past 3 Months" ? 12 :
                       timePeriod === "Last Fiscal Year" ? 52 : 52;
    return mockData.weeks.slice(0, weeksToShow); // Get first N weeks (most recent)
  }, [timePeriod, useLast14Days]);

  // Calculate top 10 customers by average sentiment (lower is better)
  const top10Customers = useMemo(() => {
    const averages = mockData.customers.map((customer, index) => {
      const values = currentData.map(d => d[customer] || 2);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { customer, average: avg, color: mockData.colors[index], trend: Math.random() * 0.4 - 0.2 };
    }).sort((a, b) => a.average - b.average); // Lower average is better (more positive)
    
    return averages.slice(0, 10);
  }, [currentData]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (viewMode === "search" && selectedCustomer.trim()) {
      const searchResults = mockData.customers.filter(c =>
        c.toLowerCase().includes(selectedCustomer.toLowerCase())
      );
      // Convert search results to consistent object structure
      return searchResults.map((customer, index) => {
        const values = currentData.map(d => d[customer] || 2);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { customer, average: avg, color: mockData.colors[mockData.customers.indexOf(customer)] };
      });
    }
    return top10Customers;
  }, [selectedCustomer, viewMode, top10Customers, currentData]);

  // Update selectedDetailCustomer when filteredCustomers changes
  useEffect(() => {
    if (filteredCustomers.length > 0 && !selectedDetailCustomer) {
      setSelectedDetailCustomer(filteredCustomers[0].customer);
    } else if (filteredCustomers.length === 0) {
      setSelectedDetailCustomer(mockData.customers[0] || "");
    }
  }, [filteredCustomers.length, viewMode]); // Depend on length and viewMode changes

  // Set initial customer on component mount
  useEffect(() => {
    if (mockData.customers.length > 0 && !selectedDetailCustomer) {
      setSelectedDetailCustomer(mockData.customers[0]);
    }
  }, []); // Run only on mount

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalCustomers = viewMode === "search" ? filteredCustomers.length : 10;
    const avgSentiment = currentData.length > 0 ? 
      mockData.customers.reduce((acc, customer) => {
        const values = currentData.map(d => d[customer] || 2);
        return acc + (values.reduce((a, b) => a + b, 0) / values.length);
      }, 0) / mockData.customers.length : 2;
    
    const trendDirection = avgSentiment < 2.2 ? "Improving" : avgSentiment < 2.8 ? "Stable" : "Declining";
    
    return [
      {
        title: "Average Sentiment",
        value: avgSentiment.toFixed(1),
        label: avgSentiment <= 1.8 ? "Positive" : avgSentiment <= 2.5 ? "Neutral" : "Needs Attention",
        icon: TrendingUp,
        color: avgSentiment <= 1.8 ? "text-green-600" : avgSentiment <= 2.5 ? "text-gray-600" : "text-red-600",
      },
      {
        title: "Trend Direction",
        value: trendDirection,
        label: trendDirection === "Improving" ? "+5.2%" : trendDirection === "Stable" ? "±1.1%" : "-3.8%",
        icon: ArrowUpDown,
        color: trendDirection === "Improving" ? "text-green-600" : trendDirection === "Stable" ? "text-gray-600" : "text-red-600",
      },
      {
        title: "Customers Analyzed",
        value: totalCustomers.toString(),
        label: viewMode === "search" ? "Search Results" : "Top by sentiment",
        icon: Users,
        color: "text-blue-600",
      },
    ];
  }, [currentData, filteredCustomers.length, viewMode]);

  const getSentimentLabel = (score) => {
    return sentimentScale.find(scale => score < scale.threshold)?.label || sentimentScale[sentimentScale.length - 1].label;
  };

  const getSentimentBadge = (score) => {
    const scale = sentimentScale.find(s => score < s.threshold) || sentimentScale[sentimentScale.length - 1];
    return {
      label: scale.label,
      variant: scale.value <= 1 ? "green" : scale.value <= 2 ? "gray" : scale.value <= 3 ? "orange" : "red",
      bgColor: scale.bgColor,
      icon: scale.icon,
      color: scale.color
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleMouseMove = (e) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      // Check if mouse is near the reference line (y=2)
      const sentimentValue = e.activePayload[0].value;
      if (Math.abs(sentimentValue - 2) < 0.4) {
        setReferenceLineTooltip({
          x: e.activeX,
          y: e.activeY,
          value: sentimentValue,
          date: e.activeLabel
        });
      } else {
        setReferenceLineTooltip(null);
      }
    } else {
      setReferenceLineTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setReferenceLineTooltip(null);
  };

  return (
    <div className="space-y-6 w-full mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Customer Sentiment Analysis</h1>
          <p className="text-muted-foreground">
            Sentiment trends over time for customers
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters - Horizontal layout with proper spacing */}
      <div className="flex flex-col md:flex-row gap-8 mb-6 p-6 bg-card border rounded-lg shadow-sm justify-start">
        <div className="w-64">
          <BusinessTypeFilter
            value={businessType}
            onChange={setBusinessType}
          />
        </div>
        <div className="w-64">
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
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 min-h-[600px]">
        {/* Left Panel - Top 10 Customers or Search Results */}
        <div className="xl:col-span-1 space-y-4 flex flex-col">
          {/* View Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer View
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* View Mode Toggle Buttons */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => {
                    setViewMode("top10");
                    setSelectedCustomer("");
                    // Don't set selectedDetailCustomer here, let useEffect handle it
                  }}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                    viewMode === "top10"
                      ? "bg-background shadow-sm text-foreground bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Top 10
                </button>
                <button
                  onClick={() => {
                    setViewMode("search");
                    // Don't clear selectedDetailCustomer here, let useMemo handle it
                  }}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                    viewMode === "search"
                      ? "bg-background shadow-sm text-foreground bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Search
                </button>
              </div>

              {/* Search Input */}
              {viewMode === "search" && (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}

              {/* Customer List */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[550px]">
                {filteredCustomers.map((customerData, index) => {
                  const badge = getSentimentBadge(customerData.average);

                  return (
                    <div
                      key={customerData.customer}
                      onClick={() => setSelectedDetailCustomer(customerData.customer)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                        (selectedDetailCustomer === customerData.customer) || (index === 0 && !selectedDetailCustomer)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{customerData.customer}</span>
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
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
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Detailed Chart */}
        <div className="xl:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {currentData.length > 0 && currentData[0].hasOwnProperty(selectedDetailCustomer || mockData.customers[0])
                      ? (selectedDetailCustomer || mockData.customers[0])
                      : mockData.customers[0]} - Sentiment Trends
                  </CardTitle>
                  <br />
                  <CardDescription>
                    {useLast14Days ? 'Daily sentiment over last 14 days' : `${timePeriod} sentiment trends`}
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
                    <label htmlFor="useLast14DaysChart" className="text-sm font-medium cursor-pointer">
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
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {showDataTable ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-center font-medium">Sentiment Score</th>
                        <th className="p-3 text-center font-medium">Sentiment Level</th>
                      </tr>
                    </thead>
                    <tbody>
                        {currentData.map((row, index) => {
                          const customerKey = currentData.length > 0 && row.hasOwnProperty(selectedDetailCustomer || mockData.customers[0])
                            ? (selectedDetailCustomer || mockData.customers[0])
                            : mockData.customers[0];
                          const score = row[customerKey] || 2;
                          const badge = getSentimentBadge(score);
                          return (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{row.date}</td>
                              <td className="p-3 text-center font-mono">{score.toFixed(2)}</td>
                              <td className="p-3 text-center">
                                <Badge variant={badge.variant} className="text-xs">
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
                <div className="w-full h-[500px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={currentData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <defs>
                        {/* Gradient for negative sentiment area (above neutral) */}
                        <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(239, 68, 68, 0.15)" />
                          <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
                        </linearGradient>
                        {/* Gradient for positive sentiment area (below neutral) */}
                        <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.05)" />
                          <stop offset="100%" stopColor="rgba(16, 185, 129, 0.15)" />
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
                        label={{ value: "Sentiment Score", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value) => [parseFloat(value).toFixed(2), "Sentiment Score"]}
                        labelFormatter={(label) => `Date: ${label}`}
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
                        dataKey={currentData.length > 0 && currentData[0].hasOwnProperty(selectedDetailCustomer || mockData.customers[0])
                          ? (selectedDetailCustomer || mockData.customers[0])
                          : mockData.customers[0]}
                        stroke={currentData.length > 0 && currentData[0].hasOwnProperty(selectedDetailCustomer || mockData.customers[0])
                          ? mockData.colors[mockData.customers.indexOf(selectedDetailCustomer || mockData.customers[0])]
                          : mockData.colors[0]}
                        strokeWidth={3}
                        fill="transparent"
                        fillOpacity={0}
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
              <div className="border-t">
                <div className="flex items-center gap-6 pt-3">
                  <span className="text-xs font-medium text-muted-foreground">Sentiment Scale:</span>
                  <div className="flex items-center gap-3">
                    {sentimentScale.map((item) => (
                      <div key={item.value} className="flex flex-col items-center gap-1">
                        <div className={cn("p-1.5 rounded-md", item.bgColor)}>
                          <item.icon className={cn("h-3 w-3", item.color)} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium leading-tight">{item.label}</p>
                          <p className="text-xs text-muted-foreground">Score: {item.value}</p>
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