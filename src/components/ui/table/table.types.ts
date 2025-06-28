import * as React from "react";

/**
 * Props for the main Table component
 */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableHeader component
 */
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableBody component
 */
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableFooter component
 */
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableRow component
 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableHead component (th)
 */
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableCell component (td)
 */
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the TableCaption component
 */
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
} 