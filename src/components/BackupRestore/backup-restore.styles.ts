/**
 * Styles for the BackupRestore component
 * 
 * These styles use Tailwind CSS classes and are designed to be compatible
 * with the project's design system and dark mode support.
 */

export const backupRestoreStyles = {
  // Container styles
  container: "space-y-4",
  
  // Section header
  header: {
    container: "flex items-center space-x-2",
    icon: "h-5 w-5 text-teal-600",
    title: "text-lg font-semibold backup-restore-title"
  },
  
  // Button container
  buttonContainer: "flex gap-2",
  
  // Buttons
  button: {
    base: "w-full backup-restore-button",
    backup: "w-full backup-restore-backup-button",
    restore: "w-full backup-restore-restore-button"
  },
  
  // Button icons
  icon: "h-4 w-4 mr-2",
  
  // Help text
  helpText: "text-xs text-gray-500 backup-restore-help-text",
  
  // Status messages
  error: {
    container: "p-3 bg-red-50 border border-red-200 rounded-md backup-restore-error-container",
    content: "flex items-center",
    icon: "h-4 w-4 text-red-500 mr-2",
    text: "text-sm text-red-700 backup-restore-error-text"
  },
  
  success: {
    container: "p-3 bg-green-50 border border-green-200 rounded-md backup-restore-success-container", 
    content: "flex items-center",
    icon: "h-4 w-4 text-green-500 mr-2",
    text: "text-sm text-green-700 backup-restore-success-text"
  }
} as const; 