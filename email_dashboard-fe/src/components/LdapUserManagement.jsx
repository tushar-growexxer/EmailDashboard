import React, { useState, useEffect } from "react";
import { RefreshCw, Users, CheckCircle, XCircle, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { FormDialog } from "./ui/Dialog";
import { Select } from "./ui/Select";
import { TableSkeleton } from "./ui/Skeleton";
import { PaginatedTable } from "./ui/PaginatedTable";
import { getInitials, formatDateTimeWithAMPM } from "../utils/dashboardUtils";
import { Avatar, AvatarFallback } from "./ui/Avatar";
import { ldapSyncApi } from "../api/index";

const LdapUserManagement = () => {
  const [ldapUsers, setLdapUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    role: "user",
    isActive: false,
  });

  useEffect(() => {
    fetchLdapUsers();
  }, []);

  const fetchLdapUsers = async () => {
    setIsLoadingUsers(true);
    setErrorMessage("");
    try {
      const result = await ldapSyncApi.getSyncedUsers();
      if (result.success) {
        setLdapUsers(result.users);
      } else {
        setErrorMessage(result.message || "Failed to fetch LDAP users");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to fetch LDAP users");
    } finally {
      setIsLoadingUsers(false);
    }
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
        // Refresh the user list
        await fetchLdapUsers();
      } else {
        setErrorMessage(result.message || "Failed to sync LDAP users");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to sync LDAP users");
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
        // Refresh the user list
        await fetchLdapUsers();
      } else {
        setErrorMessage(result.message || "Failed to update user");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  // Column definitions for LDAP Users table
  const ldapUserColumns = [
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
            <p className="font-medium truncate text-sm sm:text-base">
              {user.displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.sAMAccountName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "userPrincipalName",
      header: "Email",
      sortable: true,
      className: "min-w-[180px]",
      render: (user) => (
        <span className="text-xs sm:text-sm truncate">
          {user.userPrincipalName || user.mail || "N/A"}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      className: "min-w-[80px]",
      render: (user) => (
        <Badge
          variant={
            user.role === "admin"
              ? "default"
              : user.role === "manager"
              ? "secondary"
              : "outline"
          }
          className="text-xs"
        >
          {user.role}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      className: "min-w-[80px]",
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
      key: "syncedAt",
      header: "Last Synced",
      sortable: true,
      className: "min-w-[140px]",
      render: (user) => (
        <span className="text-xs sm:text-sm text-muted-foreground">
          {user.syncedAt ? formatDateTimeWithAMPM(user.syncedAt) : "N/A"}
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleOpenEditUser(user)}
            title="Edit User"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">LDAP User Management</h2>
          <p className="text-sm text-muted-foreground">
            Sync and manage users from LDAP directory
          </p>
        </div>
        <Button onClick={handleSyncUsers} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Refresh from LDAP"}
        </Button>
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            LDAP Users ({ldapUsers.length})
          </CardTitle>
          <CardDescription>
            Users synced from LDAP directory. Update roles and active status as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : ldapUsers.length === 0 ? (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              No LDAP users found. Click "Refresh from LDAP" to sync users.
            </div>
          ) : (
            <PaginatedTable
              data={ldapUsers}
              columns={ldapUserColumns}
              searchKey="displayName"
              searchPlaceholder="Search LDAP users..."
              defaultSort={{ key: "displayName", direction: "asc" }}
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <FormDialog
        open={editUserModal}
        onOpenChange={setEditUserModal}
        title="Edit User"
        description={`Update role and status for ${selectedUser?.displayName}`}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditUserModal(false);
                setSelectedUser(null);
              }}
              className="text-sm"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isUpdating}
              className="text-sm"
            >
              {isUpdating ? "Updating..." : "Update User"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">
              User Information
            </label>
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p className="text-sm font-medium">{selectedUser?.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {selectedUser?.sAMAccountName}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedUser?.userPrincipalName || selectedUser?.mail}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">
              Role
            </label>
            <Select
              value={editFormData.role}
              onChange={(e) =>
                setEditFormData({ ...editFormData, role: e.target.value })
              }
              className="text-sm sm:text-base"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">
              Status
            </label>
            <Select
              value={editFormData.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  isActive: e.target.value === "active",
                })
              }
              className="text-sm sm:text-base"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </FormDialog>
    </div>
  );
};

export default LdapUserManagement;
