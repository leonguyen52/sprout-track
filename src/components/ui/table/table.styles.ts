export const tableStyles = {
  // Main table container
  table: "w-full caption-bottom text-sm border-collapse border-spacing-0 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm",
  
  // Table header section
  header: "[&_tr]:border-b [&_tr]:border-gray-200",
  
  // Table body section
  body: "[&_tr:last-child]:border-0",
  
  // Table footer section
  footer: "[&_tr]:border-t [&_tr]:border-gray-200 bg-gray-50/50",
  
  // Table row
  row: "border-b border-gray-200 transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-indigo-50",
  
  // Table header cell (th)
  head: "h-12 px-4 text-left align-middle font-semibold text-gray-900 bg-gray-50/80 [&:has([role=checkbox])]:pr-0 first:pl-6 last:pr-6",
  
  // Table data cell (td)
  cell: "p-4 align-middle [&:has([role=checkbox])]:pr-0 first:pl-6 last:pr-6 text-gray-700",
  
  // Table caption
  caption: "mt-4 text-sm text-gray-500",
} as const; 