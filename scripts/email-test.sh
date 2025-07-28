#!/bin/bash

# This script runs the SendGrid email test. It sources environment
# variables from the .env file in the project root.

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

echo "Running SendGrid email test..."

# Check for .env and source it
if [ -f ".env" ]; then
  echo "Loading environment variables from .env file..."
  set -a
  # shellcheck disable=SC1090
  source .env
  set +a
else
  echo "Warning: .env file not found. The script might fail if SENDGRID_API_KEY is not set."
fi

# Run the TypeScript script using tsx
npx tsx "scripts/send-grid-email-test.ts"
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "Email test script finished successfully."
else
    echo "Email test script failed with exit code $RESULT."
    exit 1
fi

exit 0 