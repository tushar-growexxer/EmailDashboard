import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Users, Building, Smile, SmilePlus, Meh, Frown, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import BusinessTypeFilter from "../components/filters/BusinessTypeFilter";
import { cn } from "../lib/utils";
import TimePeriodFilter from "../components/filters/TimePeriodFilter";

// Mock chart data
const chartData = [
  { date: "Jan 01", "ABC Corp": 1.2, "XYZ Industries": 2.1, "Tech Solutions": 1.8, "Global Trade": 2.5 },
  { date: "Jan 08", "ABC Corp": 1.5, "XYZ Industries": 1.9, "Tech Solutions": 1.6, "Global Trade": 2.3 },
  { date: "Jan 15", "ABC Corp": 1.8, "XYZ Industries": 2.2, "Tech Solutions": 1.4, "Global Trade": 2.0 },
  { date: "Jan 22", "ABC Corp": 2.1, "XYZ Industries": 2.5, "Tech Solutions": 1.9, "Global Trade": 1.8 },
  { date: "Jan 29", "ABC Corp": 1.9, "XYZ Industries": 2.3, "Tech Solutions": 2.2, "Global Trade": 2.1 },
  { date: "Feb 05", "ABC Corp": 1.6, "XYZ Industries": 2.0, "Tech Solutions": 2.0, "Global Trade": 2.4 },
];

const customers = ["ABC Corp", "XYZ Industries", "Tech Solutions", "Global Trade"];
const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"];

const sentimentScale = [
  { label: "Higher Positive", value: 0, color: "text-green-700", icon: SmilePlus, bgColor: "bg-green-100" },
  { label: "Positive", value: 1, color: "text-green-600", icon: Smile, bgColor: "bg-green-50" },
  { label: "Neutral", value: 2, color: "text-gray-600", icon: Meh, bgColor: "bg-gray-100" },
  { label: "Negative", value: 3, color: "text-orange-600", icon: Frown, bgColor: "bg-orange-100" },
  { label: "Higher Negative", value: 4, color: "text-red-600", icon: Frown, bgColor: "bg-red-100" },
];

const SentimentDashboard = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [businessType, setBusinessType] = useState("All");
  const [timePeriod, setTimePeriod] = useState("Last 3 Months");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showDataTable, setShowDataTable] = useState(false);

  const summaryStats = [
    {
      title: "Average Sentiment",
      value: "1.9",
      label: "Positive",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Trend Direction",
      value: "Improving",
      label: "+5.2%",
      icon: ArrowUpDown,
      color: "text-green-600",
    },
    {
      title: "Customers Analyzed",
      value: "10",
      label: "Top by volume",
      icon: Users,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold mb-2">Customer Sentiment Analysis</h1>
          <Badge variant="purple">Top 10</Badge>
        </div>
        <p className="text-muted-foreground">
          Sentiment trends over time for top 10 customers (by volume from SAP)
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Last refreshed: Today at 7:00 AM
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Left Panel - Filters and Legend */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Customer</label>
                <Input
                  placeholder="Search all customers"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Showing top 10 by volume
                </p>
              </div>

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
            </CardContent>
          </Card>

          {/* Sentiment Scale Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sentiment Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sentimentScale.map((item) => (
                  <div key={item.value} className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", item.bgColor)}>
                      <item.icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">Score: {item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-900">Overall sentiment is improving</p>
                  <p className="text-xs text-green-700 mt-1">+5.2% positive trend this month</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900">ABC Corp showing best sentiment</p>
                  <p className="text-xs text-blue-700 mt-1">Consistently positive feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Chart */}
        <div className="lg:col-span-3 space-y-4 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sentiment Trends Over Time</CardTitle>
                  <CardDescription>Lower scores indicate more positive sentiment</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataTable(!showDataTable)}
                >
                  {showDataTable ? "View Chart" : "View Data Table"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!showDataTable ? (
                <div className="flex-1 min-h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
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
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="line"
                      />
                      <ReferenceLine
                        y={2}
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                        label={{ value: "Neutral Baseline", position: "right", fill: "#6b7280" }}
                      />
                      {customers.map((customer, index) => (
                        <Line
                          key={customer}
                          type="monotone"
                          dataKey={customer}
                          stroke={colors[index]}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Date</th>
                        {customers.map((customer) => (
                          <th key={customer} className="p-3 text-center font-medium">
                            {customer}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.date}</td>
                          {customers.map((customer) => (
                            <td key={customer} className="p-3 text-center">
                              <Badge
                                variant={
                                  row[customer] <= 1 ? "green" :
                                  row[customer] <= 2 ? "gray" :
                                  row[customer] <= 3 ? "orange" : "red"
                                }
                              >
                                {row[customer].toFixed(1)}
                              </Badge>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;
