import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { cn } from "../../lib/utils";

/**
 * PaginatedTable Component
 * A reusable table with pagination, sorting, and search
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data objects
 * @param {Array} props.columns - Array of column definitions
 * @param {number} props.pageSize - Number of rows per page (default: 10)
 * @param {string|Array} props.searchKey - Key(s) to search by (optional) - can be string or array of strings
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {Object} props.defaultSort - Default sort { key: string, direction: 'asc'|'desc' }
 */
export function PaginatedTable({
  data = [],
  columns = [],
  pageSize = 10,
  searchKey = null,
  searchPlaceholder = "Search...",
  defaultSort = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchKey || !searchTerm) return data;
    
    const searchKeys = Array.isArray(searchKey) ? searchKey : [searchKey];
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return data.filter((row) => {
      // Check if any of the search keys match
      return searchKeys.some((key) => {
        const value = row[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearchTerm);
        }
        return false;
      });
    });
  }, [data, searchKey, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'desc' };
      }
      if (current.direction === 'desc') {
        return { key, direction: 'asc' };
      }
      return null; // Remove sort
    });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="px-2 sm:px-4 pt-2 pb-0">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-full sm:max-w-sm text-sm sm:text-base"
          />
        </div>
      )}

      {/* Table Container - Scrollable */}
      <div className="w-full px-2 sm:px-4">
      <div className="relative border rounded-md overflow-x-auto -mx-2 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={column.key || index}
                  className={column.className || ""}
                  style={column.style}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className={cn("flex items-center justify-center text-center hover:text-foreground transition-colors font-medium w-full", column.className)}
                    >
                      {column.header}
                      {getSortIcon(column.key)}
                    </button>
                  ) : (
                    <div className={cn("font-medium text-center w-full", column.className)}>{column.header}</div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={`${rowIndex}-${colIndex}`}
                      className={column.cellClassName || ""}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex-1 text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            <span className="hidden sm:inline">Showing </span>
            {((currentPage - 1) * rowsPerPage) + 1} to{" "}
            {Math.min(currentPage * rowsPerPage, sortedData.length)} of{" "}
            {sortedData.length} <span className="hidden sm:inline">results</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-6 lg:space-x-8">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Rows per page</p>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="h-8 sm:h-9 w-[70px] text-xs sm:text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </Select>
            </div>
            <div className="flex w-full sm:w-[100px] items-center justify-center text-xs sm:text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                className="hidden h-7 w-7 sm:h-8 sm:w-8 p-0 lg:flex"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                size="sm"
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-7 w-7 sm:h-8 sm:w-8 p-0 lg:flex"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                size="sm"
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

