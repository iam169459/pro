#!/bin/bash
#
# Proposal Pentest Demo — Launcher
# ==================================
# Starts the phishing simulation server.
#
# Usage:
#   ./run.sh               # Start on port 3000
#   PORT=8080 ./run.sh     # Start on custom port
#
# Authorized pentest tool — do not use without permission.
#

PORT="${PORT:-3000}"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   Proposal Pentest Demo Server           ║"
echo "  ║──────────────────────────────────────────║"
echo "  ║  Launching on port $PORT ...              ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  📍 Proposal site:  http://localhost:$PORT"
echo "  📍 Admin panel:    http://localhost:$PORT/admin"
echo "  📍 Data API:       http://localhost:$PORT/api/data"
echo ""
echo "  ⚠️  This is an authorized security assessment tool."
echo "     Do not use without explicit permission."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "  [*] Installing dependencies..."
  npm install
  echo ""
fi

# Start server
PORT=$PORT node server.js

