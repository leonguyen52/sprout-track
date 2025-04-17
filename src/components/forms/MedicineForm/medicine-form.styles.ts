/**
 * Styles for the MedicineForm component (light mode)
 */
export const medicineFormStyles = {
  // Tab container and navigation
  tabContainer: "flex flex-row border-b border-gray-200 mb-4 overflow-x-auto",
  tabButton: "px-4 py-2 text-sm font-medium text-gray-600 hover:text-teal-600 focus:outline-none",
  tabButtonActive: "text-teal-600 border-b-2 border-teal-600",
  
  // Content containers
  tabContent: "py-2 overflow-y-auto max-h-[calc(100vh-13rem)]",
  loadingContainer: "flex flex-col items-center justify-center py-12",
  errorContainer: "flex flex-col items-center justify-center py-8 text-center",
  
  // Active doses tab
  activeDosesContainer: "space-y-4",
  doseCard: "p-4 bg-white border border-gray-200 rounded-lg shadow-sm",
  doseHeader: "flex items-center justify-between mb-2",
  doseName: "font-medium text-gray-900",
  doseAmount: "text-sm text-gray-600",
  doseTime: "text-sm text-gray-500",
  doseInfo: "flex items-center justify-between mt-2",
  totalDose: "text-sm text-gray-600",
  emptyState: "text-center py-8 text-gray-500",
  
  // Give medicine tab
  formGroup: "mb-4",
  formLabel: "block text-sm font-medium text-gray-700 mb-1",
  formError: "text-sm text-red-500 mt-1",
  selectContainer: "relative",
  
  // Manage medicines tab
  medicinesList: "space-y-3 mb-6",
  medicineItem: "p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center",
  medicineItemActive: "border-teal-200 bg-teal-50",
  medicineItemInactive: "border-gray-200 bg-gray-50 opacity-60",
  medicineDetails: "flex-1",
  medicineActions: "flex space-x-2",
  addButton: "w-full mt-4",
  
  // Medicine form
  medicineForm: "space-y-4",
  formRow: "flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-4",
  formCol: "flex-1",
  contactsSection: "mt-6",
  contactsHeader: "text-sm font-medium text-gray-700 mb-2",
  contactsList: "space-y-2 mb-4",
  contactItem: "flex items-center p-2 bg-gray-50 rounded-md",
  contactName: "ml-2 text-sm",
  
  // Common elements
  iconContainer: "flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600",
  countdownSafe: "text-green-600",
  countdownWarning: "text-amber-600",
  countdownDanger: "text-red-600",
};
