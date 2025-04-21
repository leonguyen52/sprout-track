# Sprout Track Changelog

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
