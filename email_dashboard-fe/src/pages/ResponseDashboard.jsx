import React, { useState } from "react";
import { Mail, ExternalLink, Check, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalHeader, ModalTitle } from "../components/ui/Modal";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import FilterSection from "../components/common/FilterSection";

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

const ResponseDashboard = () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Unreplied Emails by Category</h1>
        <p className="text-muted-foreground mt-1">
          Emails with no reply for more than 24 hours
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

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Categories by User</CardTitle>
          <CardDescription>Click on any count to view email details</CardDescription>
        </CardHeader>
        <CardContent>
          {mockData.length > 0 ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                No unreplied emails found for the selected filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                    {/* Sender Info */}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{email.sender}</p>
                        <p className="text-xs text-muted-foreground">{email.customerName}</p>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{email.subject}</p>
                    </div>

                    {/* Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">{email.preview}</p>

                    {/* Metadata */}
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

                    {/* Actions */}
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

export default ResponseDashboard;
