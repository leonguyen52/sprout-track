import * as React from "react";
import { cn } from "@/src/lib/utils";
import { tableStyles } from "./table.styles";
import { useTheme } from "@/src/context/theme";
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

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}; 