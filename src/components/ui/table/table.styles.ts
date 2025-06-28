export const tableStyles = {
  // Main table container
  table: "w-full caption-bottom text-sm border-collapse border-spacing-0 rounded-xl overflow-hidden border border-gray-200 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:bg-white/90",
  
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
} as const; 