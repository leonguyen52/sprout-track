#!/bin/bash

# This script helps with Docker setup and management for Sprout Track
# It provides commands for building, starting, stopping, and managing the Docker containers

# Get the project directory (one level up from the script location)
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

# Function to display usage information
show_usage() {
    echo "Sprout Track Docker Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker image"
    echo "  start       Start the Docker containers"
    echo "  stop        Stop the Docker containers"
    echo "  restart     Restart the Docker containers"
    echo "  update      Update the container with latest code and run migrations"
    echo "  backup      Create a backup of the database volume"
    echo "  logs        View container logs"
    echo "  status      Check container status"
    echo "  clean       Remove containers, images, and volumes (caution: data loss)"
    echo "  help        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PORT        Port to expose the application (default: 3000)"
    echo ""
    echo "Examples:"
    echo "  $0 build    # Build the Docker image"
    echo "  PORT=8080 $0 start  # Start containers with custom port"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed or not in PATH"
        echo "Please install Docker and try again"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "Error: docker-compose is not installed or not in PATH"
        echo "Please install docker-compose and try again"
        exit 1
    fi
}

# Build the Docker image
build_image() {
    echo "Building Sprout Track Docker image..."
    docker-compose build
}

# Start the Docker containers
start_containers() {
    echo "Starting Sprout Track containers..."
    docker-compose up -d
    echo "Containers started. The application should be available at:"
    echo "  http://localhost:${PORT:-3000}"
}

# Stop the Docker containers
stop_containers() {
    echo "Stopping Sprout Track containers..."
    docker-compose down
}

# Restart the Docker containers
restart_containers() {
    echo "Restarting Sprout Track containers..."
    docker-compose restart
}

# View container logs
view_logs() {
    echo "Viewing Sprout Track container logs..."
    docker-compose logs -f
}

# Check container status
check_status() {
    echo "Checking Sprout Track container status..."
    docker-compose ps
}

# Create a backup of the database volume
backup_database() {
    echo "Creating backup of the database volume..."
    
    # Get current timestamp for backup filename
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="${PROJECT_DIR}/backups"
    BACKUP_FILE="${BACKUP_DIR}/sprout-track-db-${TIMESTAMP}.tar"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Check if the container is running
    if docker-compose ps | grep -q "sprout-track"; then
        # Create a temporary container to access the volume and create a backup
        echo "Creating backup from volume..."
        docker run --rm \
            --volumes-from sprout-track \
            -v "${BACKUP_DIR}:/backup" \
            alpine \
            tar -cf "/backup/sprout-track-db-${TIMESTAMP}.tar" /db
        
        if [ $? -eq 0 ]; then
            echo "Backup completed successfully!"
            echo "Backup location: $BACKUP_FILE"
        else
            echo "Error: Backup failed!"
            return 1
        fi
    else
        echo "Error: Container is not running. Start the container first."
        return 1
    fi
    
    return 0
}

# Update the container with latest code and run migrations
update_container() {
    echo "Updating Sprout Track container..."
    
    # Pull latest changes from git
    echo "Pulling latest changes from git..."
    cd "$PROJECT_DIR" || exit 1
    git pull
    if [ $? -ne 0 ]; then
        echo "Error: Git pull failed!"
        return 1
    fi
    
    # Create a backup before updating
    echo "Creating backup before update..."
    backup_database
    if [ $? -ne 0 ]; then
        echo "Warning: Backup failed, but continuing with update..."
    fi
    
    # Rebuild the Docker image with the latest code
    echo "Rebuilding Docker image..."
    docker-compose build
    if [ $? -ne 0 ]; then
        echo "Error: Docker build failed!"
        return 1
    fi
    
    # Stop the container
    echo "Stopping container..."
    docker-compose down
    if [ $? -ne 0 ]; then
        echo "Error: Failed to stop container!"
        return 1
    fi
    
    # Start the container with the new image
    # This will automatically run migrations on startup due to our entrypoint script
    echo "Starting container with new image..."
    docker-compose up -d
    if [ $? -ne 0 ]; then
        echo "Error: Failed to start container!"
        return 1
    fi
    
    echo "Update completed successfully!"
    echo "The application should be available at:"
    echo "  http://localhost:${PORT:-3000}"
    echo "Check logs with: $0 logs"
    
    return 0
}

# Clean up Docker resources
clean_resources() {
    echo "WARNING: This will remove all Sprout Track Docker resources, including data volumes."
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo "Removing Sprout Track containers, images, and volumes..."
        docker-compose down -v
        docker rmi sprout-track
        echo "Cleanup completed."
    else
        echo "Cleanup cancelled."
    fi
}

# Main script logic
check_docker

case "$1" in
    build)
        build_image
        ;;
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    update)
        update_container
        ;;
    backup)
        backup_database
        ;;
    logs)
        view_logs
        ;;
    status)
        check_status
        ;;
    clean)
        clean_resources
        ;;
    help|*)
        show_usage
        ;;
esac

exit 0
