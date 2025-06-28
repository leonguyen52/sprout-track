#!/bin/bash

# This script generates test data for the Sprout Track application
# It asks the user for parameters and then runs the JavaScript data generation script

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo "========================================"
echo "   Sprout Track Test Data Generator"
echo "========================================"
echo ""
echo "This script will generate realistic test data including:"
echo "- Families with unique slugs and names"
echo "- Caretakers (parents, nannies, etc.)"
echo "- Babies with realistic birth dates"
echo "- Sleep logs (night sleep and naps)"
echo "- Feed logs (bottle feeding schedules)"
echo "- Diaper logs (wet/dirty throughout the day)"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed! Please install Node.js before running this script."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "Error: Could not find package.json. Please run this script from the project root."
    exit 1
fi

# Ask for number of families
while true; do
    echo "How many families would you like to generate? (1-20):"
    read -r FAMILY_COUNT
    
    if [[ "$FAMILY_COUNT" =~ ^[0-9]+$ ]] && [ "$FAMILY_COUNT" -ge 1 ] && [ "$FAMILY_COUNT" -le 20 ]; then
        break
    else
        echo "Please enter a valid number between 1 and 20."
    fi
done

# Ask for number of days of log entries
while true; do
    echo ""
    echo "How many days of log entries would you like to generate? (1-90):"
    echo "(Note: More days = more data = longer generation time)"
    read -r DAYS_COUNT
    
    if [[ "$DAYS_COUNT" =~ ^[0-9]+$ ]] && [ "$DAYS_COUNT" -ge 1 ] && [ "$DAYS_COUNT" -le 90 ]; then
        break
    else
        echo "Please enter a valid number between 1 and 90."
    fi
done

# Ask if they want to clear existing data
echo ""
echo "Do you want to clear all existing data before generating test data? (y/N):"
echo "WARNING: This will delete ALL families, babies, caretakers, and log entries!"
read -r CLEAR_DATA

if [[ "$CLEAR_DATA" =~ ^[Yy]$ ]]; then
    CLEAR_DATA="true"
else
    CLEAR_DATA="false"
fi

# Confirm the settings
echo ""
echo "========================================"
echo "Configuration Summary:"
echo "========================================"
echo "Families to generate: $FAMILY_COUNT"
echo "Days of log entries: $DAYS_COUNT"
echo "Clear existing data: $CLEAR_DATA"
echo ""
echo "Estimated data to be generated:"
echo "- Families: $FAMILY_COUNT"
echo "- Babies: $((FAMILY_COUNT * 1))-$((FAMILY_COUNT * 2)) (1-2 per family)"
echo "- Caretakers: $((FAMILY_COUNT * 2))-$((FAMILY_COUNT * 4)) (2-4 per family)"
echo "- Sleep logs: ~$((FAMILY_COUNT * DAYS_COUNT * 4)) (4 per baby per day)"
echo "- Feed logs: ~$((FAMILY_COUNT * DAYS_COUNT * 6)) (6 per baby per day)"
echo "- Diaper logs: ~$((FAMILY_COUNT * DAYS_COUNT * 8)) (8 per baby per day)"
echo ""

# Ask for final confirmation
echo "Do you want to proceed with data generation? (y/N):"
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Data generation cancelled."
    exit 0
fi

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Run the JavaScript data generation script
echo ""
echo "Starting data generation..."
echo "This may take a few minutes depending on the amount of data..."
echo ""

# Pass parameters to the JavaScript script via environment variables
export FAMILY_COUNT
export DAYS_COUNT
export CLEAR_DATA

# Run the data generation script
node "$SCRIPT_DIR/generate-test-data.js"
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "   Test data generation completed!"
    echo "========================================"
    echo ""
    echo "You can now:"
    echo "1. Start the application: npm run dev"
    echo "2. Browse to http://localhost:3000"
    echo "3. Navigate to /family-manager to see all families"
    echo "4. Use login PIN '111222' to access any family"
    echo ""
else
    echo ""
    echo "Error: Test data generation failed!"
    exit 1
fi

exit 0 