#!/bin/sh
echo "Starting Piggy Bank Sync server..."
export DB_PATH="/data/piggybank.db"
exec node /app/dist/index.js
