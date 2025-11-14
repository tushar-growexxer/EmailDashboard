import React, { useState, useEffect } from "react";
import { Users, Settings as SettingsIcon, RefreshCw, Edit, CheckCircle, XCircle, User, Shield, ShieldCheck, ShieldOff, UserCog, Save, X, UserPlus, Globe, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FormDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "../components/ui/Dialog";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { TableSkeleton } from "../components/ui/Skeleton";
import { PaginatedTable } from "../components/ui/PaginatedTable";
import {
  getInitials,
  formatDateTimeWithAMPM,
} from "../utils/dashboardUtils";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { ldapSyncApi, googleUsersApi, domainManagementApi } from "../api/index";
import { cn } from "../lib/utils";

const Settings = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const [activeTab, setActiveTab] = useState("users");
  const [editUserModal, setEditUserModal] = useState(false);
  const [managerModal, setManagerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForManager, setSelectedUserForManager] = useState(null);
  const [users, setUsers] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: "user",
    isActive: false,
    domain: "",
    manager: null,
  });

  // Domain management state (for super admin only)
  const [domains, setDomains] = useState([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isRefreshingDomains, setIsRefreshingDomains] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isDeletingDomain, setIsDeletingDomain] = useState(null);
  const [addDomainModalOpen, setAddDomainModalOpen] = useState(false);
  const [editDomainModalOpen, setEditDomainModalOpen] = useState(false);
  const [deleteDomainModalOpen, setDeleteDomainModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [domainToEdit, setDomainToEdit] = useState(null);
  const [newDomain, setNewDomain] = useState("");
  const [newDatabase, setNewDatabase] = useState("");
  const [domainError, setDomainError] = useState("");
  const [databaseError, setDatabaseError] = useState("");
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  // Determine if current user is Google or LDAP
  const isGoogleUser = currentUser?.isGoogleUser || currentUser?.department === 'Google';
  const isLdapUser = currentUser?.department === 'LDAP' || (!isGoogleUser && currentUser?.id?.toString().startsWith('ldap_'));

  // Check if user is super admin or admin
  const isSuperAdmin = currentUser?.role?.toLowerCase() === 'super admin';
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  
  // Only super admin and admin can access settings
  const canAccessSettings = isSuperAdmin || isAdmin;

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "email", label: "Email Configuration", icon: SettingsIcon },
  ];

  // Add domain management tab only for super admin
  if (isSuperAdmin) {
    tabs.push({ id: "domains", label: "Domain Management", icon: Globe });
  }

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "domains" && isSuperAdmin) {
      fetchDomains();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isGoogleUser, isSuperAdmin]);

  const fetchUsers = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingUsers(true);
    }
    try {
      let result;
      if (isGoogleUser) {
        // Fetch Google users
        result = await googleUsersApi.getGoogleUsers(forceRefresh);
        if (result.success) {
          setUsers(result.users);
          // For Google users, use createdAt as last synced indicator
          if (result.users.length > 0) {
            const mostRecent = result.users.reduce((latest, user) => {
              const userCreated = new Date(user.createdAt);
              return userCreated > latest ? userCreated : latest;
            }, new Date(0));
            setLastSynced(mostRecent);
          }
        } else {
          const errorMsg = result.message || "Failed to fetch users";
          if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
            showError("You don't have permission to access user management. Please contact an administrator.");
          } else {
            showError(errorMsg);
          }
        }
      } else {
        // Fetch LDAP users
        result = await ldapSyncApi.getSyncedUsers(forceRefresh);
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
          const errorMsg = result.message || "Failed to fetch users";
          if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
            showError("You don't have permission to access user management. Please contact an administrator.");
          } else {
            showError(errorMsg);
          }
        }
      }
    } catch (error) {
      const errorMsg = error.message || "Failed to fetch users";
      if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
        showError("You don't have permission to access user management. Please contact an administrator.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsLoadingUsers(false);
      setIsRefreshing(false);
    }
  };

  const handleRefreshUsers = () => {
    fetchUsers(true);
  };

  // Domain management functions (for super admin only)
  const fetchDomains = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshingDomains(true);
    } else {
      setIsLoadingDomains(true);
    }

    try {
      const result = await domainManagementApi.getAllDomains();
      if (result.success) {
        setDomains(result.data || []);
      } else {
        showError(result.message || "Failed to load domains");
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      showError("Unable to load domains. Please try again.");
    } finally {
      setIsLoadingDomains(false);
      setIsRefreshingDomains(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      setDomainError("Domain is required");
      return;
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    const normalizedDomain = newDomain.trim().toLowerCase().replace(/^www\./, '');
    
    if (!domainRegex.test(normalizedDomain)) {
      setDomainError("Invalid domain format. Example: example.com");
      return;
    }

    setIsAddingDomain(true);
    setDomainError("");
    setDatabaseError("");

    try {
      const payload = {
        domain: normalizedDomain,
        database: newDatabase.trim() || null
      };
      const result = await domainManagementApi.addDomain(payload.domain, payload.database);
      if (result.success) {
        showSuccess("Domain added successfully");
        setNewDomain("");
        setNewDatabase("");
        setAddDomainModalOpen(false);
        await fetchDomains();
      } else {
        setDomainError(result.message || "Failed to add domain");
      }
    } catch (error) {
      console.error("Error adding domain:", error);
      setDomainError(error.message || "Failed to add domain. Please try again.");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleOpenEditDomain = (domain) => {
    setDomainToEdit(domain);
    setNewDomain(domain.domain || "");
    setNewDatabase(domain.database || "");
    setDomainError("");
    setDatabaseError("");
    setEditDomainModalOpen(true);
  };

  const handleUpdateDomain = async () => {
    if (!newDomain.trim()) {
      setDomainError("Domain is required");
      return;
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    const normalizedDomain = newDomain.trim().toLowerCase().replace(/^www\./, '');
    
    if (!domainRegex.test(normalizedDomain)) {
      setDomainError("Invalid domain format. Example: example.com");
      return;
    }

    setIsAddingDomain(true);
    setDomainError("");
    setDatabaseError("");

    try {
      const payload = {
        domain: normalizedDomain,
        database: newDatabase.trim() || null
      };
      const result = await domainManagementApi.updateDomain(domainToEdit._id, payload);
      if (result.success) {
        showSuccess("Domain updated successfully");
        setNewDomain("");
        setNewDatabase("");
        setDomainToEdit(null);
        setEditDomainModalOpen(false);
        await fetchDomains();
      } else {
        setDomainError(result.message || "Failed to update domain");
      }
    } catch (error) {
      console.error("Error updating domain:", error);
      setDomainError(error.message || "Failed to update domain. Please try again.");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteDomainClick = (domain) => {
    if (!domain) return;
    // Ensure user delete modal is closed first
    setDeleteUserModalOpen(false);
    setUserToDelete(null);
    // Set domain to delete and open domain delete modal
    setDomainToDelete(domain);
    setDeleteDomainModalOpen(true);
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;

    setIsDeletingDomain(domainToDelete._id);

    try {
      const result = await domainManagementApi.deleteDomain(domainToDelete._id);
      if (result.success) {
        showSuccess("Domain deleted successfully");
        setDeleteDomainModalOpen(false);
        setDomainToDelete(null);
        await fetchDomains();
      } else {
        showError(result.message || "Failed to delete domain");
      }
    } catch (error) {
      console.error("Error deleting domain:", error);
      showError("Failed to delete domain. Please try again.");
    } finally {
      setIsDeletingDomain(null);
    }
  };

  const handleSyncUsers = async () => {
    // Only LDAP users can be synced
    if (isGoogleUser) {
      showError("Google users cannot be synced. They are created automatically on first login.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await ldapSyncApi.syncUsers();
      if (result.success) {
        showSuccess(
          result.message ||
            `Synced ${result.data?.totalUsers || 0} users successfully`
        );
        await fetchUsers();
      } else {
        const errorMsg = result.message || "Failed to sync users";
        if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
          showError("You don't have permission to sync users. Please contact an administrator.");
        } else {
          showError(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = error.message || "Failed to sync users";
      if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
        showError("You don't have permission to sync users. Please contact an administrator.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEditUser = (user) => {
    setSelectedUser(user);
    // Extract domain from email
    const email = isGoogleUser ? user.email : (user.mail || user.userPrincipalName || '');
    const domain = email ? email.split('@')[1] : (user.domain || '');
    
    setEditFormData({
      role: user.role || "user",
      isActive: user.isActive || false,
      domain: domain,
      manager: user.manager || null,
    });
    setEditUserModal(true);
  };

  const handleOpenDeleteUser = (user) => {
    // Immediately open the modal with the selected user
    setUserToDelete(user);
    setDeleteUserModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    try {
      let result;
      if (isGoogleUser) {
        // Delete Google user (also deletes from UserManager/OAuth tokens)
        result = await googleUsersApi.deleteGoogleUser(userToDelete.googleId);
      } else {
        // Delete LDAP user (also deletes from UserManager/OAuth tokens)
        if (userToDelete.sAMAccountName) {
          result = await ldapSyncApi.deleteLdapUser(userToDelete.sAMAccountName);
        } else {
          showError("Cannot delete user: User identifier not found");
          return;
        }
      }

      if (result.success) {
        showSuccess("User and associated OAuth tokens deleted successfully");
        setDeleteUserModalOpen(false);
        setUserToDelete(null);
        await fetchUsers(true); // Refresh the user list
      } else {
        showError(result.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      showError(error.message || "Failed to delete user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleOpenManagerModal = (user) => {
    setSelectedUserForManager(user);
    // Get current managers
    const currentManagers = user.manager ? (Array.isArray(user.manager) ? user.manager : [user.manager]) : [];
    setSelectedManagers(currentManagers.map(m => m.userId || m.email));
    
    // Filter out the user themselves from available managers
    const available = users.filter(u => {
      if (isGoogleUser) {
        return u.googleId !== user.googleId && u.domain === user.domain;
      } else {
        return u.sAMAccountName !== user.sAMAccountName;
      }
    });
    setAvailableManagers(available);
    setManagerModal(true);
  };

  const handleManagerToggle = (managerUserId) => {
    setSelectedManagers(prev => {
      if (prev.includes(managerUserId)) {
        return prev.filter(id => id !== managerUserId);
      } else {
        return [...prev, managerUserId];
      }
    });
  };

  const handleSaveManagers = async () => {
    if (!selectedUserForManager) return;

    setIsUpdating(true);

    try {
      // Build manager objects from selected user IDs
      const managerObjects = selectedManagers.map(managerId => {
        const managerUser = users.find(u => {
          if (isGoogleUser) {
            return u.googleId === managerId || u.email === managerId;
          } else {
            return u.sAMAccountName === managerId || u.userPrincipalName === managerId || u.mail === managerId;
          }
        });
        
        if (managerUser) {
          return {
            userId: isGoogleUser ? managerUser.googleId : managerUser.sAMAccountName,
            email: isGoogleUser ? managerUser.email : (managerUser.userPrincipalName || managerUser.mail || ''),
            displayName: managerUser.displayName,
            userType: isGoogleUser ? 'google' : 'ldap',
          };
        }
        return null;
      }).filter(Boolean);

      const updates = {
        manager: managerObjects.length > 0 ? (managerObjects.length === 1 ? managerObjects[0] : managerObjects) : null,
      };

      let result;
      if (isGoogleUser) {
        result = await googleUsersApi.updateGoogleUser(
          selectedUserForManager.googleId,
          updates
        );
      } else {
        result = await ldapSyncApi.updateUserStatus(
          selectedUserForManager.sAMAccountName,
          updates
        );
      }

      if (result.success) {
        showSuccess(`Manager(s) updated for ${selectedUserForManager.displayName}!`);
        setManagerModal(false);
        setSelectedUserForManager(null);
        await fetchUsers();
      } else {
        const errorMsg = result.message || "Failed to update managers";
        if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
          showError("You don't have permission to update managers. Please contact an administrator.");
        } else {
          showError(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = error.message || "Failed to update managers";
      if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
        showError("You don't have permission to update managers. Please contact an administrator.");
      } else {
        showError(errorMsg);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);

    try {
      let result;
      if (isGoogleUser) {
        // Update Google user
        result = await googleUsersApi.updateGoogleUser(
          selectedUser.googleId,
          editFormData
        );
      } else {
        // Update LDAP user
        result = await ldapSyncApi.updateUserStatus(
          selectedUser.sAMAccountName,
          editFormData
        );
      }

      if (result.success) {
        showSuccess(`User ${selectedUser.displayName} updated successfully!`);
        setEditUserModal(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        const errorMsg = result.message || "Failed to update user";
        if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
          showError("You don't have permission to update users. Please contact an administrator.");
        } else {
          showError(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = error.message || "Failed to update user";
      if (errorMsg.includes('403') || errorMsg.includes('Insufficient permissions')) {
        showError("You don't have permission to update users. Please contact an administrator.");
      } else {
        showError(errorMsg);
      }
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
            <p className="text-xs text-muted-foreground truncate">
              {isGoogleUser ? user.email : user.sAMAccountName}
            </p>
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
            user.role === "super admin"
              ? "destructive"
              : user.role === "admin"
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
      key: "domain",
      header: "Domain",
      sortable: true,
      className: "min-w-[150px]",
      render: (user) => {
        const email = isGoogleUser ? user.email : (user.mail || user.userPrincipalName || '');
        const domain = email ? email.split('@')[1] : user.domain || 'N/A';
        return (
          <span className="text-xs sm:text-sm text-muted-foreground">
            {domain}
          </span>
        );
      },
    },
    {
      key: "manager",
      header: "Manager(s)",
      sortable: false,
      className: "min-w-[150px]",
      render: (user) => {
        const managers = user.manager ? (Array.isArray(user.manager) ? user.manager : [user.manager]) : [];
        return (
          <div className="flex items-center gap-1">
            {managers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {managers.slice(0, 2).map((m, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {m.displayName || m.email}
                  </Badge>
                ))}
                {managers.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{managers.length - 2}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
            {(isAdmin || isSuperAdmin) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenManagerModal(user);
                }}
                title="Assign Manager"
              >
                <UserPlus className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
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
      key: isGoogleUser ? "createdAt" : "syncedAt",
      header: isGoogleUser ? "Created At" : "Synced At",
      sortable: true,
      className: "min-w-[140px]",
      render: (user) => (
        <span className="text-xs sm:text-sm text-muted-foreground">
          {isGoogleUser 
            ? (user.createdAt ? formatDateTimeWithAMPM(user.createdAt) : "Never")
            : (user.syncedAt ? formatDateTimeWithAMPM(user.syncedAt) : "Never")}
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
          {["admin","super admin"].includes(currentUser?.role) && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditUser(user);
                }}
                title="Edit User"
                disabled={user.email === currentUser?.email}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteUser(user);
                }}
                title="Delete User"
                disabled={user.email === currentUser?.email} // Prevent deleting own account
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Access control check
  if (!canAccessSettings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the Settings page. Only administrators can manage system settings.
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold">User Management</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage user access and permissions
              </p>
            </div>
            {(isAdmin || isSuperAdmin) && !isGoogleUser && (
              <Button onClick={handleSyncUsers} disabled={isSyncing} size="sm" className="w-full sm:w-auto shrink-0">
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Users from LDAP"}</span>
                <span className="sm:hidden">{isSyncing ? "Syncing..." : "Sync Users"}</span>
              </Button>
            )}
          </div>


          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="min-w-0">Users ({users.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
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
                  className="h-8 w-8 shrink-0 self-start sm:self-auto"
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
                  {isGoogleUser 
                    ? "No Google users found."
                    : 'No users found. Click "Sync Users" to load users.'}
                </div>
              ) : (
                <PaginatedTable
                  data={users}
                  columns={userColumns}
                  searchKey={isGoogleUser ? ["displayName", "email"] : ["displayName", "sAMAccountName"]}
                  searchPlaceholder={isGoogleUser ? "Search by name or email..." : "Search by name or username..."}
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

      {/* Domain Management Tab (Super Admin Only) */}
      {activeTab === "domains" && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold">Domain Management</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage allowed email domains for system access
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchDomains(true)}
                disabled={isRefreshingDomains || isLoadingDomains}
                variant="outline"
                className="gap-2"
                size="sm"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshingDomains && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                onClick={() => setAddDomainModalOpen(true)}
                className="gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Domain</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Domain Access Control
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Only users with email addresses from the domains listed below can access the system. 
                    Users attempting to log in with disallowed domains will be blocked.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domains Table */}
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="min-w-0">Allowed Domains ({domains.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                    Manage email domains that can access the system
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchDomains(true)}
                  disabled={isRefreshingDomains || isLoadingDomains}
                  title="Refresh domains list"
                  className="h-8 w-8 shrink-0 self-start sm:self-auto"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingDomains ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingDomains ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={3} />
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground px-4">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm sm:text-base">No domains configured</p>
                  <p className="text-xs sm:text-sm mt-1">
                    Add your first domain to start controlling access
                  </p>
                </div>
              ) : (
                <PaginatedTable
                  data={domains}
                  columns={[
                    {
                      key: "domain",
                      header: "Domain",
                      sortable: true,
                      className: "text-left min-w-[200px]",
                      cellClassName: "text-left",
                      render: (domain) => (
                        <div 
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{domain.domain}</span>
                        </div>
                      ),
                    },
                    {
                      key: "database",
                      header: "Database",
                      sortable: true,
                      className: "min-w-[150px]",
                      render: (domain) => (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {domain.database || "N/A"}
                        </span>
                      ),
                    },
                    {
                      key: "createdAt",
                      header: "Added On",
                      sortable: true,
                      className: "min-w-[140px]",
                      render: (domain) => (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {formatDateTimeWithAMPM(new Date(domain.createdAt))}
                        </span>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      className: "text-right min-w-[120px]",
                      cellClassName: "text-right",
                      render: (domain) => (
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDomain(domain);
                            }}
                            title="Edit Domain"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteDomainClick(domain);
                            }}
                            disabled={isDeletingDomain === domain._id}
                            title="Delete Domain"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  searchKey="domain"
                  searchPlaceholder="Search domains..."
                  defaultSort={{ key: "createdAt", direction: "desc" }}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>

          {/* Add Domain Modal */}
          <Dialog open={addDomainModalOpen} onOpenChange={setAddDomainModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Allowed Domain</DialogTitle>
                <DialogDescription>
                  Enter the domain name (e.g., example.com). Users with email addresses from this domain will be allowed to access the system.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Domain Name
                    </label>
                    <Input
                      type="text"
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => {
                        setNewDomain(e.target.value);
                        setDomainError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddDomain();
                        }
                      }}
                    />
                    {domainError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {domainError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Database / Schema (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="database_name"
                      value={newDatabase}
                      onChange={(e) => {
                        setNewDatabase(e.target.value);
                        setDatabaseError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddDomain();
                        }
                      }}
                    />
                    {databaseError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {databaseError}
                      </p>
                    )}
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddDomainModalOpen(false);
                    setNewDomain("");
                    setNewDatabase("");
                    setDomainError("");
                    setDatabaseError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDomain}
                  disabled={isAddingDomain || !newDomain.trim()}
                  className="gap-2"
                >
                  {isAddingDomain ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Domain
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Domain Modal */}
          <Dialog open={editDomainModalOpen} onOpenChange={setEditDomainModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Domain</DialogTitle>
                <DialogDescription>
                  Update the domain name and database/schema information.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Domain Name
                    </label>
                    <Input
                      type="text"
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => {
                        setNewDomain(e.target.value);
                        setDomainError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDomain();
                        }
                      }}
                    />
                    {domainError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {domainError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Database / Schema (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="database_name"
                      value={newDatabase}
                      onChange={(e) => {
                        setNewDatabase(e.target.value);
                        setDatabaseError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDomain();
                        }
                      }}
                    />
                    {databaseError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {databaseError}
                      </p>
                    )}
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDomainModalOpen(false);
                    setDomainToEdit(null);
                    setNewDomain("");
                    setNewDatabase("");
                    setDomainError("");
                    setDatabaseError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateDomain}
                  disabled={isAddingDomain || !newDomain.trim()}
                  className="gap-2"
                >
                  {isAddingDomain ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Domain
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Domain Modal */}
          <Dialog open={deleteDomainModalOpen} onOpenChange={setDeleteDomainModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Domain</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the domain "{domainToDelete?.domain}"? 
                  Users with email addresses from this domain will no longer be able to access the system.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDomainModalOpen(false);
                    setDomainToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDomain}
                  disabled={isDeletingDomain === domainToDelete?._id}
                  className="gap-2"
                >
                  {isDeletingDomain === domainToDelete?._id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Delete User Confirmation Dialog - Outside tab sections so it can be used from any tab */}
      <Dialog open={deleteUserModalOpen} onOpenChange={setDeleteUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user "{userToDelete?.email || userToDelete?.displayName}"? 
              This will permanently delete the user from both the Google Users collection and UserDetails collection (including OAuth tokens).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteUserModalOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeletingUser}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
              className="gap-2"
            >
              {isDeletingUser ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Assignment Modal */}
      <FormDialog
        open={managerModal}
        onOpenChange={setManagerModal}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span>Assign Manager(s)</span>
          </div>
        }
        description={`Select manager(s) for ${selectedUserForManager?.displayName}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setManagerModal(false);
                setSelectedUserForManager(null);
                setSelectedManagers([]);
              }}
              className="gap-2"
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button
              onClick={handleSaveManagers}
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{selectedUserForManager?.displayName}</h4>
                <p className="text-xs text-muted-foreground">
                  {isGoogleUser ? selectedUserForManager?.email : selectedUserForManager?.sAMAccountName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>Select Manager(s)</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              Choose one or more users to assign as managers. You can select multiple managers.
            </p>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
              {availableManagers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other users available
                </p>
              ) : (
                availableManagers.map((manager) => {
                  const managerId = isGoogleUser ? manager.googleId : manager.sAMAccountName;
                  const isSelected = selectedManagers.includes(managerId);
                  return (
                    <button
                      key={managerId}
                      type="button"
                      onClick={() => handleManagerToggle(managerId)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {manager.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {isGoogleUser ? manager.email : (manager.userPrincipalName || manager.mail || manager.sAMAccountName)}
                          </p>
                        </div>
                        {manager.role && (
                          <Badge variant="outline" className="text-xs">
                            {manager.role}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {selectedManagers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedManagers.length} manager(s) selected
              </p>
            )}
          </div>
        </div>
      </FormDialog>

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
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{selectedUser?.displayName}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {isGoogleUser ? selectedUser?.email : selectedUser?.sAMAccountName}
                </p>
                {editFormData.domain && (
                  <div className="flex items-center gap-1 mt-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{editFormData.domain}</span>
                  </div>
                )}
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
              {isSuperAdmin 
                ? 'Select the user\'s role to define their permissions' 
                : 'Admins can assign User, Manager, or Admin roles'}
            </p>
            <div className={`grid gap-2 ${isSuperAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, role: 'super admin' })}
                  className={`p-3 rounded-lg border transition-all ${editFormData.role === 'super admin' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className={`h-5 w-5 ${editFormData.role === 'super admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${editFormData.role === 'super admin' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Super Admin
                    </span>
                  </div>
                </button>
              )}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {isSuperAdmin 
                ? 'Super admins can assign any role including super admin' 
                : 'Admins cannot assign the super admin role'}
            </p>
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
