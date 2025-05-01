#!/bin/bash

# Define the base directory for the application
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$BASE_DIR"

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install required packages if not already installed
pip install -r requirements.txt

# Check if user is in the 'dialout' group (required for serial access)
if ! groups | grep -q '\bdialout\b'; then
    echo "WARNING: Current user is not in the 'dialout' group. You may need to run:"
    echo "sudo usermod -a -G dialout $USER"
    echo "and then log out and back in for serial port access."
fi

# Check if the frontend is built
if [ ! -d "frontend/build" ]; then
    echo "Building frontend..."
    
    # Check if Node.js is installed
    if ! command -v npm &> /dev/null; then
        echo "ERROR: Node.js is required to build the frontend."
        echo "Please install Node.js and npm, then run this script again."
        exit 1
    fi
    
    # Install dependencies and build
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Start the backend server
echo "Starting Azur 351R Controller server..."
python app.py