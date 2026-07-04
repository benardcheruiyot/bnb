#!/bin/bash
# Automated script to extract unique blocked CORS origins from PM2 logs
# and print them for review or whitelisting

# Number of log lines to scan
LINES=1000

# Extract unique blocked origins
pm2 logs --lines $LINES | grep '\[CORS BLOCKED\]' | awk -F'Origin: ' '{print $2}' | sort | uniq > blocked_origins.txt

echo "Blocked origins in the last $LINES lines of logs:"
cat blocked_origins.txt

echo "\nReview and add any trusted origins to your .env ALLOWED_ORIGINS if needed."
