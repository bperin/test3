#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Full Stack Application...${NC}"

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
        sleep 1
    fi
}

# Check if directories exist
if [ ! -d "backend" ]; then
    echo -e "${RED}Error: backend directory not found${NC}"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo -e "${RED}Error: frontend directory not found${NC}"
    exit 1
fi

# Kill any existing processes on the ports
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
kill_port 3000
kill_port 3001

# Get the current directory
CURRENT_DIR=$(pwd)

# Start backend in new terminal
echo -e "${GREEN}Starting Backend (Port 3001) in new terminal...${NC}"
osascript -e "tell application \"Terminal\" to do script \"cd '$CURRENT_DIR/backend' && npm run dev\""

# Wait a moment for backend to start
sleep 2

# Start frontend in new terminal
echo -e "${GREEN}Starting Frontend (Port 3000) in new terminal...${NC}"
osascript -e "tell application \"Terminal\" to do script \"cd '$CURRENT_DIR/frontend' && npm start\""

echo -e "${BLUE}Services starting in separate terminals...${NC}"
echo -e "${YELLOW}Backend: http://localhost:3001${NC}"
echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Check the new terminal windows for service logs${NC}"
