export const tableStyles = {
  // Main table container
  table: "w-full caption-bottom text-sm border-separate border-spacing-0 rounded-xl overflow-hidden border border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90",
  
  // Table header section
  header: "[&_tr]:border-b [&_tr]:border-gray-200",
  
  // Table body section
  body: "[&_tr:last-child]:border-0",
  
  // Table footer section
  footer: "[&_tr]:border-t [&_tr]:border-gray-200 bg-gray-50/80 backdrop-blur-sm",
  
  // Table row
  row: "border-b border-gray-200 transition-colors duration-200 hover:bg-teal-50/50 data-[state=selected]:bg-teal-50",
  
  // Table header cell (th)
  head: "h-12 px-4 text-left align-middle font-semibold text-gray-900 bg-gradient-to-r from-teal-50 to-emerald-50 [&:has([role=checkbox])]:pr-0 first:pl-6 last:pr-6 transition-colors duration-200",
  
  // Table data cell (td)
  cell: "px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0 first:pl-6 last:pr-6 text-gray-700 transition-colors duration-200",
  
  // Table caption
  caption: "mt-4 text-sm text-gray-500",

  // Enhanced table features
  searchContainer: "mb-6 w-full",
  searchInput: "w-full sm:w-3/4 lg:w-1/2",
  
  paginationContainer: "mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2",
  paginationInfo: "text-sm text-gray-700 order-2 sm:order-1",
  paginationControls: "flex items-center gap-1 order-1 sm:order-2",
  paginationButton: "h-9 w-9",
  paginationButtonCurrent: "h-9 w-9",
  
  pageSizeContainer: "flex items-center gap-2 order-3 sm:order-3",
  pageSizeLabel: "text-sm text-gray-700 whitespace-nowrap",
  pageSizeSelect: "h-8 w-20",
} as const; 