# Sprout Track Changelog

## v0.92.0 - Multi-family Edition - July 2025

### Changes

#### Multi-family Support
- Added family-level access by link/slug for independent family management
- Overhauled data schema to support multiple families with isolated data
- Updated all API endpoints to use family context for secure data access
- Updated authentication system with family-level users, admin roles, and global system administrator role
- Added ability for system administrators to manage existing families, invite new families (by link), and manually add new families
- Overhauled settings and forms for family-specific configuration
- Updated database migration scripts, including family migration script for existing databases
- Updated login screens with family information and URL sharing capabilities

#### Authentication & Security Enhancements
- Added system caretaker security lockout - system accounts (loginId '00') are automatically disabled when regular caretakers exist for a family
- Implemented on-demand creation of system caretakers and settings for families without configured users
- Added JWT-based authentication with family context embedded in tokens
- Enhanced admin authentication to support family-level, system caretaker, and global system administrator access

#### User Interface Improvements
- Updated login screens to display family information and support URL sharing
- Added family selection interface for users with access to multiple families
- Improved family management interface for system administrators
- Enhanced forms and settings pages for family-specific configuration

#### Backup and Restore Enhancements
- Added automatic post-restore database migration system to ensure compatibility with older backup versions
- Implemented initial setup database import capability - users can now import existing data during setup wizard
- Added real-time migration progress indicators with detailed step-by-step feedback
- Enhanced error handling for migration failures, authentication issues, and database compatibility problems

#### Other Fixes and Improvements
- Updated API calls to provide more real-time feel while minimizing bandwidth when app not actively used
- Fixed time that loads when opening most activities to be now instead of the the of the last page refresh
- Updated pump log so end time is now and start time defaults to 15 minutes in the past
- Removed solid foods from feed timer calculations
- Updated activity timeline descriptions to show units correctly
- Fixed visual bugs for light/dark mode consistency
- Improved error handling and user feedback across the application
- Fixed the caretaker form so that users can only correctly enter in numbers instead of characters

## v0.91.4 - Added Medicine Tracker - (Beta) - April 2025

### Changes

  - Removed duplicate scripts directory (thanks, [@need4swede](https://github.com/need4swede))
  - Added fixes so that new activities show up if config doesn't exist
  - Updated the prisma/seed.ts script to add units for medicines and update units with activity groups when they do not exist
  - Updated the scripts/update.sh script to add seed step after migrations

  #### Medicine Tracker
  - Added ability to add medicines and link contacts to medicines
  - Ability to track the dose given
  - Ability to see doses, and when a new dose is safe to administer
  - Added medicine tracking to log-entry and full-log views

## v0.9.3 (Beta Patch) - April 2025

### Changes

  - Fixed an issue where etc/timezones isn't available in docker images
  - Added the ability to set cookie auth to require HTTPS or not.  This is added to the .env file.  When enabled the cookie will only be valid and sent when the app is accessed over HTTPS.  When set to false the cookie will be valid and sent over HTTP or HTTPS.  IMPORTANT: When setting this to true you must have an SSL certificate in place otherwise all main API's will be blocked.
  - Added the ability to disable Next.js telemetry collection in the setup scripts
  


## v0.9.0 (Beta Release) - April 2025

The beta release of Sprout Track as a self-hostable baby tracking application.

### Features

#### Activity Tracking
  - Sleep logs
  - Feed logs (bottle and solids)
  - Diaper logs
  - Bath logs
  - Notes
  - Measurements
  - Milestones

#### Reporting & Analysis
  - High-level reporting and statistics
  - Full log with date range filtering
  - Quick search functionality for specific items

#### Multi-user Support
  - Multiple caretaker accounts
  - Role-based permissions

#### Calendar & Planning
  - Calendar events for caretaker schedules
  - Appointment reminders
  - Custom event creation

### Technical Details

- Built with Next.js (App Router)
- TypeScript for type safety
- Prisma with SQLite database
- TailwindCSS for styling
- Responsive design for mobile and desktop use
- Dark mode support
