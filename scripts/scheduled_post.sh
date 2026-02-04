#!/bin/bash

###############################################################################
# Caribbean Tourism Scheduled Posting Script
# 
# This script is designed to be called by cron-job.org or other schedulers
# It runs the Caribbean tourism posting automation with proper logging
#
# Schedule:
# - 9:00 AM AST (13:00 UTC) - Posts 1-2
# - 1:00 PM AST (17:00 UTC) - Posts 3-4
# - 6:00 PM AST (22:00 UTC) - Posts 5-6
###############################################################################

# Configuration
SCRIPT_DIR="/home/ubuntu/quintapoo-memory"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/posting_$(date +%Y-%m-%d).log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start logging
log "=========================================="
log "Caribbean Tourism Posting - Starting"
log "=========================================="

# Change to script directory
cd "$SCRIPT_DIR" || {
    log "ERROR: Could not change to directory $SCRIPT_DIR"
    exit 1
}

# Run the posting script
log "Executing posting script..."
node scripts/post_caribbean_tourism_v3.mjs 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    log "SUCCESS: Posting completed successfully"
else
    log "ERROR: Posting failed with exit code $EXIT_CODE"
fi

log "=========================================="
log "Caribbean Tourism Posting - Complete"
log "=========================================="

exit $EXIT_CODE
