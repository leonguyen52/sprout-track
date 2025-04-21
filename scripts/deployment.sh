#!/bin/bash

# This script performs a full deployment:
# 1. Creates a backup
# 2. Stops the service
# 3. Deletes the .next folder
# 4. Updates the application
# Service management is handled by the individual scripts

# Get the script directory and project directory
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting deployment process..."

# Step 1: Create backup
echo "Step 1: Creating backup..."
"$SCRIPT_DIR/backup.sh"
if [ $? -ne 0 ]; then
    echo "Error: Backup failed! Deployment aborted."
    exit 1
fi

# Step 2: Stop the service
echo "Step 2: Stopping service..."
"$SCRIPT_DIR/service.sh" stop
if [ $? -ne 0 ]; then
    echo "Error: Failed to stop service! Deployment aborted."
    exit 1
fi

# Step 3: Delete .next folder
echo "Step 3: Deleting .next folder..."
if [ -d "$PROJECT_DIR/.next" ]; then
    rm -rf "$PROJECT_DIR/.next"
    echo ".next folder deleted successfully."
else
    echo ".next folder not found, continuing deployment."
fi

# Step 4: Update application
echo "Step 4: Updating application..."
"$SCRIPT_DIR/update.sh"
if [ $? -ne 0 ]; then
    echo "Error: Update failed! Deployment aborted."
    "$SCRIPT_DIR/service.sh" start  # Try to restart service even if update failed
    exit 1
fi

echo "Deployment completed successfully!"
echo "Use '$SCRIPT_DIR/service.sh status' to check service status."
