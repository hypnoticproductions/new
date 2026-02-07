#!/bin/bash

# Quick Start Script - Post 2 Caribbean Tourism Articles Now
# Usage: ./scripts/post_now.sh [--dry-run]

cd "$(dirname "$0")/.."

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   WUKR Wire - Caribbean Tourism Content Posting               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if sessions exist
if [ ! -f "$HOME/.substack-session.json" ] || [ ! -f "$HOME/.twitter-session.json" ]; then
    echo "⚠️  Warning: Session files not found!"
    echo ""
    echo "You need to capture login sessions first:"
    echo "  node scripts/capture_sessions.mjs"
    echo ""
    echo "Or follow the manual session capture guide in:"
    echo "  CARIBBEAN_POSTING_SETUP_GUIDE.md"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run the posting script
if [ "$1" == "--dry-run" ]; then
    echo "🔍 Running in DRY RUN mode (no actual posting)"
    echo ""
    node scripts/post_caribbean_rotation.mjs --dry-run
else
    echo "🚀 Posting 2 Caribbean tourism articles..."
    echo ""
    node scripts/post_caribbean_rotation.mjs
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Script execution complete!"
echo ""
echo "📊 View posting history:"
echo "  cat scripts/posting_history.json"
echo ""
echo "📋 View setup guide:"
echo "  cat CARIBBEAN_POSTING_SETUP_GUIDE.md"
echo "═══════════════════════════════════════════════════════════════"
