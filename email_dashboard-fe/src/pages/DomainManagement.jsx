import React, { useState, useEffect } from "react";
import { Globe, Plus, Trash2, RefreshCw, AlertCircle, Edit2, Database, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "../components/ui/Dialog";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import domainManagementApi from "../api/domainManagement";
import { cn } from "../lib/utils";
import { formatDateTimeWithAMPM } from "../utils/dashboardUtils";

/**
 * Domain Management Page
 * Allows super admin to manage allowed email domains
 */
const DomainManagement = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [newDomain, setNewDomain] = useState("");
  const [newDatabase, setNewDatabase] = useState("");
  const [domainError, setDomainError] = useState("");
  const [editingDomain, setEditingDomain] = useState(null);
  const [editDatabase, setEditDatabase] = useState("");
  const [editDomainName, setEditDomainName] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
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
      setIsLoading(false);
      setIsRefreshing(false);
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

    setIsAdding(true);
    setDomainError("");

    try {
      const result = await domainManagementApi.addDomain(normalizedDomain, newDatabase.trim() || undefined);
      if (result.success) {
        showSuccess("Domain added successfully");
        setNewDomain("");
        setNewDatabase("");
        setAddModalOpen(false);
        await fetchDomains();
      } else {
        setDomainError(result.message || "Failed to add domain");
      }
    } catch (error) {
      console.error("Error adding domain:", error);
      setDomainError(error.message || "Failed to add domain. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (domain) => {
    setEditingDomain(domain);
    setEditDomainName(domain.domain || "");
    setEditDatabase(domain.database || "");
    setEditModalOpen(true);
    setDomainError("");
  };

  const handleUpdateDomain = async () => {
    if (!editingDomain) return;

    setIsAdding(true);
    setDomainError("");

    // Validate domain if changed
    if (editDomainName.trim() !== editingDomain.domain) {
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      const normalizedDomain = editDomainName.trim().toLowerCase().replace(/^www\./, '');
      
      if (!domainRegex.test(normalizedDomain)) {
        setDomainError("Invalid domain format. Example: example.com");
        setIsAdding(false);
        return;
      }
    }

    try {
      const updates = {};
      if (editDomainName.trim() !== editingDomain.domain) {
        updates.domain = editDomainName.trim().toLowerCase().replace(/^www\./, '');
      }
      if (editDatabase.trim() !== (editingDomain.database || "")) {
        updates.database = editDatabase.trim() || undefined;
      }

      const result = await domainManagementApi.updateDomain(editingDomain._id, updates);
      if (result.success) {
        showSuccess("Domain updated successfully");
        setEditModalOpen(false);
        setEditingDomain(null);
        setEditDomainName("");
        setEditDatabase("");
        await fetchDomains();
      } else {
        setDomainError(result.message || "Failed to update domain");
      }
    } catch (error) {
      console.error("Error updating domain:", error);
      setDomainError(error.message || "Failed to update domain. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (domain) => {
    if (!domain) return;
    setDomainToDelete(domain);
    setDeleteModalOpen(true);
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;

    setIsDeleting(domainToDelete._id);

    try {
      const result = await domainManagementApi.deleteDomain(domainToDelete._id);
      if (result.success) {
        showSuccess("Domain deleted successfully");
        setDeleteModalOpen(false);
        setDomainToDelete(null);
        await fetchDomains();
      } else {
        showError(result.message || "Failed to delete domain");
      }
    } catch (error) {
      console.error("Error deleting domain:", error);
      showError("Failed to delete domain. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const columns = [
    {
      key: "domain",
      header: "Domain",
      sortable: true,
      className: "text-left",
      render: (row) => (
        <div 
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.domain}</span>
        </div>
      ),
    },
    {
      key: "database",
      header: "Database/Schema (SAP)",
      sortable: true,
      className: "text-left min-w-[200px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            {row.database || <span className="italic text-muted-foreground">Not configured</span>}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Added On",
      sortable: true,
      className: "text-center",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTimeWithAMPM(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right min-w-[120px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleEditClick(row);
            }}
            title="Edit Domain"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteClick(row);
            }}
            disabled={isDeleting === row._id}
            title="Delete Domain"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2">
            Domain Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage allowed email domains for system access
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchDomains(true)}
            disabled={isRefreshing || isLoading}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
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
        <CardHeader>
          <CardTitle>Allowed Domains</CardTitle>
          <CardDescription>
            {domains.length} domain{domains.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} columns={4} />
            </div>
          ) : domains.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                          col.className
                        )}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain) => (
                    <tr
                      key={domain._id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn("px-4 py-3", col.className)}
                        >
                          {col.render ? col.render(domain) : domain[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground px-4">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm sm:text-base">No domains configured</p>
              <p className="text-xs sm:text-sm mt-1">
                Add your first domain to start controlling access
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Domain Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Allowed Domain</DialogTitle>
            <DialogDescription>
              Enter the domain name and optionally specify the SAP database schema for customer queries.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label htmlFor="domain-input" className="text-sm font-medium mb-2 block">
                  Domain Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="domain-input"
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value);
                    setDomainError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDomain();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="database-input" className="text-sm font-medium mb-2 block">
                  Database/Schema (SAP) <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                <Input
                  id="database-input"
                  type="text"
                  placeholder="Enter SAP schema name (e.g., SCHEMA_NAME)"
                  value={newDatabase}
                  onChange={(e) => {
                    setNewDatabase(e.target.value);
                    setDomainError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDomain();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Specify the SAP database schema name to use for customer queries. If not specified, the default schema will be used.
                </p>
              </div>
              {domainError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {domainError}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddModalOpen(false);
                setNewDomain("");
                setNewDatabase("");
                setDomainError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDomain}
              disabled={isAdding || !newDomain.trim()}
              className="gap-2"
            >
              {isAdding ? (
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
      <Dialog open={editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setEditModalOpen(false);
          setEditingDomain(null);
          setEditDomainName("");
          setEditDatabase("");
          setDomainError("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Update the domain name and database/schema for "{editingDomain?.domain}"
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-domain-input" className="text-sm font-medium mb-2 block">
                  Domain Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-domain-input"
                  type="text"
                  placeholder="example.com"
                  value={editDomainName}
                  onChange={(e) => {
                    setEditDomainName(e.target.value);
                    setDomainError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateDomain();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="edit-database-input" className="text-sm font-medium mb-2 block">
                  Database/Schema (SAP) <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                <Input
                  id="edit-database-input"
                  type="text"
                  placeholder="Enter SAP schema name (e.g., SCHEMA_NAME)"
                  value={editDatabase}
                  onChange={(e) => {
                    setEditDatabase(e.target.value);
                    setDomainError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateDomain();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Specify the SAP database schema name to use for customer queries. If not specified, the default schema will be used.
                </p>
              </div>
              {domainError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {domainError}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setEditingDomain(null);
                setEditDomainName("");
                setEditDatabase("");
                setDomainError("");
              }}
              disabled={isAdding}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDomain}
              disabled={isAdding}
              className="gap-2"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Domain Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
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
                setDeleteModalOpen(false);
                setDomainToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDomain}
              disabled={isDeleting === domainToDelete?._id}
              className="gap-2"
            >
              {isDeleting === domainToDelete?._id ? (
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
  );
};

export default DomainManagement;

