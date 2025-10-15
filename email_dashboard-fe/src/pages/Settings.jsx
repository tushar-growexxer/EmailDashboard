import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Settings as SettingsIcon, Bell, UserPlus, Edit, Trash2, Key, Eye, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { FormDialog, ConfirmDialog } from "../components/ui/Dialog";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { TableSkeleton } from "../components/ui/Skeleton";
import { PaginatedTable } from "../components/ui/PaginatedTable";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { userApi } from "../api/index";

const Settings = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [createUserModal, setCreateUserModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "user",
    department: "Sales",
  });

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setErrorMessage("");
    try {
      const result = await userApi.getAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        setErrorMessage(result.message || "Failed to fetch users");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const departments = [
    { id: "sales", label: "Sales" },
    { id: "operations", label: "Operations" },
    { id: "management", label: "Management" },
    { id: "SAP", label: "SAP" },
  ];

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "email", label: "Email Configuration", icon: SettingsIcon },
    // { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    
    // Format as DD/MM/YYYY HH:MM
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleCreateUser = async () => {
    setIsCreatingUser(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Validate form data
    if (!formData.email || !formData.fullName || !formData.password) {
      setErrorMessage("Email, full name, and password are required");
      setIsCreatingUser(false);
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      setIsCreatingUser(false);
      return;
    }

    try {
      const result = await userApi.createUser(formData);
      if (result.success) {
        setSuccessMessage("User created successfully!");
        setCreateUserModal(false);
        // Reset form
        setFormData({
          email: "",
          fullName: "",
          password: "",
          role: "user",
          department: "Sales",
        });
        // Refresh users list
        fetchUsers();
      } else {
        setErrorMessage(result.message || "Failed to create user");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create user. Please try again.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleViewUser = (userId) => {
    // Navigate to the profile page with the user ID as state
    navigate("/profile", { state: { userId } });
  };

  const handleOpenDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteUserModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeletingUser(true);
    try {
      const result = await userApi.deleteUser(selectedUser.id);
      if (result.success) {
        setSuccessMessage(`User ${selectedUser.fullName} deleted successfully!`);
        setDeleteUserModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        setErrorMessage(result.message || "Failed to delete user");
        setDeleteUserModal(false);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete user");
      setDeleteUserModal(false);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generatePassword = () => {
    setFormData({ ...formData, password: generateRandomPassword() });
  };

  const generateResetPassword = () => {
    setNewPassword(generateRandomPassword());
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setIsResettingPassword(true);
    setResetPasswordError("");

    // Validate password
    if (!newPassword) {
      setResetPasswordError("Password is required");
      setIsResettingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setResetPasswordError("Password must be at least 8 characters long");
      setIsResettingPassword(false);
      return;
    }

    try {
      const result = await userApi.resetUserPassword(selectedUser.id, newPassword);
      if (result.success) {
        setSuccessMessage(`Password reset successfully for ${selectedUser.fullName}!`);
        setResetPasswordModal(false);
        setSelectedUser(null);
        setNewPassword("");
      } else {
        setResetPasswordError(result.message || "Failed to reset password");
      }
    } catch (error) {
      setResetPasswordError(error.message || "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleOpenResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setResetPasswordError("");
    setResetPasswordModal(true);
  };

  // Column definitions for Users table
  const userColumns = [
    {
      key: "fullName",
      header: "User",
      sortable: true,
      className: "min-w-[200px]",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate text-sm sm:text-base">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      className: "min-w-[80px]",
      render: (user) => (
        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
          {user.role}
        </Badge>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      className: "min-w-[100px]",
      render: (user) => <span className="text-sm">{user.department || "N/A"}</span>,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      className: "min-w-[140px]",
      render: (user) => (
        <span className="text-xs sm:text-sm text-muted-foreground">
          {formatDate(user.lastLogin)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right min-w-[100px]",
      cellClassName: "text-right",
      render: (user) => (
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewUser(user.id)}
            title="View Profile"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {currentUser?.role === "admin" && currentUser?.id !== user.id && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                onClick={() => handleOpenResetPassword(user)}
                title="Reset Password"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleOpenDeleteUser(user)}
                title="Delete User"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-2 sm:gap-4 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors text-sm sm:text-base whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
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
            {currentUser?.role === "admin" && (
              <Button onClick={() => setCreateUserModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            )}
          </div>

          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {isLoadingUsers ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={5} />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">No users found</div>
              ) : (
                <PaginatedTable
                  data={users}
                  columns={userColumns}
                  searchKey="fullName"
                  searchPlaceholder="Search users..."
                  defaultSort={{ key: "department", direction: "asc" }}
                  pageSize={10}
                />
              )}
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
      <FormDialog
        open={createUserModal}
        onOpenChange={setCreateUserModal}
        title="Create New User"
        description="Add a new user to the system"
        maxWidth="max-w-2xl"
        footer={
          <>
            {errorMessage && (
              <div className="flex-1 text-xs sm:text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}
            <Button 
              variant="ghost" 
              onClick={() => {
                setCreateUserModal(false);
                setErrorMessage("");
                setSuccessMessage("");
              }} 
              className="text-sm"
              disabled={isCreatingUser}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={isCreatingUser} 
              className="text-sm"
            >
              {isCreatingUser ? "Creating..." : "Create User"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Email Address *</label>
            <Input
              type="email"
              placeholder="user@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              User will login with this email
            </p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Full Name *</label>
            <Input
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Initial Password *</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="password"
                placeholder="Enter secure password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="flex-1 text-sm sm:text-base"
              />
              <Button variant="outline" onClick={generatePassword} className="text-sm whitespace-nowrap">
                Generate
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Role</label>
            <Select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className="text-sm sm:text-base"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Department</label>
            <Select
              value={formData.department}
              onChange={(e) => handleInputChange("department", e.target.value)}
              className="text-sm sm:text-base"
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Reset Password Modal */}
      <FormDialog
        open={resetPasswordModal}
        onOpenChange={setResetPasswordModal}
        title="Reset Password"
        description={`Reset password for ${selectedUser?.fullName}`}
        maxWidth="max-w-lg"
        footer={
          <>
            {resetPasswordError && (
              <div className="flex-1 text-xs sm:text-sm text-red-600 dark:text-red-400">
                {resetPasswordError}
              </div>
            )}
            <Button 
              variant="ghost" 
              onClick={() => {
                setResetPasswordModal(false);
                setSelectedUser(null);
                setNewPassword("");
                setResetPasswordError("");
              }} 
              className="text-sm"
              disabled={isResettingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isResettingPassword} 
              className="text-sm"
            >
              {isResettingPassword ? "Resetting..." : "Reset Password"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">New Password *</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setResetPasswordError("");
                }}
                className="flex-1 text-sm sm:text-base"
              />
              <Button variant="outline" onClick={generateResetPassword} className="text-sm whitespace-nowrap">
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Password must be at least 8 characters long
            </p>
          </div>
        </div>
      </FormDialog>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={deleteUserModal}
        onOpenChange={setDeleteUserModal}
        title="Delete User"
        description={
          <>
            Are you sure you want to delete {selectedUser?.fullName}?
            <br />
            This action cannot be undone.
          </>
        }
        icon={Trash2}
        iconClassName="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setDeleteUserModal(false);
          setSelectedUser(null);
        }}
        variant="destructive"
        isLoading={isDeletingUser}
      />
    </div>
  );
};

export default Settings;
