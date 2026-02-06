#!/bin/bash

###############################################################################
# Caribbean Tourism Content Scheduler
# 
# Schedules automated posting to Substack and Twitter at:
# - 9:00 AM AST (Post 1-2)
# - 1:00 PM AST (Post 3-4)
# - 6:00 PM AST (Post 5-6)
#
# AST (Atlantic Standard Time) = UTC-4
# 
# Usage:
#   ./schedule_caribbean_posts.sh [install|uninstall|status]
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POSTING_SCRIPT="$SCRIPT_DIR/post_caribbean_live.mjs"
LOG_DIR="$PROJECT_DIR/logs"
CRON_COMMENT="# WUKR Wire Caribbean Tourism Syndication"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Convert AST times to UTC for cron
# AST = UTC-4, so:
# 9:00 AM AST = 1:00 PM UTC (13:00)
# 1:00 PM AST = 5:00 PM UTC (17:00)
# 6:00 PM AST = 10:00 PM UTC (22:00)

CRON_JOBS="
$CRON_COMMENT - Morning Post (9 AM AST)
0 13 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/morning.log 2>&1

$CRON_COMMENT - Afternoon Post (1 PM AST)
0 17 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/afternoon.log 2>&1

$CRON_COMMENT - Evening Post (6 PM AST)
0 22 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/evening.log 2>&1
"

function install_cron() {
    echo "📅 Installing Caribbean Tourism posting schedule..."
    
    # Check if cron jobs already exist
    if crontab -l 2>/dev/null | grep -q "WUKR Wire Caribbean Tourism Syndication"; then
        echo "⚠️  Cron jobs already installed. Run 'uninstall' first to reinstall."
        return 1
    fi
    
    # Add cron jobs
    (crontab -l 2>/dev/null; echo "$CRON_JOBS") | crontab -
    
    echo "✅ Cron jobs installed successfully!"
    echo ""
    echo "📋 Schedule (AST/UTC-4):"
    echo "   9:00 AM AST (1:00 PM UTC) - Posts 1-2"
    echo "   1:00 PM AST (5:00 PM UTC) - Posts 3-4"
    echo "   6:00 PM AST (10:00 PM UTC) - Posts 5-6"
    echo ""
    echo "📁 Logs will be saved to: $LOG_DIR"
    echo ""
    echo "🔍 To check status: ./schedule_caribbean_posts.sh status"
}

function uninstall_cron() {
    echo "🗑️  Uninstalling Caribbean Tourism posting schedule..."
    
    # Remove cron jobs with the comment marker
    crontab -l 2>/dev/null | grep -v "WUKR Wire Caribbean Tourism Syndication" | crontab -
    
    echo "✅ Cron jobs removed successfully!"
}

function show_status() {
    echo "📊 Caribbean Tourism Posting Schedule Status"
    echo "=============================================="
    echo ""
    
    # Check if cron jobs are installed
    if crontab -l 2>/dev/null | grep -q "WUKR Wire Caribbean Tourism Syndication"; then
        echo "✅ Cron jobs are INSTALLED"
        echo ""
        echo "📋 Active schedules:"
        crontab -l 2>/dev/null | grep -A 1 "WUKR Wire Caribbean Tourism Syndication"
        echo ""
    else
        echo "❌ Cron jobs are NOT installed"
        echo ""
        echo "To install: ./schedule_caribbean_posts.sh install"
        echo ""
    fi
    
    # Check recent logs
    echo "📁 Recent log files:"
    if [ -d "$LOG_DIR" ]; then
        ls -lh "$LOG_DIR"/*.log 2>/dev/null || echo "   No log files found"
    else
        echo "   Log directory not found: $LOG_DIR"
    fi
    echo ""
    
    # Check posting history
    echo "📊 Posting history:"
    if [ -f "$SCRIPT_DIR/posting_history.json" ]; then
        echo "   History file exists: $SCRIPT_DIR/posting_history.json"
        
        # Show post counts using jq if available
        if command -v jq &> /dev/null; then
            echo ""
            echo "   Post statistics:"
            jq -r '.posts[] | "   Post \(.postNumber): \(.postCount) times posted"' "$SCRIPT_DIR/posting_history.json"
        fi
    else
        echo "   No posting history found"
    fi
}

function test_posting() {
    echo "🧪 Testing Caribbean Tourism posting (DRY RUN)..."
    echo ""
    
    cd "$PROJECT_DIR"
    node "$POSTING_SCRIPT" --dry-run --count=2
    
    echo ""
    echo "✅ Test complete! Check output above for any errors."
}

# Main command handler
case "${1:-status}" in
    install)
        install_cron
        ;;
    uninstall)
        uninstall_cron
        ;;
    status)
        show_status
        ;;
    test)
        test_posting
        ;;
    *)
        echo "Usage: $0 {install|uninstall|status|test}"
        echo ""
        echo "Commands:"
        echo "  install    - Install cron jobs for automated posting"
        echo "  uninstall  - Remove cron jobs"
        echo "  status     - Show current status and logs"
        echo "  test       - Run a dry-run test of the posting script"
        exit 1
        ;;
esac
