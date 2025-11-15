#!/bin/bash
echo "=== Starting Frontend with npx (no installation) ==="
cd frontend

# Check if backend is running
if ! curl -s http://localhost:5000/health > /dev/null; then
    echo "❌ Backend is not running! Please start backend first."
    exit 1
fi

echo "✅ Backend is running"
echo "🚀 Starting frontend with npx vite..."
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

# Use npx to run vite
npx --yes vite@4.4.5
