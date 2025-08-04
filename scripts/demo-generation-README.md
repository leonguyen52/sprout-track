# Demo Family Generation Scripts

This directory contains scripts for generating and managing demo family data for Sprout Track.

## Overview

The demo family generation system creates a realistic demo family based on existing family data from the database. It's designed to provide a consistent demo experience for users to explore the application.

## Scripts

### `generate-demo-data.js`
The main JavaScript script that performs the demo family generation.

**Features:**
- Creates a demo family with slug "demo"
- Single caretaker with login ID "01" and PIN "111111"
- Extracts sleep, feed, and diaper logs from an existing family
- Uses 30 random days from March-June 2025, mapped to the last 30 actual days
- Ensures today's entries are at least 1 hour old
- Generates randomized names for family members
- Creates random bath logs and notes similar to test data generation
- Records generation metadata in DemoTracker table

### `generate-demo-data.sh`
Interactive shell wrapper for the JavaScript script.

**Usage:**
```bash
./scripts/generate-demo-data.sh
```

**Features:**
- Interactive prompts for confirmation
- Validation checks for Node.js and project structure
- Clear output formatting

### `regenerate-demo-hourly.sh`
Automated script for scheduled demo regeneration.

**Usage:**
```bash
# For manual execution
./scripts/regenerate-demo-hourly.sh

# For cron job (every hour)
0 * * * * /path/to/sprout-track/scripts/regenerate-demo-hourly.sh
```

**Features:**
- Automated execution without prompts
- Logging to `logs/demo-regeneration.log`
- Error handling and status reporting
- Log rotation (keeps 7 days of logs)

## Database Schema

### DemoTracker Table
Tracks demo family generation metadata:

```prisma
model DemoTracker {
  id                String   @id @default(cuid())
  familyId          String   @unique
  sourceFamilyId    String
  dateRangeStart    DateTime
  dateRangeEnd      DateTime
  generatedAt       DateTime @default(now())
  lastAccessedAt    DateTime?
  accessCount       Int      @default(0)
  notes             String?
}
```

## Configuration

### Source Family
The scripts use family ID `cmcqdc0gj0000s6xh8gp1sj0x` as the source for demo data. Update the `SOURCE_FAMILY_ID` constant in `generate-demo-data.js` if needed.

### Demo Family Settings
- **Slug:** `demo`
- **Caretaker Login ID:** `01`
- **Security PIN:** `111111`
- **Data Period:** 30 random days from March-June 2025 (mapped to last 30 actual days)

## Access Demo Family

After generation, access the demo family at:
- **URL:** `http://localhost:3000/demo`
- **Login PIN:** `111111`

## Data Generation Process

1. **Cleanup:** Removes existing demo family data if present
2. **Date Selection:** Chooses 30 random (non-consecutive) days from March-June 2025
3. **Date Mapping:** Maps those 30 days to the last 30 actual days, with today's cutoff at 1 hour ago
4. **Source Data Extraction:** Fetches logs from source family for each random day
5. **Family Creation:** Creates new demo family with randomized names
6. **Data Transformation:** Converts source logs to target dates using date mapping
7. **Random Generation:** Adds bath logs and notes using date mapping and time constraints
8. **Tracking:** Records generation metadata in DemoTracker table

## Logs and Monitoring

### Manual Generation
Output is displayed in console during execution.

### Automated Generation
Logs are written to `logs/demo-regeneration.log` with timestamps:
```
[2025-01-01 12:00:00] Starting automated demo family regeneration...
[2025-01-01 12:00:05] SUCCESS: Demo family regeneration completed successfully
```

## Scheduling Automated Regeneration

### Cron Job Setup
Add to crontab for hourly regeneration:
```bash
crontab -e
# Add this line:
0 * * * * /full/path/to/sprout-track/scripts/regenerate-demo-hourly.sh
```

### Systemd Timer (Alternative)
Create a systemd service and timer for more advanced scheduling.

## Troubleshooting

### Common Issues

1. **Source family not found**
   - Verify the `SOURCE_FAMILY_ID` exists in database
   - Check database connection

2. **Permission errors**
   - Ensure scripts are executable: `chmod +x scripts/*.sh`
   - Check database write permissions

3. **Node.js not found**
   - Install Node.js
   - Verify PATH includes Node.js location

4. **No source data in date range**
   - The selected random 30-day period may not have data
   - Check if source family has sufficient historical data

### Debug Mode
Add debug logging to `generate-demo-data.js` by setting:
```javascript
const DEBUG = true;
```

## Development

### Adding New Data Types
To include additional log types in demo generation:

1. Add extraction function for source data
2. Add transformation function for demo data
3. Update the main generation process
4. Test with various source data scenarios

### Customizing Names
Update the name arrays in `generate-demo-data.js`:
- `maleFirstNames`
- `femaleFirstNames` 
- `lastNames`

### Modifying Date Ranges
Change the date range constants in `generateRandomDateRange()` function.