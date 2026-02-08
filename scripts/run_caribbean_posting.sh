#!/bin/bash

###############################################################################
# WUKR Wire Caribbean Tourism Posting Script
# 
# This script runs the Caribbean tourism content syndication system
# Designed to be called by cron-job.org or other scheduling services
#
# Schedule:
#   - 9:00 AM AST: Posts 1-2
#   - 1:00 PM AST: Posts 3-4
#   - 6:00 PM AST: Posts 5-6
#
# Usage:
#   ./run_caribbean_posting.sh           # Normal posting
#   ./run_caribbean_posting.sh --dry-run # Test mode
###############################################################################

# Change to the project directory
cd /home/ubuntu/quintapoo-memory

# Log file
LOG_FILE="/home/ubuntu/quintapoo-memory/logs/caribbean_posting_$(date +%Y%m%d).log"
mkdir -p /home/ubuntu/quintapoo-memory/logs

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Starting Caribbean Tourism Content Posting"
log "=========================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log "ERROR: Node.js is not installed"
    exit 1
fi

# Check if the script exists
if [ ! -f "scripts/post_caribbean_wukr.mjs" ]; then
    log "ERROR: Posting script not found"
    exit 1
fi

# Run the posting script
log "Executing posting script..."
node scripts/post_caribbean_wukr.mjs "$@" 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Posting completed successfully"
else
    log "❌ Posting failed with exit code $EXIT_CODE"
fi

log "=========================================="
log "Posting session complete"
log "=========================================="

exit $EXIT_CODE
