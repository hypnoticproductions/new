#!/bin/bash

###############################################################################
# Caribbean Tourism Content Scheduling Script V4
# 
# Schedules automated posting to Substack and Twitter at:
# - 9:00 AM AST (Posts 1-2)
# - 1:00 PM AST (Posts 3-4)  
# - 6:00 PM AST (Posts 5-6)
#
# Usage:
#   ./scripts/schedule_caribbean_v4.sh install   # Install cron jobs
#   ./scripts/schedule_caribbean_v4.sh remove    # Remove cron jobs
#   ./scripts/schedule_caribbean_v4.sh status    # Show current cron jobs
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POST_SCRIPT="$SCRIPT_DIR/post_caribbean_now_v4.mjs"
LOG_DIR="$PROJECT_DIR/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# AST is UTC-4
# 9 AM AST = 1 PM UTC
# 1 PM AST = 5 PM UTC
# 6 PM AST = 10 PM UTC

CRON_JOBS="
# WUKR Wire Caribbean Tourism Syndication - Post 1-2 at 9 AM AST (1 PM UTC)
0 13 * * * cd $PROJECT_DIR && /usr/bin/node $POST_SCRIPT --count=2 >> $LOG_DIR/caribbean_9am.log 2>&1

# WUKR Wire Caribbean Tourism Syndication - Post 3-4 at 1 PM AST (5 PM UTC)
0 17 * * * cd $PROJECT_DIR && /usr/bin/node $POST_SCRIPT --count=2 >> $LOG_DIR/caribbean_1pm.log 2>&1

# WUKR Wire Caribbean Tourism Syndication - Post 5-6 at 6 PM AST (10 PM UTC)
0 22 * * * cd $PROJECT_DIR && /usr/bin/node $POST_SCRIPT --count=2 >> $LOG_DIR/caribbean_6pm.log 2>&1
"

install_cron() {
    echo "📅 Installing Caribbean Tourism posting schedule..."
    
    # Remove existing jobs first
    remove_cron
    
    # Add new jobs
    (crontab -l 2>/dev/null; echo "$CRON_JOBS") | crontab -
    
    echo "✅ Cron jobs installed successfully!"
    echo ""
    echo "📋 Schedule:"
    echo "   - 9:00 AM AST (1 PM UTC): Posts 1-2"
    echo "   - 1:00 PM AST (5 PM UTC): Posts 3-4"
    echo "   - 6:00 PM AST (10 PM UTC): Posts 5-6"
    echo ""
    echo "📁 Logs will be saved to: $LOG_DIR"
    echo ""
    echo "💡 To view current jobs: crontab -l"
    echo "💡 To view logs: tail -f $LOG_DIR/caribbean_*.log"
}

remove_cron() {
    echo "🗑️  Removing Caribbean Tourism posting schedule..."
    crontab -l 2>/dev/null | grep -v "WUKR Wire Caribbean Tourism" | crontab -
    echo "✅ Cron jobs removed"
}

show_status() {
    echo "📋 Current Caribbean Tourism cron jobs:"
    echo ""
    crontab -l 2>/dev/null | grep -A 1 "WUKR Wire Caribbean Tourism" || echo "   No jobs found"
    echo ""
    echo "📁 Recent logs:"
    echo ""
    for log in "$LOG_DIR"/caribbean_*.log; do
        if [ -f "$log" ]; then
            echo "   $(basename "$log"):"
            tail -n 5 "$log" 2>/dev/null | sed 's/^/      /'
            echo ""
        fi
    done
}

case "$1" in
    install)
        install_cron
        ;;
    remove)
        remove_cron
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {install|remove|status}"
        echo ""
        echo "Commands:"
        echo "  install  - Install cron jobs for automated posting"
        echo "  remove   - Remove all cron jobs"
        echo "  status   - Show current cron jobs and recent logs"
        exit 1
        ;;
esac
