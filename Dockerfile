# Use Node.js LTS as the base image
FROM node:22-alpine

# Install tzdata package for timezone support and openssl for ENC_HASH generation
RUN apk add --no-cache tzdata openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy prisma files first
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Disable Next.js telemetry
RUN npm exec next telemetry disable

# Note: Prisma client generation moved to docker-startup.sh

# Copy application files
COPY . .

# Generate ENC_HASH and create .env file
RUN echo "Generating ENC_HASH for data encryption..." && \
    RANDOM_HASH=$(openssl rand -hex 32) && \
    echo "# Environment variables for Docker container" > .env && \
    echo "DATABASE_URL=\"file:/db/baby-tracker.db\"" >> .env && \
    echo "NODE_ENV=production" >> .env && \
    echo "PORT=3000" >> .env && \
    echo "TZ=UTC" >> .env && \
    echo "AUTH_LIFE=86400" >> .env && \
    echo "IDLE_TIME=28800" >> .env && \
    echo "APP_VERSION=0.92.0" >> .env && \
    echo "COOKIE_SECURE=false" >> .env && \
    echo "" >> .env && \
    echo "# Encryption hash for data encryption" >> .env && \
    echo "ENC_HASH=\"$RANDOM_HASH\"" >> .env && \
    echo "Environment variables and ENC_HASH generated and added to .env file"

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=UTC

# Update database URL to point to the volume
ENV DATABASE_URL="file:/db/baby-tracker.db"

# Create volume mount points
VOLUME /db

# Copy startup script that runs migrations and starts the app
COPY docker-startup.sh /usr/local/bin/docker-startup.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-startup.sh && \
    chmod +x /usr/local/bin/docker-startup.sh && \
    ls -la /usr/local/bin/docker-startup.sh && \
    echo "Startup script copied and made executable"

# Set entrypoint to run migrations before starting the app
ENTRYPOINT ["/usr/local/bin/docker-startup.sh"]

# Start the application
CMD ["npm", "start"]

# Expose the port
EXPOSE 3000
