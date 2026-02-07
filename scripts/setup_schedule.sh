#!/bin/bash

# Automated Scheduling Setup Script
# Sets up cron jobs for 9 AM, 1 PM, and 6 PM AST posting

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Caribbean Tourism Content - Automated Scheduling Setup      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo "📁 Project directory: $PROJECT_DIR"
echo "📁 Logs directory: $LOG_DIR"
echo ""

# Check if sessions exist
if [ ! -f "$HOME/.substack-session.json" ] || [ ! -f "$HOME/.twitter-session.json" ]; then
    echo "⚠️  Warning: Session files not found!"
    echo ""
    echo "You should capture login sessions first:"
    echo "  node scripts/capture_sessions.mjs"
    echo ""
    read -p "Continue with scheduling setup anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 Scheduling Configuration:"
echo "  - 9:00 AM AST (13:00 UTC) - Post 2 articles"
echo "  - 1:00 PM AST (17:00 UTC) - Post 2 articles"
echo "  - 6:00 PM AST (22:00 UTC) - Post 2 articles"
echo ""
echo "This will post 6 articles per day, rotating through all content."
echo ""

read -p "Proceed with scheduling setup? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

# Create cron entries
CRON_ENTRIES="
# Caribbean Tourism Content Posting - WUKR Wire Daily Dispatch
# Post 2 articles at 9 AM AST (13:00 UTC)
0 13 * * * cd $PROJECT_DIR && node scripts/post_caribbean_rotation.mjs >> $LOG_DIR/posts_09am.log 2>&1

# Post 2 articles at 1 PM AST (17:00 UTC)
0 17 * * * cd $PROJECT_DIR && node scripts/post_caribbean_rotation.mjs >> $LOG_DIR/posts_01pm.log 2>&1

# Post 2 articles at 6 PM AST (22:00 UTC)
0 22 * * * cd $PROJECT_DIR && node scripts/post_caribbean_rotation.mjs >> $LOG_DIR/posts_06pm.log 2>&1
"

# Backup existing crontab
echo "💾 Backing up existing crontab..."
crontab -l > "$PROJECT_DIR/crontab.backup.txt" 2>/dev/null || echo "# No existing crontab" > "$PROJECT_DIR/crontab.backup.txt"

# Add new entries to crontab
echo "📝 Adding cron entries..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRIES") | crontab -

echo ""
echo "✅ Scheduling setup complete!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 Scheduled Jobs:"
echo "═══════════════════════════════════════════════════════════════"
crontab -l | grep -A 1 "Caribbean Tourism"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Monitoring:"
echo "  - View 9 AM logs:  tail -f $LOG_DIR/posts_09am.log"
echo "  - View 1 PM logs:  tail -f $LOG_DIR/posts_01pm.log"
echo "  - View 6 PM logs:  tail -f $LOG_DIR/posts_06pm.log"
echo ""
echo "🔧 Management:"
echo "  - List cron jobs:  crontab -l"
echo "  - Edit cron jobs:  crontab -e"
echo "  - Remove all jobs: crontab -r"
echo "  - Restore backup:  crontab $PROJECT_DIR/crontab.backup.txt"
echo ""
echo "💡 Tip: Run a test post now to verify everything works:"
echo "  ./scripts/post_now.sh --dry-run"
echo ""
