#!/bin/bash

# This script runs the email test, which sends an email using the
# provider configured in the application's database.

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

echo "Running email provider test..."

# Run the TypeScript script using tsx
npx tsx "scripts/email-test.ts"
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "Email test script finished successfully."
else
    echo "Email test script failed with exit code $RESULT."
    exit 1
fi

exit 0 