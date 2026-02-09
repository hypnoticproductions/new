#!/bin/bash

###############################################################################
# Caribbean Tourism Content Syndication Scheduler
# 
# Sets up cron jobs to automatically post 2 articles at:
# - 9:00 AM AST (Posts 1-2)
# - 1:00 PM AST (Posts 3-4)
# - 6:00 PM AST (Posts 5-6)
#
# Usage: ./schedule_caribbean_v5.sh [install|uninstall|status]
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POSTING_SCRIPT="$SCRIPT_DIR/post_caribbean_now_v5.mjs"
LOG_DIR="$PROJECT_DIR/logs"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Cron job entries (AST = UTC-4)
# 9:00 AM AST = 13:00 UTC
# 1:00 PM AST = 17:00 UTC
# 6:00 PM AST = 22:00 UTC

CRON_JOBS=(
    "0 13 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/posting_09am.log 2>&1"
    "0 17 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/posting_01pm.log 2>&1"
    "0 22 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/posting_06pm.log 2>&1"
)

function install_cron() {
    echo "📅 Installing Caribbean Tourism posting schedule..."
    
    # Check if sessions exist
    if [ ! -f "$HOME/.substack-session.json" ] || [ ! -f "$HOME/.twitter-session.json" ]; then
        echo "⚠️  WARNING: Login sessions not found!"
        echo "   Please run: node $POSTING_SCRIPT --setup-login"
        echo "   before enabling automated posting."
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Installation cancelled"
            exit 1
        fi
    fi
    
    # Get current crontab
    crontab -l > /tmp/current_cron 2>/dev/null || true
    
    # Remove any existing Caribbean posting jobs
    grep -v "post_caribbean" /tmp/current_cron > /tmp/new_cron 2>/dev/null || true
    
    # Add new jobs
    for job in "${CRON_JOBS[@]}"; do
        echo "$job" >> /tmp/new_cron
    done
    
    # Install new crontab
    crontab /tmp/new_cron
    
    # Clean up
    rm -f /tmp/current_cron /tmp/new_cron
    
    echo "✅ Cron jobs installed successfully!"
    echo ""
    echo "📋 Schedule:"
    echo "   9:00 AM AST - Posts 1-2"
    echo "   1:00 PM AST - Posts 3-4"
    echo "   6:00 PM AST - Posts 5-6"
    echo ""
    echo "📊 Logs will be saved to: $LOG_DIR/"
    echo ""
    echo "💡 To view logs:"
    echo "   tail -f $LOG_DIR/posting_09am.log"
    echo "   tail -f $LOG_DIR/posting_01pm.log"
    echo "   tail -f $LOG_DIR/posting_06pm.log"
}

function uninstall_cron() {
    echo "🗑️  Removing Caribbean Tourism posting schedule..."
    
    # Get current crontab
    crontab -l > /tmp/current_cron 2>/dev/null || true
    
    # Remove Caribbean posting jobs
    grep -v "post_caribbean" /tmp/current_cron > /tmp/new_cron 2>/dev/null || true
    
    # Install new crontab
    crontab /tmp/new_cron
    
    # Clean up
    rm -f /tmp/current_cron /tmp/new_cron
    
    echo "✅ Cron jobs removed successfully!"
}

function show_status() {
    echo "📊 Caribbean Tourism Posting Schedule Status"
    echo "=============================================="
    echo ""
    
    # Check if cron jobs are installed
    if crontab -l 2>/dev/null | grep -q "post_caribbean"; then
        echo "✅ Cron jobs are INSTALLED"
        echo ""
        echo "📋 Active jobs:"
        crontab -l | grep "post_caribbean"
    else
        echo "❌ Cron jobs are NOT installed"
        echo ""
        echo "💡 To install: $0 install"
    fi
    
    echo ""
    echo "🔐 Session status:"
    
    if [ -f "$HOME/.substack-session.json" ]; then
        echo "   ✅ Substack session exists"
    else
        echo "   ❌ Substack session NOT found"
    fi
    
    if [ -f "$HOME/.twitter-session.json" ]; then
        echo "   ✅ Twitter session exists"
    else
        echo "   ❌ Twitter session NOT found"
    fi
    
    echo ""
    echo "📊 Database status:"
    
    if [ -f "$SCRIPT_DIR/posting_history.json" ]; then
        POST_COUNT=$(grep -o '"postNumber"' "$SCRIPT_DIR/posting_history.json" | wc -l)
        HISTORY_COUNT=$(grep -o '"postedAt"' "$SCRIPT_DIR/posting_history.json" | wc -l)
        echo "   ✅ Database exists"
        echo "   📝 Posts: $POST_COUNT"
        echo "   📊 History records: $HISTORY_COUNT"
    else
        echo "   ❌ Database NOT found"
        echo "   💡 Run: node $SCRIPT_DIR/initialize_posts_db.mjs"
    fi
    
    echo ""
    echo "📂 Recent logs:"
    
    if [ -d "$LOG_DIR" ]; then
        for log in posting_09am.log posting_01pm.log posting_06pm.log; do
            if [ -f "$LOG_DIR/$log" ]; then
                LAST_RUN=$(tail -1 "$LOG_DIR/$log" 2>/dev/null)
                echo "   $log: $(stat -c %y "$LOG_DIR/$log" | cut -d' ' -f1)"
            fi
        done
    else
        echo "   No logs yet"
    fi
}

# Main script
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
    *)
        echo "Usage: $0 [install|uninstall|status]"
        echo ""
        echo "Commands:"
        echo "  install   - Install cron jobs for automated posting"
        echo "  uninstall - Remove cron jobs"
        echo "  status    - Show current status"
        exit 1
        ;;
esac
