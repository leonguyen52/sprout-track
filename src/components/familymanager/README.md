# Family Manager Components

This directory contains the componentized views for the Family Manager page, breaking down the large monolithic page into smaller, focused components.

## Components

### FamilyView
- **File**: `FamilyView.tsx`
- **Purpose**: Displays and manages the families table view
- **Features**:
  - Inline editing of family name, slug, and active status
  - Real-time slug validation
  - Family actions (edit, view caretakers, share, login)
  - Loading states and error handling

### ActiveInviteView
- **File**: `ActiveInviteView.tsx`
- **Purpose**: Displays and manages family setup invitations
- **Features**:
  - Shows invite tokens, creators, expiration dates
  - Status indicators (Active, Used, Expired)
  - Share invite links
  - Revoke/delete invites

### AccountView
- **File**: `AccountView.tsx`
- **Purpose**: Displays and manages user accounts (SaaS mode only)
- **Features**:
  - Account information display
  - Verification status indicators
  - Account status management (close/reinstate)
  - Family associations

### BetaSubscriberView
- **File**: `BetaSubscriberView.tsx`
- **Purpose**: Displays and manages beta subscribers (SaaS mode only)
- **Features**:
  - Subscriber information display
  - Opt-in/opt-out status management
  - Delete subscribers
  - Source tracking

### FeedbackView
- **File**: `FeedbackView.tsx`
- **Purpose**: Displays and manages user feedback submissions (SaaS mode only)
- **Features**:
  - Feedback subject and message display
  - Submitter information (name and email)
  - Read/unread status indicators
  - Mark feedback as read or unread
  - Message preview with truncation
  - Visual indicators for unread feedback
  - **Clickable subjects** - Click on any subject to view full feedback details in a modal
  - **Modal view** - Full feedback details with read-only form fields
  - **In-modal actions** - Mark as read/unread directly from the modal

## Architecture

Each view component follows these patterns:

1. **Props Interface**: Well-defined TypeScript interfaces for all props
2. **Event Handlers**: Callback functions passed from parent for actions
3. **Loading States**: Props for managing loading/saving states
4. **Consistent UI**: Uses the same table components and styling
5. **Error Handling**: Proper error state management

## Usage

The components are imported and used in the main `app/family-manager/page.tsx` file:

```tsx
import { 
  FamilyView, 
  ActiveInviteView, 
  AccountView, 
  BetaSubscriberView 
} from '@/src/components/familymanager';

// Usage based on active tab
{activeTab === 'families' && (
  <FamilyView
    families={families}
    paginatedData={paginatedData as FamilyData[]}
    onEdit={handleEdit}
    onViewCaretakers={handleViewCaretakers}
    onLogin={handleLogin}
    onSave={saveFamily}
    onCancelEdit={handleCancelEdit}
    editingId={editingId}
    editingData={editingData}
    setEditingData={setEditingData}
    saving={saving}
    slugError={slugError}
    checkingSlug={checkingSlug}
    appConfig={appConfig}
    formatDateTime={formatDateTime}
  />
)}
```

## Benefits

1. **Separation of Concerns**: Each component handles one specific view
2. **Maintainability**: Easier to modify individual views without affecting others
3. **Reusability**: Components can be reused in other parts of the application
4. **Testing**: Easier to unit test individual components
5. **Code Organization**: Better file structure and organization
6. **Performance**: Smaller bundle sizes for each component

## Type Safety

All components use TypeScript with strict typing:
- Interface definitions for all data types
- Proper event handler typing
- React component prop validation
- State management typing

## Future Enhancements

- Add component-level documentation
- Implement component-specific tests
- Add prop validation with PropTypes or Zod
- Consider adding component-level state management if needed
