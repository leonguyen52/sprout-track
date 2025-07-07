# BackupRestore Component

A standalone component for managing database backup and restore operations in the Baby Tracker application. This component provides a clean interface for users to create database backups and restore from existing backup files.

## Features

- Database backup with automatic file download
- Database restore from uploaded backup files
- Loading states and progress indicators
- Error and success message handling
- Dark mode support
- Cross-platform compatibility
- Proper error handling and user feedback

## Usage

### Basic Usage

```tsx
import { BackupRestore } from '@/src/components/BackupRestore';

// Example usage in a settings form
function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleBackupSuccess = () => {
    console.log('Backup completed successfully');
  };
  
  const handleBackupError = (error: string) => {
    console.error('Backup failed:', error);
  };
  
  const handleRestoreSuccess = () => {
    console.log('Restore completed successfully');
    // Page will reload automatically
  };
  
  const handleRestoreError = (error: string) => {
    console.error('Restore failed:', error);
  };
  
  return (
    <div>
      <BackupRestore
        isLoading={isLoading}
        isSaving={isSaving}
        onBackupSuccess={handleBackupSuccess}
        onBackupError={handleBackupError}
        onRestoreSuccess={handleRestoreSuccess}
        onRestoreError={handleRestoreError}
      />
    </div>
  );
}
```

## Component API

### BackupRestore

Main component for database backup and restore operations.

#### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `isLoading` | `boolean` | Whether the parent component is in a loading state | `false` |
| `isSaving` | `boolean` | Whether the parent component is in a saving state | `false` |
| `onBackupSuccess` | `() => void` | Callback when backup operation succeeds | `undefined` |
| `onBackupError` | `(error: string) => void` | Callback when backup operation fails | `undefined` |
| `onRestoreSuccess` | `() => void` | Callback when restore operation succeeds | `undefined` |
| `onRestoreError` | `(error: string) => void` | Callback when restore operation fails | `undefined` |
| `className` | `string` | Custom CSS classes for the container | `undefined` |

## Visual Behavior

- Displays a section header with "Database Management" title
- Two action buttons: "Backup Database" and "Restore Database"
- Help text explaining the functionality
- Error messages appear in red styling when operations fail
- Success messages appear in green styling when operations succeed
- Buttons are disabled during operations to prevent conflicts
- Restore button shows "Restoring..." text when a restore is in progress

## Implementation Details

The component handles all database backup and restore logic internally:

### Backup Process
1. Makes an authenticated request to `/api/database` with GET method
2. Downloads the response as a blob
3. Creates a temporary download link and triggers the download
4. Cleans up the temporary URL and DOM elements
5. Shows success/error messages based on the result

### Restore Process
1. Accepts a `.db` file through a hidden file input
2. Uploads the file to `/api/database` with POST method using FormData
3. Shows progress during the upload
4. Displays success message and reloads the page after successful restore
5. Shows error messages if the restore fails

## Error Handling

The component provides comprehensive error handling:
- Network failures during backup/restore operations
- Invalid file types (only `.db` files accepted)
- Authentication errors (uses stored auth token)
- Server-side errors during processing

## File Structure

```
src/components/BackupRestore/
├── index.tsx                    # Main component
├── backup-restore.types.ts      # TypeScript interfaces
├── backup-restore.styles.ts     # Tailwind CSS styles (light mode)
├── backup-restore.css          # Dark mode CSS overrides
└── README.md                   # This documentation
```

## Cross-Platform Considerations

This component is designed with cross-platform compatibility in mind:

- Uses standard web APIs that can be adapted for mobile environments
- File download mechanism can be replaced with platform-specific file sharing
- Authentication handling uses localStorage, which has mobile equivalents
- UI components follow responsive design patterns
- Error handling patterns are platform-agnostic

When converting to React Native:
- Replace file download with platform-specific file sharing APIs
- Use React Native's DocumentPicker for file selection
- Adapt authentication token storage to use AsyncStorage
- Replace CSS styling with React Native StyleSheet

## Integration Example

### With AppConfigForm

```tsx
import { BackupRestore } from '@/src/components/BackupRestore';

export default function AppConfigForm({ isOpen, onClose }: AppConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  return (
    <FormPage isOpen={isOpen} onClose={onClose} title="App Configuration">
      <FormPageContent>
        {/* Other form content */}
        
        <BackupRestore
          isLoading={loading}
          isSaving={saving}
          onBackupError={(error) => setError(error)}
          onRestoreError={(error) => setError(error)}
        />
      </FormPageContent>
    </FormPage>
  );
}
```

## Security Considerations

- All API requests include authentication tokens when available
- File upload validation is handled server-side
- Only `.db` files are accepted for restore operations
- Error messages don't expose sensitive system information
- Temporary URLs are properly cleaned up after downloads 