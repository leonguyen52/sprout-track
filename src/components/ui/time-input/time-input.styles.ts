export const timeInputStyles = {
  base: "flex h-10 w-full rounded-xl border-2 border-indigo-200 bg-white px-4 py-2 text-base text-gray-900 ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  error: "border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-red-100",
  valid: "border-green-300 hover:border-green-400 focus:border-green-500 focus:ring-green-100",
  errorMessage: "text-xs text-red-500 mt-1",
  container: "relative"
} as const;
