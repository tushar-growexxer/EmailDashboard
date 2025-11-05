import React, { useState, useEffect } from "react";
import { Users, Settings as SettingsIcon, RefreshCw, Edit, CheckCircle, XCircle, User, Shield, ShieldCheck, ShieldOff, UserCog, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FormDialog } from "../components/ui/Dialog";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { TableSkeleton } from "../components/ui/Skeleton";
import { PaginatedTable } from "../components/ui/PaginatedTable";
import {
  getInitials,
  formatDateTimeWithAMPM,
} from "../utils/dashboardUtils";
import { useAuth } from "../contexts/AuthContext";
import { ldapSyncApi } from "../api/index";
import { cn } from "../lib/utils";

const Settings = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: "user",
    isActive: false,
  });

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "email", label: "Email Configuration", icon: SettingsIcon },
  ];

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingUsers(true);
    }
    setErrorMessage("");
    try {
      const result = await ldapSyncApi.getSyncedUsers(forceRefresh);
      if (result.success) {
        setUsers(result.users);
        // Get the most recent syncedAt timestamp
        if (result.users.length > 0) {
          const mostRecent = result.users.reduce((latest, user) => {
            const userSynced = new Date(user.syncedAt);
            return userSynced > latest ? userSynced : latest;
          }, new Date(0));
          setLastSynced(mostRecent);
        }
      } else {
        setErrorMessage(result.message || "Failed to fetch users");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
      setIsRefreshing(false);
    }
  };

  const handleRefreshUsers = () => {
    fetchUsers(true);
  };

  const handleSyncUsers = async () => {
    setIsSyncing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await ldapSyncApi.syncUsers();
      if (result.success) {
        setSuccessMessage(
          result.message ||
            `Synced ${result.data?.totalUsers || 0} users successfully`
        );
        await fetchUsers();
      } else {
        setErrorMessage(result.message || "Failed to sync users");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to sync users");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role || "user",
      isActive: user.isActive || false,
    });
    setEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    setErrorMessage("");

    try {
      const result = await ldapSyncApi.updateUserStatus(
        selectedUser.sAMAccountName,
        editFormData
      );

      if (result.success) {
        setSuccessMessage(
          `User ${selectedUser.displayName} updated successfully!`
        );
        setEditUserModal(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        setErrorMessage(result.message || "Failed to update user");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  // Column definitions for Users table
  const userColumns = [
    {
      key: "displayName",
      header: "User",
      sortable: true,
      className: "text-left min-w-[200px]",
      cellClassName: "text-left",
      render: (user) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pl-2">
            <p className="font-medium truncate text-sm sm:text-base">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.sAMAccountName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      className: "min-w-[100px]",
      render: (user) => (
        <Badge
          variant={
            user.role === "admin"
              ? "default"
              : user.role === "manager"
              ? "secondary"
              : "outline"
          }
          className="text-xs capitalize"
        >
          {user.role}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      className: "min-w-[100px]",
      render: (user) => (
        <Badge
          variant={user.isActive ? "green" : "red"}
          className="text-xs"
        >
          {user.isActive ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      className: "min-w-[140px]",
      render: (user) => (
        <span className="text-xs sm:text-sm text-muted-foreground">
          {user.lastLogin ? formatDateTimeWithAMPM(user.lastLogin) : "Never"}
        </span>
      ),
    },
    {
      key: "syncedAt",
      header: "Synced At",
      sortable: true,
      className: "min-w-[140px]",
      render: (user) => (
        <span className="text-xs sm:text-sm text-muted-foreground">
          {user.syncedAt ? formatDateTimeWithAMPM(user.syncedAt) : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right min-w-[80px]",
      cellClassName: "text-right",
      render: (user) => (
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {currentUser?.role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleOpenEditUser(user)}
              title="Edit User"
            >
              <Edit className="h-4 w-4" />
            </Button>
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
                Manage user access and permissions
              </p>
            </div>
            {currentUser?.role === "admin" && (
              <Button onClick={handleSyncUsers} disabled={isSyncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Users from LDAP"}
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({users.length})
                  </CardTitle>
                  <br />
                  <CardDescription>
                    Manage user roles and access permissions
                    {lastSynced && (
                      <span className="block mt-1 text-xs">
                        Last synced: {formatDateTimeWithAMPM(lastSynced)}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshUsers}
                  disabled={isRefreshing || isLoadingUsers}
                  title="Refresh user list"
                  className="h-8 w-8"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingUsers ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={5} />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                  No users found. Click "Sync Users" to load users.
                </div>
              ) : (
                <PaginatedTable
                  data={users}
                  columns={userColumns}
                  searchKey={["displayName", "sAMAccountName"]}
                  searchPlaceholder="Search by name or username..."
                  defaultSort={{ key: "isActive", direction: "desc" }}
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
                <input className="w-full px-3 py-2 border rounded-md" placeholder="company.com" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Refresh Schedule</label>
                <select className="w-full px-3 py-2 border rounded-md" disabled>
                  <option>Daily at 7:00 AM</option>
                </select>
              </div>
              <Button disabled>Save Configuration</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      <FormDialog
        open={editUserModal}
        onOpenChange={setEditUserModal}
        title={
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <span>Edit User</span>
          </div>
        }
        description={`Update permissions for ${selectedUser?.displayName}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setEditUserModal(false);
                setSelectedUser(null);
              }}
              className="gap-2"
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* User Info Card */}
          <div className="bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{selectedUser?.displayName}</h4>
                <p className="text-xs text-muted-foreground">{selectedUser?.sAMAccountName}</p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Role</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              Select the user's role to define their permissions
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, role: 'user' })}
                className={`p-3 rounded-lg border transition-all ${editFormData.role === 'user' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <User className={`h-5 w-5 ${editFormData.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${editFormData.role === 'user' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    User
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, role: 'manager' })}
                className={`p-3 rounded-lg border transition-all ${editFormData.role === 'manager' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Shield className={`h-5 w-5 ${editFormData.role === 'manager' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${editFormData.role === 'manager' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Manager
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, role: 'admin' })}
                className={`p-3 rounded-lg border transition-all ${editFormData.role === 'admin' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className={`h-5 w-5 ${editFormData.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${editFormData.role === 'admin' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Admin
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {editFormData.isActive ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Account Status</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Account Status</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              {editFormData.isActive 
                ? 'User can sign in and access the system' 
                : 'User will be blocked from signing in'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, isActive: true })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${editFormData.isActive 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
                  : 'border-border hover:bg-muted/50'}`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, isActive: false })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${!editFormData.isActive 
                  ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' 
                  : 'border-border hover:bg-muted/50'}`}
              >
                <XCircle className="h-4 w-4" />
                <span>Inactive</span>
              </button>
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
};

export default Settings;
