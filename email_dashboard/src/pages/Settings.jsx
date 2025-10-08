import React, { useState } from "react";
import { Users, Settings as SettingsIcon, Bell, UserPlus, Edit, Trash2, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Modal, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../components/ui/Modal";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { cn } from "../lib/utils";

const mockUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@company.com",
    role: "Admin",
    department: "Sales",
    status: "Active",
    createdDate: "2024-01-15",
    lastLogin: "2024-01-20 10:30 AM",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    role: "User",
    department: "Support",
    status: "Active",
    createdDate: "2024-01-16",
    lastLogin: "2024-01-20 09:15 AM",
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.w@company.com",
    role: "User",
    department: "Marketing",
    status: "Active",
    createdDate: "2024-01-17",
    lastLogin: "2024-01-19 04:20 PM",
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [createUserModal, setCreateUserModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "User",
    department: "Sales",
  });

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "email", label: "Email Configuration", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreateUser = () => {
    console.log("Creating user:", formData);
    setCreateUserModal(false);
    // Reset form
    setFormData({
      email: "",
      fullName: "",
      password: "",
      role: "User",
      department: "Sales",
    });
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Management Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-sm text-muted-foreground">
                Add, edit, and manage user accounts
              </p>
            </div>
            <Button onClick={() => setCreateUserModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Badge variant="green">{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Configuration Tab */}
      {activeTab === "email" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Email Configuration</h2>
          <Card>
            <CardHeader>
              <CardTitle>Email Domain Settings</CardTitle>
              <CardDescription>Configure email sync and domain settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Domain</label>
                <Input placeholder="company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Refresh Schedule</label>
                <Select>
                  <option>Daily at 7:00 AM</option>
                  <option>Every 6 hours</option>
                  <option>Every 12 hours</option>
                  <option>Manual only</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Retention Period</label>
                <Select>
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                </Select>
              </div>
              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Notification Settings</h2>
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>Configure when to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Critical Aging Emails</p>
                  <p className="text-sm text-muted-foreground">Alert when emails age beyond 7 days</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">High Volume Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify when unreplied count exceeds threshold</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Sentiment Warnings</p>
                  <p className="text-sm text-muted-foreground">Alert on negative sentiment trends</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={createUserModal} onClose={() => setCreateUserModal(false)}>
        <ModalClose onClose={() => setCreateUserModal(false)} />
        <ModalHeader>
          <ModalTitle>Create New User</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <Input
                type="email"
                placeholder="user@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                User will login with username part only
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <Input
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Initial Password *</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter secure password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                />
                <Button variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <Select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
              >
                <option>User</option>
                <option>Admin</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <Select
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
              >
                <option>Sales</option>
                <option>Support</option>
                <option>Marketing</option>
                <option>Operations</option>
              </Select>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setCreateUserModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser}>Create User</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Settings;
