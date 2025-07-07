#!/bin/bash

# This script checks and updates the .env file:
# - Creates .env file if it doesn't exist
# - Checks for ENC_HASH and generates one if missing or blank
# - Used for local deployment data encryption

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "Checking and updating environment configuration..."

# Check and generate ENC_HASH for local deployment encryption
echo "Checking for ENC_HASH in .env file..."
ENV_FILE="$PROJECT_DIR/.env"

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    touch "$ENV_FILE"
fi

# Check if ENC_HASH exists and has a value
ENC_HASH_EXISTS=$(grep -E "^ENC_HASH=" "$ENV_FILE" | cut -d '=' -f2)

if [ -z "$ENC_HASH_EXISTS" ]; then
    echo "Adding ENC_HASH to .env file..."
    
    # Generate a secure random hash (64 characters)
    RANDOM_HASH=$(openssl rand -hex 32)
    
    # Add comment and ENC_HASH to .env file
    echo "" >> "$ENV_FILE"
    echo "# Encryption hash for local deployment data encryption" >> "$ENV_FILE"
    echo "ENC_HASH=\"$RANDOM_HASH\"" >> "$ENV_FILE"
    
    echo "ENC_HASH generated and added to .env file"
else
    echo "ENC_HASH already exists in .env file"
fi

echo "Environment configuration check completed." 