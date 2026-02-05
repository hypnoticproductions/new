#!/bin/bash

# WUKR Wire Daily Dispatch - Scheduling Script
# 
# This script sets up cron jobs for automated Caribbean tourism content posting
# Schedule: 3 times per day
#   - 9:00 AM AST: Posts 1-2
#   - 1:00 PM AST: Posts 3-4
#   - 6:00 PM AST: Posts 5-6
#
# Usage: ./scripts/schedule_daily_posts.sh [install|uninstall|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POST_SCRIPT="$SCRIPT_DIR/post_caribbean_rotation.mjs"
LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Cron job entries (AST = UTC-4, so 9 AM AST = 1 PM UTC)
# Note: Adjust these times based on your server's timezone
CRON_JOBS=(
    "0 13 * * * cd $PROJECT_DIR && /usr/bin/node $POST_SCRIPT --count=2 >> $LOG_DIR/post_9am.log 2>&1"
    "0 17 * * * cd $PROJECT_DIR && /usr/bin/node $POST_SCRIPT --count=2 >> $LOG_DIR/post_1pm.log 2>&1"
    "0 22 * * * cd $PROJECT_DIR && /usr/bin/node $POST_SCRIPT --count=2 >> $LOG_DIR/post_6pm.log 2>&1"
)

function install_cron_jobs() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║   Installing WUKR Wire Daily Dispatch Cron Jobs               ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Get current crontab
    crontab -l > /tmp/current_cron 2>/dev/null || true
    
    # Add marker comments
    echo "" >> /tmp/current_cron
    echo "# WUKR Wire Daily Dispatch - Caribbean Tourism Syndication" >> /tmp/current_cron
    
    # Add each cron job
    for job in "${CRON_JOBS[@]}"; do
        # Check if job already exists
        if grep -Fq "$POST_SCRIPT" /tmp/current_cron; then
            echo "⚠️  Cron jobs already installed. Run 'uninstall' first to update."
            rm /tmp/current_cron
            return 1
        fi
        echo "$job" >> /tmp/current_cron
    done
    
    echo "# End WUKR Wire Daily Dispatch" >> /tmp/current_cron
    
    # Install new crontab
    crontab /tmp/current_cron
    rm /tmp/current_cron
    
    echo "✅ Cron jobs installed successfully!"
    echo ""
    echo "Schedule:"
    echo "  9:00 AM AST (1:00 PM UTC) - Posts 1-2"
    echo "  1:00 PM AST (5:00 PM UTC) - Posts 3-4"
    echo "  6:00 PM AST (10:00 PM UTC) - Posts 5-6"
    echo ""
    echo "Logs will be written to: $LOG_DIR"
    echo ""
    echo "⚠️  IMPORTANT: Before the first automated run, you must:"
    echo "   1. Run: node $POST_SCRIPT --setup-login"
    echo "   2. Log in to both Substack and Twitter when prompted"
    echo "   3. Sessions will be saved for autonomous operation"
    echo ""
}

function uninstall_cron_jobs() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║   Uninstalling WUKR Wire Daily Dispatch Cron Jobs             ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Get current crontab
    crontab -l > /tmp/current_cron 2>/dev/null || true
    
    # Remove WUKR Wire jobs
    sed -i '/WUKR Wire Daily Dispatch/,/End WUKR Wire Daily Dispatch/d' /tmp/current_cron
    
    # Install cleaned crontab
    crontab /tmp/current_cron
    rm /tmp/current_cron
    
    echo "✅ Cron jobs uninstalled successfully!"
    echo ""
}

function show_status() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║   WUKR Wire Daily Dispatch Status                             ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    echo "📋 Current Cron Jobs:"
    echo "────────────────────────────────────────────────────────────────"
    if crontab -l 2>/dev/null | grep -q "WUKR Wire"; then
        crontab -l | grep -A 10 "WUKR Wire"
        echo ""
        echo "✅ Cron jobs are installed"
    else
        echo "❌ No cron jobs installed"
        echo ""
        echo "Run: ./scripts/schedule_daily_posts.sh install"
    fi
    echo ""
    
    echo "🔐 Session Status:"
    echo "────────────────────────────────────────────────────────────────"
    if [ -f "$HOME/.substack-session.json" ]; then
        echo "✅ Substack session: Found"
    else
        echo "❌ Substack session: Not found"
    fi
    
    if [ -f "$HOME/.twitter-session.json" ]; then
        echo "✅ Twitter session: Found"
    else
        echo "❌ Twitter session: Not found"
    fi
    echo ""
    
    if [ ! -f "$HOME/.substack-session.json" ] || [ ! -f "$HOME/.twitter-session.json" ]; then
        echo "⚠️  Sessions not configured. Run:"
        echo "   node $POST_SCRIPT --setup-login"
        echo ""
    fi
    
    echo "📊 Recent Logs:"
    echo "────────────────────────────────────────────────────────────────"
    if [ -d "$LOG_DIR" ]; then
        ls -lht "$LOG_DIR" | head -5
    else
        echo "No logs found"
    fi
    echo ""
    
    echo "📈 Posting History:"
    echo "────────────────────────────────────────────────────────────────"
    if [ -f "$SCRIPT_DIR/posting_history.json" ]; then
        echo "Recent posts:"
        tail -20 "$SCRIPT_DIR/posting_history.json"
    else
        echo "No posting history found"
    fi
    echo ""
}

function run_test() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║   Running Test Post (Dry Run)                                 ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    cd "$PROJECT_DIR"
    node "$POST_SCRIPT" --dry-run --count=2
    
    echo ""
    echo "✅ Test complete! Review output above."
    echo ""
    echo "To run a live test: node $POST_SCRIPT --count=2"
    echo ""
}

# Main script logic
case "${1:-}" in
    install)
        install_cron_jobs
        ;;
    uninstall)
        uninstall_cron_jobs
        ;;
    status)
        show_status
        ;;
    test)
        run_test
        ;;
    *)
        echo "WUKR Wire Daily Dispatch - Scheduling Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  install    - Install cron jobs for automated posting"
        echo "  uninstall  - Remove cron jobs"
        echo "  status     - Show current status and configuration"
        echo "  test       - Run a dry-run test"
        echo ""
        echo "Examples:"
        echo "  $0 install     # Set up automated posting"
        echo "  $0 status      # Check configuration"
        echo "  $0 test        # Test without posting"
        echo ""
        ;;
esac
