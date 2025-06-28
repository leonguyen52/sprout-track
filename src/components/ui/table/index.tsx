import * as React from "react";
import { cn } from "@/src/lib/utils";
import { tableStyles } from "./table.styles";
import { useTheme } from "@/src/context/theme";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import "./table.css";
import {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
  TableSearchProps,
  TablePaginationProps,
  TablePageSizeProps,
} from "./table.types";

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(tableStyles.table, className, "table-dark")}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <thead
        ref={ref}
        className={cn(tableStyles.header, className, "table-header-dark")}
        {...props}
      />
    );
  }
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <tbody
        ref={ref}
        className={cn(tableStyles.body, className, "table-body-dark")}
        {...props}
      />
    );
  }
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <tfoot
        ref={ref}
        className={cn(tableStyles.footer, className, "table-footer-dark")}
        {...props}
      />
    );
  }
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <tr
        ref={ref}
        className={cn(tableStyles.row, className)}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <th
        ref={ref}
        className={cn(tableStyles.head, className, "table-head-dark")}
        {...props}
      />
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <td
        ref={ref}
        className={cn(tableStyles.cell, className, "table-cell-dark")}
        {...props}
      />
    );
  }
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <caption
        ref={ref}
        className={cn(tableStyles.caption, className, "table-caption-dark")}
        {...props}
      />
    );
  }
);
TableCaption.displayName = "TableCaption";

const TableSearch = React.forwardRef<HTMLInputElement, TableSearchProps>(
  ({ value, onSearchChange, placeholder = "Search...", className, disabled, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <div className={cn(tableStyles.searchContainer, className)}>
        <div className={cn("relative", tableStyles.searchInput)}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={ref}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
            className={cn("pl-10 table-search-dark")}
            {...props}
          />
        </div>
      </div>
    );
  }
);
TableSearch.displayName = "TableSearch";

const TablePagination = React.forwardRef<HTMLDivElement, TablePaginationProps>(
  ({ currentPage, totalPages, totalItems, pageSize, onPageChange, className, disabled, ...props }, ref) => {
    const { theme } = useTheme();
    
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    const generatePageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };
    
    const pageNumbers = generatePageNumbers();
    
    return (
      <div
        ref={ref}
        className={cn(tableStyles.paginationContainer, className)}
        {...props}
      >
        <div className={cn(tableStyles.paginationInfo, "table-pagination-info-dark")}>
          Showing {startItem} to {endItem} of {totalItems} entries
        </div>
        
        <div className={tableStyles.paginationControls}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={disabled || currentPage === 1}
            className={tableStyles.paginationButton}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            className={tableStyles.paginationButton}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={disabled}
              className={tableStyles.paginationButton}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            className={tableStyles.paginationButton}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={disabled || currentPage === totalPages}
            className={tableStyles.paginationButton}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);
TablePagination.displayName = "TablePagination";

const TablePageSize = React.forwardRef<HTMLDivElement, TablePageSizeProps>(
  ({ pageSize, pageSizeOptions = [5, 10, 20, 50, 100], onPageSizeChange, className, disabled, ...props }, ref) => {
    const { theme } = useTheme();
    
    return (
      <div
        ref={ref}
        className={cn(tableStyles.pageSizeContainer, className)}
        {...props}
      >
        <span className={cn(tableStyles.pageSizeLabel, "table-pagesize-label-dark")}>
          Show
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value))}
          disabled={disabled}
        >
          <SelectTrigger className={cn(tableStyles.pageSizeSelect, "table-pagesize-select-dark")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className={cn(tableStyles.pageSizeLabel, "table-pagesize-label-dark")}>
          entries
        </span>
      </div>
    );
  }
);
TablePageSize.displayName = "TablePageSize";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableSearch,
  TablePagination,
  TablePageSize,
}; 