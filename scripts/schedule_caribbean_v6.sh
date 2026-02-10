#!/bin/bash

###############################################################################
# Caribbean Tourism Content Scheduling Script V6
# 
# Schedules automated posting to Substack and Twitter 3 times daily:
# - 9:00 AM AST (Posts 1-2)
# - 1:00 PM AST (Posts 3-4)
# - 6:00 PM AST (Posts 5-6)
#
# Usage:
#   ./schedule_caribbean_v6.sh [install|uninstall|status]
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POSTING_SCRIPT="$SCRIPT_DIR/post_caribbean_now_v6.mjs"

# AST is UTC-4
# 9 AM AST = 13:00 UTC
# 1 PM AST = 17:00 UTC
# 6 PM AST = 22:00 UTC

install_schedule() {
    echo "📅 Installing Caribbean tourism posting schedule..."
    
    # Remove any existing entries for this script
    crontab -l 2>/dev/null | grep -v "post_caribbean_now_v6.mjs" | crontab -
    
    # Add new schedule
    (crontab -l 2>/dev/null; echo "# Caribbean Tourism Posting - 9 AM AST (Posts 1-2)") | crontab -
    (crontab -l 2>/dev/null; echo "0 13 * * * cd $PROJECT_DIR && node $POSTING_SCRIPT --count=2 >> /tmp/caribbean_posting_9am.log 2>&1") | crontab -
    
    (crontab -l 2>/dev/null; echo "# Caribbean Tourism Posting - 1 PM AST (Posts 3-4)") | crontab -
    (crontab -l 2>/dev/null; echo "0 17 * * * cd $PROJECT_DIR && node $POSTING_SCRIPT --count=2 >> /tmp/caribbean_posting_1pm.log 2>&1") | crontab -
    
    (crontab -l 2>/dev/null; echo "# Caribbean Tourism Posting - 6 PM AST (Posts 5-6)") | crontab -
    (crontab -l 2>/dev/null; echo "0 22 * * * cd $PROJECT_DIR && node $POSTING_SCRIPT --count=2 >> /tmp/caribbean_posting_6pm.log 2>&1") | crontab -
    
    echo "✅ Schedule installed successfully!"
    echo ""
    echo "Posting times (AST):"
    echo "  - 9:00 AM - Posts 1-2"
    echo "  - 1:00 PM - Posts 3-4"
    echo "  - 6:00 PM - Posts 5-6"
    echo ""
    echo "Logs:"
    echo "  - /tmp/caribbean_posting_9am.log"
    echo "  - /tmp/caribbean_posting_1pm.log"
    echo "  - /tmp/caribbean_posting_6pm.log"
}

uninstall_schedule() {
    echo "🗑️  Removing Caribbean tourism posting schedule..."
    crontab -l 2>/dev/null | grep -v "post_caribbean_now_v6.mjs" | grep -v "Caribbean Tourism Posting" | crontab -
    echo "✅ Schedule removed successfully!"
}

show_status() {
    echo "📊 Caribbean Tourism Posting Schedule Status"
    echo "=============================================="
    echo ""
    
    if crontab -l 2>/dev/null | grep -q "post_caribbean_now_v6.mjs"; then
        echo "✅ Schedule is ACTIVE"
        echo ""
        echo "Scheduled jobs:"
        crontab -l 2>/dev/null | grep -A1 "Caribbean Tourism Posting"
        echo ""
        echo "Recent logs:"
        echo ""
        echo "--- 9 AM Posting ---"
        tail -n 5 /tmp/caribbean_posting_9am.log 2>/dev/null || echo "No logs yet"
        echo ""
        echo "--- 1 PM Posting ---"
        tail -n 5 /tmp/caribbean_posting_1pm.log 2>/dev/null || echo "No logs yet"
        echo ""
        echo "--- 6 PM Posting ---"
        tail -n 5 /tmp/caribbean_posting_6pm.log 2>/dev/null || echo "No logs yet"
    else
        echo "❌ Schedule is NOT ACTIVE"
        echo ""
        echo "Run './schedule_caribbean_v6.sh install' to activate"
    fi
    
    echo ""
    echo "Posting history:"
    if [ -f "$SCRIPT_DIR/posting_history.json" ]; then
        echo "Total posts tracked: $(grep -o '"postNumber"' "$SCRIPT_DIR/posting_history.json" | wc -l)"
    else
        echo "No posting history found"
    fi
}

# Main command handler
case "${1:-status}" in
    install)
        install_schedule
        ;;
    uninstall)
        uninstall_schedule
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 [install|uninstall|status]"
        echo ""
        echo "Commands:"
        echo "  install   - Install the posting schedule (3 times daily)"
        echo "  uninstall - Remove the posting schedule"
        echo "  status    - Show current schedule status and logs"
        exit 1
        ;;
esac
