#!/bin/bash
# Startup script for Zyntrix Hosting
# Save as start.sh and run: chmod +x start.sh && ./start.sh

echo "Starting Zyntrix Hosting Platform on in1.zyntrixtech.xyz:25569"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create data directory
mkdir -p data

# Start the server
export PORT=25569
export NODE_ENV=production

# Use PM2 for process management (install with: npm install -g pm2)
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    pm2 start server.js --name zyntrix-hosting --watch
    pm2 save
    pm2 startup
    echo "Server started with PM2!"
    echo "View logs: pm2 logs zyntrix-hosting"
    echo "Stop server: pm2 stop zyntrix-hosting"
else
    echo "Starting directly with Node.js..."
    node server.js
fi
