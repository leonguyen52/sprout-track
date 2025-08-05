/**
 * CSV Export Utility
 * 
 * Provides functions to convert data to CSV format and create downloadable files
 * Based on native JavaScript/TypeScript without external dependencies
 */

/**
 * Convert a 2D array into a CSV string
 * @param data 2D array of data
 * @returns CSV string
 */
export function arrayToCsv(data: any[][]): string {
  return data.map(row =>
    row
      .map(String)  // convert every value to String
      .map(v => v.replaceAll('"', '""'))  // escape double quotes
      .map(v => `"${v}"`)  // quote it
      .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
}

/**
 * Convert an array of objects to CSV string
 * @param data Array of objects
 * @param headers Optional array of header names. If not provided, uses object keys
 * @returns CSV string
 */
export function objectArrayToCsv(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders
    .map(String)
    .map(v => v.replaceAll('"', '""'))
    .map(v => `"${v}"`)
    .join(',');
  
  // Create data rows
  const dataRows = data.map(row =>
    csvHeaders
      .map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        return String(value);
      })
      .map(v => v.replaceAll('"', '""'))
      .map(v => `"${v}"`)
      .join(',')
  );
  
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Create a downloadable blob from CSV content
 * @param csvContent CSV string content
 * @param filename Filename for the download
 * @returns Object with blob and download URL
 */
export function createCsvBlob(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return {
    blob,
    filename,
    size: blob.size
  };
}

/**
 * Sanitize a value for CSV export
 * Handles null, undefined, objects, and special characters
 * @param value Any value to sanitize
 * @returns String safe for CSV
 */
export function sanitizeForCsv(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Create a comprehensive data export with multiple CSV files
 * @param exportData Object containing different data types to export
 * @param familySlug Family slug for filename
 * @returns Object with combined content and metadata
 */
export function createDataExport(exportData: {
  familyInfo: any;
  babies?: any[];
  caretakers?: any[];
  contacts?: any[];
  sleepLogs?: any[];
  feedLogs?: any[];
  diaperLogs?: any[];
  moodLogs?: any[];
  notes?: any[];
  milestones?: any[];
  pumpLogs?: any[];
  playLogs?: any[];
  bathLogs?: any[];
  measurements?: any[];
  medicines?: any[];
  medicineLogs?: any[];
  calendarEvents?: any[];
  settings?: any;
}, familySlug: string) {
  const exportFiles: { filename: string; content: string; size: number }[] = [];
  
  // Add family info as JSON
  if (exportData.familyInfo) {
    const content = JSON.stringify(exportData.familyInfo, null, 2);
    exportFiles.push({
      filename: 'family-info.json',
      content,
      size: content.length
    });
  }
  
  // Add each data type as CSV if it has data
  const dataTypes = [
    { key: 'babies', filename: 'babies.csv' },
    { key: 'caretakers', filename: 'caretakers.csv' },
    { key: 'contacts', filename: 'contacts.csv' },
    { key: 'sleepLogs', filename: 'sleep-logs.csv' },
    { key: 'feedLogs', filename: 'feed-logs.csv' },
    { key: 'diaperLogs', filename: 'diaper-logs.csv' },
    { key: 'moodLogs', filename: 'mood-logs.csv' },
    { key: 'notes', filename: 'notes.csv' },
    { key: 'milestones', filename: 'milestones.csv' },
    { key: 'pumpLogs', filename: 'pump-logs.csv' },
    { key: 'playLogs', filename: 'play-logs.csv' },
    { key: 'bathLogs', filename: 'bath-logs.csv' },
    { key: 'measurements', filename: 'measurements.csv' },
    { key: 'medicines', filename: 'medicines.csv' },
    { key: 'medicineLogs', filename: 'medicine-logs.csv' },
    { key: 'calendarEvents', filename: 'calendar-events.csv' }
  ];
  
  dataTypes.forEach(({ key, filename }) => {
    const data = exportData[key as keyof typeof exportData] as any[];
    if (data && data.length > 0) {
      const csvContent = objectArrayToCsv(data);
      exportFiles.push({
        filename,
        content: csvContent,
        size: csvContent.length
      });
    }
  });
  
  // Add settings as JSON if available
  if (exportData.settings) {
    const content = JSON.stringify(exportData.settings, null, 2);
    exportFiles.push({
      filename: 'settings.json',
      content,
      size: content.length
    });
  }
  
  // Create a simple text-based "archive" with file separators
  const separator = '\n' + '='.repeat(80) + '\n';
  const archiveContent = exportFiles.map(file => 
    `FILE: ${file.filename}\n${separator}${file.content}${separator}`
  ).join('\n\n');
  
  // Add a manifest at the beginning
  const manifest = {
    exportDate: new Date().toISOString(),
    familySlug,
    totalFiles: exportFiles.length,
    totalSize: exportFiles.reduce((sum, file) => sum + file.size, 0),
    files: exportFiles.map(f => ({ filename: f.filename, size: f.size }))
  };
  
  const manifestContent = JSON.stringify(manifest, null, 2);
  const finalContent = `EXPORT MANIFEST\n${separator}${manifestContent}${separator}\n\n${archiveContent}`;
  
  return {
    content: finalContent,
    filename: `${familySlug}-data-export-${new Date().toISOString().split('T')[0]}.txt`,
    manifest,
    files: exportFiles
  };
}
