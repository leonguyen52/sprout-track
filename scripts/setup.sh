#!/bin/bash

# This script performs the initial setup for the Sprout Track application:
# 1. Checks for Node.js installation (must be installed beforehand)
# 2. Installs dependencies
# 3. Generates the Prisma client
# 4. Runs database migrations (creates the database schema)
# 5. Seeds the database with initial data (creates default settings with PIN 111222 and adds units)
# 6. Builds the Next.js application

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

echo "Starting Sprout Track setup..."

# Step 1: Check if Node.js is installed
echo "Step 1: Checking for Node.js installation..."

# Check if node is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "Node.js is installed (${NODE_VERSION})."
    
    # Check if npm is installed
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        echo "npm is installed (${NPM_VERSION})."
    else
        echo "Error: npm is not installed! Please install npm before running this script."
        exit 1
    fi
else
    echo "Error: Node.js is not installed! Please install Node.js (v22 recommended) before running this script."
    echo "Visit https://nodejs.org/ for installation instructions."
    exit 1
fi

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: npm install failed! Setup aborted."
    exit 1
fi
echo "Dependencies installed successfully."

# Disable Next.js telemetry
echo "Disabling Next.js telemetry..."
npm exec next telemetry disable
echo "Next.js telemetry disabled."

# Step 3: Generate Prisma client
echo "Step 3: Generating Prisma client..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo "Error: Prisma client generation failed! Setup aborted."
    exit 1
fi
echo "Prisma client generated successfully."

# Step 4: Run database migrations
echo "Step 4: Running database migrations..."
npm run prisma:migrate
if [ $? -ne 0 ]; then
    echo "Error: Prisma migrations failed! Setup aborted."
    exit 1
fi
echo "Database migrations applied successfully."

# Step 5: Seed the database (creates default settings with PIN 111222)
echo "Step 5: Seeding the database with default settings and units..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo "Error: Database seeding failed! Setup aborted."
    exit 1
fi
echo "Database seeded successfully with default settings (PIN: 111222) and units."

# Step 6: Build the Next.js application
echo "Step 6: Building the Next.js application..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Build process failed! Setup aborted."
    exit 1
fi
echo "Next.js application built successfully."

echo "-------------------------------------"
echo "Sprout Track setup completed successfully!"
echo "Default security PIN: 111222"
echo ""
echo "To run the development server:"
echo "  npm run dev"
echo ""
echo "To run the production server:"
echo "  npm run start"
echo "-------------------------------------"

exit 0
