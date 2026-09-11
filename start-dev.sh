#!/bin/bash
# Start the Shubh Construction Billing System web development servers.

echo "🏗️  Starting Shubh Construction Billing System web development servers..."
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Start backend
echo "📦 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend
echo "⚛️  Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Backend running at: http://localhost:3001"
echo "✅ Frontend running at: http://localhost:5173"
echo ""
echo "Open http://localhost:5173 in your browser to use the application."
echo ""
echo "Press Ctrl+C to stop all servers."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Stopped.'; exit 0" SIGINT
wait
