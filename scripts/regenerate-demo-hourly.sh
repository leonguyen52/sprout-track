#!/bin/bash

# Automated script to regenerate demo family data every hour
# This script can be run via cron or other scheduling systems

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

# Log file for automated runs
LOG_FILE="$PROJECT_DIR/logs/demo-regeneration.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_with_timestamp "Starting automated demo family regeneration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_with_timestamp "ERROR: Node.js is not installed!"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    log_with_timestamp "ERROR: Could not find package.json in $PROJECT_DIR"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Run the demo generation script
log_with_timestamp "Running demo generation script..."
node "$SCRIPT_DIR/generate-demo-data.js" >> "$LOG_FILE" 2>&1
RESULT=$?

if [ $RESULT -eq 0 ]; then
    log_with_timestamp "SUCCESS: Demo family regeneration completed successfully"
else
    log_with_timestamp "ERROR: Demo family regeneration failed with exit code $RESULT"
    exit 1
fi

# Optional: Clean up old log entries (keep last 7 days)
find "$(dirname "$LOG_FILE")" -name "demo-regeneration.log.*" -mtime +7 -delete 2>/dev/null || true

log_with_timestamp "Automated demo regeneration finished"
exit 0